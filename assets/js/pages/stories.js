/* ═══════════════════════════════════════════════════════════
   VIEW · 故事（#/stories、#/stories/<slug>）
═══════════════════════════════════════════════════════════ */
/* ─────────── Stories 聚合页 / 详情 ─────────── */
function renderStoriesIndex() {
  const all = [...C.stories, ...(C.stories_more || [])];
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(T.stories.crumb)}</span></div>
      <h1>${esc(T.stories.crumb)}</h1>
      <p>${esc(T.storiesIndex.intro)}</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="story-grid">
        ${all.map(s => `
        <a class="story-card" href="#/stories/${esc(s.slug)}">
          ${s.video ? `<video class="story-card__media" src="${esc(s.video)}" muted playsinline preload="metadata"></video>` : ph(s.tag)}
          <span class="story-card__tag">${esc(s.tag)}</span>
          <h3>${esc(s.zh)}</h3>
          ${s.date ? `<p class="story-card__date">${esc(s.date)}</p>` : ''}
        </a>`).join('')}
      </div>
    </div>
  </section>`;
}

function renderStory(slug) {
  const s = [...C.stories, ...(C.stories_more || [])].find(x => x.slug === slug);
  if (!s) return renderNotFound();
  return `
  <section class="section story-page">
    <div class="wrap">
      ${s.video
        ? `<div class="story-video-wrap"><video class="story-detail__video" src="${esc(s.video)}" controls preload="metadata" playsinline></video></div>`
        : ph(s.tag)}
      <div class="story-detail">
        <h1>${esc(s.zh)}</h1>
        ${s.sub ? `<p class="story-detail__sub">${esc(s.sub)}</p>` : ''}
        ${s.tag ? `<div class="story-detail__tags">${esc(s.tag)}</div>` : ''}
      </div>
      <div class="story-body">${s.body ? esc(s.body) : `<p class="placeholder-note">${esc(T.storyDetail.bodyPlaceholder)}</p>`}</div>
    </div>
  </section>`;
}
