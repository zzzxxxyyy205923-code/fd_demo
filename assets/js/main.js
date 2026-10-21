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
  { label: 'Courses',          href: '#/courses' },
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
  {
    slug: "story-1",
    tag: "中国国际时装周",
    videoNo: 1,
    date: "2026/9/2",
    zh: "斯芬克时尚科系｜中国国际时装周",
    sub: "2026年9月5日 798中央大厅 18:30 不见不散",
    body: "",
    video: "assets/video/story-1-fashion-week.mp4",
    tags: "#中国国际时装周 #斯芬克 #服装设计 #艺术留学 #夏校"
  },
  {
    slug: "story-2",
    tag: "时尚研学",
    videoNo: 2,
    date: "2026/2/5",
    zh: "Esmod时尚学院沉浸式研学",
    sub: "打卡全球顶尖时装院Esmod，5小时沉浸式研学圆满收官，学员们收获证书、快乐加倍！#记录每个孩子认真学习的样子",
    body: "上午走进Esmod校园，校方工作人员带我们逛遍教室图书馆面料室，讲解学校百年历史。招生官还详细解读了2026年招生信息，干货满满；随后聆听2026春夏时装周各大品牌作品解读，get国际时尚流行趋势。\n\n下午迎来超期待的迷你人台3D立体剪裁实操课，讲师手把手教学，大家展开想象动手制作白坯礼服样衣，最终全员拿下 Esmod结业证书，成就感拉满！课后打卡迪奥Dior画廊博物馆，惊喜发现课堂做的样衣的灵感就在馆藏藏品中，学员们兴奋不已，现场对照学习，把知识学透学活。\n\n餐食超合胃口，午餐中餐、晚餐越南河粉，吃得开心又满足。返程路上🚌上听歌聊天，分享今日收获，一路欢声笑语，团队氛围超棒！",
    tags: "#服装设计 #时尚 #时尚传媒 #时尚学院 #ESMOD #时尚研学 #欧洲时尚文化"
  },
  {
    slug: "story-3",
    tag: "欧洲研学",
    videoNo: 3,
    date: "2026/2/4",
    zh: "SFK FASHION ｜巴黎艺术游学日志",
    sub: "乘车奔赴专业服装定制工作室，正式切换沉浸式研学Mode",
    body: "研学内容：小分队深度沉浸课堂，特邀Dior男装版师与YSL时尚设计师带来分享讲座，聆听大佬分享自己的作品集，拆解版型工艺、设计理念与高定幕后故事；随后探访Alaïa基金会，沉浸式感受Dior经典剪裁与先锋设计美学，最后还打卡了巴黎圣母院，老佛爷百货，采购新年礼物，学员之间关系越来越融洽，互相送了礼物。\n午餐享用丰盛的海鲜自助，晚餐回归暖心的米饭炒菜家乡味，地道美味治愈味蕾，大家都吃得格外开心。回来路上一直在车上放音乐唱歌♪",
    tags: "#服装设计 #时尚 #欧洲研学 #时尚工作室"
  },
  {
    slug: "story-4",
    tag: "时尚冬令营",
    videoNo: 4,
    date: "2026/2/2",
    zh: "时尚虚拟交互艺术展",
    sub: "-艺术与科技的跨学科语境与实践-\n| Inter-disciplinary Context and Practice of Art and Technology\n——贾俊",
    body: "本次外校结业展圆满落幕，作品凝聚着思考与热爱。证书为这段时光加冕，艺术探索永无止境。愿大家坚守初心，在未来的创作道路上步履不停。",
    tags: "#服装设计 #时尚 #时尚传媒 #时尚冬令营 #时尚跨专业 #时尚交互 #虚拟时尚"
  },
  {
    slug: "story-5",
    tag: "时尚冬令营",
    videoNo: 5,
    date: "2026/2/1",
    zh: "SFK 冬校项目｜",
    sub: "直击布展现场 × 「张力 Tension」",
    body: "展览倒计时警报拉响！直击布展现场，科系产品经理和教研老师们全程坐镇把控，每一处细节都力求完美💥艺术与创意的碰撞进入白热化阶段，氛围感直接拉满！\n\n展览作品完善中！同学们专注打磨细节、优化呈现效果，创意火花持续迸发💫这场即将亮相的艺术盛宴，值得万分期待✨",
    tags: "##服装设计 #时尚 #时尚传媒 #时尚冬令营 #时尚虚拟 #时尚交互 #时尚未来 #时尚策展"
  },
  {
    slug: "story-6",
    tag: "时尚冬令营",
    videoNo: 6,
    date: "2026/1/30",
    zh: "SFK26冬校-RCA时尚研究生班",
    sub: "全员终期汇报，完整展示个人项目成果\nRCA皇艺Anna教授专属终评，规划学术进阶之路",
    body: "教授亲身为作品走秀模特\n强化设计与人体、体验的真实联结\n布展冲刺收尾，只为最佳呈现效果\n从概念到落地，完成完整学术创作闭环\n艺术留学的每一步深耕，都在靠近梦校🤎",
    tags: "#SFK斯芬克 #艺术留学 #皇家艺术学院 #RCA #时尚设计 #服装设计 #艺术冬校 #设计作品集 #艺术生 #留学英国 #创作落地 #设计教育#时尚传媒"
  },
];
const STORIES_MORE = [];

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
          <form id="search-form" action="#/search" method="get" class="nav-search">
            <svg class="nav-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input class="nav-search__input" type="search" name="query" id="search-input" placeholder="Search SFK Fashion Design" autocomplete="off" aria-label="搜索">
            <input type="hidden" name="in" value="">
          </form>
          <button class="navbar__menu-btn" id="menu-toggle" aria-label="菜单"><span></span><span></span><span></span></button>
        </div>
      </nav>
    `;
    /* 导航栏内嵌搜索：输入后回车直接跳转搜索结果页（空关键词不跳转） */
    document.getElementById('search-form').addEventListener('submit', e => {
      e.preventDefault();
      const q = document.getElementById('search-input').value.trim();
      if (!q) return;
      const inScope = document.querySelector('#search-form input[name=in]').value || 'courses';
      location.hash = `#/search?in=${encodeURIComponent(inScope)}&query=${encodeURIComponent(q)}`;
    });
    document.getElementById('menu-toggle').addEventListener('click', () => {
      document.getElementById('navbar').classList.toggle('is-mobile-open');
    });
    /* 顶部透明导航：滚动进入内容区后切换实底，保证文字与 Logo 不被浅色背景淹没 */
    const navEl = document.getElementById('navbar');
    const onNavScroll = () => {
      const scrolled = window.scrollY > 24;
      navEl && navEl.classList.toggle('is-scrolled', scrolled);
      /* 光标停在导航栏上滚动页面时，清除悬停白底态与轮播下滑态，防止白底叠加浅色内容 */
      if (scrolled) {
        navEl.classList.remove('nav-hover');
        document.querySelector('.hero__carousel')?.classList.remove('nav-hover');
      }
    };
    window.addEventListener('scroll', onNavScroll, { passive: true });
    onNavScroll();
    /* 悬停导航栏：白底黑字 + 首屏轮播整体下滑至导航栏底缘；移出即平滑复原。
       仅在页面顶部（未滚动）时触发，避免白底导航叠加浅色内容导致不可读 */
    const heroBox = () => document.querySelector('.hero__carousel');
    navEl.addEventListener('mouseenter', () => {
      if (navEl.classList.contains('is-scrolled')) return;
      navEl.classList.add('nav-hover');
      heroBox()?.classList.add('nav-hover');
    });
    navEl.addEventListener('mouseleave', () => {
      navEl.classList.remove('nav-hover');
      heroBox()?.classList.remove('nav-hover');
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
  _timer: 0, _index: 1, _track: null, _animating: false,
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
    /* 首尾各加一张克隆帧：正向 / 反向翻页均可平滑过渡 */
    track.innerHTML = this.slide(HERO_SLIDES[HERO_SLIDES.length - 1]) +
      HERO_SLIDES.map(s => this.slide(s)).join('') +
      this.slide(HERO_SLIDES[0]);
    this._track = track;
    this._index = 1;
    this._apply(false);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this._startTimer();
  },
  _startTimer() {
    this._timer = setInterval(() => this.go(1), this.SLIDE_INTERVAL);
  },
  _apply(animate) {
    this._track.style.transition = animate ? `transform ${this.SLIDE_DURATION}ms ${this.EASE}` : 'none';
    this._track.style.transform = `translate3d(${-(this._index - 1) * 100}%, 0, 0)`;
  },
  /* dir = 1 下一张 / -1 上一张；越界后瞬时归位到对侧克隆帧，画面内容相同无感知 */
  go(dir) {
    if (this._animating || !this._track) return;
    this._animating = true;
    this._index += dir;
    this._apply(true);
    setTimeout(() => {
      if (!this._track) return;
      if (this._index > HERO_SLIDES.length) { this._index = 1; this._apply(false); void this._track.offsetWidth; }
      else if (this._index < 1) { this._index = HERO_SLIDES.length; this._apply(false); void this._track.offsetWidth; }
      this._animating = false;
    }, this.SLIDE_DURATION + 60);
  },
  /* 手动翻页：翻页后重置自动播放计时，避免刚切换就再次自动翻页 */
  prev() { this.go(-1); this._restartTimer(); },
  next() { this.go(1); this._restartTimer(); },
  _restartTimer() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    clearInterval(this._timer);
    this._startTimer();
  },
  /* 底部向下符号：平滑滚动至下一屏（Find a course） */
  scrollNext() {
    const el = document.querySelector('.card-grid')?.closest('section.section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = 0; }
    this._track = null; this._animating = false; this._index = 1;
  }
};

/* ─────────── 首页（区块顺序对照 UAL 官网） ─────────── */
function renderHome() {
  return `
  <!-- ① Hero：We are SFK Fashion Design（对应 UAL「We are University of the Arts London」位置） -->
  <section class="hero">
    <div class="hero__carousel" aria-hidden="true"><div class="hero__track" id="hero-track"></div></div>
    <button class="hero-nav hero-nav--prev" onclick="HeroCarousel.prev()" aria-label="上一张">&lt;</button>
    <button class="hero-nav hero-nav--next" onclick="HeroCarousel.next()" aria-label="下一张">&gt;</button>
    <span class="hero__veil" aria-hidden="true"></span>
    <div class="hero__content">
      <h1><em>SFK</em> Fashion</h1>
      <p class="hero__sub">从服装与剪裁到商业与传播，时尚科系帮助学生建立一条能被名校看见、能被行业理解、能被未来转化的成长路径。</p>
      <div class="hero__quick">
        ${HERO_QUICK.map(q => `<a href="${q.href}">${esc(q.label)}</a>`).join('')}
      </div>
    </div>
    <button class="hero-scroll" onclick="HeroCarousel.scrollNext()" aria-label="向下滚动至下一屏"><span class="hero-scroll__sym" aria-hidden="true">》</span></button>
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

  <!-- ③ Stories（全屏视频轮播：内嵌视频逐个循环播放，标题浮层覆盖于画面之上） -->
  ${(() => {
    const reelList = STORIES.filter(s => s.video);
    if (!reelList.length) return `
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
        <span class="section__eyebrow">STORIES</span>
        <h2 class="section__title">Stories</h2>
        <a class="stories-reel__cta" href="#/stories">MORE</a>
      </div>
    </div>
  </section>`;
  })()}

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

/* Stories 全屏视频轮播：板块内嵌视频逐个循环播放
   单视频时无缝 loop；补充多个视频后自动逐个切换、到末尾回到第一个 */
const StoriesReel = {
  _list: [], _i: 0,
  mount() {
    const v = document.getElementById('stories-reel-video');
    if (!v) return;
    this._list = STORIES.filter(s => s.video);
    this._i = 0;
    if (!this._list.length) return;
    v.loop = this._list.length === 1;
    v.onended = v.loop ? null : () => {
      this._i = (this._i + 1) % this._list.length;
      v.src = this._list[this._i].video;
      v.play().catch(() => {});
    };
    v.play().catch(() => {});
  },
  stop() {
    const v = document.getElementById('stories-reel-video');
    if (v) v.pause();
  }
};

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

/* 次级页面：学历 × 国家筛选 → 院校列表。
   “全部”标签（默认选中）汇总展示所有国家内容；具体国家仅显示对应内容 */
function renderSubjectLevel(slug, levelId, query) {
  const s = byId(SUBJECTS, slug);
  const level = byId(SUBJECT_LEVELS, levelId);
  if (!s || !level) return renderNotFound();
  const country = !query.country || query.country === '全部' || !SCHOOL_COUNTRIES.includes(query.country) ? '全部' : query.country;
  const list = country === '全部'
    ? SCHOOL_COUNTRIES.flatMap(ct => (SCHOOL_DB[ct] || []).map(sc => ({ ...sc, country: ct })))
    : (SCHOOL_DB[country] || []).map(sc => ({ ...sc, country }));
  SCHOOL_CTX = { subject: s, level, country, list };
  const tabHref = ct => `#/subjects/${s.id}/${level.id}` + (ct === '全部' ? '' : `?country=${encodeURIComponent(ct)}`);
  return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><a href="#/subjects">Subjects</a><span class="sep">/</span><a href="#/subjects/${s.id}">${esc(s.zh)}</a><span class="sep">/</span><span>${esc(level.label)}</span></div>
      <h1>${esc(level.label)}</h1>
      <p>「${esc(s.zh)}」· ${esc(level.label)} — 按国家/地区筛选开设该专业的院校，点击院校查看详情。</p>
      <div class="level-row">
        ${['全部'].concat(SCHOOL_COUNTRIES).map(ct => `<a class="level-tab level-tab--sm ${ct === country ? 'is-active' : ''}" href="${tabHref(ct)}">${esc(ct)}</a>`).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <span class="section__eyebrow">${esc(country)} · SCHOOLS</span>
      <h2 class="section__title" style="font-size:clamp(22px,2.6vw,34px);">开设「${esc(s.zh)}」的院校</h2>
      <div class="list-grid" style="margin-top:28px;">
        ${list.map((sc, i) => `
        <button class="school-card" onclick="openSchoolDetail(${i})">
          <span class="tile__num">${String(i + 1).padStart(2, '0')}</span>
          <h3>${esc(sc.zh)}</h3>
          <span class="subject-tile__en u-en">${esc(sc.en)}</span>
          <p class="school-card__note">${esc(sc.note)}</p>
          <span class="school-card__meta">${esc(sc.country)} · ${esc(sc.city)} · 查看详情 →</span>
        </button>`).join('')}
      </div>
      <p class="school-note">院校名单为示例数据，可按申请季实时增补替换。</p>
    </div>
  </section>`;
}

/* 院校详情浮层（叠加处理，层级参照 ftam_demo 院校库：遮罩 + 居中面板 + 吸顶关闭 + 信息盒） */
function openSchoolDetail(idx) {
  if (!SCHOOL_CTX) return;
  const sc = (SCHOOL_CTX.list || [])[idx];
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
          <div class="school-overlay__eyebrow">${esc(sc.country)} · ${esc(level.label)} · SCHOOL PROFILE</div>
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
/* ── 课程展开页占位模板：结构与层级复刻 art-humanities_demo 课程详情浮层，
   文案 / 图片 / PDF 统一占位，后续逐项填充（填充契约见 CourseProducts.detail 注释）── */
const CP_DETAIL_PH = (() => {
  const CN = ['一', '二', '三', '四', '五', '六', '七', '八'];
  const curriculum = CN.map((cn, i) => {
    const cat = i < 3 ? '课程分类占位一' : i < 6 ? '课程分类占位二' : '课程分类占位三';
    const category = i < 3 ? (i < 2 ? '子分类占位 A' : '子分类占位 B') : '';
    const title = '课程模块标题占位 ' + (i + 1);
    const program = '所属项目 / 院校占位';
    const tags = ['标签占位一', '标签占位二'];
    const desc = '课程模块简介占位：此处将展示该模块的教学内容、课时安排与产出成果，待后续填充。';
    return {
      cat, eyebrow: 'MODULE 0' + (i + 1), title, program, tags, desc,
      poster: '', pdf: '', _ph: true,
      facets: { program_type: cat, category },
      searchText: (title + ' ' + program + ' ' + desc + ' ' + tags.join(' ') + ' ' + cat).toLowerCase()
    };
  });
  return {
    desc: '课程简介占位：此处将展示课程整体定位、教学路径、师资配置与产出成果，待后续填充。',
    chips: ['标签占位一', '标签占位二', '标签占位三'],
    snapshot: ['01', '02', '03', '04'].map(n => ({
      k: '核心数据占位 ' + n,
      v: '数值待填充：此处展示该课程的关键数据指标。'
    })),
    facets: {
      searchPlaceholder: '搜索课程模块…',
      groups: [
        { value: '课程分类占位一', label: '课程分类占位一', children: ['子分类占位 A', '子分类占位 B'] },
        { value: '课程分类占位二', label: '课程分类占位二' },
        { value: '课程分类占位三', label: '课程分类占位三' }
      ]
    },
    curriculum,
    whySFK: ['01', '02', '03'].map(n => ({
      t: '优势点占位 ' + n,
      d: '优势说明占位：此处将展示选择本课程的核心理由，待后续填充。'
    })),
    closing: {
      cn: '收尾文案占位：此处将展示课程结语与申请引导，待后续填充。',
      en: 'Closing statement placeholder · to be filled.'
    }
  };
})();

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
      : '';
    return `<div class="cp-card cp-card--${group}" role="button" tabindex="0" data-cp-id="${esc(p.id)}" aria-label="${esc(p.meta.titleCn)}">
      <div class="cp-card__banner${p.tileVariant ? ' cp-card__banner--' + esc(p.tileVariant) : ''}">${ph}<span class="cp-card__badge">${esc(p.badge)}</span><span class="subject-tile__line" aria-hidden="true"></span></div>
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
  /* 预计算数据源与模块卡集合（幂等，供 heroHTML / detailBody / open 复用） */
  _prepare(p) {
    const PH = CP_DETAIL_PH;
    const D = p.detail || (window.SFK_INDUSTRY_COURSES || {})[p.id]
      || (window.SFK_ACADEMIC_COURSES || {})[p.id] || {};
    this._cur = {
      cards: (D.curriculum && D.curriculum.length) ? D.curriculum : PH.curriculum,
      facets: D.curriculumFacets || PH.facets,
      main: '', sub: '', q: ''
    };
    return { PH, D };
  },

  /* 顶部标题区（独立浮于正文之上，背景为 ink 深色、占满 panel 顶部） */
  heroHTML(p) {
    const { PH, D } = this._prepare(p);
    const desc = D.desc || PH.desc;
    const chips = (D.chips && D.chips.length) ? D.chips : PH.chips;
    const tile = 'cd-hero__tile' + (p.tileVariant ? ' cd-hero__tile--' + p.tileVariant : '');
    return `
      <div class="cd-hero">
        <div class="cd-hero__content">
          <div class="cd-hero__eyebrow">${esc(p.meta.eyebrow)}</div>
          <h2 class="cd-hero__title">${esc(p.meta.titleCn)}</h2>
          <div class="cd-hero__subtitle u-en">${esc(p.meta.titleEn)}</div>
          <p class="cd-hero__desc">${esc(desc)}</p>
          <div class="cd-chips">${chips.map(c => `<span class="cd-chip">${esc(c)}</span>`).join('')}</div>
        </div>
        <div class="${tile}" aria-hidden="true"></div>
      </div>`;
  },

  /* 顶部标题区之外的内容（核心数据 / 课程模块 / WHY SFK / CTA） */
  detailBody(p) {
    const { PH, D } = this._prepare(p);
    const sec = (label, inner) => `<section class="cd-section"><div class="cd-section__label">${esc(label)}</div>${inner}</section>`;
    const snapshot = (D.snapshot && D.snapshot.length) ? D.snapshot : PH.snapshot;
    const whys = (D.whySFK && D.whySFK.length) ? D.whySFK : PH.whySFK;
    const closing = D.closing || PH.closing;
    return `
      ${sec('核心数据 · SNAPSHOT', `<div class="cd-stat-grid">${snapshot.map(s => `<div class="cd-stat"><div class="cd-stat__k">${esc(s.k)}</div><div class="cd-stat__v">${esc(s.v)}</div></div>`).join('')}</div>`)}
      ${sec('课程模块 · CURRICULUM', this.curriculumBlock())}
      ${sec('为什么选择 SFK · WHY SFK', `<div class="cd-why-grid">${whys.map(w => `<div class="cd-why"><div class="cd-stat__k">${esc(w.t)}</div><div class="cd-stat__v">${esc(w.d)}</div></div>`).join('')}</div>`)}
      <div class="cd-cta">
        <p class="cd-cta__statement">${esc(closing.cn)}</p>
        <p class="cd-cta__statement-en u-en">${esc(closing.en)}</p>
      </div>`;
  },

  /* 完整详情（兼容旧调用） = 顶部标题区 + 正文 */
  detail(p) {
    this._prepare(p);
    return this.heroHTML(p) + this.detailBody(p);
  },

  /* ── 课程模块区：分类主标签 × 子分类 × 搜索（联动逻辑复刻 art-humanities_demo）──
     主标签选中展开其子分类；三者 AND 联动实时过滤；只重渲染网格 / 计数 / 空状态 */
  curriculumBlock() {
    const st = this._cur;
    const f = st.facets;
    const mains = f.groups.map(g =>
      `<button class="filter-btn" type="button" data-cur-main="${esc(g.value)}">${esc(g.label)}</button>`).join('');
    const subs = f.groups.filter(g => (g.children || []).length).map(g =>
      g.children.map(c => `<button class="filter-btn filter-btn--sub" type="button" data-cur-sub="${esc(c)}" data-cur-parent="${esc(g.value)}">${esc(c)}</button>`).join('')
    ).join('');
    return `
      <div class="cd-cur-bar">
        <div class="cd-cur-left">
          <div class="cd-filter-group">
            <span class="cd-filter-group__label">分类</span>
            <span class="cd-filter-group__sep">|</span>
            <span class="cd-filter-group__btns" id="cd-cur-mains">${mains}</span>
          </div>
          <div class="cd-filter-group__btns" id="cd-cur-subs" hidden>${subs}</div>
        </div>
        <div class="cd-cur-right">
          <input class="cd-cur-input" id="cd-cur-search" type="search" autocomplete="off"
            placeholder="${esc(f.searchPlaceholder || '搜索课程模块…')}" aria-label="搜索课程模块">
          <button class="cd-cur-clear" id="cd-cur-clear" type="button" hidden>清除</button>
          <span class="cd-cur-count" id="cd-cur-count"></span>
        </div>
      </div>
      <div class="cd-curriculum-grid" id="cd-cur-grid"></div>
      <p class="cd-cur-empty" id="cd-cur-empty" hidden>没有符合当前筛选条件的课程模块 · 请调整分类或搜索词</p>`;
  },

  /* 按当前筛选状态重渲染模块网格 + 计数 + 空状态（不动筛选栏，保持输入焦点） */
  renderCurriculum() {
    const st = this._cur;
    const grid = document.getElementById('cd-cur-grid');
    if (!st || !grid) return;
    const list = st.cards.filter(c => this.curMatch(c, st));
    grid.innerHTML = list.map(c => this.curriculumCard(c)).join('');
    const empty = document.getElementById('cd-cur-empty');
    if (empty) empty.hidden = list.length > 0;
    const count = document.getElementById('cd-cur-count');
    if (count) count.textContent = list.length === st.cards.length
      ? st.cards.length + ' 个模块'
      : list.length + ' / ' + st.cards.length + ' 个模块';
    const clear = document.getElementById('cd-cur-clear');
    if (clear) clear.hidden = !st.q;
  },

  curMatch(c, st) {
    const f = c.facets || {};
    if (st.main && f.program_type !== st.main) return false;
    if (st.sub && f.category !== st.sub) return false;
    if (st.q && !(c.searchText || '').includes(st.q)) return false;
    return true;
  },

  /* 主标签 / 子分类：单击选中、再击取消；切换主分类时清空并收起子分类 */
  curFacet(kind, btn) {
    const st = this._cur;
    if (!st) return;
    const attr = kind === 'main' ? 'data-cur-main' : 'data-cur-sub';
    const val = btn.getAttribute(attr);
    if (kind === 'main') {
      st.main = st.main === val ? '' : val;
      st.sub = '';
    } else {
      st.sub = st.sub === val ? '' : val;
    }
    document.querySelectorAll('#cd-cur-mains .filter-btn').forEach(b =>
      b.classList.toggle('is-active', b.getAttribute('data-cur-main') === st.main));
    let shown = 0;
    document.querySelectorAll('#cd-cur-subs .filter-btn').forEach(b => {
      b.hidden = !st.main || b.getAttribute('data-cur-parent') !== st.main;
      if (!b.hidden) shown++;
      b.classList.toggle('is-active', b.getAttribute('data-cur-sub') === st.sub);
    });
    const subs = document.getElementById('cd-cur-subs');
    if (subs) subs.hidden = shown === 0;
    this.renderCurriculum();
  },

  /* 搜索：实时匹配（不区分大小写）；不回写输入框，避免打断输入 */
  curSearch(value) {
    const st = this._cur;
    if (!st) return;
    st.q = String(value == null ? '' : value).trim().toLowerCase();
    const clear = document.getElementById('cd-cur-clear');
    if (clear) clear.hidden = !st.q;
    this.renderCurriculum();
  },

  /* 课程模块卡（层级复刻源站）：图片（含左上分类角标）→ 眉标 → 标题 → 项目 → 标签组 → 说明
     poster / pdf 字段填充后自动可点，弹出海报大图 / PDF 阅读视图（PosterModal）；
     占位态同样可点，弹窗内展示对应占位 */
  curriculumCard(c) {
    const hasMedia = !!(c.poster || c.pdf || c._ph);
    const img = c.poster ? `<img src="${esc(c.poster)}" alt="" loading="lazy">` : '';
    const catTag = c.cat ? `<span class="cd-curriculum-card__cat-tag">${esc(c.cat)}</span>` : '';
    const tags = (c.tags && c.tags.length)
      ? `<div class="cd-curriculum-card__tags">${c.tags.map(t => `<span class="cd-curriculum-card__tag">${esc(t)}</span>`).join('')}</div>`
      : '';
    const split = c.split === 1;   /* 商业实践：海报 + PDF 左右分栏叠加层 */
    const attr = hasMedia
      ? ` role="button" tabindex="0"` +
        (c.pdf ? ` data-pdf="${esc(c.pdf)}"` : '') +
        (c.posterFull ? ` data-poster-full="${esc(c.posterFull)}"` : '') +
        (split ? ' data-split="1"' : '') +
        ` data-poster="${esc(c.poster || '')}" data-poster-title="${esc(c.title)}" data-poster-sub="${esc(c.program || '')}" aria-label="${esc(c.title)} 点击查看${c.pdf || split ? '课程 PDF' : '课程海报'}"`
      : '';
    return `<div class="cd-curriculum-card cd-curriculum-card--dark${hasMedia ? ' is-clickable' : ''}" style="--poster:url('${esc(c.poster || '')}')"${attr}>
      <div class="cd-curriculum-card__img${c.poster ? ' cd-curriculum-card__img--photo' : ''}"${hasMedia ? '' : ' aria-hidden="true"'}>${img}${catTag}</div>
      <div class="cd-curriculum-card__body">
        ${c.eyebrow ? `<div class="cd-curriculum-card__eyebrow u-en">${esc(c.eyebrow)}</div>` : ''}
        <h4 class="cd-curriculum-card__title">${esc(c.program || c.title)}</h4>
        ${c.title ? `<div class="cd-curriculum-card__program">${esc(c.title)}</div>` : ''}
        ${tags}
        ${c.desc ? `<p class="cd-curriculum-card__desc" title="${esc(c.desc)}">${esc(c.desc)}</p>` : ''}
      </div>
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
          ${this.heroHTML(p)}
          <div class="course-overlay__body course-overlay__body--wide">${this.detailBody(p)}</div>
        </div>
      </div>`;
    /* 展开页内交互：分类 / 子分类 / 清除按钮 + 搜索输入 + 模块卡（海报 / PDF 弹窗），事件委托 */
    const body = document.querySelector('.course-overlay__body');
    body.addEventListener('click', e => {
      const main = e.target.closest && e.target.closest('[data-cur-main]');
      if (main) return this.curFacet('main', main);
      const sub = e.target.closest && e.target.closest('[data-cur-sub]');
      if (sub) return this.curFacet('sub', sub);
      if (e.target.closest && e.target.closest('#cd-cur-clear')) return this.curSearch('');
      const card = e.target.closest && e.target.closest('.cd-curriculum-card.is-clickable');
      if (card) return PosterModal.open(card);
    });
    body.addEventListener('input', e => {
      if (e.target && e.target.id === 'cd-cur-search') this.curSearch(e.target.value);
    });
    body.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest && e.target.closest('.cd-curriculum-card.is-clickable');
      if (!card) return;
      e.preventDefault();
      PosterModal.open(card);
    });
    this.renderCurriculum();
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

/* ── 课程海报 / PDF 二级弹窗：结构复刻 art-humanities_demo 的 PosterModal ──
   海报视图（poster 填充后显示图片，未填充显示占位）↔ PDF 视图（pdf 填充后用内嵌
   框架预览，未填充显示占位）；关闭钮 / 点遮罩 / Esc 关闭，Esc 优先于课程详情浮层 */
const PosterModal = {
  _el: null, _lastTrigger: null,
  build() {
    if (this._el) return this._el;
    const el = document.createElement('div');
    el.className = 'poster-modal';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `
      <div class="poster-modal__backdrop"></div>
      <div class="poster-modal__flipper"><div class="poster-modal__inner">
        <button class="poster-modal__close" type="button" aria-label="关闭">✕</button>
        <div class="poster-modal__pane poster-modal__pane--poster">
          <img class="poster-modal__img" src="" alt="">
          <div class="poster-modal__poster-info" hidden>
            <div class="poster-modal__poster-title"></div>
            <div class="poster-modal__poster-sub"></div>
          </div>
          <div class="poster-modal__ph" hidden><span>课程海报占位</span><small>图片待填充 · 填充课程模块 poster 字段后自动展示</small></div>
        </div>
        <div class="poster-modal__pane poster-modal__pane--pdf">
          <div class="poster-modal__pdf-ph"><span>课程 PDF 占位</span><small>文档待填充 · 填充课程模块 pdf 字段后自动预览</small></div>
          <iframe class="poster-modal__pdf-frame" src="" title="课程 PDF"></iframe>
        </div>
      </div></div>`;
    document.body.appendChild(el);
    el.querySelector('.poster-modal__backdrop').addEventListener('click', () => this.close());
    el.querySelector('.poster-modal__close').addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || !this.isOpen()) return;
      e.stopImmediatePropagation();     /* 只关海报 / PDF，不再冒泡去关课程详情浮层 */
      e.preventDefault();
      this.close();
    }, true);
    this._el = el;
    return el;
  },
  isOpen() { return !!this._el && this._el.classList.contains('is-visible'); },
  open(cardEl) {
    if (!cardEl) return;
    /* posterFull：点击后弹出的大图（如「课程名 PDF.jpg」），缺省则弹出卡片海报本身 */
    const poster = cardEl.getAttribute('data-poster-full') || cardEl.getAttribute('data-poster') || '';
    const pdf = cardEl.getAttribute('data-pdf') || '';
    const split = cardEl.getAttribute('data-split') === '1';   /* 左海报 + 右 PDF 分栏 */
    const el = this.build();
    this._lastTrigger = cardEl;
    const title = cardEl.getAttribute('data-poster-title') || '';
    const sub = cardEl.getAttribute('data-poster-sub') || '';
    const img = el.querySelector('.poster-modal__img');
    const ph = el.querySelector('.poster-modal__ph');
    const info = el.querySelector('.poster-modal__poster-info');
    const infoTitle = el.querySelector('.poster-modal__poster-title');
    const infoSub = el.querySelector('.poster-modal__poster-sub');
    const pdfPh = el.querySelector('.poster-modal__pdf-ph');
    const frame = el.querySelector('.poster-modal__pdf-frame');

    if (poster) { img.src = poster; img.alt = title; img.hidden = false; ph.hidden = true; }
    else { img.removeAttribute('src'); img.hidden = true; ph.hidden = false; }
    infoTitle.textContent = title;
    infoSub.textContent = sub;
    info.hidden = !split;                      /* 标题信息区仅分栏模式展示 */
    if (pdf) { frame.src = pdf; pdfPh.hidden = true; }
    else { frame.removeAttribute('src'); pdfPh.hidden = false; }

    el.classList.toggle('is-split', split);
    if (!split) el.classList.toggle('is-pdf', !!pdf);   /* 有 PDF 文档的课程模块直接弹出文档 */

    el.setAttribute('aria-label', (title ? title + ' ' : '') + (split ? '课程海报与 PDF' : (pdf ? '课程 PDF' : '课程海报')));
    el.style.display = 'flex';
    el.offsetHeight;                                   /* 强制回流，确保入场过渡生效 */
    el.classList.add('is-visible');
    el.querySelector('.poster-modal__close').focus();
  },
  close() {
    if (!this._el) return;
    const el = this._el;
    el.classList.remove('is-visible');
    el.querySelector('.poster-modal__pdf-frame').removeAttribute('src');   /* 释放文档，避免下次复用加载旧文件 */
    setTimeout(() => { if (!this.isOpen()) el.style.display = 'none'; }, 340);   /* 等退场过渡结束再隐藏 */
    const trigger = this._lastTrigger;
    this._lastTrigger = null;
    if (trigger && trigger.isConnected) trigger.focus();
  }
};

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
  const s = [...STORIES, ...STORIES_MORE].find(x => x.slug === slug);
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
      <div class="story-body">${s.body ? esc(s.body) : '<p class="placeholder-note">【占位】正文内容待补充。</p>'}</div>
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

/* ─────────── Offer 成果（结构 / 信息层级 / 交互复用 art-humanities_demo「OFFER成果」） ───────────
   页头 → 筛选栏（申请季 ｜ 国家 ｜ 搜索）→ 院校卡片栅格 → 查看更多 / 收起
   卡片点击原地展开为院校档案卡（年份 × offer 数 + 本科/研究生录取专业） */
const OfferSection = {
  _active: 'US', _activeSeason: '', _seasons: [], _rows: 4,
  _q: '', _openCard: '', _expanded: false,
  data() { return window.SFK_OFFERS || null; },

  page() {
    const d = this.data();
    if (!d) return renderPlaceholder('offer');
    this._seasons = d.seasonFilters || [];
    this._activeSeason = this._seasons[0] || '';
    this._rows = d.rows || 4;
    this._q = ''; this._openCard = ''; this._expanded = false;
    this._active = (d.filters && d.filters[0] && d.filters[0].id) || 'US';
    const grp = (label, inner) => `<div class="offer-filter-group"><span class="offer-filter-group__label">${label}</span><span class="offer-filter-group__sep">|</span><span class="offer-filter-group__btns">${inner}</span></div>`;
    const seasonBtns = this._seasons.map(s => `<button class="offer-filter-btn${s === this._activeSeason ? ' is-active' : ''}" type="button" data-season="${esc(s)}" onclick="OfferSection.setSeason('${esc(s)}')">${esc(s)}</button>`).join('');
    const countryBtns = (d.filters || []).map(f => `<button class="offer-filter-btn${f.id === this._active ? ' is-active' : ''}" type="button" data-group="${esc(f.id)}" onclick="OfferSection.setCountry('${esc(f.id)}')">${esc(f.label)}</button>`).join('');
    return `
  <section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="#/home">Home</a><span class="sep">/</span><span>Offer</span></div>
      <h1>${esc(d.hero.title)}</h1>
      <p>${esc(d.hero.desc)}</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="offers-filter-bar" id="offers-filter-bar">
        ${this._seasons.length ? grp('申请季', seasonBtns) : ''}
        ${grp('国家', countryBtns)}
        <div class="offer-filter-group offer-filter-group--search">
          <span class="offer-filter-group__label">搜索</span><span class="offer-filter-group__sep">|</span>
          <input class="offers-search" id="offers-search" type="search" placeholder="输入院校中 / 英文名" autocomplete="off">
        </div>
      </div>
      <div class="rough-grid" id="offers-grid">${this.gridHtml()}</div>
      <div class="offers-more" id="offers-more"></div>
    </div>
  </section>`;
  },

  /* 当前应渲染的行：[row, groupId]。常规态 = 当前国家组；搜索态 = 跨全部国家匹配，
     按 offer 总数降序，再叠加国家 / 申请季筛选 */
  rowsData() {
    const d = this.data(); if (!d) return [];
    const groups = d.groups || {};
    let pool = [];
    if (this._q) {
      Object.keys(groups).forEach(g => (groups[g] || []).forEach(r => {
        const hay = ((r.zh || '') + ' ' + (r.en || '')).toLowerCase();
        if (hay.includes(this._q)) pool.push([r, g]);
      }));
      pool.sort((a, b) => (parseInt(b[0].count, 10) || 0) - (parseInt(a[0].count, 10) || 0));
      if (this._active) pool = pool.filter(([, g]) => g === this._active);
    } else {
      pool = (groups[this._active] || []).map(r => [r, null]);
    }
    if (this._activeSeason) {
      pool = pool.filter(([r]) => !(r.seasons || []).length || (r.seasons || []).includes(this._activeSeason));
    }
    return pool;
  },

  gridHtml() {
    const d = this.data(); if (!d) return '';
    const filters = d.filters || [];
    const inSearch = !!this._q;
    return this.rowsData().map(([r, g]) => {
      const cnt = (this._activeSeason && r.seasonCounts && r.seasonCounts[this._activeSeason]) || r.count;
      const dossier = inSearch || this._openCard === r.zh;
      if (!dossier) {
        return `
      <div class="offer-card offer-card--clickable" data-school="${esc(r.zh)}">
        <div class="offer-card__count${r.hl ? ' offer-card__count--hl' : ''}">${esc(cnt)}</div>
        <div class="offer-card__school-zh">${esc(r.zh)}</div>
        <div class="offer-card__school-en u-en">${esc(r.en)}</div>
      </div>`;
      }
      const fl = filters.find(f => f.id === (g || this._active));
      const years = (r.seasons || []).slice().sort().reverse()
        .map(s => `<div class="offer-card__year">${esc(s)} ｜ <span class="offer-card__year-num">${esc((r.seasonCounts && r.seasonCounts[s]) || '—')}</span></div>`).join('');
      const majorsGrp = (list, label) => (list && list.length) ? `
        <div class="offer-card__major-group">
          <div class="offer-card__major-h">${label}</div>
          <ul>${list.map(m => `<li><span class="offer-card__major-en u-en">${esc(m[0])}</span><span class="offer-card__major-cn">${esc(m[1])}</span></li>`).join('')}</ul>
        </div>` : '';
      const majors = r.majors ? `
        <aside class="offer-card__majors">
          ${majorsGrp(r.majors.ug, '本科 · Undergraduate')}
          ${majorsGrp(r.majors.pg, '研究生 · Postgraduate')}
        </aside>` : '';
      return `
      <div class="offer-card offer-card--dossier${inSearch ? '' : ' offer-card--clickable'}" data-school="${esc(r.zh)}">
        <div class="offer-card__info">
          <div class="offer-card__count${r.hl ? ' offer-card__count--hl' : ''}">${esc(cnt)}</div>
          <div class="offer-card__school-zh">${esc(r.zh)}</div>
          <div class="offer-card__school-en u-en">${esc(r.en)}</div>
          <div class="offer-card__meta">${esc(fl ? fl.label : '—')}</div>
          <div class="offer-card__years">${years}</div>
        </div>${majors}
      </div>`;
    }).join('');
  },

  syncBtns() {
    const bar = document.getElementById('offers-filter-bar');
    if (!bar) return;
    bar.querySelectorAll('[data-group]').forEach(b => b.classList.toggle('is-active', b.getAttribute('data-group') === this._active));
    bar.querySelectorAll('[data-season]').forEach(b => b.classList.toggle('is-active', b.getAttribute('data-season') === this._activeSeason));
  },

  /* 申请季：搜索态下点击已选中 = 取消；常规态点击即选中 */
  setSeason(s) {
    const deselect = !!this._q && this._activeSeason === s;
    this._activeSeason = deselect ? '' : s;
    this.syncBtns(); this.refresh();
  },

  /* 国家：搜索态下点击已选中 = 取消；常规态点击即选中 */
  setCountry(id) {
    const deselect = !!this._q && this._active === id;
    this._active = deselect ? '' : id;
    this.syncBtns(); this.refresh();
  },

  /* 实时搜索（150ms 防抖）：进入搜索态清空筛选，清空输入恢复默认 */
  search(v) {
    const q = String(v == null ? '' : v).trim().toLowerCase();
    if (q === this._q) return;
    this._q = q;
    if (this._q) {
      this._active = ''; this._activeSeason = '';
    } else {
      const d = this.data();
      this._active = (d && d.filters && d.filters[0] && d.filters[0].id) || 'US';
      this._activeSeason = this._seasons[0] || '';
    }
    this.syncBtns(); this.refresh();
  },

  refresh() {
    const grid = document.getElementById('offers-grid');
    if (grid) {
      grid.innerHTML = this.gridHtml();
      grid.classList.toggle('rough-grid--search', !!this._q);
    }
    this.clamp();
  },

  toggleCard(zh) { this._openCard = this._openCard === zh ? '' : zh; this.refresh(); },
  toggleExpand() { this._expanded = !this._expanded; this.clamp(); },

  /* 整行折叠：读取栅格实际列数 × 行数（rows），避免末尾稀疏半行；展开时显示全部 */
  clamp() {
    const grid = document.getElementById('offers-grid');
    const more = document.getElementById('offers-more');
    if (!grid || !more) return;
    const tpl = getComputedStyle(grid).gridTemplateColumns;
    const cols = (tpl && tpl !== 'none') ? tpl.split(' ').length : 1;
    const limit = cols * this._rows;
    const cards = Array.from(grid.children);
    cards.forEach((c, i) => { c.style.display = (this._expanded || i < limit) ? '' : 'none'; });
    const total = cards.length;
    more.innerHTML = total <= limit ? '' : (this._expanded
      ? `<button class="btn btn--ghost" type="button" onclick="OfferSection.toggleExpand()">收起</button>`
      : `<button class="btn btn--ghost" type="button" onclick="OfferSection.toggleExpand()">查看更多 <span class="u-en">/ ${total - limit} more</span></button>`);
  },

  init() {
    const input = document.getElementById('offers-search');
    if (input) {
      let t;
      input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => this.search(input.value), 150);
      });
    }
    this.clamp();
  }
};

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
  else if (a === 'offer') { view = 'offer'; html = OfferSection.page(); }
  else if (a === 'search') { view = 'search'; html = renderSearch(query); }
  else if (NAV_MAIN.some(x => x.id === a)) html = renderPlaceholder(a);
  else html = renderNotFound();

  document.getElementById('app-main').innerHTML = html;
  Header.markActive(view);
  /* 次级页面及下属层级：导航栏统一白底黑字（on-sub）；主页保持透明轮播叠加逻辑 */
  document.getElementById('navbar')?.classList.toggle('on-sub', view !== 'home');
  closeSchoolDetail();
  CourseProducts.close();
  BackTab.render(a && a !== 'home' ? (c ? `#/${a}/${b}` : (b ? `#/${a}` : '#/home')) : '');
  if (view === 'home') { HeroCarousel.mount(); StoriesReel.mount(); requestAnimationFrame(equalizeHomeBands); } else { HeroCarousel.stop(); StoriesReel.stop(); }
  if (view === 'offer') OfferSection.init();
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
/* Offer 院校卡：点击原地展开 / 收起档案卡（事件委托，路由重渲染后依然生效） */
document.addEventListener('click', e => {
  const card = e.target.closest && e.target.closest('.offer-card--clickable');
  if (card) OfferSection.toggleCard(card.getAttribute('data-school'));
});
/* 视口变化时重算整行折叠（展开态不干预） */
window.addEventListener('resize', () => {
  if (document.getElementById('offers-grid') && !OfferSection._expanded) OfferSection.clamp();
});
window.addEventListener('hashchange', route);
route();
