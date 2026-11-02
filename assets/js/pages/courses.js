/* ═══════════════════════════════════════════════════════════
   VIEW · 课程产品页（#/courses）
   分区与详情由 assets/js/course-products.js 渲染
═══════════════════════════════════════════════════════════ */
/* ─────────── Courses：课程产品（页面结构 / 信息层级 / 点击展开逻辑复用 art-humanities_demo「课程产品」） ─────────── */
function renderCourses() {
  const d = DATA.courseProducts;
  if (!d) return renderPlaceholder('courses');
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">${esc(T.common.home)}</a><span class="sep">${esc(T.common.crumbSep)}</span><span>${esc(T.courses.crumb)}</span></div>
      <h1>${esc(d.hero.title)}</h1>
      <p>${esc(d.hero.sub)}</p>
      <div class="level-row" id="cp-level-bar">
        ${T.courses.levels.map(lv =>
          `<button class="level-tab level-tab--sm${CourseProducts._level === lv.id ? ' is-active' : ''}" type="button" data-level="${esc(lv.id)}" onclick="CourseProducts.setLevel('${esc(lv.id)}')">${esc(lv.label)}</button>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div id="cp-zones">${CourseProducts.zonesHtml()}</div>
    </div>
  </section>`;
}
