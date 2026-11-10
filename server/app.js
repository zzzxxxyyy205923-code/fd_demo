/*
  访问闸门（Express）—— 复用 art-humanities_demo 当前后台管理系统的实现。
  ────────────────────────────────────────────────────────────────
  · 登录接口带 IP 限流；会话为 httpOnly 签名 cookie（带密码指纹 → 改密后旧会话立即失效）
  · 角色 / 权限矩阵只管后台账号数据：超级管理员看全部账号，其余角色只看得到自己那一条
  · 使用埋点 POST /api/usage；「网站使用概览」GET /api/usage/overview|export 与
    「操作日志」GET /api/audit 只开给 role === 'admin'
  · 后台页面外壳由 server/views/ 下的片段注入（顶栏 / 底部标签 / 页脚）

  ★ 全站登录闸门（2026-11-10 起）：除登录页自身与其静态资源、认证接口外，
    任何路径（含主页、index.html、assets/**、数据 JSON、/admin、/api/*）未登录一律
    302 到 login.html?next=…；XHR/静态子资源返回 401 JSON，避免资源请求被重定向成 HTML。
    已登录才下发主页与后台，会话失效由客户端守卫兜底跳回登录页。

  ★ 本站相对源站的三处刻意裁剪（均为「不覆盖已有功能与数据」的要求）：
    1) 站点内容由同一道闸门保护，登录后仍按原有 index.html + hash 路由浏览，页面结构不变；
    2) 不加载 content / uploads 模块，不注册 /data/*.json 快照路由与内容编辑接口 ——
       本站页面数据一律仍由 assets/data/*.json 提供，后台不会改写任何已写入内容；
    3) 账号库只认本站 server/data/accounts.json（见 lib/account-cloud.js），
       CloudBase 账号源恒为关闭，避免环境变量把账号或内容串到别的站点。
*/
const fs = require("fs");
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("./lib/session");
const accounts = require("./lib/accounts");
const usage = require("./lib/usage");
const xlsx = require("./lib/xlsx");
const audit = require("./lib/audit");
const {
  hasPermission, rolesForClient, permissionsForClient,
  accountScope, isScopedAccount, SCOPED_POSITION, ROLES
} = require("./lib/permissions");

const SITE_ROOT = path.join(__dirname, "..");

/* 静态资源白名单：只有 assets/ 与根目录页面/脚本允许被读取，
   server/、node_modules/、tools/、package.json 一律 404（账号哈希绝不能被下载）。 */
const ROOT_DENY = new Set(["/package.json", "/package-lock.json"]);
const SERVED_DIRS = ["assets"];

/* 全站闸门的唯一放行清单：登录页本身、认证接口，以及登录页渲染所需的静态资源。
   清单以外的所有请求（主页 / 数据 JSON / 后台 / 其它资源）都必须先通过会话校验。 */
const PUBLIC_PATHS = new Set([
  "/login.html", "/healthz", "/favicon.ico",
  "/api/auth/login", "/api/auth/logout", "/api/auth/me",
  "/assets/css/fonts.css", "/assets/css/auth.css", "/assets/css/admin-fashion.css",
  "/assets/js/auth-guard.js", "/assets/js/auth-login.js",
  "/assets/img/brand/logo-fashion.png", "/assets/img/hero/slide-01.jpeg"
]);
const isPublicPath = req => PUBLIC_PATHS.has(req.path) || req.path.startsWith("/assets/fonts/");

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const loginAttempts = new Map();
const passwordAttempts = new Map();

function basePath() {
  const value = process.env.BASE_PATH || "";
  if (!value || value === "/") return "";
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
function joinPath(base, suffix) {
  if (!suffix.startsWith("/")) suffix = `/${suffix}`;
  return `${base}${suffix}`;
}
function sendError(res, status, message) { res.status(status).json({ error: message }); }
function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim();
  return req.ip || "unknown";
}
function tooManyAttempts(store, key) {
  const now = Date.now();
  const recent = (store.get(key) || []).filter(time => now - time < LOGIN_WINDOW_MS);
  store.set(key, recent);
  return recent.length >= LOGIN_MAX_ATTEMPTS;
}
function recordAttempt(store, key) {
  const current = store.get(key) || [];
  current.push(Date.now());
  store.set(key, current);
}
const tooManyLogins = ip => tooManyAttempts(loginAttempts, ip);
const recordLogin = ip => recordAttempt(loginAttempts, ip);

function wantsJson(req) {
  if (req.path.startsWith("/api/")) return true;
  const destination = String(req.headers["sec-fetch-dest"] || "");
  if (destination && destination !== "document" && destination !== "iframe") return true;
  const accept = String(req.headers.accept || "");
  return accept.includes("application/json") && !accept.includes("text/html");
}
function isServedPath(pathname) {
  const route = String(pathname || "").toLowerCase();
  if (route === "" || route === "/") return true;
  const parts = route.split("/").filter(Boolean);
  if (!parts.length) return false;
  if (parts.some(part => part === "." || part === "..")) return false;
  if (parts.length === 1) {
    if (ROOT_DENY.has(`/${parts[0]}`)) return false;
    return /\.(?:html|css|js|ico|png|jpe?g|webp|svg|woff2?|txt)$/.test(parts[0]);
  }
  return SERVED_DIRS.includes(parts[0]);
}

function attachUser(req, _res, next) {
  const token = req.cookies ? req.cookies[session.COOKIE_NAME] : null;
  const payload = session.decode(token);
  const user = payload ? accounts.findById(payload.userId) : null;
  const fresh = user && payload && payload.fp === accounts.fingerprint(user);
  req.user = fresh ? user : null;
  return next();
}
function requireLogin(req, res, next) {
  if (req.user) return next();
  if (wantsJson(req)) return sendError(res, 401, "请先登录");
  const nextUrl = encodeURIComponent(req.originalUrl || "/");
  return res.redirect(joinPath(basePath(), `/login.html?next=${nextUrl}`));
}
function requireContentAccess(req, res, next) {
  if (!isServedPath(req.path)) return res.status(404).send("Not Found");
  return next();
}
function accessDeniedPage(message) {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>无访问权限｜SFK 时尚科系</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#000;color:#fff;font:15px/1.8 'PingFang SC',sans-serif">
<div style="max-width:520px;padding:0 24px">
  <p style="margin:0 0 14px;color:#FF0080;font-size:11px;font-weight:700;letter-spacing:.22em">403 · FORBIDDEN</p>
  <h1 style="margin:0 0 12px;font-size:28px;letter-spacing:-.02em">${message}</h1>
  <p style="margin:0 0 26px;color:rgba(255,255,255,.78)">当前账号没有后台管理权限。如需开通，请联系系统管理员在「后台 · 账号与权限」里调整角色。</p>
  <a href="./" style="display:inline-flex;align-items:center;height:44px;padding:0 18px;background:#FF0080;color:#fff;text-decoration:none;font-size:14px;font-weight:700">返回站点首页</a>
</div></body></html>`;
}
function denyAccess(req, res, message = "当前账号没有这项权限") {
  if (wantsJson(req)) return sendError(res, req.user ? 403 : 401, req.user ? message : "请先登录");
  if (!req.user) {
    const nextUrl = encodeURIComponent(req.originalUrl || "/");
    return res.redirect(joinPath(basePath(), `/login.html?next=${nextUrl}`));
  }
  return res.status(403).type("html").send(accessDeniedPage(message));
}
function requirePermission(permission) {
  return (req, res, next) => (hasPermission(req.user, permission) ? next() : denyAccess(req, res));
}
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") return next();
  return denyAccess(req, res, "该模块仅对「超级管理员」角色开放");
}

/* ── 操作日志：密码只记脱敏占位，绝不落明文 ───────────────────── */
const auditLog = (req, entry) => audit.write({
  actorId: req.user && req.user.id,
  actorName: req.user && req.user.name,
  actorRole: req.user && req.user.role,
  ip: clientIp(req),
  ...entry
});
const AUDIT_FIELDS = {
  name: "姓名", email: "公司邮箱", department: "部门", region: "地区",
  position: "职位", majors: "负责科系", role: "角色", permissions: "附加权限"
};
const auditSnapshot = user => {
  if (!user) return null;
  const out = {};
  Object.keys(AUDIT_FIELDS).forEach(key => {
    const raw = user[key];
    out[key] = Array.isArray(raw) ? raw.join("、") : String(raw == null ? "" : raw);
  });
  out.role = (ROLES[user.role] && ROLES[user.role].label) || user.role || "";
  return out;
};
const auditChanges = (before, after, keys) => keys
  .filter(key => AUDIT_FIELDS[key])
  .map(key => ({
    field: key, label: AUDIT_FIELDS[key],
    before: before ? (before[key] || "—") : "—",
    after: after ? (after[key] || "—") : "—"
  }))
  .filter(change => change.before !== change.after);
const auditAction = body => {
  if (body.role !== undefined) return "account.role";
  if (body.permissions !== undefined) return "account.permission";
  if (body.password !== undefined) return "account.password";
  return "account.update";
};
const PASSWORD_CHANGE = { field: "password", label: "登录密码", before: "••••••", after: "已更新" };
function assertRoleChangeAllowed(req, res, body) {
  if (body && (body.role !== undefined || body.permissions !== undefined) && !hasPermission(req.user, "manage_roles")) {
    const message = "调整角色或附加权限需要「调整账号角色与权限」权限";
    auditLog(req, {
      action: body.role !== undefined ? "account.role" : "account.permission",
      targetId: (req.params && req.params.id) || "—",
      result: "failed", reason: message
    });
    sendError(res, 403, message);
    return false;
  }
  return true;
}

/* 服务端下发首页时注入标记：auth-guard.js 只在看到它时才问 /api/auth/me。
   file:// 与纯静态预览没有这枚标记 → 零请求、零控制台噪音、页面行为完全不变。 */
const GATE_MARKER = "<script>window.__SFK_GATE__=1;</script>";
function sendHtmlWithMarker(file, res) {
  fs.readFile(path.join(SITE_ROOT, file), "utf8", (error, html) => {
    if (error) return res.status(500).send("Not Found");
    res.setHeader("Cache-Control", "no-store");
    const marked = /<head[^>]*>/i.test(html)
      ? html.replace(/<head[^>]*>/i, match => `${match}\n${GATE_MARKER}`)
      : `${GATE_MARKER}\n${html}`;
    res.type("html").send(marked);
  });
}

/* ── 后台页面外壳（与源站同一套占位符注入） ───────────────────── */
const VIEWS = path.join(__dirname, "views");
const ADMIN_NAV = [{ key: "accounts", href: "admin", label: "账号与权限" }];
const escapeHtml = value => String(value == null ? "" : value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function adminTabs(current) {
  const page = ADMIN_NAV.find(item => item.key === current);
  return `<nav class="admin-tabs" aria-label="后台页面标签">`
    + `<span class="admin-tab is-active" aria-current="page">${page.label}</span>`
    + `<button class="admin-tab admin-tab--action" type="button" id="admin-logout-tab">登出</button></nav>`;
}

/* 后台页脚直接复用主页的共享组件：数据取自同一份 site-content.json，
   由 site-footer.js 生成与主页完全相同的 DOM；样式由 site-footer.css 统一提供。
   后台无需加载整套数据层，也不会出现两份文案不同步。 */
function adminFooterMarkup() {
  const content = JSON.parse(fs.readFileSync(
    path.join(SITE_ROOT, "assets/data/site-content.json"), "utf8"));
  const data = { meta: content.data.meta, navMain: content.data.nav_main, ui: content.ui.footer };
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return '<div id="app-footer"></div>\n'
    + '<script>window.__SFK_FOOTER_DATA__=' + json + ';</script>';
}

function sendAdminPage(file, current, req, res) {
  try {
    const me = accounts.publicUser(req.user);
    const fill = (name, values) => fs.readFileSync(path.join(VIEWS, name), "utf8")
      .replace(/\{\{(\w+)\}\}/g, (_m, key) => values[key]);
    const html = fs.readFileSync(path.join(SITE_ROOT, file), "utf8")
      .replace(/<head[^>]*>/i, match => `${match}\n${GATE_MARKER}<base href="${escapeHtml(joinPath(basePath(), "/"))}">`)
      .replace("<!-- admin:topbar -->", fill("admin-topbar.html", { account: escapeHtml(`${me.name} · ${me.roleLabel}`) }))
      .replace("<!-- admin:nav -->", "")
      .replace("<!-- admin:tabs -->", adminTabs(current))
      .replace("<!-- admin:footer -->", adminFooterMarkup());
    res.setHeader("Cache-Control", "no-store");
    res.type("html").send(html);
  } catch (error) {
    console.error("[admin-page]", error);
    res.status(500).send("Not Found");
  }
}

function createApp() {
  const app = express();
  const site = express.Router();
  const base = basePath();

  app.set("trust proxy", true);
  app.disable("x-powered-by");
  app.use(express.json({ limit: "512kb" }));
  app.use(cookieParser());
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
  });

  site.use(attachUser);
  /* 全站闸门：任何未列在白名单里的地址，未登录都拿不到内容。
     文档类请求 302 到登录页（带 next 回跳），XHR / 静态子资源返回 401 JSON。 */
  site.use((req, res, next) => (isPublicPath(req) ? next() : requireLogin(req, res, next)));
  site.get("/healthz", (_req, res) => res.json({ ok: true }));

  site.get("/api/auth/me", (req, res) => {
    if (!req.user) return sendError(res, 401, "未登录");
    res.setHeader("Cache-Control", "no-store");
    res.json({ user: accounts.publicUser(req.user) });
  });

  site.post("/api/auth/login", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const ip = clientIp(req);
    if (tooManyLogins(ip)) return sendError(res, 429, "尝试次数过多，请稍后再试");
    const username = String((req.body && req.body.username) || "").trim();
    const password = String((req.body && req.body.password) || "");
    if (!username || !password) {
      recordLogin(ip);
      return sendError(res, 400, "请输入账号或邮箱，以及密码");
    }
    const user = accounts.authenticate(username, password);
    if (!user) {
      recordLogin(ip);
      return sendError(res, 401, "账号或密码不正确");
    }
    loginAttempts.delete(ip);
    res.cookie(session.COOKIE_NAME,
      session.createToken(user.id, accounts.fingerprint(user)),
      session.cookieOptions());
    res.json({ user: accounts.publicUser(user) });
  });

  site.post("/api/auth/password", requireLogin, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const attempts = passwordAttempts;
    if (tooManyAttempts(attempts, req.user.id)) return sendError(res, 429, "尝试次数过多，请稍后再试");
    const current = String((req.body && req.body.currentPassword) || "");
    const next = String((req.body && req.body.newPassword) || "");
    if (!current || !next) return sendError(res, 400, "请填写当前密码与新密码");
    if (current === next) return sendError(res, 400, "新密码不能与当前密码相同");
    const selfLog = extra => auditLog(req, {
      action: "account.password.self", targetId: req.user.id, targetName: req.user.name, ...extra
    });
    if (!accounts.verifyPassword(req.user.id, current)) {
      recordAttempt(attempts, req.user.id);
      selfLog({ result: "failed", reason: "当前密码不正确" });
      return sendError(res, 400, "当前密码不正确");
    }
    try {
      accounts.setPassword(req.user.id, next);
      await accounts.flush();
    } catch (error) {
      selfLog({ result: "failed", reason: error.message });
      return sendError(res, 400, error.message);
    }
    attempts.delete(req.user.id);
    selfLog({ changes: [PASSWORD_CHANGE] });
    const updated = accounts.findById(req.user.id);
    res.cookie(session.COOKIE_NAME,
      session.createToken(updated.id, accounts.fingerprint(updated)),
      session.cookieOptions());
    return res.json({ ok: true, user: accounts.publicUser(updated) });
  });

  site.post("/api/auth/logout", (_req, res) => {
    res.clearCookie(session.COOKIE_NAME, session.clearCookieOptions());
    res.json({ ok: true });
  });

  site.get("/login.html", (req, res) => {
    if (req.user) {
      const requested = typeof req.query.next === "string" ? req.query.next : "";
      const safe = requested.startsWith("/") && !requested.startsWith("//")
        && !requested.includes("\\") && !requested.includes("://") && !requested.includes("login.html");
      return res.redirect(safe ? requested : joinPath(base, "/"));
    }
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(path.join(SITE_ROOT, "login.html"));
  });

  /* 后台页面：仅登录用户可进；数据范围由 /api/accounts 控制 */
  site.get("/admin", requireLogin, (req, res) => sendAdminPage("admin.html", "accounts", req, res));
  site.get("/admin.html", (_req, res) => res.redirect(joinPath(basePath(), "/admin")));

  site.get("/api/roles", requireLogin, (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ roles: rolesForClient(), permissions: permissionsForClient() });
  });

  site.post("/api/usage", requireLogin, express.text({ type: () => true, limit: "4kb" }), (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    let payload = req.body;
    if (typeof payload === "string") {
      try { payload = JSON.parse(payload || "{}"); } catch (_error) { payload = {}; }
    }
    if (!payload || typeof payload !== "object") payload = {};
    const written = usage.record(req.user, payload);
    res.status(written ? 202 : 400).json({ ok: written });
  });

  site.get("/api/activity", requireLogin, (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try { res.json(usage.activity({ roster: accounts.list() })); }
    catch (error) { console.error("[activity]", error); sendError(res, 500, error.message); }
  });

  site.get("/api/audit", requireLogin, requireAdmin, (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      res.json({
        ...audit.query({
          days: req.query.days === undefined ? 7 : Number(req.query.days),
          action: String(req.query.action || ""),
          actor: String(req.query.actor || ""),
          q: String(req.query.q || ""),
          result: String(req.query.result || ""),
          page: Number(req.query.page) || 1,
          pageSize: Number(req.query.pageSize) || 10
        }),
        facets: audit.facets()
      });
    } catch (error) { console.error("[audit-query]", error); sendError(res, 500, error.message); }
  });

  site.get("/api/usage/overview", requireLogin, requireAdmin, (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try { res.json(usage.overview({ days: Number(req.query.days) || 0, roster: accounts.list() })); }
    catch (error) { console.error("[usage-overview]", error); sendError(res, 500, error.message); }
  });

  site.get("/api/usage/export", requireLogin, requireAdmin, (req, res) => {
    const days = Number(req.query.days) || 0;
    try {
      const data = usage.overview({ days, roster: accounts.list() });
      const buffer = xlsx.build(usage.exportSheets(data));
      const stamp = new Date().toISOString().slice(0, 10);
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition",
        `attachment; filename="fashion-usage-${days ? `${days}d` : "all"}-${stamp}.xlsx"`);
      res.setHeader("Content-Length", buffer.length);
      res.end(buffer);
    } catch (error) { console.error("[usage-export]", error); sendError(res, 500, `导出失败：${error.message}`); }
  });

  site.get("/api/accounts", requireLogin, (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const scope = accountScope(req.user);
    let visible;
    if (scope === "all") visible = accounts.list();
    else if (scope === "position") visible = accounts.list().filter(user => isScopedAccount(user) || user.id === req.user.id);
    else visible = [accounts.publicUser(req.user)];
    res.json({
      accounts: visible, scope,
      scopedPosition: scope === "position" ? SCOPED_POSITION : null,
      currentUser: accounts.publicUser(req.user),
      currentUserId: req.user.id,
      source: accounts.source(),
      readOnly: accounts.source() === "env"
    });
  });

  site.post("/api/accounts", requireLogin, async (req, res) => {
    const body = req.body || {};
    if (!assertRoleChangeAllowed(req, res, body)) return;
    const scope = accountScope(req.user);
    const createFailed = reason => auditLog(req, {
      action: "account.create", targetId: String(body.username || "—"),
      targetName: String(body.name || ""), result: "failed", reason
    });
    if (scope === "self") {
      createFailed("当前角色没有管理账号的权限");
      return sendError(res, 403, "当前角色没有管理账号的权限");
    }
    if (scope === "position" && String(body.position || "").trim() !== SCOPED_POSITION) {
      const reason = `当前角色只能新建「${SCOPED_POSITION}」职位的账号`;
      createFailed(reason);
      return sendError(res, 403, reason);
    }
    try {
      const user = accounts.create(body);
      await accounts.flush();
      auditLog(req, {
        action: "account.create", targetId: user.id, targetName: user.name,
        changes: Object.keys(AUDIT_FIELDS).filter(key => body[key] !== undefined).map(key => ({
          field: key, label: AUDIT_FIELDS[key], before: "—",
          after: key === "role" ? ((ROLES[user.role] && ROLES[user.role].label) || user.role)
            : String(body[key] == null ? "" : body[key]) || "—"
        }))
      });
      res.status(201).json({ account: accounts.publicUser(user), initialPassword: user.initialPassword || null });
    } catch (error) {
      createFailed(error.message);
      sendError(res, 400, error.message);
    }
  });

  site.patch("/api/accounts/:id", requireLogin, async (req, res) => {
    const body = req.body || {};
    const scope = accountScope(req.user);
    const self = String(req.params.id || "").trim().toLowerCase() === String(req.user.id).toLowerCase();
    const target = accounts.findById(req.params.id);
    const before = auditSnapshot(target);
    const action = auditAction(body);
    const patchFailed = reason => auditLog(req, {
      action, targetId: req.params.id, targetName: target ? target.name : "", result: "failed", reason
    });
    const allowed = scope === "all" || self || (scope === "position" && isScopedAccount(target));
    if (!allowed) {
      const message = "只能修改本人或当前角色管理范围内的账号信息";
      patchFailed(message);
      return sendError(res, 403, message);
    }
    if (!assertRoleChangeAllowed(req, res, body)) return;
    try {
      const user = accounts.update(req.params.id, body);
      await accounts.flush();
      const changes = auditChanges(before, auditSnapshot(user), Object.keys(body));
      if (body.password !== undefined && body.password !== "") changes.push({ ...PASSWORD_CHANGE, after: "已重置" });
      auditLog(req, { action, targetId: user.id, targetName: user.name, changes });
      res.json({ account: accounts.publicUser(user) });
    } catch (error) {
      patchFailed(error.message);
      sendError(res, 400, error.message);
    }
  });

  site.delete("/api/accounts/:id", requireLogin, async (req, res) => {
    const scope = accountScope(req.user);
    const target = accounts.findById(req.params.id);
    const before = auditSnapshot(target);
    const deleteFailed = reason => auditLog(req, {
      action: "account.delete", targetId: req.params.id,
      targetName: target ? target.name : "", result: "failed", reason
    });
    if (scope === "self") {
      const message = "当前角色没有管理账号的权限";
      deleteFailed(message);
      return sendError(res, 403, message);
    }
    if (scope === "position" && !isScopedAccount(target)) {
      const reason = `当前角色只能删除「${SCOPED_POSITION}」职位的账号`;
      deleteFailed(reason);
      return sendError(res, 403, reason);
    }
    try {
      const user = accounts.remove(req.params.id, req.user.id);
      await accounts.flush();
      auditLog(req, {
        action: "account.delete", targetId: user.id, targetName: user.name,
        changes: [{ field: "account", label: "账号状态", before: `存在 · ${before ? before.role : ""}`, after: "已删除" }]
      });
      res.json({ ok: true, account: accounts.publicUser(user) });
    } catch (error) {
      deleteFailed(error.message);
      sendError(res, 400, error.message);
    }
  });

  /* 已登录才下发主页：全站闸门已在此前统一拦截，这里只负责注入守卫标记 */
  site.get("/", requireContentAccess, (_req, res) => sendHtmlWithMarker("index.html", res));
  site.get("/index.html", requireContentAccess, (_req, res) => sendHtmlWithMarker("index.html", res));
  site.use(requireContentAccess, express.static(SITE_ROOT, {
    index: "index.html", dotfiles: "ignore", fallthrough: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
    }
  }));
  site.use((_req, res) => res.status(404).send("Not Found"));
  site.use((error, _req, res, _next) => {
    console.error("[auth-api]", error);
    sendError(res, 500, "服务暂时不可用");
  });

  if (base) {
    app.use(base, site);
    app.get("/healthz", (_req, res) => res.json({ ok: true }));
    app.use((req, res) => {
      if (req.path === "/" || req.path === "") return res.redirect(joinPath(base, "/"));
      res.status(404).send("Not Found");
    });
  } else {
    app.use(site);
  }
  return app;
}

module.exports = { createApp, basePath };
