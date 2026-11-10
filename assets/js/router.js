/* ═══════════════════════════════════════════════════════════
   ROUTER — 单页 hash 路由：全部视图在当前文档内切换
   与 art-humanities_demo 的 router.js 同层：解析地址 → 分发构建 → 同步导航态
   视图构建器（PAGES）分别在 assets/js/pages/*.js 中实现
═══════════════════════════════════════════════════════════ */

/* ─────────── 路由（hash） ─────────── */
function parseHash() {
  const h = location.hash.replace(/^#\/?/, '') || 'home';
  const [pathPart, queryPart] = h.split('?');
  const segs = pathPart.split('/').filter(Boolean);
  const query = {};
  (queryPart || '').split('&').forEach(kv => {
    if (!kv) return;
    const [k, v = ''] = kv.split('=');
    query[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
  });
  return { segs, query, raw: h };
}

/* ─────────── 滚动位置记忆 ───────────
   站内链接跳转：新页面一律回顶（既有行为）
   前进 / 后退：还原该条历史离开时的位置（sessionStorage 按 hash 记录）
   刷新：按「新页面」处理，回顶 */
const ScrollMemory = {
  KEY: 'fd-scroll:',
  _last: null,
  _pop: false,
  init() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.addEventListener('popstate', () => { this._pop = true; });
  },
  read(hash) {
    try {
      const v = sessionStorage.getItem(this.KEY + hash);
      return v == null ? null : Number(v);
    } catch (e) { return null; }
  },
  save(hash, y) {
    try { sessionStorage.setItem(this.KEY + hash, String(Math.round(y || 0))); } catch (e) {}
  }
};

/* ─────────── 路由分发 ─────────── */
function route() {
  const { segs, query } = parseHash();
  const [a, b, c] = segs;
  let view = a || 'home';
  let html;

  /* 渲染前记录「即将离开的视图」的滚动位置；后退时取出目标视图的位置 */
  const here = location.hash || '#/home';
  if (ScrollMemory._last && ScrollMemory._last !== here) {
    ScrollMemory.save(ScrollMemory._last, window.scrollY);
  }
  const restoreY = ScrollMemory._pop ? ScrollMemory.read(here) : null;
  ScrollMemory._pop = false;
  ScrollMemory._last = here;

  if (!a || a === 'home') { view = 'home'; html = renderHome(); }
  else if (a === 'subjects' && !b) html = renderSubjects();
  else if (a === 'subjects' && b && c) { view = 'subjects'; html = renderSubjectLevel(b, c, query); }
  else if (a === 'subjects') { view = 'subjects'; html = renderSubject(b); }
  else if (a === 'colleges' && !b) html = renderColleges();
  else if (a === 'colleges') { view = 'colleges'; html = renderCollege(b, c); }
  else if (a === 'courses') { view = 'courses'; html = renderCourses(query); }
  else if (a === 'stories' && !b) html = renderStoriesIndex();
  else if (a === 'stories') { view = 'stories'; html = renderStory(b); }
  else if (a === 'whats-on' && !b) html = renderWhatsOnIndex();
  else if (a === 'whats-on') { view = 'whats-on'; html = renderEvent(b); }
  else if (a === 'offer') { view = 'offer'; html = OfferSection.page(); }
  else if (a === 'resources') { view = 'resources'; html = renderResources(); }
  else if (a === 'search') { view = 'search'; html = renderSearch(query); }
  else if (C.nav_main.some(x => x.id === a)) html = renderPlaceholder(a);
  else html = renderNotFound();

  document.getElementById('app-main').innerHTML = html;
  Header.markActive(view);
  /* 次级页面及下属层级：导航栏统一白底黑字（on-sub）；主页保持透明轮播叠加逻辑 */
  document.getElementById('navbar')?.classList.toggle('on-sub', view !== 'home');
  closeSchoolDetail();
  CourseProducts.close();
  BackTab.render(a && a !== 'home' ? (c ? `#/${a}/${b}` : (b ? `#/${a}` : '#/home')) : '');
  if (view === 'home') { HeroCarousel.mount(C.hero_slides); StoriesReel.mount(C.stories); requestAnimationFrame(equalizeHomeBands); } else { HeroCarousel.stop(); StoriesReel.stop(); }
  if (view === 'offer') OfferSection.init();
  if (view === 'resources') ResourcesSection.init(); else ResourcesSection.stop();
  if (restoreY != null) {
    requestAnimationFrame(() => window.scrollTo(0, restoreY));   /* 后退：回到离开时的位置 */
  } else if (!location.hash.includes('#/home') || segs.length) {
    window.scrollTo(0, 0);                                       /* 站内跳转：新页面从顶部开始 */
  }
}
