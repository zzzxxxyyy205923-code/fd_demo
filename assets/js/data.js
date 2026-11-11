/* ═══════════════════════════════════════════════════════════
   DATA — 数据层加载器（参照 dad_demo / IST_demo 的 assets/js/data.js）
   页面脚本（main.js / course-products.js / effects.js）只负责
   渲染、路由与视觉交互，不再内联任何文案。
   用法：await DATA.load(); 之后 DATA.site / DATA.courseProducts ...

   两条取数通道，内容完全等价：
     ① http(s)://  → fetch assets/data/*.json（JSON 为唯一事实来源）
     ② file://     → 该协议下 origin 为 null，fetch / XHR 会被 CORS 拦截，
                     改用 <script src> 加载 assets/js/data.bundle.js 镜像
                     （脚本标签不受 CORS 限制，镜像由 tools/build_data_bundle.py 从 JSON 生成）
     http 下 fetch 失败时同样回落到镜像；两条通道都失败才抛错，由界面展示提示。
     可用 DATA.source 查看当前实际通道：'json' | 'bundle'。
═══════════════════════════════════════════════════════════ */

const DATA = (() => {
  const BASE = 'assets/data/';
  const BUNDLE = 'assets/js/data.bundle.js?v=20261109v';   /* 本地镜像，由 tools/build_data_bundle.py 生成 */

  /* 逻辑名 → JSON 文件（不含扩展名）→ 消费方 JS
     site            → site-content.json      → main.js（页头 / 页脚 / 首页 / 学科 / 学院 / 故事 / 活动 / 搜索 / 占位页）
     courseProducts  → course-products.json   → course-products.js（课程产品分区与详情）、main.js（首页 Find a course）
     coursesIndustry → courses_industry.json  → course-products.js（商业实践 / 就业实习详情）
     coursesAcademic → courses_academic.json  → course-products.js（海外冬夏校 / 大师课详情）
     offers          → offers.json            → main.js（Offer 成果）
     resources       → resources.json         → pages/resources.js（校企资源页） */
     const FILES = {
     site: 'site-content',
     courseProducts: 'course-products',
     coursesAcademic: 'courses_academic',
     coursesIndustry: 'courses_industry',
     offers: 'offers',
     resources: 'resources'
     };

     /* 必需字段：缺任意一项即视为数据结构异常，避免半渲染 */
     const REQUIRED = {
     site: ['data', 'ui'],
     courseProducts: ['hero', 'zones'],
     coursesAcademic: [],
     coursesIndustry: [],
     offers: ['hero', 'filters', 'groups'],
     resources: ['title', 'partners']
     };

  const cache = {};
  let source = '';

  function fail(code, message) {
    const err = new Error(message);
    err.code = code;
    return err;
  }

  /* 运行时校验：数据结构完整性 */
  function assertSchema() {
    Object.keys(FILES).forEach(key => {
      const payload = cache[key];
      if (!payload || typeof payload !== 'object') {
        throw fail('ESCHEMA', 'DATA: ' + FILES[key] + '.json is empty or malformed');
      }
      (REQUIRED[key] || []).forEach(field => {
        if (payload[field] === undefined) {
          throw fail('ESCHEMA', 'DATA: ' + FILES[key] + '.json missing "' + field + '"');
        }
      });
    });
  }

  /* 通道 ②：<script src> 载入镜像（file:// 下唯一可行的取数方式） */
  function loadBundle() {
    if (window.__SFK_DATA__) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = BUNDLE;
      el.onload = () => {
        if (window.__SFK_DATA__) resolve();
        else reject(fail('EBUNDLE', 'DATA: ' + BUNDLE + ' loaded but __SFK_DATA__ is missing'));
      };
      el.onerror = () => reject(fail('EBUNDLE', 'DATA: ' + BUNDLE + ' could not be loaded'));
      document.head.appendChild(el);
    });
  }

  async function loadFallback() {
    await loadBundle();
    const mirror = window.__SFK_DATA__ || {};
    Object.keys(FILES).forEach(key => { cache[key] = mirror[key]; });
    assertSchema();
    source = 'bundle';
    return cache;
  }

  /* 通道 ①：并行 fetch JSON */
  async function loadJson() {
    await Promise.all(Object.keys(FILES).map(async key => {
      const file = BASE + FILES[key] + '.json';
      const res = await fetch(file, { cache: 'no-cache' });
      if (!res.ok) throw fail('EFETCH', 'DATA: ' + file + ' (' + res.status + ')');
      cache[key] = await res.json();
    }));
    assertSchema();
    source = 'json';
    return cache;
  }

  async function load() {
    /* file://：fetch 必被 CORS 拦截，直接用镜像，避免一次注定失败的请求 */
    if (location.protocol === 'file:') return loadFallback();

    try {
      return await loadJson();
    } catch (err) {
      if (window.__SFK_GATE__) throw err;
      /* HTTP 取数失败（服务未启动 / 路径不对 / JSON 损坏）→ 尝试镜像 */
      try {
        return await loadFallback();
      } catch (err2) {
        throw fail('EALL',
          (err && err.message ? err.message : String(err)) +
          ' ｜ ' + (err2 && err2.message ? err2.message : String(err2)));
      }
    }
  }

  return new Proxy({ load }, {
    get(target, prop) {
      if (prop === 'load') return target.load;
      if (prop === 'source') return source;
      return cache[prop];
    }
  });
})();

/* ═══════════════════════════════════════════════════════════
   共享运行时状态与工具（与 art-humanities_demo 的 data.js 同层：
   状态、转义、文案读取与通用工具集中在此，页面模块只消费）
═══════════════════════════════════════════════════════════ */

/* boot 时由 DATA 注入 */
let SITE = null;   /* site-content.json 全量对象 */
let C = null;      /* data：导航 / 学科 / 院校 / 学院 / 故事 / 活动 / 轮播图 */
let T = null;      /* ui：界面文案 */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = (arr, id) => (arr || []).find(x => x.id === id);
/* 无图占位块（故事卡 / 活动卡） */
const ph = label => `<div class="story-card__ph">${esc(label || T.common.phLabel)}${esc(T.common.phSuffix)}</div>`;
/* 文案模板插值：{n} / {a} / {b} 等占位符 */
const fill = (tpl, vars) => String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
