/* ═══════════════════════════════════════════════════════════
   VIEW · 学科（#/subjects、#/subjects/<slug>、#/subjects/<slug>/<level>?country=）
   三级下钻：学科 → 学历 → 国家 → 院校详情浮层
═══════════════════════════════════════════════════════════ */
/* 院校详情浮层的当前上下文（学科 / 学历 / 国家） */
/* 院校详情浮层的当前上下文（学科 / 学历 / 国家） */
let SCHOOL_CTX = null;

/* ─────────── Subjects（对应 UAL /subjects 一级） ─────────── */
function renderSubjects() {
  SubjectAreas.reset();
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(T.subjects.crumb)}</span></div>
      <h1>${esc(T.subjects.crumb)}</h1>
      <p>${esc(fill(T.subjects.intro, { n: C.subjects.length }))}</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="list-grid list-grid--subjects">
        ${C.subjects.map(s => {
          const img = C.subject_images[s.id];
          return `
        <a class="subject-tile${img ? ' subject-tile--photo' : ''}" href="#/subjects/${s.id}">
          <span class="subject-tile__media">${img ? `<img src="${esc(img)}" alt="${esc(s.zh)}" loading="lazy">` : ''}</span>
          <span class="subject-tile__body">
            <span class="tile__num">${esc(s.num)}</span>
            <h3>${esc(s.zh)}</h3>
            <span class="subject-tile__en u-en">${esc(s.en)}</span>
          </span>
          <span class="subject-tile__line" aria-hidden="true"></span>
        </a>`;
        }).join('')}
      </div>
    </div>
  </section>`;
}

/* ─────────── 学科详情正文 ───────────
   顶部标题区：卡片图铺底作背景，专业简介接在英文专业名之后。
   下方统一为黑底区域：01 是 1.1–1.5 细分领域翻页，其余学科为单页学习优势，
   两者复用同一套 .sd-areas / .sd-pager / .sd-page 骨架与界面设计。 */
const subjectPoints = (pts, variant) => `
  <div class="sd-points${variant ? ' ' + variant : ''}">
    ${(pts || []).map((p, i) => `
    <div class="sd-point">
      <span class="sd-point__num">${String(i + 1).padStart(2, '0')}</span>
      <div class="sd-point__body">
        <h4>${esc(p.t)}</h4>
        <p>${esc(p.d)}</p>
      </div>
    </div>`).join('')}
  </div>`;

/* 局部替换舞台内容，不改写 hash，翻页时滚动位置保持不变 */
const SubjectAreas = {
  _list: null,
  _i: 0,
  _multi: false,
  reset() { this._list = null; this._i = 0; this._multi = false; },
  /* 01 取文档中的 5 个细分领域；其余学科由卡片自身构造一个单页领域 */
  items(s) {
    if (s.areas && s.areas.length) return s.areas;
    return [{
      num: s.num, zh: s.zh, en: s.en,
      image: s.portrait || C.subject_images[s.id],
      intro: s.intro, points: s.points
    }];
  },
  render(s) {
    this._list = this.items(s);
    this._i = 0;
    this._multi = this._list.length > 1;
    const m = this._multi;
    return `
  <section class="section sd-areas${m ? '' : ' sd-areas--single'}">
    <div class="wrap">
      <span class="section__eyebrow">${esc(m ? T.subjects.areasEyebrow : T.subjects.whyEyebrow)}</span>
      <h2 class="section__title sd-areas__title">${esc(m ? T.subjects.areasTitle : fill(T.subjects.whyTitle, { name: s.zh }))}</h2>
      ${m ? `<p class="sd-areas__hint">${esc(T.subjects.areasHint)}</p>` : ''}
      <div class="sd-pager" id="sd-area-pager" role="group" tabindex="0" aria-label="${esc(m ? T.subjects.areaNavAria : fill(T.subjects.singleNavAria, { name: s.zh }))}">
        <div class="sd-pager__bar">
          <div class="sd-pager__dots" id="sd-area-dots">${m ? this.dots() : ''}</div>
          <div class="sd-pager__controls">
            ${m ? `
            <span class="sd-pager__counter" id="sd-area-counter" aria-live="polite">${esc(fill(T.subjects.flipCounter, { a: 1, b: this._list.length }))}</span>
            <button type="button" class="sd-flip" aria-label="${esc(T.subjects.flipPrevAria)}" onclick="SubjectAreas.flip(-1)">${esc(T.subjects.flipPrevSym)}</button>
            <button type="button" class="sd-flip" aria-label="${esc(T.subjects.flipNextAria)}" onclick="SubjectAreas.flip(1)">${esc(T.subjects.flipNextSym)}</button>
            ` : `<span class="sd-pager__label">${esc(fill(T.subjects.singleBarLabel, { num: s.num, name: s.zh }))}</span>`}
          </div>
        </div>
        <div class="sd-pager__stage" id="sd-area-stage" aria-live="polite">${this.page(this._list[0])}</div>
      </div>
    </div>
  </section>`;
  },
  dots() {
    return this._list.map((a, i) => `<button type="button" class="sd-dot${i === this._i ? ' is-active' : ''}" aria-label="${esc(fill(T.subjects.areaDotAria, { n: i + 1, t: a.zh }))}"${i === this._i ? ' aria-current="true"' : ''} onclick="SubjectAreas.go(${i})"></button>`).join('');
  },
  page(a) {
    return `
      <div class="sd-page">
        <div class="sd-page__media">${a.image ? `<img src="${esc(a.image)}" alt="${esc(a.zh)}" loading="lazy">` : ''}</div>
        <div class="sd-page__body">
          <div class="sd-page__num">${esc(a.num)}</div>
          <h3>${esc(a.zh)}</h3>
          <div class="sd-page__en u-en">${esc(a.en)}</div>
          ${this._multi ? `<p class="sd-page__intro">${esc(a.intro)}</p>` : ''}
          <div class="sd-page__why">${esc(this._multi ? fill(T.subjects.whyTitle, { name: a.zh }) : T.subjects.whyStageLabel)}</div>
          ${subjectPoints(a.points, 'sd-points--compact')}
        </div>
      </div>`;
  },
  flip(delta) {
    if (!this._multi || !this._list) return;
    this._i = (this._i + delta + this._list.length) % this._list.length;
    this.paint();
  },
  go(i) {
    if (!this._multi || !this._list || i === this._i) return;
    this._i = i;
    this.paint();
  },
  paint() {
    const stage = document.getElementById('sd-area-stage');
    if (!stage || !this._list) return;
    stage.innerHTML = this.page(this._list[this._i]);
    const counter = document.getElementById('sd-area-counter');
    if (counter) counter.textContent = fill(T.subjects.flipCounter, { a: this._i + 1, b: this._list.length });
    document.querySelectorAll('#sd-area-dots .sd-dot').forEach((d, i) => {
      const on = i === this._i;
      d.classList.toggle('is-active', on);
      if (on) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
  }
};

/* 学科详情（对应 UAL subject 页 → course-finder 深链层级） */
function renderSubject(slug) {
  const s = byId(C.subjects, slug);
  if (!s) return renderNotFound();
  SubjectAreas.reset();
  const heroImg = C.subject_images[s.id];
  return `
  <section class="page-hero page-hero--subject">
    ${heroImg ? `<img class="sd-hero__bg" src="${esc(heroImg)}" alt="" aria-hidden="true">` : ''}
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><a href="#/subjects">${esc(T.subjects.crumb)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(s.zh)}</span></div>
      <h1>${esc(s.zh)}</h1>
      <p class="sd-hero__desc"><span class="u-en">${esc(s.en)}</span> — ${esc(s.intro)}</p>
      <div class="level-row">
        ${C.subject_levels.map(l => `<a class="level-tab" href="#/subjects/${s.id}/${l.id}">${esc(l.label)}</a>`).join('')}
      </div>
    </div>
  </section>
  ${SubjectAreas.render(s)}`;
}

/* 次级页面：学历 × 国家筛选 → 院校列表。
   “全部”标签（默认选中）汇总展示所有国家内容；具体国家仅显示对应内容 */
function renderSubjectLevel(slug, levelId, query) {
  const s = byId(C.subjects, slug);
  const level = byId(C.subject_levels, levelId);
  if (!s || !level) return renderNotFound();
  const ALL = T.common.all;
  const country = !query.country || query.country === ALL || !C.school_countries.includes(query.country) ? ALL : query.country;
  const list = country === ALL
    ? C.school_countries.flatMap(ct => (C.school_db[ct] || []).map(sc => ({ ...sc, country: ct })))
    : (C.school_db[country] || []).map(sc => ({ ...sc, country }));
  SCHOOL_CTX = { subject: s, level, country, list };
  const tabHref = ct => `#/subjects/${s.id}/${level.id}` + (ct === ALL ? '' : `?country=${encodeURIComponent(ct)}`);
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><a href="#/subjects">${esc(T.subjects.crumb)}</a><span class="sep">${esc(T.common.crumbSep)}</span><a href="#/subjects/${s.id}">${esc(s.zh)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(level.label)}</span></div>
      <h1>${esc(level.label)}</h1>
      <p>${esc(T.subjects.levelPrefix)}${esc(s.zh)}${esc(T.subjects.levelMid)}${esc(level.label)}${esc(T.subjects.levelSuffix)}</p>
      <div class="level-row">
        ${[ALL].concat(C.school_countries).map(ct => `<a class="level-tab level-tab--sm ${ct === country ? 'is-active' : ''}" href="${tabHref(ct)}">${esc(ct)}</a>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <span class="section__eyebrow">${esc(country)} · ${esc(T.subjects.schoolsEyebrowSuffix)}</span>
      <h2 class="section__title" style="font-size:clamp(22px,2.6vw,34px);">${esc(T.subjects.schoolsTitlePrefix)}${esc(s.zh)}${esc(T.subjects.schoolsTitleSuffix)}</h2>
      <div class="list-grid" style="margin-top:28px;">
        ${list.map((sc, i) => `
        <button class="school-card" onclick="openSchoolDetail(${i})">
          <span class="tile__num">${String(i + 1).padStart(2, '0')}</span>
          <h3>${esc(sc.zh)}</h3>
          <span class="subject-tile__en u-en">${esc(sc.en)}</span>
          <p class="school-card__note">${esc(sc.note)}</p>
          <span class="school-card__meta">${esc(sc.country)} · ${esc(sc.city)} · ${esc(T.common.viewDetail)}</span>
        </button>`).join('')}
      </div>
      <p class="school-note">${esc(T.subjects.schoolNote)}</p>
    </div>
  </section>`;
}

/* 院校详情浮层（叠加处理，层级参照 ftam_demo 院校库：遮罩 + 居中面板 + 吸顶关闭 + 信息盒） */
function openSchoolDetail(idx) {
  if (!SCHOOL_CTX) return;
  const sc = (SCHOOL_CTX.list || [])[idx];
  if (!sc) return;
  const { subject: s, level } = SCHOOL_CTX;
  const infoBox = (label, copy, wide) => `<div class="info-box${wide ? ' info-box--wide' : ''}"><div class="info-box__label">${label}</div><div class="info-box__copy">${copy}</div></div>`;
  const stack = items => `<div class="stack-list">${items.map((t, i) => `<div class="stack-list__item"><span class="stack-list__num">${i + 1}.</span><span>${esc(t)}</span></div>`).join('')}</div>`;
  const programs = stack([
    `${s.zh} ${T.school.majorA}${level.label}${T.school.majorB}`,
    `${s.zh} ${T.school.interDisc}`,
    T.school.shortCourse
  ]);
  const boxes = [
    infoBox(T.school.introTitle, `${esc(sc.note)}${esc(T.school.introSuffix)}`, true),
    infoBox(`${esc(T.school.programsTitle)}${esc(level.label)}`, programs, true),
    infoBox(T.school.reqTitle, esc(T.school.reqCopy)),
    infoBox(T.school.langTitle, esc(T.school.langCopy)),
    infoBox(T.school.tuitionTitle, esc(T.school.tuitionCopy)),
    infoBox(T.school.careerTitle, esc(T.school.careerCopy))
  ].join('');
  document.getElementById('app-overlay').innerHTML = `
    <div class="school-overlay is-open">
      <div class="school-overlay__backdrop" onclick="closeSchoolDetail()"></div>
      <div class="school-overlay__panel">
        <button class="school-overlay__close" onclick="closeSchoolDetail()" aria-label="${esc(T.common.closeAria)}">${esc(T.common.closeSym)}</button>
        <div class="school-overlay__body">
          <div class="school-overlay__eyebrow">${esc(sc.country)} · ${esc(level.label)} · ${esc(T.school.profileSuffix)}</div>
          <h2 class="school-overlay__title">${esc(sc.zh)}</h2>
          <div class="school-overlay__title-en u-en">${esc(sc.en)}</div>
          <p class="school-overlay__meta">${esc(sc.city)} · ${esc(T.school.metaPrefix)}${esc(s.zh)}${esc(T.school.metaSuffix)}</p>
          <div class="info-grid">${boxes}</div>
        </div>
      </div>
    </div>`;
  /* 登记到统一弹层：Esc 关闭 / body 滚动锁 / 关闭后焦点归位由 Modal 统一处理 */
  Modal.open({ el: document.querySelector('.school-overlay'), close: closeSchoolDetail, trigger: document.activeElement });
}
function closeSchoolDetail() {
  const el = document.querySelector('.school-overlay');
  if (el) { Modal.close(el); el.remove(); }
  Modal.sync();
}

/* 细分领域翻页：焦点位于翻页区内时，左右方向键等价于左右按钮 */
document.addEventListener('keydown', e => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const pager = document.getElementById('sd-area-pager');
  if (!pager || !pager.contains(document.activeElement)) return;
  e.preventDefault();
  SubjectAreas.flip(e.key === 'ArrowLeft' ? -1 : 1);
});
