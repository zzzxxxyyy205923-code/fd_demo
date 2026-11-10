/* VIEW · 校企资源（#/resources）
   交互参照 art-humanities_demo 首页「校企资源」：无缝跑马灯 + 悬停详情浮层。
   视觉适配 SFK 时尚科系：直角描边卡、黑 / 白 / 品牌粉令牌、无圆角与发光。
   所有文案与数据均来自 assets/data/resources.json，组件不内联硬编码内容。 */
function renderResources() {
  const d = DATA.resources;
  if (!d || !d.partners) return renderNotFound();
  const ps = d.partners;

  const logo = p => p.logo
    ? `<img src="${esc(p.logo)}" alt="${esc(fill(d.logoAlt, { name: p.nameEn }))}" loading="lazy">`
    : `<span class="rs-logo-ph u-en">${esc(d.logoPlaceholder)}</span>`;
  const tags = p => (p.collab && p.collab.length)
    ? `<div class="rs-tags">${p.collab.map(c => `<span class="rs-tag">${esc(c)}</span>`).join('')}</div>`
    : '';
  const marqueeCard = (p, clone) => `
    <div class="rs-card" data-id="${esc(p.id)}" role="group" tabindex="${clone ? '-1' : '0'}"${clone ? ' aria-hidden="true"' : ''} aria-label="${esc(fill(d.cardAria, { name: p.nameEn }))}">
      <div class="rs-card__media">${logo(p)}</div>
      <div class="rs-card__name u-en">${esc(p.nameEn)}</div>
      <div class="rs-card__cn">${esc(p.nameCn)}</div>
    </div>`;
  const directoryCard = (p, i) => `
    <article class="rs-dir-card">
      <div class="rs-dir-card__media">${logo(p)}</div>
      <div class="rs-dir-card__body">
        <div class="rs-dir-card__num u-en">${String(i + 1).padStart(2, '0')}</div>
        <h3 class="u-en">${esc(p.nameEn)}</h3>
        <div class="rs-dir-card__cn">${esc(p.nameCn)}</div>
        <p>${esc(p.intro || d.introFallback)}</p>
        ${tags(p)}
      </div>
    </article>`;

  return `
  <section class="page-hero rs-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(d.title)}</span></div>
      <span class="rs-hero__eyebrow u-en">${esc(d.eyebrow)}</span>
      <h1>${esc(d.title)}</h1>
      <p class="rs-hero__intro">${esc(d.intro)}</p>
      <div class="rs-hero__count u-en">${esc(fill(d.countLabel, { n: ps.length }))}</div>
    </div>
  </section>

  <section class="section rs-marquee-sec">
    <div class="wrap">
      <span class="section__eyebrow">${esc(d.marqueeEyebrow)}</span>
      <h2 class="section__title">${esc(d.marqueeTitle)}</h2>
    </div>
    <div class="rs-marquee" id="rs-marquee">
      <div class="rs-marquee__track" id="rs-marquee-track">
        ${ps.map(p => marqueeCard(p, false)).join('')}
        ${ps.map(p => marqueeCard(p, true)).join('')}
      </div>
    </div>
  </section>

  <section class="section rs-dir-sec">
    <div class="wrap">
      <span class="section__eyebrow">${esc(d.directoryEyebrow)}</span>
      <h2 class="section__title">${esc(d.directoryTitle)}</h2>
      <div class="rs-dir-grid">${ps.map(directoryCard).join('')}</div>
    </div>
  </section>`;
}

/* 跑马灯与详情浮层的生命周期由 router.js 管理：进入页面 init，离开页面 stop */
const ResourcesSection = {
  _raf: 0,
  _ov: null,
  _cleanup: [],
  _map: {},
  _current: null,

  init() {
    this.stop();
    const track = document.getElementById('rs-marquee-track');
    const wrap = document.getElementById('rs-marquee');
    const d = DATA.resources;
    if (!track || !wrap || !d) return;

    this._map = {};
    d.partners.forEach(p => { this._map[p.id] = p; });

    const ov = document.createElement('div');
    ov.className = 'rs-hover';
    ov.setAttribute('role', 'status');
    document.body.appendChild(ov);
    this._ov = ov;

    /* 按速度匀速左移，走完一组宽度即回卷，实现无缝循环；
       鼠标移入暂停、prefers-reduced-motion 时不启动动画并允许手动横向滚动 */
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      wrap.classList.add('is-static');
    } else {
      let x = 0, last = null, paused = false;
      wrap.addEventListener('mouseenter', () => { paused = true; });
      wrap.addEventListener('mouseleave', () => { paused = false; });
      const tick = ts => {
        if (last === null) last = ts;
        const dt = Math.min((ts - last) / 1000, 0.25);
        last = ts;
        const half = track.scrollWidth / 2;
        if (!paused && half > 0) {
          x -= d.speedPxPerSec * dt;
          if (x <= -half) x += half;
          track.style.transform = `translate3d(${x}px,0,0)`;
        }
        this._raf = requestAnimationFrame(tick);
      };
      this._raf = requestAnimationFrame(tick);
    }

    const cardOf = el => el && el.closest ? el.closest('.rs-card') : null;
    /* 纯悬浮：指针进入显示详情、移开即恢复；跑马灯同时暂停 / 恢复。
       键盘 focus / blur 与悬浮等价，不保留任何点击固定态。 */
    track.addEventListener('mouseover', e => {
      const c = cardOf(e.target);
      if (c) this._show(c);
    });
    track.addEventListener('mouseout', e => {
      const c = cardOf(e.target);
      if (c && e.relatedTarget && cardOf(e.relatedTarget) === c) return;
      this._hide();
    });
    track.addEventListener('focusin', e => { const c = cardOf(e.target); if (c) this._show(c); });
    track.addEventListener('focusout', () => this._hide());

    /* 页面滚动只重新定位浮层，卡片离开视口时 _place 会隐藏 */
    const onScroll = () => { if (this._current) this._place(this._current); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    this._cleanup.push(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });
  },

  _show(card) {
    const d = DATA.resources;
    const p = this._map[card.dataset.id];
    const ov = this._ov;
    if (!p || !ov || !d) return;
    if (this._current === card && ov.classList.contains('is-visible')) return;
    this._current = card;
    ov.innerHTML = `
      <span class="rs-hover__eyebrow u-en">${esc(d.hoverEyebrow)}</span>
      <div class="rs-hover__name u-en">${esc(p.nameEn)}</div>
      ${p.nameCn ? `<div class="rs-hover__cn">${esc(p.nameCn)}</div>` : ''}
      <p>${esc(p.intro || d.introFallback)}</p>
      ${(p.collab && p.collab.length) ? `<div class="rs-tags">${p.collab.map(c => `<span class="rs-tag">${esc(c)}</span>`).join('')}</div>` : ''}`;
    ov.classList.add('is-visible');
    this._place(card);
  },

  /* 浮层跟随卡片定位；卡片完全滚出视口才隐藏 */
  _place(card) {
    const ov = this._ov;
    if (!ov || !ov.classList.contains('is-visible')) return;
    const r = card.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) { this._hide(); return; }
    const w = ov.offsetWidth || 260;
    const h = ov.offsetHeight || 160;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
    let top = r.top - h - 12;
    if (top < 12) top = r.bottom + 12;
    ov.style.left = `${left}px`;
    ov.style.top = `${top}px`;
  },

  _hide() {
    this._current = null;
    if (this._ov) this._ov.classList.remove('is-visible');
  },

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._cleanup.forEach(fn => fn());
    this._cleanup = [];
    this._hide();
    if (this._ov) { this._ov.remove(); this._ov = null; }
  }
};
