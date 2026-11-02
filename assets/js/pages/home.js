/* ═══════════════════════════════════════════════════════════
   VIEW · 首页（#/home）
   Hero 轮播 → Find a course → Stories → What's on
   文案与内容来自 assets/data/site-content.json（data + ui）
═══════════════════════════════════════════════════════════ */
/* ─────────── 首页（区块顺序对照 UAL 官网） ───────────
   ① Hero：We are SFK Fashion Design（对应 UAL「We are University of the Arts London」位置）
   ② Find a course（对应 UAL card-grid-container 位置）
   ③ Stories（全屏视频轮播：内嵌视频逐个循环播放，标题浮层覆盖于画面之上）
   ④ What's on（浅色带：延续主页深浅交替节奏） */
function renderHome() {
  return `
  <section class="hero">
    <div class="hero__carousel" aria-hidden="true"><div class="hero__track" id="hero-track"></div></div>
    <button class="hero-nav hero-nav--prev" onclick="HeroCarousel.prev()" aria-label="${esc(T.hero.prevAria)}">&lt;</button>
    <button class="hero-nav hero-nav--next" onclick="HeroCarousel.next()" aria-label="${esc(T.hero.nextAria)}">&gt;</button>
    <span class="hero__veil" aria-hidden="true"></span>
    <div class="hero__content">
      <h1>${T.hero.titleHtml}</h1>
      <p class="hero__sub">${esc(T.hero.sub)}</p>
      <div class="hero__quick">
        ${C.hero_quick.map(q => `<a href="${esc(q.href)}">${esc(q.label)}</a>`).join('')}
      </div>
    </div>
    <button class="hero-scroll" onclick="HeroCarousel.scrollNext()" aria-label="${esc(T.hero.scrollAria)}"><span class="hero-scroll__sym" aria-hidden="true">${esc(T.hero.scrollSym)}</span></button>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="section__head">
        <div>
          <span class="section__eyebrow">${esc(T.findCourse.eyebrow)}</span>
          <h2 class="section__title">${esc(T.findCourse.title)}</h2>
        </div>
        <a class="more-link" href="#/courses">${esc(T.findCourse.more)} <span class="arr">→</span></a>
      </div>
      <div class="card-grid">
        ${C.home_courses.map((id, i) => {
          const cp = DATA.courseProducts || {};
          const p = (cp.longform || []).concat(cp.catalog || []).filter(x => x.id === id)[0];
          if (!p) return '';
          return `
        <div class="course-card" role="button" tabindex="0" data-cp-id="${esc(p.id)}" aria-label="${esc(p.meta.titleCn)}">
          ${ph(T.common.courseLabelPrefix + (i + 1))}
          <h3>${esc(p.meta.titleCn)}</h3>
          <div class="course-card__en u-en">${esc(p.meta.titleEn)}</div>
          <span class="subject-tile__line" aria-hidden="true"></span>
        </div>`;
        }).join('')}
      </div>
    </div>
  </section>

  ${(() => {
    const reelList = C.stories.filter(s => s.video);
    if (!reelList.length) return `
  <section class="section band--dark">
    <div class="wrap">
      <div class="section__head">
        <div>
          <span class="section__eyebrow">${esc(T.stories.eyebrow)}</span>
          <h2 class="section__title">${esc(T.stories.title)}</h2>
        </div>
        <a class="more-link" href="#/stories">${esc(T.stories.more)} <span class="arr">→</span></a>
      </div>
      <div class="story-grid">
        ${C.stories.map(s => `
        <a class="story-card" href="#/stories/${esc(s.slug)}">
          ${ph(s.tag)}
          <span class="story-card__tag">${esc(s.tag)}</span>
          <h3>${esc(s.zh)}</h3>
          ${s.date ? `<p class="story-card__date">${esc(s.date)}</p>` : ''}
        </a>`).join('')}
      </div>
    </div>
  </section>`;
    return `
  <section class="stories-reel">
    <video id="stories-reel-video" class="stories-reel__video" src="${esc(reelList[0].video)}" muted autoplay loop playsinline preload="auto"></video>
    <div class="stories-reel__veil" aria-hidden="true"></div>
    <div class="stories-reel__head">
      <div class="wrap stories-reel__inner">
        <span class="section__eyebrow">${esc(T.stories.eyebrow)}</span>
        <h2 class="section__title">${esc(T.stories.title)}</h2>
        <a class="stories-reel__cta" href="#/stories">${esc(T.stories.cta)}</a>
      </div>
    </div>
  </section>`;
  })()}

  <section class="section band--light">
    <div class="wrap">
      <div class="section__head">
        <div>
          <span class="section__eyebrow">${esc(T.whatsOn.eyebrow)}</span>
          <h2 class="section__title">${esc(T.whatsOn.title)}</h2>
        </div>
        <a class="more-link" href="#/whats-on">${esc(T.whatsOn.more)} <span class="arr">→</span></a>
      </div>
      <div class="story-grid">
        ${C.events.slice(0, 3).map(e => `
        <a class="story-card" href="#/whats-on/${esc(e.slug)}">
          ${ph(T.whatsOn.eventTag)}
          <span class="story-card__tag">${esc(T.whatsOn.eventTag)}</span>
          <h3>${esc(e.zh)}</h3>
        </a>`).join('')}
      </div>
    </div>
  </section>`;
}
