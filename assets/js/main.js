/* ═══════════════════════════════════════════════════════════
   SFK 时尚科系 · Fashion Design — 启动入口
   区块结构 / 层级与跳转关系对照 UAL 官网首页：
   Hero(We are...) → Find a course → Stories(dark) → 学院横幅
   → What's on(dark) → 推广横幅；导航 Subject / Colleges and
   Institutes / [Career·Offer·Instructors·Resources·Student
   Gallery·Timeline·Courses] / Search + 二三级页面层级。

   脚本分层（index.html 加载顺序）：
     data.js            数据层：加载 / 校验 assets/data/*.json + 共享状态与工具
     router.js          hash 路由分发
     components.js      页头 / 页脚 / 返回标签 / 统一弹层
     effects.js         首屏轮播 / 视频带 / 内容带等高
     course-products.js 课程产品分区与详情
     pages/*.js         一视图一文件的渲染器
     main.js            本文件：只做全局绑定与启动

   页面上的全部文字与内容集合均来自 assets/data/*.json。
   ═══════════════════════════════════════════════════════════ */

/* ─────────── 全局事件绑定 ─────────── */
function bindGlobalEvents() {
  /* 课程产品卡：事件委托（页面重渲染后依然生效），点击 / 回车 / 空格 → 展开详情浮层
     首页 Find a Course 卡片（course-card[data-cp-id]）共用同一套展开逻辑 */
  document.addEventListener('click', e => {
    const card = e.target.closest && e.target.closest('.cp-card, .course-card[data-cp-id]');
    if (card) CourseProducts.open(card.getAttribute('data-cp-id'));
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest && e.target.closest('.cp-card, .course-card[data-cp-id]');
    if (!card) return;
    e.preventDefault();
    CourseProducts.open(card.getAttribute('data-cp-id'));
  });
  /* Offer 院校卡：点击原地展开 / 收起档案卡（事件委托，路由重渲染后依然生效） */
  document.addEventListener('click', e => {
    const card = e.target.closest && e.target.closest('.offer-card--clickable');
    if (card) OfferSection.toggleCard(card.getAttribute('data-school'));
  });
  /* Offer 院校卡：键盘可达（Enter / 空格） */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest && e.target.closest('.offer-card--clickable');
    if (!card) return;
    e.preventDefault();
    OfferSection.toggleCard(card.getAttribute('data-school'));
  });
  /* 视口变化时重算整行折叠（展开态不干预） */
  window.addEventListener('resize', () => {
    if (document.getElementById('offers-grid') && !OfferSection._expanded) OfferSection.clamp();
  });
  ScrollMemory.init();
  window.addEventListener('hashchange', route);
}

/* ─────────── 启动异常提示：文案写在 index.html 的静态块里，
   保证在数据层不可用时（file:// / 取数失败）依然能显示 ─────────── */
function showBootNotice(id, detail) {
  ['app-header', 'app-main', 'app-back', 'app-overlay', 'app-footer'].forEach(host => {
    const el = document.getElementById(host);
    if (el) el.hidden = true;
  });
  const notice = document.getElementById(id);
  if (notice) notice.hidden = false;
  /* 具体失败原因（缺文件 / HTTP 状态 / 结构异常）追加在提示块末尾，便于排查 */
  const slot = document.getElementById(id + '-detail');
  if (slot) {
    const text = detail ? String(detail) : '';
    slot.textContent = text;
    slot.hidden = !text;
  }
}

/* ─────────── 启动：先校验协议并加载数据层，再渲染 ─────────── */
(async () => {
  try {
    await DATA.load();
  } catch (err) {
    console.error(err);
    /* file:// 下的失败一律归因为「本地镜像不可用」；HTTP 下为「取数失败」 */
    const isFile = location.protocol === 'file:';
    const noticeId = (isFile || (err && err.code === 'EBUNDLE')) ? 'boot-notice-bundle' : 'boot-notice-load';
    showBootNotice(noticeId, err && err.message ? err.message : '');
    return;
  }
  SITE = DATA.site;
  C = SITE.data;
  T = SITE.ui;
  Header.build();
  Footer.build();
  bindGlobalEvents();
  route();
})();
