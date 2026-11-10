/* ═══════════════════════════════════════════════════════════
   COMPONENTS — 页头 / 页脚 / 返回标签 / 统一弹层
   与 art-humanities_demo 的 components.js 同层：页面侧只调用，
   不关心 DOM 细节与滚动锁 / Esc 顺序
═══════════════════════════════════════════════════════════ */
/* ─────────── 页头 ─────────── */
const Header = {
  build() {
    const D = T.session || {};
    document.getElementById('app-header').innerHTML = `
      <nav class="navbar" id="navbar">
        <a class="navbar__logo" href="#/home" aria-label="${esc(T.nav.brandAria)}">
          <img src="${esc(C.meta.logo)}" alt="${esc(T.nav.logoAlt)}">
          <span class="navbar__logo-text">
            <span class="navbar__logo-en u-en">${esc(T.nav.brandEn)}</span>
            <span class="navbar__logo-zh">${esc(T.nav.brandZh)}</span>
          </span>
        </a>
        <div class="navbar__nav" id="nav-links">
          ${C.nav_main.map(it => `<a class="nav-link" data-view="${it.id}" href="#/${it.id}">${esc(it.label)}</a>`).join('')}
          <button class="nav-session__logout" data-nav-logout type="button" hidden>${esc(D.logoutLabel)}</button>
        </div>
        <div class="navbar__actions">
          <form id="search-form" action="#/search" method="get" class="nav-search">
            <svg class="nav-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input class="nav-search__input" type="search" name="query" id="search-input" placeholder="${esc(T.nav.searchPlaceholder)}" autocomplete="off" aria-label="${esc(T.nav.searchAria)}">
            <input type="hidden" name="in" value="">
          </form>
          <a class="navbar__user-btn" data-admin-entry data-admin-aria="${esc(D.adminAria)}"
             href="admin" aria-label="${esc(D.adminAria)}" hidden>
            <span class="navbar__user-btn__avatar" data-user-initial aria-hidden="true"></span>
            <span class="navbar__user-btn__name" data-user-name></span>
            <span class="navbar__user-btn__arrow" aria-hidden="true"></span>
          </a>
          <button class="navbar__menu-btn" id="menu-toggle" aria-label="${esc(T.nav.menuAria)}"><span></span><span></span><span></span></button>
        </div>
      </nav>
    `;
    /* 页头是动态渲染的：登录态可能比页头先返回，渲染完成后主动同步一次后台入口 */
    if (window.SFKAuth && typeof window.SFKAuth.syncSessionActions === 'function') {
      window.SFKAuth.syncSessionActions();
    }
    /* 导航栏内嵌搜索：输入后回车直接跳转搜索结果页（空关键词不跳转） */
    document.getElementById('search-form').addEventListener('submit', e => {
      e.preventDefault();
      const q = document.getElementById('search-input').value.trim();
      if (!q) return;
      const inScope = document.querySelector('#search-form input[name=in]').value || (T.search.scopes[0] || {}).id;
      location.hash = `#/search?in=${encodeURIComponent(inScope)}&query=${encodeURIComponent(q)}`;
    });
    document.getElementById('menu-toggle').addEventListener('click', () => {
      document.getElementById('navbar').classList.toggle('is-mobile-open');
    });
    /* 顶部透明导航：滚动进入内容区后切换实底，保证文字与 Logo 不被浅色背景淹没 */
    const navEl = document.getElementById('navbar');
    const onNavScroll = () => {
      const scrolled = window.scrollY > 24;
      navEl && navEl.classList.toggle('is-scrolled', scrolled);
      /* 光标停在导航栏上滚动页面时，清除悬停白底态与轮播下滑态，防止白底叠加浅色内容 */
      if (scrolled) {
        navEl.classList.remove('nav-hover');
        document.querySelector('.hero__carousel')?.classList.remove('nav-hover');
      }
    };
    window.addEventListener('scroll', onNavScroll, { passive: true });
    onNavScroll();
    /* 悬停导航栏：白底黑字 + 首屏轮播整体下滑至导航栏底缘；移出即平滑复原。
       仅在页面顶部（未滚动）时触发，避免白底导航叠加浅色内容导致不可读 */
    const heroBox = () => document.querySelector('.hero__carousel');
    navEl.addEventListener('mouseenter', () => {
      if (navEl.classList.contains('is-scrolled')) return;
      navEl.classList.add('nav-hover');
      heroBox()?.classList.add('nav-hover');
    });
    navEl.addEventListener('mouseleave', () => {
      navEl.classList.remove('nav-hover');
      heroBox()?.classList.remove('nav-hover');
    });
  },
  markActive(view) {
    document.querySelectorAll('.nav-link[data-view]').forEach(a => {
      a.classList.toggle('is-active', a.dataset.view === view);
    });
  }
};

/* ─────────── 页脚 ───────────
   DOM 由共享组件 assets/js/site-footer.js 生成：
   主页与后台管理系统调用同一份 SiteFooter.render() + site-footer.css，
   两处页脚在结构、间距、字体、颜色与响应式上完全一致。
   这里只负责把 DATA 加载好的站点内容传给共享组件。 */
const Footer = {
  build() {
    SiteFooter.render(document.getElementById('app-footer'), {
      meta: C.meta,
      navMain: C.nav_main,
      ui: T.footer
    });
  }
};

/* ─────────── 子层级页面"返回上一级"标签（左侧居中常驻，悬停右展 + 边框变主色） ─────────── */
const BackTab = {
  render(target) {
    const el = document.getElementById('app-back');
    if (!el) return;
    el.innerHTML = target ? `
      <button class="back-tab" onclick="location.hash='${target}'" aria-label="${esc(T.nav.backAria)}">
        <span class="back-tab__arrow" aria-hidden="true"></span>
        <span class="back-tab__label">${esc(T.nav.backLabel)}</span>
      </button>` : '';
  }
};

/* ─────────── 统一弹层（Modal） ───────────
   全站弹层统一登记，不再各自监听 Esc：
   · 栈式管理，Esc 只关闭最上层（等价于原先 PosterModal 的捕获阶段优先关闭）
   · 只要有「需要锁滚动」的弹层在栈内就锁 body，栈清空后自动解锁
   · 关闭时把焦点归还给触发元素（元素已卸载则跳过）
   各弹层仍自行负责 DOM 结构与开关动画，视觉与交互表现不变。 */
const Modal = {
  _stack: [],
  _bound: false,

  /* entry: { el, close, trigger, lockScroll } */
  open(entry) {
    if (!entry || !entry.el) return;
    const i = this._stack.findIndex(x => x.el === entry.el);
    if (i >= 0) this._stack.splice(i, 1);
    this._stack.push(entry);
    this.sync();
    this._bind();
  },

  close(el) {
    const i = this._stack.findIndex(x => x.el === el);
    if (i < 0) { this.sync(); return; }
    const entry = this._stack.splice(i, 1)[0];
    this.sync();
    const t = entry.trigger;
    if (t && t.isConnected && typeof t.focus === 'function') t.focus();
  },

  isOpen(el) { return this._stack.some(x => x.el === el); },
  top() { return this._stack[this._stack.length - 1] || null; },

  /* 依据栈内条目同步 body 滚动锁 */
  sync() {
    const lock = this._stack.some(x => x.lockScroll !== false);
    document.body.style.overflow = lock ? 'hidden' : '';
  },

  _bind() {
    if (this._bound) return;
    this._bound = true;
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const top = this.top();
      if (!top) return;
      e.preventDefault();
      e.stopImmediatePropagation();     /* 只关最上层，不再冒泡触发下层关闭 */
      top.close();
    }, true);
  }
};

/* 目录页（CONTENTS 全屏浮层）与其底部会话组已整体移除：
   后台入口改为导航栏右上角显示用户姓名的按钮，退出入口保留在导航栏与移动下拉菜单。 */


