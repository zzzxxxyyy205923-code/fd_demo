/*
  网站信息更改 · 操作日志（审计轨迹）
  ------------------------------------------------------------------
  · 采集：所有「账号与权限」写操作（新建 / 改资料 / 调整角色与权限 / 改密 / 删除）
    由 server/app.js 在成功与失败两条路径上各记一条，含更改前后的逐字段对比。
  · 落盘：server/data/audit.jsonl —— 一行一条 JSON，追加写；超过 MAX_LINES 裁掉最旧部分。
    可用 AUTH_AUDIT_FILE 指向别处（便于隔离测试），目录与 accounts.json / usage.jsonl 一致，不进版本库。
  · 密码绝不落明文：密码类变更只记「已重置 / 已修改」，前后值统一为脱敏占位。
  · 关键更改（severity=critical）：删除账号、角色/权限调整、重置密码 —— 前端给醒目状态标识。
  · 查询：按时间范围 / 操作类型 / 操作人 / 关键词（受影响账号或权限项）/ 结果筛选，服务端分页。
  · 权限：本模块不鉴权，路由层只把 /api/audit 开给 role === 'admin'（超级管理员）。
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FILE = process.env.AUTH_AUDIT_FILE || path.join(__dirname, "..", "data", "audit.jsonl");
const MAX_LINES = Number(process.env.AUTH_AUDIT_MAX_LINES || 20000);

/* 操作类型字典：既决定显示名，也决定是否为关键更改 */
const ACTIONS = {
  "account.create": { label: "新建账号", critical: false },
  "account.update": { label: "修改资料", critical: false },
  "account.role": { label: "调整角色", critical: true },
  "account.permission": { label: "调整权限", critical: true },
  "account.password": { label: "重置密码", critical: true },
  "account.password.self": { label: "自助改密", critical: false },
  "account.delete": { label: "删除账号", critical: true },
  "content.create": { label: "新增站点内容", critical: false },
  "content.update": { label: "编辑站点内容", critical: false },
  "content.delete": { label: "删除站点内容", critical: true },
  "content.upload": { label: "上传图片", critical: false }
};

const clip = (value, max) => String(value == null ? "" : value).trim().slice(0, max);
let trimming = false;

function trim() {
  if (trimming) return;
  trimming = true;
  fs.readFile(FILE, "utf8", (error, text) => {
    trimming = false;
    if (error) return;
    const lines = text.split("\n").filter(Boolean);
    if (lines.length <= MAX_LINES) return;
    fs.writeFile(FILE, `${lines.slice(-MAX_LINES).join("\n")}\n`, "utf8", writeError => {
      if (writeError) console.error("[audit] 裁剪失败：", writeError.message);
    });
  });
}

/* ── 采集 ───────────────────────────────────────────────── */
function write(entry = {}) {
  const action = ACTIONS[entry.action] ? entry.action : "account.update";
  const meta = ACTIONS[action];
  const changes = (Array.isArray(entry.changes) ? entry.changes : []).slice(0, 20).map(change => ({
    field: clip(change && change.field, 40),
    label: clip(change && change.label, 40),
    before: clip(change && change.before, 160),
    after: clip(change && change.after, 160)
  }));
  const record = {
    id: `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    ts: Date.now(),
    actorId: clip(entry.actorId, 80),
    actorName: clip(entry.actorName, 60),
    actorRole: clip(entry.actorRole, 40),
    action,
    actionLabel: meta.label,
    targetId: clip(entry.targetId, 80),
    targetName: clip(entry.targetName, 60),
    changes,
    result: entry.result === "failed" ? "failed" : "success",
    reason: clip(entry.reason, 200),
    severity: (entry.critical || meta.critical) ? "critical" : "normal",
    ip: clip(entry.ip, 60)
  };
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.appendFile(FILE, `${JSON.stringify(record)}\n`, error => {
    if (error) console.error("[audit] 写入失败：", error.message);
    else trim();
  });
  return record;
}

function readAll() {
  try {
    return fs.readFileSync(FILE, "utf8").split("\n")
      .filter(Boolean)
      .map(line => { try { return JSON.parse(line); } catch (_error) { return null; } })
      .filter(item => item && item.ts && item.action);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw new Error(`操作日志文件读取失败：${error.message}`);
  }
}

/* 关键词覆盖：受影响的账号、操作者、操作类型、字段名与前后值、失败原因 */
const searchable = item => [
  item.targetId, item.targetName, item.actorId, item.actorName, item.actionLabel, item.reason,
  ...(item.changes || []).flatMap(change => [change.field, change.label, change.before, change.after])
].join(" ").toLowerCase();

/* ── 查询 / 筛选 / 分页 ───────────────────────────────────── */
function query({ days = 7, action = "", actor = "", q = "", result = "", page = 1, pageSize = 10 } = {}) {
  const windowDays = Number(days) > 0 ? Number(days) : 0;          /* 0 = 全部 */
  const since = windowDays ? Date.now() - windowDays * 86400000 : 0;
  const keyword = String(q || "").trim().toLowerCase();
  const actorKey = String(actor || "").trim().toLowerCase();

  let items = readAll().filter(item => (item.ts || 0) >= since);
  if (action) items = items.filter(item => item.action === action);
  if (actorKey) {
    items = items.filter(item => String(item.actorId || "").toLowerCase() === actorKey
      || String(item.actorName || "").toLowerCase().includes(actorKey));
  }
  if (result) items = items.filter(item => item.result === result);
  if (keyword) items = items.filter(item => searchable(item).includes(keyword));
  items.sort((a, b) => b.ts - a.ts);                                  /* 最新在前，便于追溯 */

  const total = items.length;
  const size = Math.max(1, Math.min(50, Number(pageSize) || 10));
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.max(1, Math.min(pages, Number(page) || 1));
  return {
    items: items.slice((current - 1) * size, current * size),
    total,
    page: current,
    pages,
    pageSize: size,
    days: windowDays,
    generatedAt: new Date().toISOString()
  };
}

/* 筛选项：操作类型固定给全量字典（没有数据也能选）；操作人从实际日志中去重 */
function facets() {
  const all = readAll();
  const actors = new Map();
  all.forEach(item => {
    if (item.actorId && !actors.has(item.actorId)) {
      actors.set(item.actorId, { id: item.actorId, name: item.actorName || item.actorId });
    }
  });
  return {
    actions: Object.entries(ACTIONS).map(([id, meta]) => ({ id, label: meta.label, critical: meta.critical })),
    actors: [...actors.values()]
  };
}

module.exports = { FILE, ACTIONS, write, query, facets, readAll };
