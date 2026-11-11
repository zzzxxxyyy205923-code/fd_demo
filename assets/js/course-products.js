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

/* ─────────── pptx 页序详情区 ───────────
   区域顺序完全由 course-products.json 的 detail.sections[] 决定；
   下面只负责把结构化数据映射成 SFK 版式，不含任何页面文案 */
function deckHead(s) {
  return `<div class="cd-deck__head">
      <div class="cd-deck__meta"><span class="cd-deck__no u-en">${esc(s.no)}</span><span class="cd-deck__kicker u-en">${esc(s.kicker)}</span></div>
      <h3 class="cd-deck__title">${esc(s.title)}</h3>
      ${s.subtitle ? `<div class="cd-deck__subtitle u-en">${esc(s.subtitle)}</div>` : ''}
      ${s.intro ? `<p class="cd-deck__intro">${esc(s.intro)}</p>` : ''}
      ${s.note ? `<p class="cd-deck__note">${esc(s.note)}</p>` : ''}
    </div>`;
}

function deckSection(s, inner) {
  return `<section class="cd-section cd-deck" id="${esc(s.id)}" data-deck-page="${esc(s.no)}">${deckHead(s)}${inner}</section>`;
}

function deckFooter(f) {
  if (!f) return '';
  if (typeof f === 'string') return `<div class="cd-deck__footer">${esc(f)}</div>`;
  return `<div class="cd-deck__footer">${f.statement ? `<strong>${esc(f.statement)}</strong>` : ''}${f.keywords ? `<p>${esc(f.keywords)}</p>` : ''}</div>`;
}

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
    return `<section class="cd-section"${s.id ? ` id="${esc(s.id)}"` : ''}><div class="cd-section__label">${esc(s.label || T.courseDetail.curriculumLabel)}</div>${this.curriculumBlock()}</section>`;
  },

  /* 末尾课程模块：按分类来源分组，复用 curriculumCard() 与 .cd-curriculum-grid，
     保证卡片结构 / 样式 / 海报 PDF 点击交互与其它详情页完全一致；
     某分类无结果时显示该分类说明，不留空网格 */
  courseCards(s) {
    const groups = (s.groups || []).map(g => {
      const cards = g.cards || [];
      const body = cards.length
        ? `<div class="cd-curriculum-grid cd-deck-courses__grid">${cards.map(c => this.curriculumCard(c)).join('')}</div>`
        : `<p class="cd-deck-courses__empty">${esc(g.emptyNote)}</p>`;
      return `<div class="cd-deck-courses__group">
        <div class="cd-deck-courses__head">
          <h4 class="cd-deck-courses__title">${esc(g.label)}</h4>
          ${g.note ? `<span class="cd-deck-courses__note">${esc(g.note)}</span>` : ''}
        </div>
        ${body}
      </div>`;
    }).join('');
    return `<section class="cd-section" id="${esc(s.id)}"><div class="cd-section__label">${esc(s.label || T.courseDetail.curriculumLabel)}</div>${s.intro ? `<p class="cd-deck__intro cd-deck-courses__intro">${esc(s.intro)}</p>` : ''}<div class="cd-deck-courses">${groups}</div></section>`;
  },

  /* pptx P2：导航卡，点击跳转到对应页序区域 */
  deckNav(s) {
    const a = s.aside || {};
    const aside = `<div class="cd-deck-nav__aside">
        <div class="cd-deck-nav__aside-eyebrow u-en">${esc(a.eyebrow)}</div>
        ${(a.lines || []).map(l => `<p>${esc(l)}</p>`).join('')}
      </div>`;
    const cards = (s.items || []).map(it => `<button class="cd-deck-nav__card" type="button" data-deck-target="${esc(it.target)}">
        <span class="cd-deck-nav__no u-en">${esc(it.no)}</span>
        <span class="cd-deck-nav__title">${esc(it.title)}</span>
        <span class="cd-deck-nav__note">${esc(it.note)}</span>
      </button>`).join('');
    return deckSection(s, `<div class="cd-deck-nav">${aside}<div class="cd-deck-nav__grid">${cards}</div></div>`);
  },

  /* pptx P3 / P10：双栏对照（BEFORE → AFTER / 设计实践 × 学术研究） */
  deckSplit(s) {
    const cols = (s.cols || []).map(c => `<div class="cd-deck-split__col">
        <div class="cd-deck-split__eyebrow u-en">${esc(c.eyebrow)}</div>
        ${c.title ? `<h4 class="cd-deck-split__title">${esc(c.title)}</h4>` : ''}
        ${c.sub ? `<div class="cd-deck-split__sub">${esc(c.sub)}</div>` : ''}
        <ul class="cd-deck-split__list">${(c.bullets || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`).join('');
    const arrow = s.arrow ? `<div class="cd-deck-split__arrow" aria-hidden="true">${esc(s.arrow)}</div>` : '';
    return deckSection(s, `<div class="cd-deck-split">${cols}${arrow}</div>${deckFooter(s.footer)}`);
  },

  /* pptx P4 / P5 / P6 / P9 / P11 / P19：编号 / 英文眉标卡栅格，列数由数据指定 */
  deckGrid(s) {
    const h = s.header || {};
    const header = (h.eyebrow || h.title || h.desc || (h.tags || []).length)
      ? `<div class="cd-deck-grid__header">
          ${h.eyebrow ? `<div class="cd-deck-grid__header-eyebrow u-en">${esc(h.eyebrow)}</div>` : ''}
          ${h.title ? `<div class="cd-deck-grid__header-title u-en">${esc(h.title)}</div>` : ''}
          ${h.desc ? `<p class="cd-deck-grid__header-desc">${esc(h.desc)}</p>` : ''}
          ${(h.tags || []).length ? `<div class="cd-deck-grid__tags">${h.tags.map(t => `<span class="u-en">${esc(t)}</span>`).join('')}</div>` : ''}
        </div>` : '';
    const isStat = s.variant === 'stats';
    const items = (s.items || []).map(it => {
      if (isStat) {
        return `<div class="cd-deck-grid__item cd-deck-grid__item--stat">
          <div class="cd-deck-grid__stat-value u-en">${esc(it.value)}</div>
          <div class="cd-deck-grid__stat-label">${esc(it.title)}</div>
        </div>`;
      }
      return `<div class="cd-deck-grid__item">
        ${it.no ? `<div class="cd-deck-grid__no u-en">${esc(it.no)}</div>` : ''}
        ${it.en ? `<div class="cd-deck-grid__en u-en">${esc(it.en)}</div>` : ''}
        ${it.title ? `<h4 class="cd-deck-grid__title">${esc(it.title)}</h4>` : ''}
        ${it.desc ? `<p class="cd-deck-grid__desc">${esc(it.desc)}</p>` : ''}
        ${it.note ? `<p class="cd-deck-grid__note">${esc(it.note)}</p>` : ''}
      </div>`;
    }).join('');
    const gridCls = 'cd-deck-grid' + (isStat ? ' cd-deck-grid--stats' : '');
    return deckSection(s, `${header}<div class="${gridCls}" style="--deck-cols:${Number(s.columns) || 2}">${items}</div>${deckFooter(s.footer)}`);
  },

  /* pptx P7 + P8：两页同属「重点课程与项目」，续页眉保留，5 张卡整合成一排 */
  deckRow(s) {
    const pages = s.pages || [];
    const head = deckHead(Object.assign({}, pages[0] || {}, { no: s.no }));
    const cont = pages.slice(1).map(pg => `<div class="cd-deck__cont">
        <span class="cd-deck__no u-en">${esc(pg.no)}</span>
        <span class="cd-deck__kicker u-en">${esc(pg.kicker)}</span>
        <h4 class="cd-deck__cont-title">${esc(pg.title)}</h4>
        <p class="cd-deck__cont-intro">${esc(pg.intro)}</p>
      </div>`).join('');
    const cards = pages.reduce((all, pg) => all.concat(pg.cards || []), []).map(c => `<div class="cd-deck-row__card">
        ${c.en ? `<div class="cd-deck-row__en u-en">${esc(c.en)}</div>` : ''}
        ${c.title ? `<h4 class="cd-deck-row__title">${esc(c.title)}</h4>` : ''}
        ${c.note ? `<p class="cd-deck-row__note">${esc(c.note)}</p>` : ''}
        ${c.desc ? `<p class="cd-deck-row__desc">${esc(c.desc)}</p>` : ''}
      </div>`).join('');
    return `<section class="cd-section cd-deck" id="${esc(s.id)}" data-deck-page="${esc(s.no)}">${head}${cont}<div class="cd-deck-row">${cards}</div></section>`;
  },

  /* pptx P12–P18：七大赛道共用一个区域，标签切换同一区域内的院校 / 项目内容 */
  deckTracks(s) {
    const tabs = (s.tabs || []).map((t, i) => `<button class="cd-deck-tracks__tab${i === 0 ? ' is-active' : ''}" type="button" data-deck-track="${esc(t.no)}" aria-pressed="${i === 0}">
        <span class="u-en">${esc(t.no)}</span><span>${esc(t.name)}</span>
      </button>`).join('');
    const panels = (s.tracks || []).map((t, i) => `<div class="cd-deck-tracks__panel" data-deck-panel="${esc(t.no)}"${i ? ' hidden' : ''}>
        <div class="cd-deck-tracks__lead">
          <h4 class="cd-deck-tracks__name"><span aria-hidden="true">●</span> ${esc(t.name)} <span class="u-en">${esc(t.en)}</span></h4>
          ${t.theme ? `<p class="cd-deck-tracks__theme">${esc(t.theme)}</p>` : ''}
        </div>
        ${t.note ? `<p class="cd-deck__note cd-deck-tracks__note">${esc(t.note)}</p>` : ''}
        <div class="cd-deck-tracks__schools">${(t.schools || []).map(sc => `<div class="cd-deck-school">
            ${sc.abbr ? `<div class="cd-deck-school__abbr u-en">${esc(sc.abbr)}</div>` : ''}
            <div class="cd-deck-school__main">
              <div class="cd-deck-school__cn">${esc(sc.cn)}${sc.tag ? `<span class="cd-deck-school__tag">${esc(sc.tag)}</span>` : ''}</div>
              ${sc.en ? `<div class="cd-deck-school__en u-en">${esc(sc.en)}</div>` : ''}
              ${sc.program ? `<div class="cd-deck-school__program u-en">${esc(sc.program)}</div>` : ''}
              ${sc.desc ? `<p class="cd-deck-school__desc">${esc(sc.desc)}</p>` : ''}
            </div>
          </div>`).join('')}</div>
      </div>`).join('');
    return deckSection(s, `<div class="cd-deck-tracks"><div class="cd-deck-tracks__tabs" role="group" aria-label="${esc(s.title)}">${tabs}</div>${panels}</div>`);
  },

  /* pptx P20：收尾主张 */
  deckStatement(s) {
    const pillars = (s.pillars || []).map(p => `<div class="cd-deck-statement__pillar u-en">${esc(p)}</div>`).join('');
    return deckSection(s, `<div class="cd-deck-statement"><div class="cd-deck-statement__pillars">${pillars}</div>${s.footer ? `<div class="cd-deck-statement__footer">${esc(s.footer)}</div>` : ''}</div>`);
  },
  /* 为什么选择：条目网格 */
  why(s) {
    const items = s.items || [];
    return `<section class="cd-section"><div class="cd-section__label">${esc(s.label)}</div><div class="cd-why-grid">${items.map(w => `<div class="cd-why"><div class="cd-stat__k">${esc(w.t)}</div><div class="cd-stat__v">${esc(w.d)}</div></div>`).join('')}</div></section>`;
  },
  /* 收尾文案：cn / en / 说明 / 标签（art-humanities_demo anxin-ban 同款结构），全空时不渲染 */
  cta(s) {
    const c = s.closing || {};
    if (!c.cn && !c.en && !c.desc && !(c.tags && c.tags.length)) return '';
    return `<div class="cd-cta">
        <p class="cd-cta__statement">${esc(c.cn)}</p>
        ${c.en ? `<p class="cd-cta__statement-en u-en">${esc(c.en)}</p>` : ''}
        ${c.desc ? `<p class="cd-cta__desc">${esc(c.desc)}</p>` : ''}
        ${(c.tags && c.tags.length) ? `<div class="cd-chips cd-cta__tags">${c.tags.map(t => `<span class="cd-chip">${esc(t)}</span>`).join('')}</div>` : ''}
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
        ${p.meta.desc ? `<p class="cp-card__desc">${esc(p.meta.desc)}</p>` : ''}
        ${(p.meta.chips && p.meta.chips.length) ? `<div class="cp-card__chips">${p.meta.chips.map(c => `<span class="cd-chip">${esc(c)}</span>`).join('')}</div>` : ''}
      </div>
    </div>`;
  },

  /* 详情结构：cd-hero → 核心数据 · SNAPSHOT → 课程模块 · CURRICULUM → WHY SFK → CTA */
  /* 预计算数据源与模块卡集合（幂等，供 heroHTML / detailBody / open 复用） */
  _prepare(p) {
    const PH = cpPlaceholder();
    const D = p.detail || (DATA.coursesIndustry || {})[p.id] || (DATA.coursesAcademic || {})[p.id] || {};
    const cards = Array.isArray(D.curriculum) ? D.curriculum : (PH.curriculum || []);
    this._cur = {
      cards,
      facets: D.curriculumFacets || PH.facets || { groups: [] },
      main: '', sub: '', q: '',
      expanded: false,               /* 课程模块折叠状态：每次打开详情重置为简要预览 */
      /* 数据侧标记为缺失 PDF 的模块，供课程模块区汇总提示使用 */
      missing: cards.filter(c => c.pdfMissing).map(c => c.pdfMissing)
    };
    /* 视口跨过折叠档位（桌面 8 / 平板 4 / 移动 3）时刷新预览条数，跨断点才重渲染 */
    if (!this._curResizeBound) {
      this._curResizeBound = true;
      let narrow = null;
      window.addEventListener('resize', () => {
        const next = window.innerWidth <= 900;
        if (next !== narrow && this._cur) this.renderCurriculum();
        narrow = next;
      }, { passive: true });
    }
    return { PH, D };
  },

  /* 顶部标题区（独立浮于正文之上，背景为 ink 深色、占满 panel 顶部） */
  heroHTML(p) {
    const { PH, D } = this._prepare(p);
    /* 简介与标签取数链：产品专属详情数据 → 卡片 meta（保证卡片与详情页一一对应）
       → detailPlaceholder 占位模板（仅在 meta 也缺失时降级显示） */
    const m = p.meta || {};
    const desc = D.desc || m.desc || PH.desc;
    const chips = (D.chips && D.chips.length) ? D.chips
      : (m.chips && m.chips.length ? m.chips : (PH.chips || []));
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

  /* 七大赛道：同一区域内切换标签，只改按钮状态与 panel 显隐，不重建 DOM、不影响滚动位置 */
  deckTrack(btn) {
    const box = btn.closest('.cd-deck-tracks');
    if (!box) return;
    const val = btn.getAttribute('data-deck-track');
    box.querySelectorAll('[data-deck-track]').forEach(b => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    box.querySelectorAll('[data-deck-panel]').forEach(p => {
      p.hidden = p.getAttribute('data-deck-panel') !== val;
    });
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
      <div class="cd-cur-toggle-wrap"><button class="cd-cur-toggle" id="cd-cur-toggle" type="button"
        data-cur-toggle aria-expanded="false" hidden>
        <span class="cd-cur-toggle__label"></span>
        <span class="cd-cur-toggle__arrow" aria-hidden="true">▾</span>
      </button></div>
      <p class="cd-cur-missing" id="cd-cur-missing" hidden></p>
      <p class="cd-cur-empty" id="cd-cur-empty" hidden>${esc(T.courseDetail.empty)}</p>`;
  },

  /* 按当前筛选状态重渲染模块网格 + 计数 + 空状态（不动筛选栏，保持输入焦点） */
  renderCurriculum() {
    const st = this._cur;
    const grid = document.getElementById('cd-cur-grid');
    if (!st || !grid) return;
    const all = st.cards.filter(c => this.curMatch(c, st));
    /* 渐进式披露：课程源配置 collapsible 时（如就业实习 56 门）默认只展示简要预览，
       计数与空状态始终按过滤后的全部结果计算，不受折叠影响 */
    const collapse = (st.facets || {}).collapsible;
    const limit = collapse ? this.curLimit(collapse) : Infinity;
    const list = (!collapse || st.expanded || all.length <= limit) ? all : all.slice(0, limit);
    grid.innerHTML = list.map(c => this.curriculumCard(c)).join('');
    const empty = document.getElementById('cd-cur-empty');
    if (empty) empty.hidden = all.length > 0;
    const count = document.getElementById('cd-cur-count');
    if (count) count.textContent = all.length === st.cards.length
      ? fill(T.courseDetail.countAll, { n: st.cards.length })
      : fill(T.courseDetail.countFiltered, { a: all.length, b: st.cards.length });
    const clear = document.getElementById('cd-cur-clear');
    if (clear) clear.hidden = !st.q;
    /* 折叠 / 展开按钮：仅当配置 collapsible 且过滤结果超过预览条数时出现；
       按钮元素不随网格重建，切换后焦点保持在按钮上 */
    const toggle = document.getElementById('cd-cur-toggle');
    if (toggle) {
      const show = !!collapse && all.length > limit;
      toggle.hidden = !show;
      if (show) {
        toggle.classList.toggle('is-expanded', !!st.expanded);
        toggle.setAttribute('aria-expanded', st.expanded ? 'true' : 'false');
        toggle.querySelector('.cd-cur-toggle__label').textContent = st.expanded
          ? T.courseDetail.collapseLabel
          : fill(T.courseDetail.expandLabel, { n: all.length });
      }
    }
    /* 缺失汇总跟随筛选结果：只列出当前可见的缺失模块，无缺失则整行隐藏 */
    const miss = document.getElementById('cd-cur-missing');
    if (miss) {
      const names = list.filter(c => c.pdfMissing).map(c => c.pdfMissing);
      miss.hidden = names.length === 0;
      if (!miss.hidden) miss.textContent = fill(T.courseDetail.missingPdfSummary, { names: names.join('、') });
    }
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

  /* 折叠 / 展开：切换状态后只重渲染网格与按钮文案（按钮本身不重建，焦点保持） */
  curToggle() {
    const st = this._cur;
    if (!st) return;
    st.expanded = !st.expanded;
    this.renderCurriculum();
  },

  /* 简要预览条数：桌面 8（4 列 2 行）/ 平板 4（2 列 2 行）/ 移动 3，由课程源数据配置 */
  curLimit(c) {
    const w = window.innerWidth || 1280;
    const v = w <= 640 ? c.mobileLimit : (w <= 900 ? c.tabletLimit : c.limit);
    return Math.max(1, Number(v) || Number(c.limit) || 6);
  },

  /* 课程模块卡（层级复刻源站）：图片（含左上分类角标）→ 眉标 → 标题 → 项目 → 标签组 → 说明
     poster / pdf 字段填充后自动可点，弹出海报大图 / PDF 阅读视图（PosterModal）；
     占位态同样可点，弹窗内展示对应占位 */
  curriculumCard(c) {
    const hasMedia = !!(c.poster || c.pdf || c._ph);
    const img = c.poster ? `<img src="${esc(c.poster)}" alt="" loading="lazy">` : '';
    const catTag = c.cat ? `<span class="cd-curriculum-card__cat-tag">${esc(c.cat)}</span>` : '';
    const missing = !!c.pdfMissing;   /* 无对应 PDF：保留原海报，并显式提示缺失项 */
    const missTag = missing ? `<span class="cd-curriculum-card__pdf-tag">${esc(T.courseDetail.missingPdfTag)}</span>` : '';
    const tags = (c.tags && c.tags.length)
      ? `<div class="cd-curriculum-card__tags">${c.tags.map(t => `<span class="cd-curriculum-card__tag">${esc(t)}</span>`).join('')}</div>`
      : '';
    const split = c.split === 1;   /* 商业实践：海报 + PDF 左右分栏叠加层 */
    const viewHint = c.pdf || split ? T.courseDetail.viewPdfAria : T.courseDetail.viewPosterAria;
    const attr = hasMedia
      ? ` role="button" tabindex="0"` +
        (c.pdf ? ` data-pdf="${esc(c.pdf)}"` : '') +
        (c.docLabel ? ` data-doc-label="${esc(c.docLabel)}"` : '') +
        (missing ? ` data-pdf-missing="${esc(c.pdfMissing)}"` : '') +
        (c.posterFull ? ` data-poster-full="${esc(c.posterFull)}"` : '') +
        (split ? ' data-split="1"' : '') +
        ` data-poster="${esc(c.poster || '')}" data-poster-title="${esc(c.title)}" data-poster-sub="${esc(c.program || '')}" aria-label="${esc(c.title)}${esc(viewHint)}${missing ? esc(T.courseDetail.missingPdfAria) : ''}"`
      : '';
    return `<div class="cd-curriculum-card cd-curriculum-card--dark${hasMedia ? ' is-clickable' : ''}" style="--poster:url('${esc(c.poster || '')}')"${attr}>
      <div class="cd-curriculum-card__img${c.poster ? ' cd-curriculum-card__img--photo' : ''}"${hasMedia ? '' : ' aria-hidden="true"'}>${img}${catTag}${missTag}</div>
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
      const jump = e.target.closest && e.target.closest('[data-deck-target]');
      if (jump) {
        const dest = document.getElementById(jump.getAttribute('data-deck-target'));
        if (dest) dest.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const tab = e.target.closest && e.target.closest('[data-deck-track]');
      if (tab) return this.deckTrack(tab);
      const main = e.target.closest && e.target.closest('[data-cur-main]');
      if (main) return this.curFacet('main', main);
      const sub = e.target.closest && e.target.closest('[data-cur-sub]');
      if (sub) return this.curFacet('sub', sub);
      const toggle = e.target.closest && e.target.closest('[data-cur-toggle]');
      if (toggle) return this.curToggle();
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
        <header class="poster-modal__doc-head" hidden>
          <div class="poster-modal__doc-head__text">
            <span class="poster-modal__doc-eyebrow u-en">${esc(T.poster.docEyebrow)}</span>
            <span class="poster-modal__doc-title"></span>
          </div>
          <a class="poster-modal__doc-open" target="_blank" rel="noopener noreferrer">${esc(T.poster.docOpenLabel)}</a>
        </header>
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
        <div class="poster-modal__missing" hidden>
          <span class="poster-modal__missing__eyebrow u-en">${esc(T.poster.missingEyebrow)}</span>
          <span class="poster-modal__missing__text"></span>
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
    const missing = cardEl.getAttribute('data-pdf-missing') || '';
    const docLabel = cardEl.getAttribute('data-doc-label') || '';
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
    const docHead = el.querySelector('.poster-modal__doc-head');
    const docTitle = el.querySelector('.poster-modal__doc-title');
    const docOpen = el.querySelector('.poster-modal__doc-open');
    const missBar = el.querySelector('.poster-modal__missing');
    const missText = el.querySelector('.poster-modal__missing__text');

    if (poster) { img.src = poster; img.alt = title; img.hidden = false; ph.hidden = true; }
    else { img.removeAttribute('src'); img.hidden = true; ph.hidden = false; }
    infoTitle.textContent = title;
    infoSub.textContent = sub;
    info.hidden = !split;                      /* 标题信息区仅分栏模式展示 */
    if (pdf) { frame.src = pdf; pdfPh.hidden = true; }
    else { frame.removeAttribute('src'); pdfPh.hidden = false; }

    /* 境外项目文档视图：带 docLabel 的 PDF 模块启用黑底标题条，其余沿用原 is-pdf 形态 */
    const dossier = !!pdf && !split && !!docLabel;
    docHead.hidden = !dossier;
    if (dossier) {
      docTitle.textContent = docLabel;
      docOpen.href = pdf;
      docOpen.setAttribute('aria-label', fill(T.poster.docOpenAria, { name: docLabel }));
    }
    /* 无对应 PDF：保留原海报，并在弹窗底部常驻缺失说明 */
    missBar.hidden = !missing;
    if (missing) missText.textContent = fill(T.poster.missingDesc, { name: missing });

    el.classList.toggle('is-split', split);
    el.classList.toggle('is-pdf', !split && !!pdf);   /* 有 PDF 文档的课程模块直接弹出文档 */
    el.classList.toggle('is-dossier', dossier);
    el.classList.toggle('is-missing', !!missing);

    el.setAttribute('aria-label', (title ? title + ' ' : '') + (split ? T.poster.ariaSplit : (pdf ? T.courseDetail.pdfAria : T.courseDetail.posterAria)) + (missing ? T.poster.missingAria : ''));
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
