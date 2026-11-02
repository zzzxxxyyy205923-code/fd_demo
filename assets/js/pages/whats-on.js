/* ═══════════════════════════════════════════════════════════
   VIEW · 活动（#/whats-on、#/whats-on/<slug>）
═══════════════════════════════════════════════════════════ */
/* ─────────── What's on 聚合页 / 详情 ─────────── */
function renderWhatsOnIndex() {
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(T.whatsOn.crumb)}</span></div>
      <h1>${esc(T.whatsOn.crumb)}</h1>
      <p>${esc(T.whatsOnIndex.intro)}</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="story-grid">
        ${C.events.map(e => `
        <a class="story-card" href="#/whats-on/${esc(e.slug)}">
          ${ph(T.whatsOn.eventTag)}
          <span class="story-card__tag">${esc(T.whatsOn.eventTag)}</span>
          <h3>${esc(e.zh)}</h3>
        </a>`).join('')}
      </div>
    </div>
  </section>`;
}

function renderEvent(slug) {
  const e = C.events.find(x => x.slug === slug);
  if (!e) return renderNotFound();
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><a href="#/whats-on">${esc(T.whatsOn.crumb)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(e.zh)}</span></div>
      <h1 style="font-size:clamp(24px,3.2vw,44px);">${esc(e.zh)}</h1>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="placeholder-note">
        <h2>${esc(T.eventDetail.phTitle)}</h2>
        <p>${esc(T.eventDetail.phBodyPrefix)}<span class="u-en">/whats-on/${esc(e.slug)}</span>${esc(T.eventDetail.phBodySuffix)}</p>
      </div>
    </div>
  </section>`;
}
