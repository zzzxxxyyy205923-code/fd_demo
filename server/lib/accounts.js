/*
  账号库 —— 只存 bcrypt 哈希，绝不落明文；每条账号带角色与附加权限
  ------------------------------------------------------------------
  三个来源，按优先级：
    0) 云存储 private/staff-accounts.json（TCB_ENV + TCB_STORAGE_BUCKET + CLOUDBASE_APIKEY
       都配置时启用，可写，重启不丢）
    1) AUTH_STAFF_JSON 环境变量（没有云存储时只读；有云存储时只在云端还没有账号文件时做一次种子）：
       [{"username":"zhangshaopeng1@xdf.cn","name":"zhangshaopeng1","email":"zhangshaopeng1@xdf.cn",
         "role":"admin","permissions":[],"hash":"$2a$10$..."}]
       哈希用 `npm run account:hash -- '密码'` 生成。
       2) server/data/accounts.json（本地开发用；首次启动若一个账号都没有，会生成一名管理员
       —— 初始密码统一取 AUTH_INITIAL_PASSWORD（默认 888888）—— 并打印到控制台。
       文件已在 .gitignore 中，不进版本库）
       两种来源都没有时：开发环境自动 bootstrap；生产环境（NODE_ENV=production）直接拒绝启动，
       避免「忘了配账号 ⇒ 闸门形同虚设」。

       初始密码策略（2026-09-22 起）：
       · 后台「添加导师」不填密码 ⇒ 一律用**统一初始密码**（AUTH_INITIAL_PASSWORD，默认 888888）；
       · 导师本人登录后到「账号与权限 → 重置密码」自助改成自己的密码（需验当前密码），
       管理员也可在列表里代改（走 PATCH，无需旧密码）。
       · 因此密码最小长度放宽到 6 位（`888888` 这类初始密码本身合法）。

  账号记录形状：{ id, username, name, email, role, permissions, hash }
  数据层自带两条安全护栏：最后一名管理员不可删除、不可降级；不能删除当前登录的账号。
*/
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const {
  ADMIN_ROLE, DEFAULT_ROLE, isRole, isPermission, roleOf, roleLabel, effectivePermissions
} = require("./permissions");

const cloud = require("./account-cloud");

const BCRYPT_ROUNDS = Number(process.env.AUTH_BCRYPT_ROUNDS || 10);
/* 全站统一的初始密码：新建账号不填密码时用它；导师本人登录后自行「重置密码」改掉。
   可用 AUTH_INITIAL_PASSWORD 覆盖（生产环境建议改成一次性值并强制首次改密）。 */
const INITIAL_PASSWORD = String(process.env.AUTH_INITIAL_PASSWORD || "888888");
const MIN_PASSWORD_LENGTH = Number(process.env.AUTH_MIN_PASSWORD_LENGTH || 6);
const LOGIN_PATTERN = /^[\w.@-]{2,64}$/;
const STORE_FILE = process.env.AUTH_STORE_FILE || path.join(__dirname, "..", "data", "accounts.json");

/* 「账号不存在」时也走一次 bcrypt 比对，抹平响应时间差，避免枚举账号 */
const DUMMY_HASH = bcrypt.hashSync("sfk-dummy-password", BCRYPT_ROUNDS);

let cache = null;
let pushTask = Promise.resolve();
/* CLI 场景关闭「空库自动 bootstrap」：否则一次 `account add` 会先莫名生成一个随机管理员账号。
   服务端（server/index.js）保持默认开启，保证「零配置也能登录进去」。 */
let bootstrapAllowed = true;
const disableBootstrap = () => { bootstrapAllowed = false; };

const normalize = raw => {
  if (!raw || typeof raw !== "object") return null;
  const username = String(raw.username || raw.id || "").trim();
  const hash = String(raw.hash || raw.passwordHash || "").trim();
  if (!username || !hash) return null;
  return {
    id: username.toLowerCase(),
    username,
    name: String(raw.name || "").trim() || username,
    email: String(raw.email || "").trim(),
    department: String(raw.department || "").trim(),
    region: String(raw.region || "").trim(),
    position: String(raw.position || raw.title || "").trim(),
    majors: String(raw.majors || "").trim(),
    role: isRole(raw.role) ? raw.role : DEFAULT_ROLE,
    permissions: Array.isArray(raw.permissions) ? raw.permissions.filter(isPermission) : [],
    hash
  };
};

function envList() {
  const raw = process.env.AUTH_STAFF_JSON;
  if (!raw || !raw.trim()) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`AUTH_STAFF_JSON 不是合法 JSON：${error.message}`);
  }
  if (!Array.isArray(parsed)) throw new Error("AUTH_STAFF_JSON 需要是数组");
  return parsed.map(normalize).filter(Boolean);
}

function readFileList() {
  try {
    const text = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : parsed.users;
    return Array.isArray(list) ? list.map(normalize).filter(Boolean) : [];
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new Error(`账号文件 ${STORE_FILE} 读取失败：${error.message}`);
  }
}

function writeFileList(list, options = {}) {
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
  fs.writeFileSync(STORE_FILE, `${JSON.stringify(list, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  if (!options.skipCloud && cloud.enabled()) {
    const snapshot = list.map(user => ({ ...user }));
    pushTask = pushTask.catch(() => {}).then(() => cloud.push(snapshot));
  }
}

function flush() {
  return pushTask;
}

function bootstrap() {
  const username = String(process.env.AUTH_BOOTSTRAP_USER || "admin").trim();
  const password = String(process.env.AUTH_BOOTSTRAP_PASSWORD || INITIAL_PASSWORD);
  const account = {
    id: username.toLowerCase(),
    username,
    name: "系统管理员",
    email: "",
    role: ADMIN_ROLE,
    permissions: [],
    hash: bcrypt.hashSync(password, BCRYPT_ROUNDS)
  };
  writeFileList([account]);
  console.log(
    "\n[auth] 未检测到任何账号配置，已生成本地管理员账号（仅开发用）：\n" +
    `       账号：${username}\n` +
    `       初始密码：${password}（全站统一初始密码，登录后请到「账号与权限 → 重置密码」修改）\n` +
    "       正式部署请改用 AUTH_STAFF_JSON（npm run account:hash -- '密码' 生成哈希），\n" +
    "       或执行 npm run account:add -- <账号> <密码> --role admin 建正式管理员。\n"
  );
  return [account];
}

function adopt(rawList) {
  const list = (Array.isArray(rawList) ? rawList : []).map(normalize).filter(Boolean);
  if (!list.length) throw new Error("账号列表为空");
  writeFileList(list, { skipCloud: true });
  cache = { source: cloud.enabled() ? "cloud" : "file", list };
  return list;
}

function ensure() {
  if (cache) return cache;
  if (cloud.enabled()) {
    const fromCloudFile = readFileList();
    if (!fromCloudFile || !fromCloudFile.length) {
      throw new Error("云端账号尚未载入");
    }
    cache = { source: "cloud", list: fromCloudFile };
    return cache;
  }
  const fromFile = readFileList();
  if (fromFile && fromFile.length) {
    cache = { source: "file", list: fromFile };
    return cache;
  }
  const fromEnv = envList();
  if (fromEnv) {
    if (!fromEnv.length) throw new Error("AUTH_STAFF_JSON 里没有任何有效账号");
    writeFileList(fromEnv, { skipCloud: true });
    cache = { source: "file", list: fromEnv };
    return cache;
  }
  if (!bootstrapAllowed) {
    cache = { source: "file", list: [] };
    return cache;
  }
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_BOOTSTRAP_PASSWORD) {
    throw new Error(
      "生产环境未配置任何内部账号：请设置 AUTH_STAFF_JSON（或 AUTH_BOOTSTRAP_USER + AUTH_BOOTSTRAP_PASSWORD 完成首次初始化）。"
    );
  }
  cache = { source: "file", list: bootstrap() };
  return cache;
}

function reload() {
  cache = null;
  return ensure();
}

function byLogin(login) {
  const key = String(login || "").trim().toLowerCase();
  if (!key) return null;
  return ensure().list.find(user => user.id === key || (user.email && user.email.toLowerCase() === key)) || null;
}

function authenticate(login, password) {
  const user = byLogin(login);
  if (!user) {
    bcrypt.compareSync(String(password || ""), DUMMY_HASH);   // 时序对齐
    return null;
  }
  return bcrypt.compareSync(String(password || ""), user.hash) ? user : null;
}

/* 校验某个账号的当前密码（本人自助改密时用；不返回任何账号信息，只回是与否） */
function verifyPassword(id, password) {
  const user = ensure().list.find(item => item.id === String(id || "").trim().toLowerCase());
  if (!user) return false;
  return bcrypt.compareSync(String(password || ""), user.hash);
}

/* 会话指纹：随密码变化而变化（只取哈希的摘要前 16 位，不可逆、也不泄漏哈希本身）。
   会话 token 里带上它 ⇒ 密码一改，旧 cookie 立刻失效（统一初始密码人人可知，这一条必须做）。 */
const fingerprint = user => crypto.createHash("sha256")
  .update(String((user && user.hash) || ""))
  .digest("hex")
  .slice(0, 16);

/* 对外（前端 / 日志）永远用这个：不含 hash */
const publicUser = user => ({
  id: user.id,
  username: user.username,
  name: user.name,
  email: user.email,
  department: user.department || "",
  region: user.region || "",
  position: user.position || "",
  majors: user.majors || "",
  role: roleOf(user),
  roleLabel: roleLabel(user),
  permissions: effectivePermissions(user)
});

function assertWritable() {
  const store = ensure();
  if (store.source === "env") {
    throw new Error("账号来自 AUTH_STAFF_JSON 环境变量，运行期只读：请改环境变量后重启服务");
  }
  return store;
}

const adminCount = () => ensure().list.filter(user => user.role === ADMIN_ROLE).length;

const assertLogin = login => {
  const value = String(login || "").trim();
  if (!LOGIN_PATTERN.test(value)) throw new Error("登录名需为 2–64 位字母、数字或 . _ - @（可直接用邮箱）");
  return value;
};

const assertPassword = password => {
  if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
    throw new Error(`密码至少 ${MIN_PASSWORD_LENGTH} 位`);
  }
};

function create({ username, password, bcryptHash, name, email, department, region, position, majors, role, permissions }) {
  const store = assertWritable();
  const login = assertLogin(username);
  /* 未给密码时用**统一初始密码**（后台「添加导师」不再让管理员填初始密码）：
     值挂在非枚举属性上 —— 既能回给调用方展示一次，又不会被 JSON.stringify 写进账号文件。 */
  const generated = !bcryptHash && !password ? INITIAL_PASSWORD : "";
  if (!bcryptHash && !generated) assertPassword(password);
  const targetRole = role === undefined || role === null || role === "" ? DEFAULT_ROLE : String(role);
  if (!isRole(targetRole)) throw new Error(`未知角色：${targetRole}`);
  if (store.list.some(user => user.id === login.toLowerCase())) throw new Error(`账号 ${login} 已存在`);
  const user = {
    id: login.toLowerCase(),
    username: login,
    name: String(name || "").trim() || login,
    email: String(email || "").trim(),
    department: String(department || "").trim(),
    region: String(region || "").trim(),
    position: String(position || "").trim(),
    majors: String(majors || "").trim(),
    role: targetRole,
    permissions: Array.isArray(permissions) ? permissions.filter(isPermission) : [],
    hash: bcryptHash || bcrypt.hashSync(String(generated || password), BCRYPT_ROUNDS)
  };
  if (generated) Object.defineProperty(user, "initialPassword", { value: generated, enumerable: false });
  store.list.push(user);
  writeFileList(store.list);
  return user;
}

function update(id, patch = {}) {
  const store = assertWritable();
  const key = String(id || "").trim().toLowerCase();
  const user = store.list.find(item => item.id === key);
  if (!user) throw new Error("账号不存在");

  if (patch.role !== undefined) {
    const nextRole = String(patch.role);
    if (!isRole(nextRole)) throw new Error(`未知角色：${nextRole}`);
    if (user.role === ADMIN_ROLE && nextRole !== ADMIN_ROLE && adminCount() <= 1) {
      throw new Error("至少保留一名管理员：不能降级最后一名管理员");
    }
    user.role = nextRole;
  }
  if (patch.permissions !== undefined) {
    if (!Array.isArray(patch.permissions)) throw new Error("permissions 需要是数组");
    const unknown = patch.permissions.filter(item => !isPermission(item));
    if (unknown.length) throw new Error(`未知权限：${unknown.join("、")}`);
    user.permissions = [...new Set(patch.permissions)];
  }
  if (patch.name !== undefined) user.name = String(patch.name).trim() || user.username;
  if (patch.email !== undefined) user.email = String(patch.email).trim();
  if (patch.department !== undefined) user.department = String(patch.department).trim();
  if (patch.region !== undefined) user.region = String(patch.region).trim();
  if (patch.position !== undefined) user.position = String(patch.position).trim();
  if (patch.majors !== undefined) user.majors = String(patch.majors).trim();
  if (patch.password !== undefined && patch.password !== "") {
    assertPassword(patch.password);
    user.hash = bcrypt.hashSync(String(patch.password), BCRYPT_ROUNDS);
  }
  writeFileList(store.list);
  return user;
}

function remove(id, actorId) {
  const store = assertWritable();
  const key = String(id || "").trim().toLowerCase();
  const user = store.list.find(item => item.id === key);
  if (!user) throw new Error("账号不存在");
  if (actorId && String(actorId).toLowerCase() === key) throw new Error("不能删除当前登录的账号");
  if (user.role === ADMIN_ROLE && adminCount() <= 1) throw new Error("至少保留一名管理员：不能删除最后一名管理员");
  store.list = store.list.filter(item => item.id !== key);
  writeFileList(store.list);
  return user;
}

function setPassword(id, password) {
  const store = assertWritable();
  const user = store.list.find(item => item.id === String(id || "").trim().toLowerCase());
  if (!user) throw new Error("账号不存在");
  assertPassword(password);
  user.hash = bcrypt.hashSync(String(password), BCRYPT_ROUNDS);
  writeFileList(store.list);
  return user;
}

function hashPassword(password) {
  assertPassword(password);
  return bcrypt.hashSync(String(password), BCRYPT_ROUNDS);
}

module.exports = {
  STORE_FILE,
  INITIAL_PASSWORD,
  MIN_PASSWORD_LENGTH,
  disableBootstrap,
  adopt,
  flush,
  reload,
  source: () => ensure().source,
  list: () => ensure().list.map(publicUser),
  findById: id => ensure().list.find(user => user.id === String(id || "").toLowerCase()) || null,
  adminCount,
  authenticate,
  verifyPassword,
  fingerprint,
  publicUser,
  create,
  update,
  remove,
  setPassword,
  hashPassword
};
