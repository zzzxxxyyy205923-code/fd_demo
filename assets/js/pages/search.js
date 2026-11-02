/* ═══════════════════════════════════════════════════════════
   VIEW · 搜索（#/search?in=&query=）
═══════════════════════════════════════════════════════════ */
/* ─────────── Search（对应 UAL /search?in=&query= 及 scope 子路由） ─────────── */
function renderSearch(query) {
  const scopes = T.search.scopes;
  const scope = scopes.some(s => s.id === query.in) ? query.in : (scopes[0] || {}).id;
  const q = query.query || '';
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(T.search.crumb)}</span></div>
      <h1 style="font-size:clamp(24px,3.2vw,44px);">${esc(T.search.crumb)}</h1>
      <div class="level-row">
        ${scopes.map(s => `<a class="chip ${s.id === scope ? 'is-active' : ''}" href="#/search?in=${encodeURIComponent(s.id)}&query=${encodeURIComponent(q)}">${esc(s.label)}</a>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      ${q ? `
      <div class="result-item">
        <h3>${esc(T.search.resultTitlePrefix)}${esc(q)}${esc(T.search.resultTitleMid)}<span class="u-en">${esc(scope)}</span>${esc(T.search.resultTitleSuffix)}</h3>
        <span class="url u-en">/search?in=${esc(scope)}&query=${encodeURIComponent(q)}</span>
        <p>${esc(T.search.resultDesc)}</p>
      </div>` : `
      <div class="result-empty">${esc(T.search.emptyPrefix)}<span class="u-en">${esc(scope)}</span>${esc(T.search.emptySuffix)}</div>`}
    </div>
  </section>`;
}
