/*
  网站使用概览 —— 使用埋点的采集与聚合（唯一数据源）
  ------------------------------------------------------------------
  · 采集：登录态下上报六类事件（客户端 assets/js/auth-guard.js 用 sendBeacon 打点）
      page         板块/页面浏览（target = 板块 id，label = 中文名）
      dwell        该板块的停留时长（ms，按累计值上报）
      mentor       导师信息访问（点开某位导师的卡片/图片弹窗）
      course       课程海报访问（点击「课程目录」浮层内的一张课程海报 = 一次访问）
      course_dwell 该次课程海报查看的停留时长（图片弹层打开→关闭，ms）
      active       登录进站（每次确认登录态上报一次，保证「只进站不浏览」的用户也计入活跃）
  · 落盘：server/data/usage.jsonl —— 一行一条 JSON，追加写。
    目录随站点数据纳入版本库；超过 MAX_LINES 行自动裁掉最旧部分。
  · 聚合：按时间窗汇总「用户 / 板块 / 导师 / 课程」四个维度，并把账号库名单并进来
    （没使用过的账号也会出现，标 active=false），供后台「网站使用概览」展示与导出。
  · 活跃地图：activity() 以账号库全部已录入用户为数据集合，按自然月 / 自然年聚合
    「当日 / 当月活跃用户数」，见该函数处的口径说明。
  · 板块清单：SECTIONS 是页面两张图表的固定清单（2026-11-09 起去掉「科系介绍/首页」
    与「账号与权限（后台）」，新增「导师团队」「offer展示」）。清单外的 page/dwell
    事件一律不计入；清单内的板块即使暂无数据也会以 0 值出现在图表里。
  · 权限：本模块不做鉴权 —— 路由层只把 /api/usage/* 开给 role === 'admin'（管理员）；
    /api/activity 只返回聚合数字，对所有登录角色开放。
*/
const fs = require("fs");
const path = require("path");
const { roleOf, roleLabel } = require("./permissions");

const FILE = process.env.AUTH_USAGE_FILE || path.join(__dirname, "..", "data", "usage.jsonl");
const MAX_LINES = Number(process.env.AUTH_USAGE_MAX_LINES || 20000);
const MAX_DWELL_MS = 6 * 60 * 60 * 1000;      /* 单条停留时长上限 6 小时，防脏数据 */
const EVENTS = new Set(["page", "dwell", "mentor", "course", "course_dwell", "active"]);

/* 「板块页面访问量」与「各板块平均停留时长」两张图共用这份固定清单 */
const SECTIONS = [
  { target: "portfolio", label: "案例展示" },
  { target: "schools", label: "院校库" },
  { target: "planning", label: "全链路规划" },
  { target: "course-products", label: "课程产品" },
  { target: "mentors", label: "导师团队" },
  { target: "offers", label: "offer展示" }
];
const SECTION_TARGETS = new Set(SECTIONS.map(section => section.target));
const COURSE_META_FIELDS = ["catalog", "course", "category", "level", "poster"];

let trimming = false;

const clip = (value, max) => String(value == null ? "" : value).trim().slice(0, max);

/* ── 采集 ───────────────────────────────────────────────── */
function record(user, payload = {}) {
  if (!user || !EVENTS.has(payload.kind)) return false;
  const target = clip(payload.target, 80);
  if (!target) return false;
  const timed = payload.kind === "dwell" || payload.kind === "course_dwell";
  const event = {
    ts: Date.now(),
    uid: user.id,
    user: user.username,
    name: user.name,
    role: roleOf(user),
    kind: payload.kind,
    target,
    label: clip(payload.label, 60) || target,
    ms: timed ? Math.max(0, Math.min(MAX_DWELL_MS, Math.round(Number(payload.ms) || 0))) : 0
  };
  if (payload.kind === "course" || payload.kind === "course_dwell") {
    const raw = payload.meta && typeof payload.meta === "object" ? payload.meta : {};
    event.meta = {};
    COURSE_META_FIELDS.forEach(key => { event.meta[key] = clip(raw[key], 160); });
  }
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.appendFile(FILE, `${JSON.stringify(event)}\n`, error => {
    if (error) console.error("[usage] 写入失败：", error.message);
    else trim();
  });
  return true;
}

/* 行数超上限时保留最近的 MAX_LINES 行（异步、单飞，避免并发重写） */
function trim() {
  if (trimming) return;
  trimming = true;
  fs.readFile(FILE, "utf8", (error, text) => {
    trimming = false;
    if (error) return;
    const lines = text.split("\n").filter(Boolean);
    if (lines.length <= MAX_LINES) return;
    fs.writeFile(FILE, `${lines.slice(-MAX_LINES).join("\n")}\n`, "utf8", writeError => {
      if (writeError) console.error("[usage] 裁剪失败：", writeError.message);
    });
  });
}

function readEvents() {
  try {
    return fs.readFileSync(FILE, "utf8").split("\n")
      .filter(Boolean)
      .map(line => { try { return JSON.parse(line); } catch (_error) { return null; } })
      .filter(event => event && event.ts && event.kind);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw new Error(`使用数据文件读取失败：${error.message}`);
  }
}

/* ── 聚合 ───────────────────────────────────────────────── */
const emptyRow = account => ({
  uid: account.id, username: account.username, name: account.name,
  department: account.department || "", region: account.region || "",
  position: account.position || "",
  role: roleOf(account), roleLabel: roleLabel(account),
  views: 0, dwellMs: 0, mentorViews: 0, courseViews: 0, lastTs: 0, active: false,
  pages: new Map(), mentors: new Map()
});

function overview({ days = 7, roster = [] } = {}) {
  const windowDays = Number(days) > 0 ? Number(days) : 0;          /* 0 = 全部 */
  const since = windowDays ? Date.now() - windowDays * 86400000 : 0;
  const events = readEvents().filter(event => (event.ts || 0) >= since);

  const users = new Map();
  const pages = new Map();
  const mentors = new Map();
  const courses = new Map();

  /* 固定板块清单先占位：没有埋点的板块也会出现在两张图里（0 次 / 0 秒） */
  SECTIONS.forEach(section => pages.set(section.target, {
    target: section.target, label: section.label, views: 0, dwellMs: 0, viewers: new Set()
  }));

  roster.forEach(account => users.set(account.id, emptyRow(account)));

  events.forEach(event => {
    /* 账号可能已被删除：仍然统计历史，用事件里自带的身份信息兜底 */
    const uid = event.uid || event.user;
    let row = users.get(uid);
    if (!row) {
      row = {
        ...emptyRow({ id: uid, username: event.user, name: event.name, role: event.role }),
        roleLabel: (() => { try { return roleLabel({ role: event.role }); } catch (_error) { return event.role; } })()
      };
      users.set(uid, row);
    }
    row.active = true;
    row.lastTs = Math.max(row.lastTs, event.ts);

    if (event.kind === "page" && SECTION_TARGETS.has(event.target)) {
      row.views += 1;
      const entry = row.pages.get(event.target) || { target: event.target, label: event.label, views: 0, dwellMs: 0 };
      entry.views += 1;
      entry.label = pages.get(event.target).label;
      row.pages.set(event.target, entry);

      const page = pages.get(event.target);
      page.views += 1;
      page.viewers.add(uid);
    } else if (event.kind === "dwell" && SECTION_TARGETS.has(event.target)) {
      row.dwellMs += event.ms || 0;
      const entry = row.pages.get(event.target) || { target: event.target, label: event.label, views: 0, dwellMs: 0 };
      entry.dwellMs += event.ms || 0;
      entry.label = pages.get(event.target).label;
      row.pages.set(event.target, entry);

      const page = pages.get(event.target);
      page.dwellMs += event.ms || 0;
      page.viewers.add(uid);
    } else if (event.kind === "mentor") {
      row.mentorViews += 1;
      const entry = row.mentors.get(event.target) || { target: event.target, label: event.label, views: 0 };
      entry.views += 1;
      entry.label = event.label || entry.label;
      row.mentors.set(event.target, entry);

      const mentor = mentors.get(event.target) || { target: event.target, label: event.label, views: 0, viewers: new Set() };
      mentor.views += 1;
      mentor.label = event.label || mentor.label;
      mentor.viewers.add(uid);
      mentors.set(event.target, mentor);
    } else if (event.kind === "course" || event.kind === "course_dwell") {
      const entry = courses.get(event.target) || {
        target: event.target, label: event.label, views: 0, dwellMs: 0, viewers: new Set(),
        catalog: "", category: "", level: "", poster: "", lastTs: 0
      };
      if (event.kind === "course") {
        entry.views += 1;
        entry.viewers.add(uid);
        row.courseViews += 1;
      } else {
        entry.dwellMs += event.ms || 0;
      }
      entry.label = event.label || entry.label;
      if (event.meta && event.ts >= entry.lastTs) {
        COURSE_META_FIELDS.forEach(key => { if (event.meta[key]) entry[key] = event.meta[key]; });
        entry.lastTs = event.ts;
      }
      courses.set(event.target, entry);
    }
  });

  const usersOut = [...users.values()].map(row => ({
    ...row,
    pages: [...row.pages.values()].sort((a, b) => (b.views - a.views) || (b.dwellMs - a.dwellMs)),
    mentors: [...row.mentors.values()].sort((a, b) => b.views - a.views),
    lastAt: row.lastTs ? new Date(row.lastTs).toISOString() : ""
  })).sort((a, b) =>
    (Number(b.active) - Number(a.active)) ||
    (b.dwellMs - a.dwellMs) ||
    (b.views - a.views) ||
    String(a.username).localeCompare(String(b.username)));

  const pagesOut = SECTIONS.map(section => {
    const row = pages.get(section.target);
    return {
      target: row.target, label: section.label, views: row.views, dwellMs: row.dwellMs,
      viewers: row.viewers.size,
      avgMs: row.views ? Math.round(row.dwellMs / row.views) : Math.round(row.dwellMs)
    };
  }).sort((a, b) => (b.views - a.views) || (b.dwellMs - a.dwellMs));

  const mentorsOut = [...mentors.values()].map(row => ({
    target: row.target, label: row.label, views: row.views, viewers: row.viewers.size
  })).sort((a, b) => (b.views - a.views) || String(a.label).localeCompare(String(b.label)));

  /* 课程热度：访问次数 + 停留秒数（1 次访问 = 1 分，停留 1 秒 = 1 分）。
     两个因子都参与排名；分数并列时访问次数多的在前。 */
  const coursesOut = [...courses.values()].map(row => ({
    target: row.target, label: row.label,
    catalog: row.catalog, category: row.category, level: row.level, poster: row.poster,
    views: row.views, dwellMs: row.dwellMs,
    avgMs: row.views ? Math.round(row.dwellMs / row.views) : 0,
    viewers: row.viewers.size,
    score: Math.round(row.views + row.dwellMs / 1000)
  })).sort((a, b) =>
    (b.score - a.score) || (b.views - a.views) || String(a.label).localeCompare(String(b.label)));

  return {
    days: windowDays,
    since: since ? new Date(since).toISOString() : "",
    generatedAt: new Date().toISOString(),
    totals: {
      accounts: users.size,
      activeUsers: usersOut.filter(row => row.active).length,
      views: usersOut.reduce((sum, row) => sum + row.views, 0),
      dwellMs: usersOut.reduce((sum, row) => sum + row.dwellMs, 0),
      mentorViews: usersOut.reduce((sum, row) => sum + row.mentorViews, 0),
      courseViews: usersOut.reduce((sum, row) => sum + row.courseViews, 0),
      courseDwellMs: coursesOut.reduce((sum, row) => sum + row.dwellMs, 0),
      events: events.length
    },
    users: usersOut,
    pages: pagesOut,
    mentors: mentorsOut,
    courses: coursesOut,
    sections: SECTIONS.map(section => section.label)
  };
}

/* ── 活跃地图：全站口径聚合 ─────────────────────────────────────
   统计口径（2026-11-10 起，替代原「仅本机 localStorage」）：
     · 数据集合 = 账号库当前全部已录入用户（roster）。从未登录 / 从未活跃的用户
       同样在集合内，作为分母；界面会显示「未活跃用户数」。
     · 活跃 = 某用户在某个自然日至少有一条使用事件（page/dwell/mentor/course/
       course_dwell/active）。同一用户一天内多条事件只算 1 个活跃用户。
     · 按自然日聚合 → days['YYYY-MM-DD'] = { users 活跃用户数, events 事件数, rate 活跃率% }；
       按自然月聚合 → months['YYYY-MM'] = { users 当月活跃用户数, activeDays 活跃天数, events }；
       按自然年聚合 → years['YYYY'] = { users 当年活跃用户数, activeDays 当年活跃天数, events }。
       月视图取当前自然月的每一天，年视图取当前自然年的 12 个月，均为自然月 / 自然年口径。
     · 只统计仍在账号库内的 uid（已删除账号的历史事件不进入用户数，避免活跃数超过分母）。
     · 只返回聚合数字，不下发姓名 / 邮箱等个人身份，故所有登录角色都可查看。 */
function activity({ roster = [] } = {}) {
  const known = new Set(roster.map(account => String(account.id || "").toLowerCase()));
  const totalUsers = known.size;
  const pad = value => String(value).padStart(2, "0");
  const dayKeyOf = ts => {
    const date = new Date(ts);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const byDay = new Map();
  const byMonth = new Map();
  const byYear = new Map();
  const everActive = new Set();

  readEvents().forEach(event => {
    const uid = String(event.uid || event.user || "").toLowerCase();
    if (!uid || !known.has(uid)) return;
    const key = dayKeyOf(event.ts);
    const monthKey = key.slice(0, 7);
    const yearKey = key.slice(0, 4);

    const day = byDay.get(key) || { users: new Set(), events: 0 };
    day.users.add(uid);
    day.events += 1;
    byDay.set(key, day);

    const month = byMonth.get(monthKey) || { users: new Set(), days: new Set(), events: 0 };
    month.users.add(uid);
    month.days.add(key);
    month.events += 1;
    byMonth.set(monthKey, month);

    const year = byYear.get(yearKey) || { users: new Set(), days: new Set(), events: 0 };
    year.users.add(uid);
    year.days.add(key);
    year.events += 1;
    byYear.set(yearKey, year);

    everActive.add(uid);
  });

  const days = {};
  byDay.forEach((value, key) => {
    days[key] = {
      users: value.users.size,
      events: value.events,
      rate: totalUsers ? Math.round((value.users.size / totalUsers) * 1000) / 10 : 0
    };
  });
  const months = {};
  byMonth.forEach((value, key) => {
    months[key] = { users: value.users.size, activeDays: value.days.size, events: value.events };
  });
  const years = {};
  byYear.forEach((value, key) => {
    years[key] = { users: value.users.size, activeDays: value.days.size, events: value.events };
  });

  return {
    totalUsers,
    activeUsers: everActive.size,
    inactiveUsers: Math.max(0, totalUsers - everActive.size),
    days,
    months,
    years,
    generatedAt: new Date().toISOString()
  };
}

/* ── 导出用工作表（交给 server/lib/xlsx.js 打包成 .xlsx） ────── */
const minutes = ms => Math.round((ms || 0) / 6000) / 10;
const seconds = ms => Math.round((ms || 0) / 1000);
const when = ts => (ts ? new Date(ts).toLocaleString("zh-CN", { hour12: false }) : "—");

function exportSheets(data = {}) {
  const totals = data.totals || {};
  const users = data.users || [];
  const pages = data.pages || [];
  const mentors = data.mentors || [];
  const courses = data.courses || [];
  const scopeLabel = data.days ? `近 ${data.days} 天` : "全部";

  const sheets = [{
    name: "概览",
    columns: [{ label: "指标", width: 22 }, { label: "数值", width: 30 }],
    rows: [
      ["指标", "数值"],
      ["统计范围", scopeLabel],
      ["生成时间", when(Date.now())],
      ["账号总数", totals.accounts || 0],
      ["有使用记录的账号", totals.activeUsers || 0],
      ["板块页面访问次数", totals.views || 0],
      ["累计停留（分钟）", minutes(totals.dwellMs)],
      ["导师信息访问次数", totals.mentorViews || 0],
      ["课程海报访问次数", totals.courseViews || 0],
      ["原始事件条数", totals.events || 0]
    ]
  }, {
    name: "用户明细",
    columns: [{ label: "登录名", width: 34 }, { label: "部门", width: 14 }, { label: "地区", width: 12 },
      { label: "姓名", width: 16 }, { label: "使用情况", width: 12 }, { label: "访问次数", width: 12 },
      { label: "总停留（分钟）", width: 16 }, { label: "最后活跃", width: 22 },
      { label: "导师访问次数", width: 14 }, { label: "访问过的板块", width: 40 }],
    rows: [["登录名", "部门", "地区", "姓名", "使用情况", "访问次数", "总停留（分钟）", "最后活跃", "导师访问次数", "访问过的板块"],
      ...users.map(row => [row.username, row.department, row.region, row.name, row.active ? "已使用" : "未使用",
        row.views, minutes(row.dwellMs), when(row.lastTs), row.mentorViews,
        row.pages.map(page => `${page.label}(${page.views})`).join(" / ")])]
  }, {
    name: "板块页面",
    columns: [{ label: "板块", width: 20 }, { label: "访问次数", width: 12 }, { label: "访问人数", width: 12 },
      { label: "累计停留（分钟）", width: 18 }, { label: "平均每次停留（秒）", width: 20 }],
    rows: [["板块", "访问次数", "访问人数", "累计停留（分钟）", "平均每次停留（秒）"],
      ...pages.map(row => [row.label, row.views, row.viewers, minutes(row.dwellMs), seconds(row.avgMs)])]
  }, {
    name: "用户×板块停留",
    columns: [{ label: "登录名", width: 34 }, { label: "角色", width: 16 }, { label: "板块", width: 20 },
      { label: "访问次数", width: 12 }, { label: "停留（秒）", width: 14 }],
    rows: [["登录名", "角色", "板块", "访问次数", "停留（秒）"],
      ...users.flatMap(row => row.pages.map(page => [row.username, row.roleLabel, page.label, page.views, seconds(page.dwellMs)]))]
  }, {
    name: "导师访问",
    columns: [{ label: "导师", width: 24 }, { label: "访问次数", width: 12 }, { label: "访问人数", width: 12 }],
    rows: [["导师", "访问次数", "访问人数"], ...mentors.map(row => [row.label, row.views, row.viewers])]
  }, {
    name: "用户×导师",
    columns: [{ label: "登录名", width: 34 }, { label: "角色", width: 16 }, { label: "导师", width: 24 }, { label: "访问次数", width: 12 }],
    rows: [["登录名", "角色", "导师", "访问次数"],
      ...users.flatMap(row => row.mentors.map(mentor => [row.username, row.roleLabel, mentor.label, mentor.views]))]
  }, {
    name: "课程信息排行",
    columns: [{ label: "课程", width: 34 }, { label: "所属课程目录", width: 30 }, { label: "类别", width: 20 },
      { label: "层级", width: 16 }, { label: "访问次数", width: 12 }, { label: "累计停留（秒）", width: 16 },
      { label: "平均停留（秒）", width: 16 }, { label: "访问人数", width: 12 }, { label: "热度分", width: 12 },
      { label: "海报", width: 60 }],
    rows: [["课程", "所属课程目录", "类别", "层级", "访问次数", "累计停留（秒）", "平均停留（秒）", "访问人数", "热度分", "海报"],
      ...courses.map(row => [row.label, row.catalog, row.category, row.level,
        row.views, seconds(row.dwellMs), seconds(row.avgMs), row.viewers, row.score, row.poster])]
  }];

  return sheets;
}

module.exports = { FILE, SECTIONS, record, overview, activity, readEvents, exportSheets };
