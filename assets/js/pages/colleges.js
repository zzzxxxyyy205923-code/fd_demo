/* ═══════════════════════════════════════════════════════════
   VIEW · 学院与研究所（#/colleges、#/colleges/<slug>[/<section>]）
═══════════════════════════════════════════════════════════ */
/* ─────────── Colleges and Institutes（对应 UAL /colleges 一级） ─────────── */
function renderColleges() {
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(T.colleges.crumb)}</span></div>
      <h1>${esc(T.colleges.crumb)}</h1>
      <p>${esc(T.colleges.intro)}</p>
    </div>
  </section>
  <section class="section college-banner">
    <div class="wrap">
      <div class="college-banner__head">
        <span class="section__eyebrow">${esc(T.colleges.eyebrow)}</span>
        <h2 class="section__title" style="font-size:clamp(22px,2.6vw,34px);">${esc(T.colleges.title)}</h2>
      </div>
      <div class="college-banner__grid">
        ${C.colleges.map(c => `
        <a class="college-card" href="#/colleges/${c.id}">
          <h3>${esc(c.zh)}</h3>
          <div class="college-card__en u-en">${esc(c.en)}</div>
        </a>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <span class="section__eyebrow">${esc(T.colleges.instEyebrow)}</span>
      <h2 class="section__title" style="font-size:clamp(22px,2.6vw,34px);">${esc(T.colleges.instTitle)}</h2>
      <div class="list-grid" style="margin-top:28px;">
        ${C.institutes.map(i => `
        <a class="tile" href="#/colleges/${i.id}">
          <h3>${esc(i.zh)}</h3>
          <p class="u-en">${esc(i.en)}</p>
        </a>`).join('')}
      </div>
    </div>
  </section>`;
}

/* 学院详情（对应 UAL college 页的 Courses / About / What's on / Stories 子层级） */
function renderCollege(slug, sub) {
  const c = byId([...C.colleges, ...C.institutes], slug);
  if (!c) return renderNotFound();
  const base = `#/colleges/${c.id}`;
  const sec = C.college_sections.find(x => x.id === (sub || 'about')) || {};
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><a href="#/colleges">${esc(T.colleges.crumbShort)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(c.zh)}</span></div>
      <h1>${esc(c.zh)}</h1>
      <p class="u-en">${esc(c.en)}</p>
      <div class="subnav">
        ${C.college_sections.map(s => `<a href="${base}${s.id === 'about' ? '' : '/' + s.id}">${esc(s.en)}</a>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="placeholder-note">
        <h2>${esc(T.common.placeholderPrefix)}${esc(c.zh)} · ${esc(sec.zh || T.colleges.detailDefaultSection)}</h2>
        <p>${esc(sub ? T.colleges.detailPhBodySub : T.colleges.detailPhBody)}${esc(T.colleges.detailLevelNote)}<span class="u-en">/colleges/{college}/${esc(sub || '')}</span>${esc(T.colleges.detailLevelNoteSuffix)}</p>
      </div>
    </div>
  </section>`;
}
