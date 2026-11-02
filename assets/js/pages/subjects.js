/* ═══════════════════════════════════════════════════════════
   VIEW · 学科（#/subjects、#/subjects/<slug>、#/subjects/<slug>/<level>?country=）
   三级下钻：学科 → 学历 → 国家 → 院校详情浮层
═══════════════════════════════════════════════════════════ */
/* 院校详情浮层的当前上下文（学科 / 学历 / 国家） */
/* 院校详情浮层的当前上下文（学科 / 学历 / 国家） */
let SCHOOL_CTX = null;

/* ─────────── Subjects（对应 UAL /subjects 一级） ─────────── */
function renderSubjects() {
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(T.subjects.crumb)}</span></div>
      <h1>${esc(T.subjects.crumb)}</h1>
      <p>${esc(T.subjects.intro)}</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="list-grid">
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

/* 学科详情（对应 UAL subject 页 → course-finder 深链层级） */
function renderSubject(slug) {
  const s = byId(C.subjects, slug);
  if (!s) return renderNotFound();
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><a href="#/subjects">${esc(T.subjects.crumb)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(s.zh)}</span></div>
      <h1>${esc(s.zh)}</h1>
      <p class="u-en">${esc(s.en)} — ${esc(T.subjects.enDesc)}</p>
      <div class="level-row">
        ${C.subject_levels.map(l => `<a class="level-tab" href="#/subjects/${s.id}/${l.id}">${esc(l.label)}</a>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <span class="section__eyebrow">${esc(T.subjects.overviewEyebrow)}</span>
      <h2 class="section__title" style="font-size:clamp(22px,2.6vw,34px);">${esc(T.subjects.overviewTitle)}</h2>
      <div class="placeholder-note" style="margin-top:24px;">
        <h2>${esc(T.subjects.phTitlePrefix)}${esc(s.zh)}${esc(T.subjects.phTitleSuffix)}</h2>
        <p>${esc(T.subjects.phBody)}</p>
      </div>
    </div>
  </section>`;
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
