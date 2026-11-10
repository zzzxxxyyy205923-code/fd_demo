/*
  会话（cookie 签名）—— 复用 SFK 游戏动画科系「登录权限管理」模块 server/lib/session.js 的做法：
  HMAC-SHA256 签名的自包含 token 放进 httpOnly cookie，服务端无状态、不保存会话表。
  差异：密钥变量名改为 AUTH_SESSION_SECRET；未配置时不再直接抛错，而是进程内随机生成
       （本地开箱可跑，但重启即掉线；生产环境必须显式配置）。
*/
const crypto = require("crypto");

/* 与源站 art-humanities_demo 的 cookie 名区分：同源多端口/多站点部署时不会串会话 */
const COOKIE_NAME = "sfk_fashion_session";
const MAX_AGE_MS = 12 * 60 * 60 * 1000;   // 12 小时

let fallbackSecret = "";

function getSecret() {
  const configured = process.env.AUTH_SESSION_SECRET || "";
  if (configured) return configured;
  if (!fallbackSecret) {
    fallbackSecret = crypto.randomBytes(32).toString("hex");
    console.warn(
      "[auth] 未设置 AUTH_SESSION_SECRET，已临时生成一次性密钥：服务重启后所有人的登录态都会失效。\n" +
      "       生产环境请在 .env 或部署平台配置至少 32 位随机字符串。"
    );
  }
  return fallbackSecret;
}

function encode(payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const mac = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function decode(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expected = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload || !payload.userId || !payload.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch (_error) {
    return null;
  }
}

function createToken(userId, fingerprint) {
  /* fingerprint = 账号密码哈希的摘要（见 accounts.fingerprint）：密码一改，旧 token 立即失效。
     旧版本签发的 token 里没有 fp，会被 attachUser 判为无效 ⇒ 升级后需要重新登录一次。 */
  return encode({ userId, fp: fingerprint || "", exp: Date.now() + MAX_AGE_MS });
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: process.env.BASE_PATH || "/",
    maxAge: MAX_AGE_MS
  };
}

function clearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: process.env.BASE_PATH || "/"
  };
}

module.exports = {
  COOKIE_NAME,
  MAX_AGE_MS,
  encode,
  decode,
  createToken,
  cookieOptions,
  clearCookieOptions
};
