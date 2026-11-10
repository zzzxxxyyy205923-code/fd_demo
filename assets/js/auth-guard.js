/*
  客户端登录态守卫（复用 art-humanities_demo 后台管理系统的同一套机制）
  ------------------------------------------------------------------
  · 真正的访问控制由 server/app.js 负责：除登录页自身与认证接口外，任何路径
    （主页 / index.html / assets/** / 数据 JSON / /admin / /api/*）未登录一律 302 / 401。
  · 客户端守卫是会话失效的兜底：/api/auth/me 返回 401 立即带 next 跳回登录页，
    不会出现「页面还开着但操作全失败」的悬空状态。
  · 只有服务端下发页面时注入的 window.__SFK_GATE__ 存在才发请求；
    纯静态托管 / 本地直开没有服务端，自然无法做登录校验（见 README）。
  · 登录后：导航栏右上角的用户姓名按钮（→ 后台）显形；顶部导航栏不再放登出按钮，
    登出入口保留在移动端下拉菜单与后台页顶栏/标签，由 auth-guard / admin-shell 各自绑定。
  · 暴露 window.SFKAuth.syncSessionActions()，页头动态渲染完成后主动补一次同步。
*/
(() => {
  const ME_ENDPOINT = "api/auth/me";
  const LOGIN_PAGE = "login.html";
  const USAGE_ENDPOINT = "api/usage";

  const whenReady = fn => (document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", fn, { once: true })
    : fn());

  let sessionRetry = 0;

  const setSessionActions = user => {
    const who = String((user && (user.name || user.username)) || "").trim();
    const initial = who ? Array.from(who)[0] : "·";
    const entries = document.querySelectorAll("#admin-entry, [data-admin-entry]");
    const logouts = document.querySelectorAll("[data-nav-logout]");

    entries.forEach(entry => {
      /* 右上角按钮有「头像 + 姓名 + 箭头」三段结构，只填对应子节点，
         不整体覆盖 textContent，避免把视觉标识一起抹掉；旧式纯文本入口仍有兜底。 */
      const nameEl = entry.querySelector("[data-user-name]");
      const initialEl = entry.querySelector("[data-user-initial]");
      if (nameEl) nameEl.textContent = who || "用户";
      else entry.textContent = who || "账号与权限";
      if (initialEl) initialEl.textContent = initial;
      const baseAria = entry.getAttribute("data-admin-aria") || "进入后台管理系统";
      const accessible = who ? `${who} · ${baseAria}` : baseAria;
      entry.setAttribute("aria-label", accessible);
      entry.setAttribute("title", accessible);
      entry.hidden = !user;
    });
    logouts.forEach(button => {
      if (!button.dataset.bound) {
        button.addEventListener("click", () => window.SFKAuth.logout());
        button.dataset.bound = "1";
      }
      button.hidden = !user;
    });

    if (!entries.length && !logouts.length && sessionRetry < 8) {
      sessionRetry += 1;
      window.setTimeout(() => revealSessionActions(user), 150);
    }
  };

  const revealSessionActions = user => whenReady(() => setSessionActions(user));

  /* 会话失效的统一落地：把当前地址（含 hash 路由）放进 next，登录后原路返回 */
  const goLogin = () => {
    if (/login\.html$/.test(window.location.pathname)) return;
    const current = window.location.pathname + window.location.search + window.location.hash;
    window.location.replace(`${LOGIN_PAGE}?next=${encodeURIComponent(current || "/")}`);
  };

  /* 使用埋点：与源站同一口径（板块浏览 / 停留时长 / 登录进站），
     只映射本站真实存在的 hash 路由；清单外的页面不上报。 */
  const PAGE_LABELS = {
    courses: { target: "course-products", label: "课程产品" },
    colleges: { target: "schools", label: "院校库" },
    offer: { target: "offers", label: "offer展示" },
    stories: { target: "portfolio", label: "案例展示" }
  };
  const reportUsage = payload => {
    try {
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) navigator.sendBeacon(USAGE_ENDPOINT, body);
      else fetch(USAGE_ENDPOINT, { method: "POST", body, keepalive: true, credentials: "same-origin" });
    } catch (_error) { /* 打点失败绝不影响页面功能 */ }
  };

  const currentSection = () => {
    const first = String(location.hash || "").replace(/^#\/?/, "").split("/")[0];
    return PAGE_LABELS[first] || { target: "", label: "" };
  };
  const usageState = { target: "", label: "", since: 0, timer: 0 };
  const flushDwell = () => {
    const ms = usageState.since ? Date.now() - usageState.since : 0;
    if (usageState.target && ms >= 1000) {
      reportUsage({ kind: "dwell", target: usageState.target, label: usageState.label, ms });
    }
    usageState.since = Date.now();
  };
  const syncSection = () => {
    const section = currentSection();
    if (section.target === usageState.target) return;
    flushDwell();
    usageState.target = section.target;
    usageState.label = section.label;
    usageState.since = Date.now();
    if (section.target) reportUsage({ kind: "page", target: section.target, label: section.label });
  };
  const startUsageTracking = () => {
    if (usageState.timer) return;
    reportUsage({ kind: "active", target: "visit", label: "登录进站" });
    syncSection();
    usageState.timer = window.setInterval(syncSection, 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) flushDwell();
      else usageState.since = Date.now();
    });
    window.addEventListener("pagehide", flushDwell);
  };

  window.SFKAuth = {
    user: null,
    /* 页头动态渲染后补同步；无登录态时保持默认全 hidden（静态预览 / 未登录不显形任何入口） */
    syncSessionActions() { if (this.user) revealSessionActions(this.user); },
    goLogin,
    /* 退出：先让服务端清掉 httpOnly 会话 cookie，再返回登录页；
       即使接口超时也强制回登录页，避免出现「退出后仍停在已登录页面」。 */
    logout() {
      return fetch("api/auth/logout", {
        method: "POST", credentials: "same-origin",
        headers: { Accept: "application/json" }
      })
        .catch(() => {})
        .then(() => {
          window.SFKAuth.user = null;
          window.location.replace(LOGIN_PAGE);
        });
    }
  };

  if (/login\.html$/.test(window.location.pathname)) return;
  if (!window.__SFK_GATE__) return;

  fetch(ME_ENDPOINT, {
    credentials: "same-origin", cache: "no-store",
    headers: { Accept: "application/json" }
  })
    .then(response => {
      if (response.status === 401) { goLogin(); return null; }
      /* 403/5xx 不当作「已登录」放行，也不当作「未登录」误跳；保持入口隐藏 */
      if (!response.ok) return null;
      return response.json().catch(() => null);
    })
    .then(payload => {
      if (!payload || !payload.user) return;
      window.SFKAuth.user = payload.user;
      revealSessionActions(payload.user);
      startUsageTracking();
    })
    .catch(() => { /* 离线 / 静态托管 → 放行 */ });
})();
