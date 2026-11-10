/* ═══════════════════════════════════════════════════════════
   SFK 时尚科系 · 共享页脚组件
   主页与后台管理系统调用同一份 SiteFooter.render() 生成页脚 DOM，
   并共同加载 assets/css/site-footer.css，两处页脚因此完全一致。

   数据唯一来源：assets/data/site-content.json
     · 主页：main.js 在 DATA.load() 之后，由 components.js 的
             Footer.build() 把 C.meta / C.nav_main / T.footer 传进来
     · 后台：server/app.js 的 sendAdminPage() 读取同一份 JSON，
             注入 window.__SFK_FOOTER_DATA__，本脚本自动渲染
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const MAIN_IDS = ['subjects', 'colleges', 'courses'];

  function markup(data) {
    const meta = data && data.meta ? data.meta : {};
    const ui = data && data.ui ? data.ui : {};
    const nav = data && Array.isArray(data.navMain) ? data.navMain : [];
    const contact = meta.footer && meta.footer.contact ? meta.footer.contact : {};
    const links = list => list.map(it => `<a href="#/${esc(it.id)}">${esc(it.label)}</a>`).join('');

    return `
      <footer class="site-footer">
        <div class="site-footer__inner">
          <div>
            <div class="site-footer__brand">
              <img src="${esc(meta.logo)}" alt="">
              <span>${esc(meta.brand)}</span>
            </div>
            <p class="site-footer__desc">${esc(meta.subtitle)}</p>
          </div>
          <div>
            <h3 class="site-footer__col-title">${esc(ui.colMain)}</h3>
            ${links(nav.filter(it => MAIN_IDS.includes(it.id)))}
          </div>
          <div>
            <h3 class="site-footer__col-title">${esc(ui.colSubject)}</h3>
            ${links(nav.filter(it => !MAIN_IDS.includes(it.id)))}
          </div>
          <div>
            <h3 class="site-footer__col-title">${esc(ui.colPlan)}</h3>
            <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>
            <a href="tel:${esc(contact.tel)}">${esc(contact.tel)}</a>
          </div>
        </div>
        <div class="site-footer__bottom">${esc(meta.footer && meta.footer.copyright)}</div>
      </footer>
    `;
  }

  function render(host, data) {
    const el = typeof host === 'string' ? document.getElementById(host) : host;
    if (!el || !data) return false;
    el.innerHTML = markup(data);
    return true;
  }

  window.SiteFooter = { render, markup };

  /* 后台页：数据由服务端注入，脚本位于 #app-footer 之后 → 自动渲染。
     主页不注入该全局变量，改由 main.js → Footer.build() 显式渲染。 */
  function auto() {
    if (window.__SFK_FOOTER_DATA__) render('app-footer', window.__SFK_FOOTER_DATA__);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();
})();
