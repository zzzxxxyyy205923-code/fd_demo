/* 后台页面外壳的共用行为（/admin 账号与权限 + /admin/<内容> 内容管理）：
   · 顶栏「退出登录」与底部「登出」标签
   · 顶部网格背景剪裁：网格本体是 admin-site.css 的 body::before，admin.css 把它改成顶部一条，
     高度 = 页面主标题底部（文档坐标）+ 一行区块标题的字体高度。 */
(() => {
  function logout() {
    if (window.SFKAuth && typeof window.SFKAuth.logout === 'function') return window.SFKAuth.logout();
    return fetch('api/auth/logout', { method: 'POST', credentials: 'same-origin' })
      .catch(() => {})
      .then(() => window.location.replace('login.html'));
  }
  ['admin-logout', 'admin-logout-tab'].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.addEventListener('click', logout);
  });

  const title = document.querySelector('.admin-hero h1');
  if (!title) return;
  function fitGridClip() {
    const heading = document.getElementById('admin-list-title') || document.querySelector('.admin-block__head h2');
    const lineHeight = heading ? parseFloat(getComputedStyle(heading).fontSize) || 22 : 22;
    const titleBottom = title.getBoundingClientRect().bottom + window.scrollY;
    document.documentElement.style.setProperty('--admin-grid-clip', `${Math.max(0, Math.round(titleBottom + lineHeight))}px`);
  }
  fitGridClip();
  window.addEventListener('resize', fitGridClip);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitGridClip);
  if (window.ResizeObserver) new ResizeObserver(fitGridClip).observe(title);
  window.SFKAdminShell = { fitGridClip };
})();
