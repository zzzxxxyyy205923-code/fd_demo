/* ═══════════════════════════════════════════════════════════
   SFK 时尚科系 · Fashion Design
   区块结构 / 层级与跳转关系对照 UAL 官网首页：
   Hero(We are...) → Find a course → Stories(dark) → 学院横幅
   → What's on(dark) → 推广横幅；导航 Subject / Colleges and
   Institutes / [Career·Offer·Instructors·Resources·Student
   Gallery·Timeline·Courses] / Search + 二三级页面层级。
   页脚参照 art-humanities_demo。
   ═══════════════════════════════════════════════════════════ */

/* ─────────── 数据（图片均为占位符，后期替换） ─────────── */
const META = {
  brand: 'SFK · 时尚科系',
  logo: 'assets/img/brand/logo-fashion.png',
  subtitle: 'SFK 时尚科系 — 覆盖时装设计、时尚商业、时尚传媒、纺织材料等方向的升学规划、作品集指导与案例展示。',
  footer: { contact: { email: 'fashion@sfk.example.com', tel: '+86 400-000-0000' }, copyright: '© 2026 SFK 时尚科系 · Fashion Design. All rights reserved.' }
};

const NAV_MAIN = [
  { id: 'subjects',    label: 'Subject',                   en: 'Subject' },
  { id: 'colleges',    label: 'Colleges and Institutes',   en: 'Colleges & Institutes' },
  { id: 'career',      label: 'Career',                    en: 'Career',        placeholder: true },
  { id: 'offer',       label: 'Offer',                     en: 'Offer',         placeholder: true },
  { id: 'instructors', label: 'Instructors',               en: 'Instructors',   placeholder: true },
  { id: 'resources',   label: 'Resources',                 en: 'Resources',     placeholder: true },
  { id: 'student-gallery', label: 'Student Gallery',       en: 'Student Gallery', placeholder: true },
  { id: 'timeline',    label: 'Timeline',                  en: 'Timeline',      placeholder: true },
  { id: 'courses',     label: 'Courses',                   en: 'Courses' }
];

const HERO_QUICK = [
  { label: 'Apply',            href: '#/offer' },
  { label: 'Open days',        href: '#/whats-on' },
  { label: 'Student gallery',  href: '#/student-gallery' },
  { label: 'Career',           href: '#/career' }
];

/* 首页 Find a Course 四个课程模块 → 课程产品条目 ID（标题/简介/链接与其保持一致） */
const HOME_COURSES = ['changemakers-ug', 'longform2', 'summerwinter', 'internship'];

const COURSE_LEVELS = [
  { id: 'undergraduate', label: 'Undergraduate', zh: '本科' },
  { id: 'postgraduate',  label: 'Postgraduate',  zh: '研究生' },
  { id: 'pre-degree',    label: 'Pre-degree',    zh: '预科' },
  { id: 'short-course',  label: 'Short Courses', zh: '短期课程' }
];

/* 学科（对应 UAL Subjects 一级 20 个学科页） */
const SUBJECTS = [
  ['fashion-design',            '时装设计',          'Fashion Design'],
  ['textiles-and-materials',    '纺织与材料',        'Textiles & Materials'],
  ['fashion-business',          '时尚商业与管理',    'Fashion Business & Management'],
  ['fashion-communication',     '时尚传媒',          'Fashion Communication'],
  ['fashion-styling',           '时尚造型与妆发',    'Fashion Styling & Make-up'],
  ['accessories-footwear-jewellery', '配饰鞋履与珠宝', 'Accessories, Footwear & Jewellery'],
  ['fashion-making',            '服装制版与工艺',    'Fashion Making & Pattern Cutting'],
  ['digital-fashion',           '数字时尚与虚拟时装', 'Digital & Virtual Fashion'],
  ['fashion-photography',       '时尚摄影',          'Fashion Photography'],
  ['fashion-film',              '时尚影像与短片',    'Fashion Film'],
  ['fashion-marketing',         '时尚营销',          'Fashion Marketing'],
  ['luxury-brand-management',   '奢侈品管理',        'Luxury Brand Management'],
  ['fashion-journalism',        '时尚新闻与出版',    'Fashion Journalism & Publishing'],
  ['performance-costume',       '戏剧影视服装设计',  'Performance & Costume Design'],
  ['knitwear',                  '针织设计',          'Knitwear Design'],
  ['footwear-design',           '鞋履设计',          'Footwear Design'],
  ['jewellery-design',          '珠宝设计',          'Jewellery Design'],
  ['beauty-industry',           '美妆产业管理',      'Beauty Industry Management'],
  ['fashion-tech-ai',           '时尚科技与 AI',     'Fashion Tech & AI'],
  ['sustainable-fashion',       '可持续时尚',        'Sustainable Fashion']
].map(([id, zh, en], i) => ({ id, zh, en, num: String(i + 1).padStart(2, '0') }));

/* 学科标签配图（当前仅"01 时装设计"置入照片，其余标签暂不置入） */
const SUBJECT_IMAGES = { 'fashion-design': 'assets/img/subjects/fashion-design.jpeg' };

/* Subject 详情页学历标签（名称按要求：本科 / 研究生 / 全日制 / 1+2） */
const SUBJECT_LEVELS = [
  { id: 'undergraduate', label: '本科' },
  { id: 'postgraduate',  label: '研究生' },
  { id: 'fulltime',      label: '全日制' },
  { id: 'oneplus2',      label: '1+2' }
];

/* 次级页面国家/地区筛选维度 */
const SCHOOL_COUNTRIES = ['美国', '英国', '港新澳', '欧洲', '日韩'];

/* 院校库（示例名单，可按申请季增补替换） */
const SCHOOL_DB = {
  '美国': [
    { zh: '帕森斯设计学院', en: 'Parsons School of Design', city: '纽约', note: '全美艺术设计顶尖，时装设计王牌方向' },
    { zh: '罗德岛设计学院', en: 'Rhode Island School of Design', city: '普罗维登斯', note: '纯艺与设计并重的顶尖美院' },
    { zh: '纽约时装学院', en: 'Fashion Institute of Technology', city: '纽约', note: '时装技术与产业资源深厚' },
    { zh: '芝加哥艺术学院', en: 'School of the Art Institute of Chicago', city: '芝加哥', note: '跨学科实验性突出' },
    { zh: '普瑞特艺术学院', en: 'Pratt Institute', city: '纽约布鲁克林', note: '设计与建筑传统名校' },
    { zh: '加州艺术学院', en: 'California Institute of the Arts', city: '洛杉矶', note: '实验艺术与影像强校' }
  ],
  '英国': [
    { zh: '伦敦艺术大学', en: 'University of the Arts London', city: '伦敦', note: '全球艺术设计顶尖，六院联合体' },
    { zh: '皇家艺术学院', en: 'Royal College of Art', city: '伦敦', note: '研究生阶段全球第 1 的艺术设计学院' },
    { zh: '金史密斯学院', en: 'Goldsmiths, University of London', city: '伦敦', note: '实验性与批判性著称' },
    { zh: '格拉斯哥美术学院', en: 'Glasgow School of Art', city: '格拉斯哥', note: '苏格兰老牌美术学院' },
    { zh: '利兹大学', en: 'University of Leeds', city: '利兹', note: '设计与材料研究见长' }
  ],
  '港新澳': [
    { zh: '香港理工大学', en: 'The Hong Kong Polytechnic University', city: '香港', note: '设计学院亚洲领先' },
    { zh: '新加坡拉萨尔艺术学院', en: 'LASALLE College of the Arts', city: '新加坡', note: '东南亚当代艺术重镇' },
    { zh: '南洋艺术学院', en: 'Nanyang Academy of Fine Arts', city: '新加坡', note: '应用艺术与实践导向' },
    { zh: '皇家墨尔本理工大学', en: 'RMIT University', city: '墨尔本', note: '澳洲设计第一梯队' },
    { zh: '新南威尔士大学', en: 'UNSW Sydney', city: '悉尼', note: '综合名校中的艺术设计强校' }
  ],
  '欧洲': [
    { zh: '马兰戈尼学院', en: 'Istituto Marangoni', city: '米兰 / 巴黎 / 伦敦', note: '时尚产业资源与行业网络深厚' },
    { zh: '安特卫普皇家艺术学院', en: 'Royal Academy of Fine Arts Antwerp', city: '安特卫普', note: '安特卫普六君子发源地' },
    { zh: 'ESMOD 高级时装艺术学院', en: 'ESMOD Paris', city: '巴黎', note: '世界首所时装学院' },
    { zh: '米兰理工大学', en: 'Politecnico di Milano', city: '米兰', note: '设计与工程结合见长' },
    { zh: '柏林魏森湖艺术学院', en: 'Weißensee Kunsthochschule Berlin', city: '柏林', note: '欧洲实验设计前沿' }
  ],
  '日韩': [
    { zh: '文化服装学院', en: 'Bunka Fashion College', city: '东京', note: '日本时装教育最高学府' },
    { zh: '武藏野美术大学', en: 'Musashino Art University', city: '东京', note: '日本顶级私立美术大学' },
    { zh: '多摩美术大学', en: 'Tama Art University', city: '东京', note: '日本顶级私立美术大学' },
    { zh: '女子美术大学', en: 'Joshibi University of Art and Design', city: '东京', note: '工艺与时尚表现见长' },
    { zh: '弘益大学', en: 'Hongik University', city: '首尔', note: '韩国艺术设计第一学府' }
  ]
};

/* 院校详情浮层的当前上下文（学科 / 学历 / 国家） */
let SCHOOL_CTX = null;

/* 学院（对应 UAL「6 Colleges, 1 University」横幅与 Colleges 页） */
const COLLEGES = [
  { id: 'school-of-fashion-design',     zh: '时装设计学院',     en: 'School of Fashion Design' },
  { id: 'school-of-fashion-business',   zh: '时尚商学院',       en: 'School of Fashion Business' },
  { id: 'school-of-fashion-communication', zh: '时尚传媒学院',  en: 'School of Fashion Communication' },
  { id: 'school-of-textiles',           zh: '纺织与材料学院',   en: 'School of Textiles & Materials' },
  { id: 'school-of-accessories',        zh: '配饰与珠宝学院',   en: 'School of Accessories & Jewellery' },
  { id: 'school-of-fashion-tech',       zh: '时尚科技学院',     en: 'School of Fashion Tech' }
];

/* 研究所（对应 UAL Colleges 页 Institutes 部分） */
const INSTITUTES = [
  { id: 'fashion-research-institute', zh: '时尚研究院',       en: 'Fashion Research Institute' },
  { id: 'sustainable-fashion-centre', zh: '可持续时尚中心',   en: 'Sustainable Fashion Centre' },
  { id: 'digital-fashion-lab',        zh: '数字时尚实验室',   en: 'Digital Fashion Lab' },
  { id: 'fashion-curation-institute', zh: '时尚策展研究所',   en: 'Fashion Curation Institute' },
  { id: 'pre-degree-school',          zh: '预科教学中心',     en: 'School of Pre-degree Studies' }
];

/* 学院子页面（对应 UAL college 页 courses/about/whats-on/stories 层级） */
const COLLEGE_SECTIONS = [
  { id: 'courses',   zh: '课程',   en: 'Courses' },
  { id: 'about',     zh: '学院介绍', en: 'About' },
  { id: 'whats-on',  zh: '活动',   en: "What's on" },
  { id: 'stories',   zh: '故事',   en: 'Stories' }
];

/* Stories（对应 UAL 首页 Stories 区块，含 See more → 聚合页） */
const STORIES = [
  { tag: 'STORY', zh: '2026 时尚毕设大秀：新生代的剪裁语言', slug: 'graduate-show-2026' },
  { tag: 'STORY', zh: '从 SKP 到巴黎：一位时尚管理学生的实习之路', slug: 'internship-paris' },
  { tag: 'STORY', zh: '数字时装周：虚拟服装如何走上秀场', slug: 'digital-fashion-week' }
];
const STORIES_MORE = [
  { tag: 'ALUMNI', zh: '校友故事：LVMH 面料创新岗位的一天', slug: 'alumni-lvmh' },
  { tag: 'STORY',  zh: '可持续材料的 12 次实验', slug: 'sustainable-materials' }
];

/* What's on（对应 UAL 首页 What's on 区块） */
const EVENTS = [
  { zh: '时尚科系开放日：作品集面对面', slug: 'open-day-portfolio' },
  { zh: '大师工作坊：立体剪裁入门', slug: 'workshop-draping' },
  { zh: '行业讲座：买手与陈列的商业逻辑', slug: 'talk-buying-merchandising' },
  { zh: '学生作品展：纤维与身体', slug: 'exhibition-fibre-body' },
  { zh: '申请季答疑：研究生作品集策略', slug: 'qa-postgraduate-portfolio' },
  { zh: '暑期短课发布：时尚摄影入门', slug: 'short-course-photography' }
];

/* ─────────── 工具 ─────────── */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = (arr, id) => arr.find(x => x.id === id);
const ph = (label = 'IMAGE') => `<div class="story-card__ph">${esc(label)} · 占位图</div>`;

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

/* ─────────── 页头 ─────────── */
const Header = {
  build() {
    document.getElementById('app-header').innerHTML = `
      <nav class="navbar" id="navbar">
        <a class="navbar__logo" href="#/home" aria-label="SFK 时尚科系 Fashion Design">
          <img src="${META.logo}" alt="SFK 时尚科系 logo">
          <span class="navbar__logo-text">
            <span class="navbar__logo-en u-en">Fashion Design</span>
            <span class="navbar__logo-zh">时尚科系</span>
          </span>
        </a>
        <div class="navbar__nav" id="nav-links">
          ${NAV_MAIN.map(it => `<a class="nav-link" data-view="${it.id}" href="#/${it.id}">${esc(it.label)}</a>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:14px;">
          <button class="nav-search-btn" id="search-toggle" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <span class="u-en">Search</span>
          </button>
          <button class="navbar__menu-btn" id="menu-toggle" aria-label="菜单"><span></span><span></span><span></span></button>
        </div>
      </nav>
      <div class="search-panel" id="search-panel">
        <form id="search-form" action="#/search" method="get">
          <input type="search" name="query" id="search-input" placeholder="Search SFK Fashion Design" autocomplete="off">
          <input type="hidden" name="in" value="">
        </form>
      </div>
    `;
    document.getElementById('search-toggle').addEventListener('click', () => {
      const p = document.getElementById('search-panel');
      p.classList.toggle('is-open');
      if (p.classList.contains('is-open')) document.getElementById('search-input').focus();
    });
    document.getElementById('search-form').addEventListener('submit', e => {
      e.preventDefault();
      const q = document.getElementById('search-input').value.trim();
      const inScope = document.querySelector('#search-form input[name=in]').value || 'courses';
      document.getElementById('search-panel').classList.remove('is-open');
      location.hash = `#/search?in=${encodeURIComponent(inScope)}&query=${encodeURIComponent(q)}`;
    });
    document.getElementById('menu-toggle').addEventListener('click', () => {
      document.getElementById('navbar').classList.toggle('is-mobile-open');
    });
  },
  markActive(view) {
    document.querySelectorAll('.nav-link[data-view]').forEach(a => {
      a.classList.toggle('is-active', a.dataset.view === view);
    });
  }
};

/* ─────────── 页脚（参照 art-humanities_demo） ─────────── */
const Footer = {
  build() {
    document.getElementById('app-footer').innerHTML = `
      <footer class="site-footer">
        <div class="site-footer__inner">
          <div>
            <div class="site-footer__brand">
              <img src="${META.logo}" alt="">
              <span>${esc(META.brand)}</span>
            </div>
            <p class="site-footer__desc">${esc(META.subtitle)}</p>
          </div>
          <div>
            <h3 class="site-footer__col-title">主要内容</h3>
            ${NAV_MAIN.filter(it => ['subjects', 'colleges', 'courses'].includes(it.id)).map(it => `<a href="#/${it.id}">${esc(it.label)}</a>`).join('')}
          </div>
          <div>
            <h3 class="site-footer__col-title">科系板块</h3>
            ${NAV_MAIN.filter(it => !['subjects', 'colleges', 'courses'].includes(it.id)).map(it => `<a href="#/${it.id}">${esc(it.label)}</a>`).join('')}
          </div>
          <div>
            <h3 class="site-footer__col-title">规划咨询</h3>
            <a href="mailto:${META.footer.contact.email}">${META.footer.contact.email}</a>
            <a href="tel:${META.footer.contact.tel}">${META.footer.contact.tel}</a>
          </div>
        </div>
        <div class="site-footer__bottom">${esc(META.footer.copyright)}</div>
      </footer>
    `;
  }
};

/* ─────────── 子层级页面"返回上一级"标签（左侧居中常驻，悬停右展 + 边框变主色） ─────────── */
const BackTab = {
  render(target) {
    const el = document.getElementById('app-back');
    if (!el) return;
    el.innerHTML = target ? `
      <button class="back-tab" onclick="location.hash='${target}'" aria-label="返回">
        <span class="back-tab__arrow" aria-hidden="true"></span>
        <span class="back-tab__label">返回</span>
      </button>` : '';
  }
};

/* ─────────── Hero 轮播：单张依次切换 · 慢速左滑过场 · 自动循环不间断 ─────────── */
const HERO_SLIDES = Array.from({ length: 22 }, (_, i) => `assets/img/hero/slide-${String(i + 1).padStart(2, '0')}.jpeg`);

const HeroCarousel = {
  _timer: 0, _index: 0, _track: null, _animating: false,
  SLIDE_DURATION: 1000,   /* 关键参数：慢速左滑过场时长 ms */
  SLIDE_INTERVAL: 6000,   /* 关键参数：每张展示时长 ms（须大于过场时长） */
  EASE: 'cubic-bezier(.65,.05,.25,1)',   /* 缓入缓出，过场自然 */
  slide(src) {
    return `
      <div class="hero-slide">
        <img class="hero-slide__img hero-slide__img--base" src="${src}" alt="" draggable="false">
        <img class="hero-slide__img hero-slide__img--vivid" src="${src}" alt="" draggable="false">
      </div>`;
  },
  mount() {
    this.stop();
    const track = document.getElementById('hero-track');
    if (!track || !HERO_SLIDES.length) return;
    /* 22 张 + 首张克隆：末张滑向克隆完成后瞬时归位，循环无接缝、无回跳 */
    track.innerHTML = HERO_SLIDES.map(s => this.slide(s)).join('') + this.slide(HERO_SLIDES[0]);
    this._track = track;
    this._index = 0;
    this._apply(false);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this._timer = setInterval(() => this.next(), this.SLIDE_INTERVAL);
  },
  _apply(animate) {
    this._track.style.transition = animate ? `transform ${this.SLIDE_DURATION}ms ${this.EASE}` : 'none';
    this._track.style.transform = `translate3d(${-this._index * 100}%, 0, 0)`;
  },
  next() {
    if (this._animating || !this._track) return;
    this._animating = true;
    this._index += 1;
    this._apply(true);
    setTimeout(() => {
      if (!this._track) return;
      if (this._index >= HERO_SLIDES.length) {
        this._index = 0;
        this._apply(false);            /* 过场结束后瞬时归位到首张（画面内容相同，无感知） */
        void this._track.offsetWidth;  /* 强制重排，避免归位与下次过场被浏览器合并 */
      }
      this._animating = false;
    }, this.SLIDE_DURATION + 60);
  },
  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = 0; }
    this._track = null; this._animating = false; this._index = 0;
  }
};

/* ─────────── 首页（区块顺序对照 UAL 官网） ─────────── */
function renderHome() {
  return `
  <!-- ① Hero：We are SFK Fashion Design（对应 UAL「We are University of the Arts London」位置） -->
  <section class="hero">
    <div class="hero__carousel" aria-hidden="true"><div class="hero__track" id="hero-track"></div></div>
    <span class="hero__veil" aria-hidden="true"></span>
    <div class="hero__content">
      <div class="hero__eyebrow">SFK · 时尚科系 · <span class="u-en">FASHION DESIGN</span></div>
      <h1><em>SFK</em> Fashion Design</h1>
      <p class="hero__sub">从服装与剪裁到商业与传播，时尚科系帮助学生建立一条能被名校看见、能被行业理解、能被未来转化的成长路径。</p>
      <div class="hero__quick">
        ${HERO_QUICK.map(q => `<a href="${q.href}">${esc(q.label)}</a>`).join('')}
      </div>
    </div>
  </section>

  <!-- ② Find a course（对应 UAL card-grid-container 位置） -->
  <section class="section">
    <div class="wrap">
      <div class="section__head">
        <div>
          <span class="section__eyebrow">FIND A COURSE</span>
          <h2 class="section__title">Find a course</h2>
        </div>
        <a class="more-link" href="#/courses">All courses <span class="arr">→</span></a>
      </div>
      <div class="card-grid">
        ${HOME_COURSES.map((id, i) => {
          const p = ((window.COURSE_PRODUCTS || {}).longform || [])
            .concat((window.COURSE_PRODUCTS || {}).catalog || [])
            .filter(x => x.id === id)[0];
          if (!p) return '';
          return `
        <div class="course-card" role="button" tabindex="0" data-cp-id="${esc(p.id)}" aria-label="${esc(p.meta.titleCn)}">
          ${ph('COURSE 0' + (i + 1))}
          <h3>${esc(p.meta.titleCn)}</h3>
          <div class="course-card__en u-en">${esc(p.meta.titleEn)}</div>
          <span class="subject-tile__line" aria-hidden="true"></span>
        </div>`;
        }).join('')}
      </div>
    </div>
  </section>

  <!-- ③ Stories（对应 UAL curated-stories-container dark--theme 位置） -->
  <section class="section band--dark">
    <div class="wrap">
      <div class="section__head">
        <div>
          <span class="section__eyebrow">STORIES</span>
          <h2 class="section__title">Stories</h2>
        </div>
        <a class="more-link" href="#/stories">See more stories <span class="arr">→</span></a>
      </div>
      <div class="story-grid">
        ${STORIES.map(s => `
        <a class="story-card" href="#/stories/${s.slug}">
          ${ph('STORY')}
          <span class="story-card__tag">${esc(s.tag)}</span>
          <h3>${esc(s.zh)}</h3>
        </a>`).join('')}
      </div>
    </div>
  </section>

  <!-- ④ What's on（浅色带：延续主页深浅交替节奏） -->
  <section class="section band--light">
    <div class="wrap">
      <div class="section__head">
        <div>
          <span class="section__eyebrow">WHAT'S ON</span>
          <h2 class="section__title">What's on</h2>
        </div>
        <a class="more-link" href="#/whats-on">See more events <span class="arr">→</span></a>
      </div>
      <div class="story-grid">
        ${EVENTS.slice(0, 3).map(e => `
        <a class="story-card" href="#/whats-on/${e.slug}">
          ${ph('EVENT')}
          <span class="story-card__tag">EVENT</span>
          <h3>${esc(e.zh)}</h3>
        </a>`).join('')}
      </div>
    </div>
  </section>`;
}

/* 主页内容带等高：STORIES / WHAT'S ON 总高对齐 Find a course
   仅调整分区自身的上下内边距，内部布局、元素排列与样式不变；随视口重算 */
function equalizeHomeBands() {
  const findSec = document.querySelector('.card-grid')?.closest('section.section');
  if (!findSec) return;
  const target = findSec.offsetHeight;
  document.querySelectorAll('.band--dark, .band--light').forEach(sec => {
    sec.style.paddingTop = '';
    sec.style.paddingBottom = '';
    const delta = sec.offsetHeight - target;
    if (delta === 0) return;
    const cs = getComputedStyle(sec);
    const half = Math.max(28, (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) - delta) / 2);
    sec.style.paddingTop = half + 'px';
    sec.style.paddingBottom = half + 'px';
  });
}
window.addEventListener('resize', equalizeHomeBands);

/* ─────────── Subjects（对应 UAL /subjects 一级） ─────────── */
function renderSubjects() {
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><span>Subjects</span></div>
      <h1>Subjects</h1>
      <p>从时装设计到可持续时尚，20 个学科方向覆盖时尚产业全链路。点击任意学科，按学历层次进入课程检索。</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="list-grid">
        ${SUBJECTS.map(s => {
          const img = SUBJECT_IMAGES[s.id];
          return `
        <a class="subject-tile${img ? ' subject-tile--photo' : ''}" href="#/subjects/${s.id}">
          <span class="subject-tile__media">${img ? `<img src="${img}" alt="${esc(s.zh)}" loading="lazy">` : ''}</span>
          <span class="subject-tile__body">
            <span class="tile__num">${s.num}</span>
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
  const s = byId(SUBJECTS, slug);
  if (!s) return renderNotFound();
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><a href="#/subjects">Subjects</a><span class="sep">/</span><span>${esc(s.zh)}</span></div>
      <h1>${esc(s.zh)}</h1>
      <p class="u-en">${esc(s.en)} — 选择培养路径，按国家/地区查看开设该专业的院校。</p>
      <div class="level-row">
        ${SUBJECT_LEVELS.map(l => `<a class="level-tab" href="#/subjects/${s.id}/${l.id}">${esc(l.label)}</a>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <span class="section__eyebrow">OVERVIEW</span>
      <h2 class="section__title" style="font-size:clamp(22px,2.6vw,34px);">学科概览</h2>
      <div class="placeholder-note" style="margin-top:24px;">
        <h2>【占位】「${esc(s.zh)}」学科介绍</h2>
        <p>学科简介、课程体系、就业方向与工作室资源待填入。</p>
      </div>
    </div>
  </section>`;
}

/* 次级页面：学历 × 国家筛选 → 院校列表（如 美国 → Parsons、RISD…） */
function renderSubjectLevel(slug, levelId, query) {
  const s = byId(SUBJECTS, slug);
  const level = byId(SUBJECT_LEVELS, levelId);
  if (!s || !level) return renderNotFound();
  const country = SCHOOL_COUNTRIES.includes(query.country) ? query.country : SCHOOL_COUNTRIES[0];
  const schools = SCHOOL_DB[country] || [];
  SCHOOL_CTX = { subject: s, level, country };
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><a href="#/subjects">Subjects</a><span class="sep">/</span><a href="#/subjects/${s.id}">${esc(s.zh)}</a><span class="sep">/</span><span>${esc(level.label)}</span></div>
      <h1>${esc(level.label)}</h1>
      <p>「${esc(s.zh)}」· ${esc(level.label)} — 按国家/地区筛选开设该专业的院校，点击院校查看详情。</p>
      <div class="level-row">
        ${SCHOOL_COUNTRIES.map(ct => `<a class="level-tab level-tab--sm ${ct === country ? 'is-active' : ''}" href="#/subjects/${s.id}/${level.id}?country=${encodeURIComponent(ct)}">${esc(ct)}</a>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <span class="section__eyebrow">${esc(country)} · SCHOOLS</span>
      <h2 class="section__title" style="font-size:clamp(22px,2.6vw,34px);">开设「${esc(s.zh)}」的院校</h2>
      <div class="list-grid" style="margin-top:28px;">
        ${schools.map((sc, i) => `
        <button class="school-card" onclick="openSchoolDetail(${i})">
          <span class="tile__num">${String(i + 1).padStart(2, '0')}</span>
          <h3>${esc(sc.zh)}</h3>
          <span class="subject-tile__en u-en">${esc(sc.en)}</span>
          <p class="school-card__note">${esc(sc.note)}</p>
          <span class="school-card__meta">${esc(sc.city)} · 查看详情 →</span>
        </button>`).join('')}
      </div>
      <p class="school-note">院校名单为示例数据，可按申请季实时增补替换。</p>
    </div>
  </section>`;
}

/* 院校详情浮层（叠加处理，层级参照 ftam_demo 院校库：遮罩 + 居中面板 + 吸顶关闭 + 信息盒） */
function openSchoolDetail(idx) {
  if (!SCHOOL_CTX) return;
  const sc = (SCHOOL_DB[SCHOOL_CTX.country] || [])[idx];
  if (!sc) return;
  const { subject: s, level } = SCHOOL_CTX;
  const infoBox = (label, copy, wide) => `<div class="info-box${wide ? ' info-box--wide' : ''}"><div class="info-box__label">${label}</div><div class="info-box__copy">${copy}</div></div>`;
  const stack = items => `<div class="stack-list">${items.map((t, i) => `<div class="stack-list__item"><span class="stack-list__num">${i + 1}.</span><span>${esc(t)}</span></div>`).join('')}</div>`;
  const programs = stack([
    `${s.zh} 主修方向 · ${level.label}（学位与学制以院校官网为准）`,
    `${s.zh} 跨学科方向 · 数字时尚 / 材料创新等（占位，可替换）`,
    `短期与先修衔接课程（占位，可替换）`
  ]);
  const boxes = [
    infoBox('院校简介', `${esc(sc.note)}。其时尚方向课程强调工作室实践与产业连接，具体课程结构以院校官网当年公布为准。`, true),
    infoBox(`专业设置 · ${level.label}`, programs, true),
    infoBox('申请要求', '作品集（建议 8–12 个项目，含过程稿与调研记录）、在校成绩单、个人陈述、推荐信 2 封；GPA 与先修要求以当年招生简章为准。'),
    infoBox('语言成绩', '本科：雅思 6.0–6.5 / 托福 80–90 区间；研究生：雅思 6.5–7.0 / 托福 90–100 区间（以院校官网为准）。'),
    infoBox('学费参考', '【占位】按院校、学制与学年存在差异，待填入最新数据。'),
    infoBox('就业方向', '时装设计师、创意指导助理、买手与商品企划、时尚传媒与视觉造型、独立工作室与品牌创业等。')
  ].join('');
  document.getElementById('app-overlay').innerHTML = `
    <div class="school-overlay is-open">
      <div class="school-overlay__backdrop" onclick="closeSchoolDetail()"></div>
      <div class="school-overlay__panel">
        <button class="school-overlay__close" onclick="closeSchoolDetail()" aria-label="关闭">✕</button>
        <div class="school-overlay__body">
          <div class="school-overlay__eyebrow">${esc(SCHOOL_CTX.country)} · ${esc(level.label)} · SCHOOL PROFILE</div>
          <h2 class="school-overlay__title">${esc(sc.zh)}</h2>
          <div class="school-overlay__title-en u-en">${esc(sc.en)}</div>
          <p class="school-overlay__meta">${esc(sc.city)} · 开设「${esc(s.zh)}」相关方向</p>
          <div class="info-grid">${boxes}</div>
        </div>
      </div>
    </div>`;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', _schoolEscClose);
}
function _schoolEscClose(e) { if (e.key === 'Escape') closeSchoolDetail(); }
function closeSchoolDetail() {
  const el = document.querySelector('.school-overlay');
  if (el) el.remove();
  document.body.style.overflow = '';
  document.removeEventListener('keydown', _schoolEscClose);
}

/* ─────────── Colleges and Institutes（对应 UAL /colleges 一级） ─────────── */
function renderColleges() {
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><span>Colleges and Institutes</span></div>
      <h1>Colleges and Institutes</h1>
      <p>6 大学院与 5 个研究机构，共同构成 SFK 时尚科系的教学与研究网络。</p>
    </div>
  </section>
  <section class="section college-banner">
    <div class="wrap">
      <div class="college-banner__head">
        <span class="section__eyebrow">COLLEGES</span>
        <h2 class="section__title" style="font-size:clamp(22px,2.6vw,34px);">6 学院</h2>
      </div>
      <div class="college-banner__grid">
        ${COLLEGES.map(c => `
        <a class="college-card" href="#/colleges/${c.id}">
          <h3>${esc(c.zh)}</h3>
          <div class="college-card__en u-en">${esc(c.en)}</div>
        </a>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <span class="section__eyebrow">INSTITUTES</span>
      <h2 class="section__title" style="font-size:clamp(22px,2.6vw,34px);">研究机构</h2>
      <div class="list-grid" style="margin-top:28px;">
        ${INSTITUTES.map(i => `
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
  const c = byId([...COLLEGES, ...INSTITUTES], slug);
  if (!c) return renderNotFound();
  const base = `#/colleges/${c.id}`;
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><a href="#/colleges">Colleges</a><span class="sep">/</span><span>${esc(c.zh)}</span></div>
      <h1>${esc(c.zh)}</h1>
      <p class="u-en">${esc(c.en)}</p>
      <div class="subnav">
        ${COLLEGE_SECTIONS.map(sec => `<a href="${base}${sec.id === 'about' ? '' : '/' + sec.id}">${esc(sec.en)}</a>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="placeholder-note">
        <h2>【占位】${esc(c.zh)} · ${esc((COLLEGE_SECTIONS.find(x => x.id === (sub || 'about')) || {}).zh || '学院介绍')}</h2>
        <p>${sub ? '子页面内容待填入。' : '学院介绍、课程、活动与故事待填入。'}当前层级对应 UAL 学院页 <span class="u-en">/colleges/{college}/${sub || ''}</span> 结构。</p>
      </div>
    </div>
  </section>`;
}

/* ─────────── Courses：课程产品（页面结构 / 信息层级 / 点击展开逻辑复用 art-humanities_demo「课程产品」） ─────────── */
const CourseProducts = {
  /* 分区顺序：elite / longform 用长线式详情，catalog / overseas / frontier 用目录式详情 */
  ZONES: [
    { key: 'elite',    group: 'longform' },
    { key: 'longform', group: 'longform' },
    { key: 'catalog',  group: 'catalog' },
    { key: 'overseas', group: 'catalog' },
    { key: 'frontier', group: 'catalog' }
  ],
  _level: '',                    /* '' = 全部；'ug' = 本科；'pg' = 研究生 */
  data() { return window.COURSE_PRODUCTS || null; },

  /* 按学历筛选渲染五个分区；筛选后为空的分区整体隐藏，保持版面协调 */
  zonesHtml() {
    const d = this.data(); if (!d) return '';
    return this.ZONES.map(z => {
      const list = (d[z.key] || []).filter(p => !this._level || (p.levels || []).includes(this._level));
      if (!list.length) return '';
      const zc = (d.zones || {})[z.key] || {};
      return `
      <section class="cp-zone">
        <div class="cp-zone__head">
          <span class="section__eyebrow">${esc(zc.eyebrow)}</span>
          <h2 class="section__title cp-zone__title">${esc(zc.title)}</h2>
        </div>
        <div class="cp-grid">${list.map(p => this.card(p, z.group)).join('')}</div>
      </section>`;
    }).join('');
  },

  card(p, group) {
    const ph = p.cover
      ? `<img src="${esc(p.cover)}" alt="" loading="lazy">`
      : `<span class="cp-card__ph">IMAGE · 占位图</span>`;
    return `<div class="cp-card cp-card--${group}" role="button" tabindex="0" data-cp-id="${esc(p.id)}" aria-label="${esc(p.meta.titleCn)}">
      <div class="cp-card__banner${p.tileVariant ? ' cp-card__banner--' + esc(p.tileVariant) : ''}">${ph}<span class="cp-card__badge">${esc(p.badge)}</span></div>
      <div class="cp-card__body">
        <div class="cp-card__eyebrow">${esc(p.meta.eyebrow)}</div>
        <div class="cp-card__title">${esc(p.meta.titleCn)}</div>
        <div class="cp-card__subtitle u-en">${esc(p.meta.titleEn)}</div>
        <p class="cp-card__desc">${esc(p.meta.desc)}</p>
        <div class="cp-card__chips">${(p.meta.chips || []).map(c => `<span class="cd-chip">${esc(c)}</span>`).join('')}</div>
      </div>
    </div>`;
  },

  /* 详情结构：cd-hero → 核心数据 · SNAPSHOT → 课程模块 · CURRICULUM → WHY SFK → CTA */
  detail(p) {
    const sec = (label, inner) => `<section class="cd-section"><div class="cd-section__label">${esc(label)}</div>${inner}</section>`;
    return `
      <div class="cd-hero">
        <div class="cd-hero__content">
          <div class="cd-hero__eyebrow">${esc(p.meta.eyebrow)}</div>
          <h2 class="cd-hero__title">${esc(p.meta.titleCn)}</h2>
          <div class="cd-hero__subtitle u-en">${esc(p.meta.titleEn)}</div>
          <p class="cd-hero__desc">${esc(p.meta.desc)}</p>
          <div class="cd-chips">${(p.meta.chips || []).map(c => `<span class="cd-chip">${esc(c)}</span>`).join('')}</div>
        </div>
      </div>
      ${p.placeholder ? '<p class="cd-note">本目录的具体课程、课时与配图待提供，以下为结构占位。</p>' : ''}
      ${(p.snapshot || []).length ? sec('核心数据 · SNAPSHOT', `<div class="cd-stat-grid">${p.snapshot.map(s => `<div class="cd-stat"><div class="cd-stat__k">${esc(s.k)}</div><div class="cd-stat__v">${esc(s.v)}</div></div>`).join('')}</div>`) : ''}
      ${(p.curriculum || []).length ? sec('课程模块 · CURRICULUM', `<div class="cd-curriculum-grid">${p.curriculum.map(c => this.curriculumCard(c)).join('')}</div>`) : ''}
      ${(p.whySFK || []).length ? sec('为什么选择 SFK · WHY SFK', `<div class="cd-why-grid">${p.whySFK.map(w => `<div class="cd-why"><div class="cd-stat__k">${esc(w.t)}</div><div class="cd-stat__v">${esc(w.d)}</div></div>`).join('')}</div>`) : ''}
      <div class="cd-cta">
        <p class="cd-cta__statement">${esc((p.closing || {}).cn || '')}</p>
        <p class="cd-cta__statement-en u-en">${esc((p.closing || {}).en || '')}</p>
      </div>`;
  },

  curriculumCard(c) {
    const img = c.img ? `<img src="${esc(c.img)}" alt="" loading="lazy">` : `<span>IMAGE · 占位图</span>`;
    return `<div class="cd-curriculum-card">
      <div class="cd-curriculum-card__img${c.img ? ' cd-curriculum-card__img--photo' : ''}">${img}</div>
      <div class="cd-curriculum-card__title">${esc(c.title || '')}</div>
      <p class="cd-curriculum-card__desc">${esc(c.desc || '')}</p>
    </div>`;
  },

  open(id) {
    const d = this.data(); if (!d) return;
    const p = [d.longform, d.elite, d.catalog, d.overseas, d.frontier]
      .reduce((f, l) => f || ((l || []).filter(x => x.id === id)[0]), null);
    if (!p) return;
    document.getElementById('app-overlay').innerHTML = `
      <div class="course-overlay is-open">
        <div class="course-overlay__backdrop" onclick="CourseProducts.close()"></div>
        <div class="course-overlay__panel">
          <button class="course-overlay__close" onclick="CourseProducts.close()" aria-label="关闭">✕</button>
          <div class="course-overlay__body">${this.detail(p)}</div>
        </div>
      </div>`;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', _cpEscClose);
  },
  close() {
    const el = document.querySelector('.course-overlay');
    if (el) el.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', _cpEscClose);
  },

  /* 本科 / 研究生 筛选：单击选中、再击取消（取消后展示全部） */
  setLevel(lv) {
    this._level = this._level === lv ? '' : lv;
    const wrap = document.getElementById('cp-zones');
    if (wrap) wrap.innerHTML = this.zonesHtml();
    document.querySelectorAll('#cp-level-bar [data-level]').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-level') === this._level);
    });
  }
};
function _cpEscClose(e) { if (e.key === 'Escape') CourseProducts.close(); }

function renderCourses() {
  const d = window.COURSE_PRODUCTS;
  if (!d) return renderPlaceholder('courses');
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><span>Courses</span></div>
      <h1>${esc(d.hero.title)}</h1>
      <p>${esc(d.hero.sub)}</p>
      <div class="level-row" id="cp-level-bar">
        ${[['ug', '本科'], ['pg', '研究生']].map(([id, label]) =>
          `<button class="level-tab level-tab--sm${CourseProducts._level === id ? ' is-active' : ''}" type="button" data-level="${id}" onclick="CourseProducts.setLevel('${id}')">${label}</button>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div id="cp-zones">${CourseProducts.zonesHtml()}</div>
    </div>
  </section>`;
}

/* ─────────── Stories 聚合页 / 详情 ─────────── */
function renderStoriesIndex() {
  const all = [...STORIES, ...STORIES_MORE];
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><span>Stories</span></div>
      <h1>Stories</h1>
      <p>学生故事、校友故事与科系动态（对应 UAL /stories 聚合页）。</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="story-grid">
        ${all.map(s => `
        <a class="story-card" href="#/stories/${s.slug}">
          ${ph('STORY')}
          <span class="story-card__tag">${esc(s.tag)}</span>
          <h3>${esc(s.zh)}</h3>
        </a>`).join('')}
      </div>
    </div>
  </section>`;
}
function renderStory(slug) {
  const s = [...STORIES, ...STORIES_MORE].find(x => x.slug === slug);
  if (!s) return renderNotFound();
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><a href="#/stories">Stories</a><span class="sep">/</span><span>${esc(s.zh)}</span></div>
      <h1 style="font-size:clamp(24px,3.2vw,44px);">${esc(s.zh)}</h1>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      ${ph('STORY COVER')}
      <div class="placeholder-note" style="margin-top:28px;">
        <h2>【占位】正文内容</h2>
        <p>故事正文待填入。路径：<span class="u-en">/stories/${esc(s.slug)}</span>（对应 UAL /{audience}/stories/{slug}）。</p>
      </div>
    </div>
  </section>`;
}

/* ─────────── What's on 聚合页 / 详情 ─────────── */
function renderWhatsOnIndex() {
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><span>What's on</span></div>
      <h1>What's on</h1>
      <p>开放日、工作坊、行业讲座与展览（对应 UAL /whats-on 聚合页）。</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="story-grid">
        ${EVENTS.map(e => `
        <a class="story-card" href="#/whats-on/${e.slug}">
          ${ph('EVENT')}
          <span class="story-card__tag">EVENT</span>
          <h3>${esc(e.zh)}</h3>
        </a>`).join('')}
      </div>
    </div>
  </section>`;
}
function renderEvent(slug) {
  const e = EVENTS.find(x => x.slug === slug);
  if (!e) return renderNotFound();
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><a href="#/whats-on">What's on</a><span class="sep">/</span><span>${esc(e.zh)}</span></div>
      <h1 style="font-size:clamp(24px,3.2vw,44px);">${esc(e.zh)}</h1>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="placeholder-note">
        <h2>【占位】活动详情</h2>
        <p>时间、地点、报名方式待填入。路径：<span class="u-en">/whats-on/${esc(e.slug)}</span>（对应 UAL /whats-on/{event-slug}）。</p>
      </div>
    </div>
  </section>`;
}

/* ─────────── Search（对应 UAL /search?in=&query= 及 scope 子路由） ─────────── */
const SEARCH_SCOPES = ['courses', 'whats-on', 'stories', 'people', 'scholarships', 'research'];
function renderSearch(query) {
  const scope = SEARCH_SCOPES.includes(query.in) ? query.in : 'courses';
  const q = query.query || '';
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><span>Search</span></div>
      <h1 style="font-size:clamp(24px,3.2vw,44px);">Search</h1>
      <div class="level-row">
        ${SEARCH_SCOPES.map(s => `<a class="chip ${s === scope ? 'is-active' : ''}" href="#/search?in=${s}&query=${encodeURIComponent(q)}">${esc(s)}</a>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      ${q ? `
      <div class="result-item">
        <h3>【占位】“${esc(q)}” 在 <span class="u-en">${esc(scope)}</span> 范围内的结果</h3>
        <span class="url u-en">/search?in=${esc(scope)}&query=${encodeURIComponent(q)}</span>
        <p>搜索结果数据待接入（对应 UAL SaaS 搜索引擎 collection + facet 结构）。</p>
      </div>` : `
      <div class="result-empty">输入关键词开始搜索。当前范围：<span class="u-en">${esc(scope)}</span>。</div>`}
    </div>
  </section>`;
}

/* ─────────── 新增导航占位页 ─────────── */
function renderPlaceholder(view) {
  const it = NAV_MAIN.find(x => x.id === view) || { label: view, en: view };
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><span>${esc(it.label)}</span></div>
      <h1>${esc(it.label)}</h1>
      <p class="u-en">${esc(it.en)}</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="placeholder-note">
        <h2>【占位】「${esc(it.label)}」板块</h2>
        <p>页面内容待填入。路由：<span class="u-en">/${esc(it.id)}</span>，已接入主导航与页脚层级。</p>
      </div>
    </div>
  </section>`;
}

function renderNotFound() {
  return `
  <section class="page-hero"><div class="wrap"><h1>404</h1><p>页面不存在。<a href="#/home" style="color:var(--pink-soft);">返回首页 →</a></p></div></section>`;
}

/* ─────────── 路由分发 ─────────── */
function route() {
  const { segs, query } = parseHash();
  const [a, b, c] = segs;
  let view = a || 'home';
  let html;

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
  else if (a === 'search') { view = 'search'; html = renderSearch(query); }
  else if (NAV_MAIN.some(x => x.id === a)) html = renderPlaceholder(a);
  else html = renderNotFound();

  document.getElementById('app-main').innerHTML = html;
  Header.markActive(view);
  closeSchoolDetail();
  CourseProducts.close();
  BackTab.render(a && a !== 'home' ? (c ? `#/${a}/${b}` : (b ? `#/${a}` : '#/home')) : '');
  if (view === 'home') { HeroCarousel.mount(); requestAnimationFrame(equalizeHomeBands); } else { HeroCarousel.stop(); }
  if (!location.hash.includes('#/home') || segs.length) window.scrollTo(0, 0);
}

/* ─────────── 启动 ─────────── */
Header.build();
Footer.build();
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
window.addEventListener('hashchange', route);
route();
