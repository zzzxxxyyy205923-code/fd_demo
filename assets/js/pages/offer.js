/* ═══════════════════════════════════════════════════════════
   VIEW · Offer 成果（#/offer）
   筛选栏（申请季 ｜ 国家 ｜ 搜索）→ 院校栅格 → 展开 / 收起
   数据来自 assets/data/offers.json
═══════════════════════════════════════════════════════════ */
/* ─────────── Offer 成果（结构 / 信息层级 / 交互复用 art-humanities_demo「OFFER成果」） ───────────
   页头 → 筛选栏（申请季 ｜ 国家 ｜ 搜索）→ 院校卡片栅格 → 查看更多 / 收起
   卡片点击原地展开为院校档案卡（年份 × offer 数 + 本科/研究生录取专业） */
const OfferSection = {
  _active: '', _activeSeason: '', _seasons: [], _rows: 4,
  _q: '', _openCard: '', _expanded: false,
  _inited: false,     /* 首次进入才初始化筛选态；之后跨路由保留 */
  data() { return DATA.offers || null; },

  page() {
    const d = this.data();
    if (!d) return renderPlaceholder('offer');
    this._seasons = d.seasonFilters || [];
    this._rows = d.rows || 4;
    const ids = (d.filters || []).map(f => f.id);
    if (!this._inited) {
      this._inited = true;
      this._activeSeason = this._seasons[0] || '';
      this._q = ''; this._openCard = ''; this._expanded = false;
      this._active = ids[0] || '';
    }
    /* 数据变动兜底：失效的筛选值回落到默认，避免空白栅格 */
    if (this._activeSeason && !this._seasons.includes(this._activeSeason)) this._activeSeason = this._seasons[0] || '';
    if (this._active && !ids.includes(this._active)) this._active = ids[0] || '';
    const T_ = T.offer;
    const grp = (label, inner) => `<div class="offer-filter-group"><span class="offer-filter-group__label">${label}</span><span class="offer-filter-group__sep">${esc(T.common.bar)}</span><span class="offer-filter-group__btns">${inner}</span></div>`;
    const seasonBtns = this._seasons.map(s => `<button class="offer-filter-btn${s === this._activeSeason ? ' is-active' : ''}" type="button" data-season="${esc(s)}" onclick="OfferSection.setSeason('${esc(s)}')">${esc(s)}</button>`).join('');
    const countryBtns = (d.filters || []).map(f => `<button class="offer-filter-btn${f.id === this._active ? ' is-active' : ''}" type="button" data-group="${esc(f.id)}" onclick="OfferSection.setCountry('${esc(f.id)}')">${esc(f.label)}</button>`).join('');
    return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(T.offer.crumb)}</span></div>
      <h1>${esc(d.hero.title)}</h1>
      <p>${esc(d.hero.desc)}</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="offers-filter-bar" id="offers-filter-bar">
        ${this._seasons.length ? grp(esc(T_.seasonLabel), seasonBtns) : ''}
        ${grp(esc(T_.countryLabel), countryBtns)}
        <div class="offer-filter-group offer-filter-group--search">
          <span class="offer-filter-group__label">${esc(T_.searchLabel)}</span><span class="offer-filter-group__sep">${esc(T.common.bar)}</span>
          <input class="offers-search" id="offers-search" type="search" placeholder="${esc(T_.searchPlaceholder)}"${this._q ? ` value="${esc(this._q)}"` : ''} autocomplete="off">
        </div>
      </div>
      <div class="rough-grid${this._q ? ' rough-grid--search' : ''}" id="offers-grid">${this.gridHtml()}</div>
      <div class="offers-more" id="offers-more"></div>
    </div>
  </section>`;
  },

  /* 当前应渲染的行：[row, groupId]。常规态 = 当前国家组；搜索态 = 跨全部国家匹配，
     按 offer 总数降序，再叠加国家 / 申请季筛选 */
  rowsData() {
    const d = this.data(); if (!d) return [];
    const groups = d.groups || {};
    let pool = [];
    if (this._q) {
      Object.keys(groups).forEach(g => (groups[g] || []).forEach(r => {
        const hay = ((r.zh || '') + ' ' + (r.en || '')).toLowerCase();
        if (hay.includes(this._q)) pool.push([r, g]);
      }));
      pool.sort((a, b) => (parseInt(b[0].count, 10) || 0) - (parseInt(a[0].count, 10) || 0));
      if (this._active) pool = pool.filter(([, g]) => g === this._active);
    } else {
      pool = (groups[this._active] || []).map(r => [r, null]);
    }
    if (this._activeSeason) {
      pool = pool.filter(([r]) => !(r.seasons || []).length || (r.seasons || []).includes(this._activeSeason));
    }
    return pool;
  },

  gridHtml() {
    const d = this.data(); if (!d) return '';
    const filters = d.filters || [];
    const inSearch = !!this._q;
    return this.rowsData().map(([r, g]) => {
      const cnt = (this._activeSeason && r.seasonCounts && r.seasonCounts[this._activeSeason]) || r.count;
      const dossier = inSearch || this._openCard === r.zh;
      if (!dossier) {
        return `
      <div class="offer-card offer-card--clickable" role="button" tabindex="0" data-school="${esc(r.zh)}">
        <div class="offer-card__count${r.hl ? ' offer-card__count--hl' : ''}">${esc(cnt)}</div>
        <div class="offer-card__school-zh">${esc(r.zh)}</div>
        <div class="offer-card__school-en u-en">${esc(r.en)}</div>
      </div>`;
      }
      const fl = filters.find(f => f.id === (g || this._active));
      const years = (r.seasons || []).slice().sort().reverse()
        .map(s => `<div class="offer-card__year">${esc(s)}${esc(T.offer.yearsSep)}<span class="offer-card__year-num">${esc((r.seasonCounts && r.seasonCounts[s]) || T.common.dash)}</span></div>`).join('');
      const majorsGrp = (list, label) => (list && list.length) ? `
        <div class="offer-card__major-group">
          <div class="offer-card__major-h">${label}</div>
          <ul>${list.map(m => `<li><span class="offer-card__major-en u-en">${esc(m[0])}</span><span class="offer-card__major-cn">${esc(m[1])}</span></li>`).join('')}</ul>
        </div>` : '';
      const majors = r.majors ? `
        <aside class="offer-card__majors">
          ${majorsGrp(r.majors.ug, esc(T.offer.ugLabel))}
          ${majorsGrp(r.majors.pg, esc(T.offer.pgLabel))}
        </aside>` : '';
      return `
      <div class="offer-card offer-card--dossier${inSearch ? '' : ' offer-card--clickable'}"${inSearch ? '' : ' role="button" tabindex="0"'} data-school="${esc(r.zh)}">
        <div class="offer-card__info">
          <div class="offer-card__count${r.hl ? ' offer-card__count--hl' : ''}">${esc(cnt)}</div>
          <div class="offer-card__school-zh">${esc(r.zh)}</div>
          <div class="offer-card__school-en u-en">${esc(r.en)}</div>
          <div class="offer-card__meta">${esc(fl ? fl.label : T.common.dash)}</div>
          <div class="offer-card__years">${years}</div>
        </div>${majors}
      </div>`;
    }).join('');
  },

  syncBtns() {
    const bar = document.getElementById('offers-filter-bar');
    if (!bar) return;
    bar.querySelectorAll('[data-group]').forEach(b => b.classList.toggle('is-active', b.getAttribute('data-group') === this._active));
    bar.querySelectorAll('[data-season]').forEach(b => b.classList.toggle('is-active', b.getAttribute('data-season') === this._activeSeason));
  },

  /* 申请季：搜索态下点击已选中 = 取消；常规态点击即选中 */
  setSeason(s) {
    const deselect = !!this._q && this._activeSeason === s;
    this._activeSeason = deselect ? '' : s;
    this.syncBtns(); this.refresh();
  },

  /* 国家：搜索态下点击已选中 = 取消；常规态点击即选中 */
  setCountry(id) {
    const deselect = !!this._q && this._active === id;
    this._active = deselect ? '' : id;
    this.syncBtns(); this.refresh();
  },

  /* 实时搜索（150ms 防抖）：进入搜索态清空筛选，清空输入恢复默认 */
  search(v) {
    const q = String(v == null ? '' : v).trim().toLowerCase();
    if (q === this._q) return;
    this._q = q;
    if (this._q) {
      this._active = ''; this._activeSeason = '';
    } else {
      const d = this.data();
      this._active = (d && d.filters && d.filters[0] && d.filters[0].id) || '';
      this._activeSeason = this._seasons[0] || '';
    }
    this.syncBtns(); this.refresh();
  },

  refresh() {
    const grid = document.getElementById('offers-grid');
    if (grid) {
      grid.innerHTML = this.gridHtml();
      grid.classList.toggle('rough-grid--search', !!this._q);
    }
    this.clamp();
  },

  toggleCard(zh) { this._openCard = this._openCard === zh ? '' : zh; this.refresh(); },
  toggleExpand() { this._expanded = !this._expanded; this.clamp(); },

  /* 整行折叠：读取栅格实际列数 × 行数（rows），避免末尾稀疏半行；展开时显示全部 */
  clamp() {
    const grid = document.getElementById('offers-grid');
    const more = document.getElementById('offers-more');
    if (!grid || !more) return;
    const tpl = getComputedStyle(grid).gridTemplateColumns;
    const cols = (tpl && tpl !== 'none') ? tpl.split(' ').length : 1;
    const limit = cols * this._rows;
    const cards = Array.from(grid.children);
    cards.forEach((c, i) => { c.style.display = (this._expanded || i < limit) ? '' : 'none'; });
    const total = cards.length;
    more.innerHTML = total <= limit ? '' : (this._expanded
      ? `<button class="btn btn--ghost" type="button" onclick="OfferSection.toggleExpand()">${esc(T.common.collapse)}</button>`
      : `<button class="btn btn--ghost" type="button" onclick="OfferSection.toggleExpand()">${esc(T.common.more)} <span class="u-en">/ ${total - limit}${esc(T.offer.moreSuffix)}</span></button>`);
  },

  init() {
    const input = document.getElementById('offers-search');
    if (input) {
      let t;
      input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => this.search(input.value), 150);
      });
    }
    this.clamp();
  }
};
