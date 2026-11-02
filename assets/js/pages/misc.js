/* ═══════════════════════════════════════════════════════════
   VIEW · 占位页（导航中未接入的板块）与 404
═══════════════════════════════════════════════════════════ */
/* ─────────── 新增导航占位页 ─────────── */
function renderPlaceholder(view) {
  const it = C.nav_main.find(x => x.id === view) || { id: view, label: view, en: view };
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(it.label)}</span></div>
      <h1>${esc(it.label)}</h1>
      <p class="u-en">${esc(it.en)}</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="placeholder-note">
        <h2>${esc(T.placeholderPage.titlePrefix)}${esc(it.label)}${esc(T.placeholderPage.titleSuffix)}</h2>
        <p>${esc(T.placeholderPage.bodyPrefix)}<span class="u-en">/${esc(it.id)}</span>${esc(T.placeholderPage.bodySuffix)}</p>
      </div>
    </div>
  </section>`;
}

function renderNotFound() {
  return `
  <section class="page-hero"><div class="wrap"><h1>${esc(T.notFound.code)}</h1><p>${esc(T.notFound.title)}<a href="#/home" style="color:var(--pink-soft);">${esc(T.notFound.back)}</a></p></div></section>`;
}
