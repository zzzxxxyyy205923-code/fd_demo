/*
  登录页交互（复用 SFK 游戏动画科系「登录权限管理」模块的 auth-login.js 逻辑）：
  - 提交账号/邮箱 + 密码到 POST api/auth/login（同源、带上会话 cookie）
  - 失败时把服务端错误原文写在 .auth-error（role=alert）里
  - 成功后用 ?next=… 回跳原目标页（严格校验：同源 + 站点内 + 非登录页），否则回首页
  - 「忘记密码？」只提示联系管理员（本站不开自助重置）
  差异：本站是单文档 SPA（index.html + hash 路由），所有页面共用一个入口，
       因此没有参考站的「按权限挑选落地页」逻辑，登录成功统一进 index.html。
*/
(() => {
  const form = document.getElementById("loginForm");
  const errorNode = document.getElementById("loginError");
  const forgotButton = document.getElementById("forgotPassword");
  const params = new URLSearchParams(window.location.search);
  const nextUrl = params.get("next");

  const HOME_PAGE = "index.html";

  /* 只接受本站自身、且非登录页的目标地址，避免被 ?next= 带去外部站点（开放重定向） */
  const safeNext = value => {
    if (!value || value.startsWith("//")) return false;
    try {
      const destination = new URL(value, window.location.href);
      const sitePath = window.location.pathname.replace(/login\.html$/, "");
      if (destination.origin !== window.location.origin) return false;
      if (!destination.pathname.startsWith(sitePath)) return false;
      if (destination.pathname.endsWith("login.html")) return false;
      const leaf = destination.pathname.slice(sitePath.length);
      /* 从 /admin 被闸门送来的登录请求，登录后直接回后台 */
      return leaf === "" || leaf === "index.html" || leaf === "admin" || leaf === "admin.html";
    } catch (_error) {
      return false;
    }
  };

  forgotButton?.addEventListener("click", () => {
    errorNode.textContent = "请联系管理员重置密码。";
  });

  const showError = message => {
    errorNode.textContent = message;
    /* role="alert" 已可播报；这里再聚焦一次，确保键盘/读屏用户不会漏看提示 */
    errorNode.setAttribute("data-visible", "1");
  };

  form.addEventListener("submit", async event => {
    event.preventDefault();
    errorNode.textContent = "";
    const usernameField = document.getElementById("username");
    const passwordField = document.getElementById("password");
    const username = usernameField.value.trim();
    const password = passwordField.value;

    /* 空输入：不发起请求，直接给出明确的、区分字段的提示 */
    if (!username && !password) {
      showError("请输入用户名和密码。");
      usernameField.focus();
      return;
    }
    if (!username) {
      showError("请输入用户名（账号或公司邮箱）。");
      usernameField.focus();
      return;
    }
    if (!password) {
      showError("请输入密码。");
      passwordField.focus();
      return;
    }

    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    try {
      const response = await fetch("api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        /* 错误凭证：明确的失败原因；其余失败（限流等）原样展示服务端提示 */
        showError(response.status === 401
          ? "用户名或密码错误，请检查后重新输入。"
          : (payload.error || "登录失败，请稍后重试。"));
        passwordField.select();
        return;
      }
      window.location.replace(safeNext(nextUrl) ? nextUrl : HOME_PAGE);
    } catch (error) {
      showError("网络异常，请稍后重试。");
    } finally {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  });
})();
