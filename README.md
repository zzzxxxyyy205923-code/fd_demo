# fd_demo · SFK 时尚科系（Fashion Design）

SFK 时尚科系演示站点。单页应用（hash 路由），结构与 `art-humanities_demo` 对齐：
**内容与文案全部在 `assets/data/*.json`，脚本在 `assets/js/`（含 `pages/`），样式只有 `assets/css/style.css`。**

---

## 一、本地运行

三种方式任选其一，**渲染与交互完全一致**：

| 方式 | 操作 | 数据通道 |
|---|---|---|
| 直接打开 | 双击 `index.html` | `<script>` 加载镜像 `assets/js/data.bundle.js` |
| 一键预览 | 双击 `tools/preview.command` | `fetch` 读 `assets/data/*.json` |
| 手动服务 | `python3 -m http.server 8931` → `http://localhost:8931/index.html` | 同上 |

**为什么直开需要镜像**：`file://` 下页面 origin 为 `null`，浏览器以 CORS 拦截 `fetch` / `XHR` 读取本地文件，
但 `<script src>` 不受限制。因此数据层做了双通道：

1. `http(s)://` → `fetch assets/data/*.json`（JSON 为唯一事实来源）
2. `file://` → 加载 `assets/js/data.bundle.js` 镜像（内容与 JSON 逐字节一致）

HTTP 下若 `fetch` 失败（服务未起 / 文件缺失），也会自动回落镜像；两条通道都失败才显示提示。
运行时可用 `DATA.source` 确认当前通道：`json` 或 `bundle`。

**提示逻辑（`index.html` 内两个静态块，不依赖数据层）**

| 触发条件 | 提示块 | 内容 |
|---|---|---|
| `file://` 且镜像缺失 / 损坏 / 结构异常 | `#boot-notice-bundle`「本地数据镜像缺失」 | 引导执行 `python3 tools/build_data_bundle.py`，或改用本地服务 |
| HTTP 取数失败且镜像不可用 | `#boot-notice-load`「数据加载失败」 | 排查服务与数据文件，给出 Network 面板指引 |

两个提示块末尾都会追加**具体失败原因**（缺哪个文件 / HTTP 状态码 / 结构缺失字段），控制台同时输出完整错误对象。

---

## 二、目录

```
index.html                    页面骨架（视图容器 + 两个启动提示块 + 脚本清单）
README.md                     本文件
assets/
  css/style.css               唯一样式表（令牌 → 组件 → 页面分区）
  data/                       全部内容与文案（5 个 JSON）
  img/ pdf/ video/            素材
  js/
    data.js                   数据层：加载 / 校验 assets/data/*.json
                              + 共享状态（SITE / C / T）与工具（esc / byId / ph / fill）
    router.js                 hash 路由分发 + 滚动位置记忆（ScrollMemory）
    components.js             页头 Header / 页脚 Footer / 返回标签 BackTab / 统一弹层 Modal
    effects.js                首屏轮播 HeroCarousel / Stories 视频带 / 内容带等高
    data.bundle.js            ⚠ 自动生成：JSON 的本地镜像（勿手改，见 tools/build_data_bundle.py）
    course-products.js        课程产品分区、详情浮层、模块检索、海报与 PDF 弹窗
    pages/                    一视图一文件
      home.js                 #/home
      subjects.js             #/subjects、#/subjects/<slug>、#/subjects/<slug>/<level>
      colleges.js             #/colleges、#/colleges/<slug>[/<section>]
      courses.js              #/courses
      stories.js              #/stories、#/stories/<slug>
      whats-on.js             #/whats-on、#/whats-on/<slug>
      offer.js                #/offer
      search.js               #/search?in=&query=
      misc.js                 导航占位页 + 404
    main.js                   启动入口：全局事件绑定 → 加载数据 → 首次路由
tools/
  preview.command             本地预览启动器
  build_data_bundle.py        从 JSON 生成 data.bundle.js 镜像（改数据后必跑）
  gen_academic.py             课程数据写入脚本
  gen_offers_fashion.py       Offer 数据写入脚本
```

**脚本加载顺序（`index.html` 末尾，不可随意调整）**

```
data → router → components → effects → course-products → pages/* → main
```

`data.js` 必须最先（提供 `DATA` 与共享状态），`main.js` 必须最后（负责启动）。

---

## 三、数据层

数据统一放在 `assets/data/`，逻辑名与文件的映射写在 `assets/js/data.js` 的 `FILES`：

| 逻辑名 | 文件 | 主要内容 | 消费方 |
|---|---|---|---|
| `site` | `site-content.json` | `data`：品牌 / 导航 / 学科 20 个 / 学院 6+5 / 院校库 / 故事 / 活动 / 首屏轮播图清单；`ui`：界面文案命名空间；`detailPlaceholder`：课程详情占位模板 | `main.js`、`pages/*`、`course-products.js` |
| `courseProducts` | `course-products.json` | 课程产品卡片（`hero` / `zones` / `elite` / `longform` / `catalog` / `overseas` / `frontier`），每项含 `meta` 与 `curriculum / whySFK / closing` | `course-products.js`、`pages/home.js` |
| `coursesAcademic` | `courses_academic.json` | 海外冬夏校 / 大师课的课表（按产品 id） | `course-products.js` |
| `coursesIndustry` | `courses_industry.json` | 商业实践 / 就业实习的课表（按产品 id） | `course-products.js` |
| `offers` | `offers.json` | `hero` / `rows` / `filters` / `seasonFilters` / `groups`（按国家分组的院校行） | `pages/offer.js` |

**约定**

1. **文案不写进 JS**：所有可见文字在 JSON；`ui` 为命名空间树（`nav` / `common` / `school` / `offer` …），JS 用 `T.nav.menuAria` 这类路径读取。
2. **路径写相对 `assets/...`**，不写以 `/` 开头的绝对路径（否则 `file://` 与子目录部署会失败）。
3. **计数类文案用模板占位**：`{n}` / `{a}` / `{b}`，由 `fill(tpl, {n: 3})` 插值。
4. `data.js` 在启动时校验结构与协议，缺字段直接报 `ESCHEMA`，避免半渲染。
5. `offers.json` 的 `groups` 键必须与 `filters[].id` 对应；`seasonFilters` 为申请季顺序。

### 新增课程详情的排版区块

课程详情正文由 `course-products.js` 的 `DETAIL_SECTIONS` 注册表渲染，**默认顺序**为
「核心数据 · SNAPSHOT → 课程模块 · CURRICULUM → 为什么选择 SFK · WHY SFK → CTA」。

需要在数据里自定义顺序或裁剪区块时，在课表条目上加 `sections`（无需改 JS）：

```json
{
  "sections": [
    { "type": "stat", "label": "核心数据 · SNAPSHOT", "items": [{ "k": "TOP1–10", "v": "说明" }] },
    { "type": "curriculum", "label": "课程模块 · CURRICULUM" },
    { "type": "why", "label": "为什么选择 SFK · WHY SFK", "items": [{ "t": "标题", "d": "说明" }] },
    { "type": "cta", "closing": { "cn": "结语", "en": "Closing" } }
  ]
}
```

新增一种版式：在 `DETAIL_SECTIONS` 里加一个 `type → (section, ctx) => html` 的函数即可。

---

## 四、交互机制

| 机制 | 实现位置 | 行为 |
|---|---|---|
| 路由 | `router.js › route()` | `#/a/b/c?query` → 分发到 `pages/*` 的渲染器，写入 `#app-main`，同步导航高亮与 `on-sub` 态 |
| 滚动记忆 | `router.js › ScrollMemory` | 站内跳转新页面回顶；前进/后退还原离开时的位置（`sessionStorage`，键 `fd-scroll:<hash>`）；刷新按新页面处理 |
| 视图状态 | `pages/offer.js › _inited`、`course-products.js › _level` | 学科/课程筛选与 Offer 的申请季、国家、搜索词、展开态跨路由保留 |
| 弹层 | `components.js › Modal` | 栈式管理：Esc 只关最上层、按需锁 `body` 滚动、关闭后焦点归还触发元素 |
| 事件委托 | `main.js › bindGlobalEvents()` | 课程卡 / Offer 卡在 `document` 上委托，路由重渲染后依然生效 |
| 动效 | `effects.js` | 首屏图片轮播（22 张，首尾克隆帧无缝）、Stories 视频带、首页内容带等高；尊重 `prefers-reduced-motion` |

**弹层层级**：课程详情浮层（`.course-overlay`）→ 海报 / PDF 弹窗（`.poster-modal`）可叠加，Esc 逐层关闭。

---

## 五、样式与卡片规范

`style.css` 顶部 `:root` 是唯一色值来源，其余规则只引用变量：

- 品牌：`--pink #FF0080` + 同色系 `--pink-deep / --pink-soft / --pink-pale / --pink-mist`
- 中性：`--black / --ink / --ink-2 / --white / --grey / --grey-l / --grey-pale`
- 半透明：`--white-rgb / --black-rgb / --pink-rgb` 三元组 → `rgba(var(--white-rgb), .14)`
- 布局：`--max-w 1280`、`--gutter clamp(20px,4vw,48px)`、`--navbar-h 76`

**规则：组件内不写裸色值**（`#hex` / `rgba(255,…)`），一律走令牌；新增颜色先进 `:root`。

**卡片家族**

| 类 | 用途 | 形态 |
|---|---|---|
| `.course-card` | 首页 Find a course | 竖卡：占位图 → 中文名 → 英文名 → 底线，4 列网格 |
| `.subject-tile` | 学科入口 | 图片铺满上部 + 文字置底 + 装饰短线 |
| `.cp-card` | 课程产品 | 横幅 + 眉标 / 标题 / 英文 / 描述 / chips |
| `.cd-curriculum-card` | 课程模块 | 海报 + 期次角标 + 五级文字，`--dark` 为黑底变体 |
| `.offer-card` | Offer 院校 | 数字 + 中英文校名，`--dossier` 档案卡跨两列 |
| `.college-card` / `.school-card` / `.tile` | 学院 / 院校 / 研究所 | 描边卡 |
| `.story-card` | 故事 / 活动 | 媒体 + 标签 + 标题 + 日期 |

所有可点击卡统一具备 `role="button"` 与 Enter / 空格激活（见各页渲染器）。

---

## 六、维护约定

**新增一个页面视图**

1. `assets/js/pages/<name>.js` 写渲染器（导出全局函数或对象）；
2. `router.js › route()` 加分发分支；
3. `index.html` 追加 `<script src="assets/js/pages/<name>.js?v=...">`（在 `main.js` 之前）；
4. 导航项写进 `site-content.json › data.nav_main`，文案写进 `ui`。

**修改数据后**

- 改 `assets/data/*.json` 后**必须重新生成镜像**，否则双击打开看到的是旧数据（HTTP 访问不受影响）：
  ```bash
  python3 tools/build_data_bundle.py
  ```
- 部署时同步提升 `index.html` 中所有 `?v=` 版本号（含 `data.js` 里的 `BUNDLE` 版本号），避免旧缓存。

**排查**

| 现象 | 检查点 |
|---|---|
| 「本地数据镜像缺失」 | 执行 `python3 tools/build_data_bundle.py`；或改用 `preview.command` |
| 「数据加载失败」 | 服务是否在跑、`assets/data/*.json` 是否被移动/改名（详见提示块末尾的原因） |
| 控制台 `ESCHEMA` | 对应 JSON 缺字段（报错信息含文件名与字段名） |
| 某区块空白 | 该 JSON 的 id 是否与 `course-products.json` / `offers.json` 的引用一致 |
| 样式不生效 | `?v=` 是否提升；是否有裸色值覆盖令牌 |

---

## 七、与 art-humanities_demo 的对应关系

| 本仓库 | art-humanities_demo | 差异说明 |
|---|---|---|
| `assets/js/data.js` | `assets/js/data.js` | 本仓库数据在 `assets/data/`，且增加协议/结构校验 |
| `assets/js/router.js` | `assets/js/router.js` | 同为 hash 路由；本仓库按整块重渲染，art 为视图构建一次 |
| `assets/js/components.js` | `assets/js/components.js` | 本仓库含统一 `Modal`；art 另有 CaseSheet / MentorSheet / PdfViewer |
| `assets/js/pages/*` | `assets/js/pages/*` | 一视图一文件，命名与本仓库路由一致 |
| `assets/js/course-products.js` | `assets/js/pages/course-products.js` | 本仓库该模块被首页与课程页共用，故留在顶层 |
| `assets/data/` | `data/` | 本仓库按业务域合并为 5 个文件；art 按板块细分 25 个 |
