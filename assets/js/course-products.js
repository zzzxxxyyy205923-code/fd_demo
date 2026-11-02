/* ═══════════════════════════════════════════════════════════
   课程产品：分区渲染 / 学历筛选 / 详情浮层 / 模块检索 / 海报与 PDF 弹窗
   结构与交互逻辑复用 art-humanities_demo「课程产品」；
   课程内容、占位文案与图片 / PDF 资源全部来自 assets/data/*.json，
   本文件不含任何页面文案。
═══════════════════════════════════════════════════════════ */

/* 详情占位模板：结构固定，文案来自 site-content.json 的 detailPlaceholder
   （esc / fill / T / DATA 由 assets/js/data.js 提供） */
const cpPlaceholder = () => (DATA.site && DATA.site.detailPlaceholder) || {};
const cpSearchPlaceholder = () => ((cpPlaceholder().facets || {}).searchPlaceholder || '');

/* ─────────── 详情版式注册表 ───────────
   一个 type 一个渲染器；新增版式只在下面登记，数据里引用 type 即可，无需改动页面逻辑 */
const DETAIL_SECTIONS = {
  /* 核心数据：键值网格 */
  stat(s) {
    const items = s.items || [];
    return `<section class="cd-section"><div class="cd-section__label">${esc(s.label)}</div><div class="cd-stat-grid">${items.map(x => `<div class="cd-stat"><div class="cd-stat__k">${esc(x.k)}</div><div class="cd-stat__v">${esc(x.v)}</div></div>`).join('')}</div></section>`;
  },
  /* 课程模块：分类 × 子分类 × 搜索（数据来自 CourseProducts._cur） */
  curriculum(s) {
    return `<section class="cd-section"><div class="cd-section__label">${esc(s.label)}</div>${this.curriculumBlock()}</section>`;
  },
  /* 为什么选择：条目网格 */
  why(s) {
    const items = s.items || [];
    return `<section class="cd-section"><div class="cd-section__label">${esc(s.label)}</div><div class="cd-why-grid">${items.map(w => `<div class="cd-why"><div class="cd-stat__k">${esc(w.t)}</div><div class="cd-stat__v">${esc(w.d)}</div></div>`).join('')}</div></section>`;
  },
  /* 收尾文案 */
  cta(s) {
    const c = s.closing || {};
    return `<div class="cd-cta">
        <p class="cd-cta__statement">${esc(c.cn)}</p>
        <p class="cd-cta__statement-en u-en">${esc(c.en)}</p>
      </div>`;
  }
};

/* 缺省版式：与旧版硬编码顺序完全一致（核心数据 → 课程模块 → WHY SFK → CTA） */
function resolveDetailSections(D, PH) {
  if (Array.isArray(D.sections) && D.sections.length) return D.sections;
  return [
    { type: 'stat', label: T.courseDetail.snapshotLabel, items: (D.snapshot && D.snapshot.length) ? D.snapshot : (PH.snapshot || []) },
    { type: 'curriculum', label: T.courseDetail.curriculumLabel },
    { type: 'why', label: T.courseDetail.whyLabel, items: (D.whySFK && D.whySFK.length) ? D.whySFK : (PH.whySFK || []) },
    { type: 'cta', closing: D.closing || PH.closing || {} }
  ];
}

const CourseProducts = {
  /* 分区顺序：elite / longform 用长线式详情，catalog / overseas / frontier 用目录式详情 */
  ZONES: [
    { key: 'elite',    group: 'longform' },
    { key: 'longform', group: 'longform' },
    { key: 'catalog',  group: 'catalog' },
    { key: 'overseas', group: 'catalog' },
    { key: 'frontier', group: 'catalog' }
  ],
  _level: '',                    /* '' = 全部；'ug' = 本科；'pg' = 研究生 */
  data() { return DATA.courseProducts || null; },

  /* 按学历筛选渲染五个分区；筛选后为空的分区整体隐藏，保持版面协调 */
  zonesHtml() {
    const d = this.data(); if (!d) return '';
    return this.ZONES.map(z => {
      const list = (d[z.key] || []).filter(p => !this._level || (p.levels || []).includes(this._level));
      if (!list.length) return '';
      const zc = (d.zones || {})[z.key] || {};
      return `
      <section class="cp-zone">
        <div class="cp-zone__head">
          <span class="section__eyebrow">${esc(zc.eyebrow)}</span>
          <h2 class="section__title cp-zone__title">${esc(zc.title)}</h2>
        </div>
        <div class="cp-grid">${list.map(p => this.card(p, z.group)).join('')}</div>
      </section>`;
    }).join('');
  },

  card(p, group) {
    const cover = p.cover
      ? `<img src="${esc(p.cover)}" alt="" loading="lazy">`
      : '';
    return `<div class="cp-card cp-card--${group}" role="button" tabindex="0" data-cp-id="${esc(p.id)}" aria-label="${esc(p.meta.titleCn)}">
      <div class="cp-card__banner${p.tileVariant ? ' cp-card__banner--' + esc(p.tileVariant) : ''}">${cover}<span class="cp-card__badge">${esc(p.badge)}</span><span class="subject-tile__line" aria-hidden="true"></span></div>
      <div class="cp-card__body">
        <div class="cp-card__eyebrow">${esc(p.meta.eyebrow)}</div>
        <div class="cp-card__title">${esc(p.meta.titleCn)}</div>
        <div class="cp-card__subtitle u-en">${esc(p.meta.titleEn)}</div>
        <p class="cp-card__desc">${esc(p.meta.desc)}</p>
        <div class="cp-card__chips">${(p.meta.chips || []).map(c => `<span class="cd-chip">${esc(c)}</span>`).join('')}</div>
      </div>
    </div>`;
  },

  /* 详情结构：cd-hero → 核心数据 · SNAPSHOT → 课程模块 · CURRICULUM → WHY SFK → CTA */
  /* 预计算数据源与模块卡集合（幂等，供 heroHTML / detailBody / open 复用） */
  _prepare(p) {
    const PH = cpPlaceholder();
    const D = p.detail || (DATA.coursesIndustry || {})[p.id] || (DATA.coursesAcademic || {})[p.id] || {};
    this._cur = {
      cards: (D.curriculum && D.curriculum.length) ? D.curriculum : (PH.curriculum || []),
      facets: D.curriculumFacets || PH.facets || { groups: [] },
      main: '', sub: '', q: ''
    };
    return { PH, D };
  },

  /* 顶部标题区（独立浮于正文之上，背景为 ink 深色、占满 panel 顶部） */
  heroHTML(p) {
    const { PH, D } = this._prepare(p);
    const desc = D.desc || PH.desc;
    const chips = (D.chips && D.chips.length) ? D.chips : (PH.chips || []);
    const tile = 'cd-hero__tile' + (p.tileVariant ? ' cd-hero__tile--' + p.tileVariant : '');
    return `
      <div class="cd-hero">
        <div class="cd-hero__content">
          <div class="cd-hero__eyebrow">${esc(p.meta.eyebrow)}</div>
          <h2 class="cd-hero__title">${esc(p.meta.titleCn)}</h2>
          <div class="cd-hero__subtitle u-en">${esc(p.meta.titleEn)}</div>
          <p class="cd-hero__desc">${esc(desc)}</p>
          <div class="cd-chips">${chips.map(c => `<span class="cd-chip">${esc(c)}</span>`).join('')}</div>
        </div>
        <div class="${tile}" aria-hidden="true"></div>
      </div>`;
  },

  /* 顶部标题区之外的内容：按 sections[] 顺序渲染
     数据侧可在课程条目里提供 detail.sections / 课表条目里提供 sections：
       [{ type: 'stat', label, items:[{k,v}] },
        { type: 'curriculum', label },
        { type: 'why', label, items:[{t,d}] },
        { type: 'cta', closing:{cn,en} }]
     未提供时按内置顺序（核心数据 → 课程模块 → WHY SFK → CTA）推导，行为与旧版一致 */
  detailBody(p) {
    const { PH, D } = this._prepare(p);
    const parts = resolveDetailSections(D, PH)
      .map(s => {
        const render = DETAIL_SECTIONS[s.type];
        return render ? render.call(this, s) : '';
      })
      .filter(Boolean);
    return '\n      ' + parts.join('\n      ');
  },

  /* 完整详情（兼容旧调用） = 顶部标题区 + 正文 */
  detail(p) {
    this._prepare(p);
    return this.heroHTML(p) + this.detailBody(p);
  },

  /* ── 课程模块区：分类主标签 × 子分类 × 搜索（联动逻辑复刻 art-humanities_demo）──
     主标签选中展开其子分类；三者 AND 联动实时过滤；只重渲染网格 / 计数 / 空状态 */
  curriculumBlock() {
    const st = this._cur;
    const f = st.facets || {};
    const groups = f.groups || [];
    const mains = groups.map(g =>
      `<button class="filter-btn" type="button" data-cur-main="${esc(g.value)}">${esc(g.label)}</button>`).join('');
    const subs = groups.filter(g => (g.children || []).length).map(g =>
      g.children.map(c => `<button class="filter-btn filter-btn--sub" type="button" data-cur-sub="${esc(c)}" data-cur-parent="${esc(g.value)}">${esc(c)}</button>`).join('')
    ).join('');
    return `
      <div class="cd-cur-bar">
        <div class="cd-cur-left">
          <div class="cd-filter-group">
            <span class="cd-filter-group__label">${esc(T.courseDetail.filterLabel)}</span>
            <span class="cd-filter-group__sep">${esc(T.common.bar)}</span>
            <span class="cd-filter-group__btns" id="cd-cur-mains">${mains}</span>
          </div>
          <div class="cd-filter-group__btns" id="cd-cur-subs" hidden>${subs}</div>
        </div>
        <div class="cd-cur-right">
          <input class="cd-cur-input" id="cd-cur-search" type="search" autocomplete="off"
            placeholder="${esc(f.searchPlaceholder || cpSearchPlaceholder())}" aria-label="${esc(T.courseDetail.searchAria)}">
          <button class="cd-cur-clear" id="cd-cur-clear" type="button" hidden>${esc(T.courseDetail.clear)}</button>
          <span class="cd-cur-count" id="cd-cur-count"></span>
        </div>
      </div>
      <div class="cd-curriculum-grid" id="cd-cur-grid"></div>
      <p class="cd-cur-empty" id="cd-cur-empty" hidden>${esc(T.courseDetail.empty)}</p>`;
  },

  /* 按当前筛选状态重渲染模块网格 + 计数 + 空状态（不动筛选栏，保持输入焦点） */
  renderCurriculum() {
    const st = this._cur;
    const grid = document.getElementById('cd-cur-grid');
    if (!st || !grid) return;
    const list = st.cards.filter(c => this.curMatch(c, st));
    grid.innerHTML = list.map(c => this.curriculumCard(c)).join('');
    const empty = document.getElementById('cd-cur-empty');
    if (empty) empty.hidden = list.length > 0;
    const count = document.getElementById('cd-cur-count');
    if (count) count.textContent = list.length === st.cards.length
      ? fill(T.courseDetail.countAll, { n: st.cards.length })
      : fill(T.courseDetail.countFiltered, { a: list.length, b: st.cards.length });
    const clear = document.getElementById('cd-cur-clear');
    if (clear) clear.hidden = !st.q;
  },

  curMatch(c, st) {
    const f = c.facets || {};
    if (st.main && f.program_type !== st.main) return false;
    if (st.sub && f.category !== st.sub) return false;
    if (st.q && !(c.searchText || '').includes(st.q)) return false;
    return true;
  },

  /* 主标签 / 子分类：单击选中、再击取消；切换主分类时清空并收起子分类 */
  curFacet(kind, btn) {
    const st = this._cur;
    if (!st) return;
    const attr = kind === 'main' ? 'data-cur-main' : 'data-cur-sub';
    const val = btn.getAttribute(attr);
    if (kind === 'main') {
      st.main = st.main === val ? '' : val;
      st.sub = '';
    } else {
      st.sub = st.sub === val ? '' : val;
    }
    document.querySelectorAll('#cd-cur-mains .filter-btn').forEach(b =>
      b.classList.toggle('is-active', b.getAttribute('data-cur-main') === st.main));
    let shown = 0;
    document.querySelectorAll('#cd-cur-subs .filter-btn').forEach(b => {
      b.hidden = !st.main || b.getAttribute('data-cur-parent') !== st.main;
      if (!b.hidden) shown++;
      b.classList.toggle('is-active', b.getAttribute('data-cur-sub') === st.sub);
    });
    const subs = document.getElementById('cd-cur-subs');
    if (subs) subs.hidden = shown === 0;
    this.renderCurriculum();
  },

  /* 搜索：实时匹配（不区分大小写）；不回写输入框，避免打断输入 */
  curSearch(value) {
    const st = this._cur;
    if (!st) return;
    st.q = String(value == null ? '' : value).trim().toLowerCase();
    const clear = document.getElementById('cd-cur-clear');
    if (clear) clear.hidden = !st.q;
    this.renderCurriculum();
  },

  /* 课程模块卡（层级复刻源站）：图片（含左上分类角标）→ 眉标 → 标题 → 项目 → 标签组 → 说明
     poster / pdf 字段填充后自动可点，弹出海报大图 / PDF 阅读视图（PosterModal）；
     占位态同样可点，弹窗内展示对应占位 */
  curriculumCard(c) {
    const hasMedia = !!(c.poster || c.pdf || c._ph);
    const img = c.poster ? `<img src="${esc(c.poster)}" alt="" loading="lazy">` : '';
    const catTag = c.cat ? `<span class="cd-curriculum-card__cat-tag">${esc(c.cat)}</span>` : '';
    const tags = (c.tags && c.tags.length)
      ? `<div class="cd-curriculum-card__tags">${c.tags.map(t => `<span class="cd-curriculum-card__tag">${esc(t)}</span>`).join('')}</div>`
      : '';
    const split = c.split === 1;   /* 商业实践：海报 + PDF 左右分栏叠加层 */
    const attr = hasMedia
      ? ` role="button" tabindex="0"` +
        (c.pdf ? ` data-pdf="${esc(c.pdf)}"` : '') +
        (c.posterFull ? ` data-poster-full="${esc(c.posterFull)}"` : '') +
        (split ? ' data-split="1"' : '') +
        ` data-poster="${esc(c.poster || '')}" data-poster-title="${esc(c.title)}" data-poster-sub="${esc(c.program || '')}" aria-label="${esc(c.title)}${esc(c.pdf || split ? T.courseDetail.viewPdfAria : T.courseDetail.viewPosterAria)}"`
      : '';
    return `<div class="cd-curriculum-card cd-curriculum-card--dark${hasMedia ? ' is-clickable' : ''}" style="--poster:url('${esc(c.poster || '')}')"${attr}>
      <div class="cd-curriculum-card__img${c.poster ? ' cd-curriculum-card__img--photo' : ''}"${hasMedia ? '' : ' aria-hidden="true"'}>${img}${catTag}</div>
      <div class="cd-curriculum-card__body">
        ${c.eyebrow ? `<div class="cd-curriculum-card__eyebrow u-en">${esc(c.eyebrow)}</div>` : ''}
        <h4 class="cd-curriculum-card__title">${esc(c.program || c.title)}</h4>
        ${c.title ? `<div class="cd-curriculum-card__program">${esc(c.title)}</div>` : ''}
        ${tags}
        ${c.desc ? `<p class="cd-curriculum-card__desc" title="${esc(c.desc)}">${esc(c.desc)}</p>` : ''}
      </div>
    </div>`;
  },

  open(id) {
    const d = this.data(); if (!d) return;
    const p = [d.longform, d.elite, d.catalog, d.overseas, d.frontier]
      .reduce((f, l) => f || ((l || []).filter(x => x.id === id)[0]), null);
    if (!p) return;
    document.getElementById('app-overlay').innerHTML = `
      <div class="course-overlay is-open">
        <div class="course-overlay__backdrop" onclick="CourseProducts.close()"></div>
        <div class="course-overlay__panel">
          <button class="course-overlay__close" onclick="CourseProducts.close()" aria-label="${esc(T.common.closeAria)}">${esc(T.common.closeSym)}</button>
          ${this.heroHTML(p)}
          <div class="course-overlay__body course-overlay__body--wide">${this.detailBody(p)}</div>
        </div>
      </div>`;
    /* 展开页内交互：分类 / 子分类 / 清除按钮 + 搜索输入 + 模块卡（海报 / PDF 弹窗），事件委托 */
    const body = document.querySelector('.course-overlay__body');
    body.addEventListener('click', e => {
      const main = e.target.closest && e.target.closest('[data-cur-main]');
      if (main) return this.curFacet('main', main);
      const sub = e.target.closest && e.target.closest('[data-cur-sub]');
      if (sub) return this.curFacet('sub', sub);
      if (e.target.closest && e.target.closest('#cd-cur-clear')) return this.curSearch('');
      const card = e.target.closest && e.target.closest('.cd-curriculum-card.is-clickable');
      if (card) return PosterModal.open(card);
    });
    body.addEventListener('input', e => {
      if (e.target && e.target.id === 'cd-cur-search') this.curSearch(e.target.value);
    });
    body.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest && e.target.closest('.cd-curriculum-card.is-clickable');
      if (!card) return;
      e.preventDefault();
      PosterModal.open(card);
    });
    this.renderCurriculum();
    /* 登记到统一弹层：Esc / 滚动锁 / 焦点归位统一由 Modal 处理 */
    Modal.open({ el: document.querySelector('.course-overlay'), close: () => this.close(), trigger: document.activeElement });
  },
  close() {
    const el = document.querySelector('.course-overlay');
    if (el) { Modal.close(el); el.remove(); }
    Modal.sync();
  },

  /* 本科 / 研究生 筛选：单击选中、再击取消（取消后展示全部） */
  setLevel(lv) {
    this._level = this._level === lv ? '' : lv;
    const wrap = document.getElementById('cp-zones');
    if (wrap) wrap.innerHTML = this.zonesHtml();
    document.querySelectorAll('#cp-level-bar [data-level]').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-level') === this._level);
    });
  }
};

/* ── 课程海报 / PDF 二级弹窗：结构复刻 art-humanities_demo 的 PosterModal ──
   海报视图（poster 填充后显示图片，未填充显示占位）↔ PDF 视图（pdf 填充后用内嵌
   框架预览，未填充显示占位）；关闭钮 / 点遮罩 / Esc 关闭，Esc 优先于课程详情浮层 */
const PosterModal = {
  _el: null,
  build() {
    if (this._el) return this._el;
    const el = document.createElement('div');
    el.className = 'poster-modal';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `
      <div class="poster-modal__backdrop"></div>
      <div class="poster-modal__flipper"><div class="poster-modal__inner">
        <button class="poster-modal__close" type="button" aria-label="${esc(T.common.closeAria)}">${esc(T.common.closeSym)}</button>
        <div class="poster-modal__pane poster-modal__pane--poster">
          <img class="poster-modal__img" src="" alt="">
          <div class="poster-modal__poster-info" hidden>
            <div class="poster-modal__poster-title"></div>
            <div class="poster-modal__poster-sub"></div>
          </div>
          <div class="poster-modal__ph" hidden><span>${esc(T.poster.phTitle)}</span><small>${esc(T.poster.phDesc)}</small></div>
        </div>
        <div class="poster-modal__pane poster-modal__pane--pdf">
          <div class="poster-modal__pdf-ph"><span>${esc(T.poster.pdfPhTitle)}</span><small>${esc(T.poster.pdfPhDesc)}</small></div>
          <iframe class="poster-modal__pdf-frame" src="" title="${esc(T.poster.pdfFrameTitle)}"></iframe>
        </div>
      </div></div>`;
    document.body.appendChild(el);
    el.querySelector('.poster-modal__backdrop').addEventListener('click', () => this.close());
    el.querySelector('.poster-modal__close').addEventListener('click', () => this.close());
    this._el = el;
    return el;
  },
  isOpen() { return !!this._el && this._el.classList.contains('is-visible'); },
  open(cardEl) {
    if (!cardEl) return;
    /* posterFull：点击后弹出的大图（如「课程名 PDF.jpg」），缺省则弹出卡片海报本身 */
    const poster = cardEl.getAttribute('data-poster-full') || cardEl.getAttribute('data-poster') || '';
    const pdf = cardEl.getAttribute('data-pdf') || '';
    const split = cardEl.getAttribute('data-split') === '1';   /* 左海报 + 右 PDF 分栏 */
    const el = this.build();
    const title = cardEl.getAttribute('data-poster-title') || '';
    const sub = cardEl.getAttribute('data-poster-sub') || '';
    const img = el.querySelector('.poster-modal__img');
    const ph = el.querySelector('.poster-modal__ph');
    const info = el.querySelector('.poster-modal__poster-info');
    const infoTitle = el.querySelector('.poster-modal__poster-title');
    const infoSub = el.querySelector('.poster-modal__poster-sub');
    const pdfPh = el.querySelector('.poster-modal__pdf-ph');
    const frame = el.querySelector('.poster-modal__pdf-frame');

    if (poster) { img.src = poster; img.alt = title; img.hidden = false; ph.hidden = true; }
    else { img.removeAttribute('src'); img.hidden = true; ph.hidden = false; }
    infoTitle.textContent = title;
    infoSub.textContent = sub;
    info.hidden = !split;                      /* 标题信息区仅分栏模式展示 */
    if (pdf) { frame.src = pdf; pdfPh.hidden = true; }
    else { frame.removeAttribute('src'); pdfPh.hidden = false; }

    el.classList.toggle('is-split', split);
    if (!split) el.classList.toggle('is-pdf', !!pdf);   /* 有 PDF 文档的课程模块直接弹出文档 */

    el.setAttribute('aria-label', (title ? title + ' ' : '') + (split ? T.poster.ariaSplit : (pdf ? T.courseDetail.pdfAria : T.courseDetail.posterAria)));
    el.style.display = 'flex';
    el.offsetHeight;                                   /* 强制回流，确保入场过渡生效 */
    el.classList.add('is-visible');
    el.querySelector('.poster-modal__close').focus();
    /* 压入弹层栈（位于课程详情浮层之上）：Esc 只关本层，关闭后焦点回到模块卡 */
    Modal.open({ el, close: () => this.close(), trigger: cardEl, lockScroll: false });
  },
  close() {
    if (!this._el) return;
    const el = this._el;
    el.classList.remove('is-visible');
    el.querySelector('.poster-modal__pdf-frame').removeAttribute('src');   /* 释放文档，避免下次复用加载旧文件 */
    setTimeout(() => { if (!this.isOpen()) el.style.display = 'none'; }, 340);   /* 等退场过渡结束再隐藏 */
    Modal.close(el);   /* 出栈 + 焦点归还触发卡片 */
  }
};
