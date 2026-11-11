# fd_demo · SFK 时尚科系（Fashion Design）

SFK 时尚科系演示站点。单页应用（hash 路由），结构与 `art-humanities_demo` 对齐：
**内容与文案全部在 `assets/data/*.json`，脚本在 `assets/js/`（含 `pages/`），前台样式只有 `assets/css/style.css`；后台另有一组独立样式（见第八节）。**

---

## 一、本地运行

**正式运行（网站形态）只有一种**：`npm install && npm start` → `http://127.0.0.1:8020/`。
本站已启用**全站登录闸门**：未登录访问任何地址都会跳到登录页，验证通过后才能浏览主页与后台（见第八节）。

| 方式 | 操作 | 说明 |
|---|---|---|
| **正式运行（推荐）** | `npm start` → `http://127.0.0.1:8020/` | 全站登录 + 后台账号与权限管理 |
| 开发期静态直开 | 双击 `index.html` | `<script>` 加载镜像 `assets/js/data.bundle.js` |
| 开发期一键预览 | 双击 `tools/preview.command` | `fetch` 读 `assets/data/*.json` |
| 开发期静态服务 | `python3 -m http.server 8931` | 同上 |

后三种是**无服务端**的本地开发预览：没有服务端就没有会话与账号校验，登录闸门只在 Node 服务下生效；
`auth-guard.js` 检测不到服务端闸门标记时不发任何请求，页面仍按原静态方式渲染。
对外部署或需要登录保护时，一律使用 `npm start`（或等价的 Node 托管），不要把静态目录直接暴露出去。

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
  css/style.css               前台主样式表（令牌 → 组件 → 页面分区）
  css/site-footer.css         共享页脚样式：主页与后台管理系统加载同一份
  data/                       全部内容与文案（5 个 JSON）
  img/ pdf/ video/            素材
  js/
    data.js                   数据层：加载 / 校验 assets/data/*.json
                              + 共享状态（SITE / C / T）与工具（esc / byId / ph / fill）
    router.js                 hash 路由分发 + 滚动位置记忆（ScrollMemory）
    components.js             页头 Header / 页脚 Footer（转调共享组件）/ 返回标签 BackTab / 统一弹层 Modal
    site-footer.js            共享页脚组件：主页与后台调用同一份 SiteFooter.render()
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
      resources.js            #/resources（校企资源跑马灯 + 名录）
    main.js                   启动入口：全局事件绑定 → 加载数据 → 首次路由
tools/
  preview.command             本地预览启动器
  build_data_bundle.py        从 JSON 生成 data.bundle.js 镜像（改数据后必跑）
  import_subjects.py          从 DOCX + SUBJECTS 图片同步学科卡片、详情正文与配图
  import_resources.py         从校企资源 JSON + logo 目录生成 resources.json 与配图
  import_overseas_pdfs.py     从境外项目目录递归导入课程 PDF（含缺失标记）
  import_us_pg_deck.py        从 20 页 pptx 写入美研详情页的页序分区
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
| `site` | `site-content.json` | `data`：品牌 / 导航 / 学科 18 个（含 01 下 5 个细分领域）/ 学院 6+5 / 院校库 / 故事 / 活动 / 首屏轮播图清单；`ui`：界面文案命名空间；`detailPlaceholder`：课程详情占位模板 | `main.js`、`pages/*`、`course-products.js` |
| `courseProducts` | `course-products.json` | 课程产品卡片（`hero` / `zones` / `elite` / `longform` / `catalog` / `overseas` / `frontier`），每项含 `meta` 与 `curriculum / whySFK / closing`；境外项目 `detail.curriculum[]` 另含 `pdf / docLabel / pdfMissing`；`longform[changemakers].detail.sections[]` 为 20 页 pptx 的页序详情区 | `course-products.js`、`pages/home.js` |
| `coursesAcademic` | `courses_academic.json` | 海外冬夏校 / 大师课的课表（按产品 id） | `course-products.js` |
| `coursesIndustry` | `courses_industry.json` | 商业实践 / 就业实习的课表（按产品 id） | `course-products.js` |
| `offers` | `offers.json` | `hero` / `rows` / `filters` / `seasonFilters` / `groups`（按国家分组的院校行） | `pages/offer.js` |
| `resources` | `resources.json` | 校企资源文案、滚动速度、`partners[]`（`nameEn` / `nameCn` / `logo` / `intro` / `collab`） | `pages/resources.js` |

**产品封面图来源**：14 张产品卡片的 `cover` 字段指向 `assets/img/products/<产品名>.png`，
来自源目录（`SFK 教研管理/…/长线旗舰产品`）中与产品 `meta.titleCn` **精确同名**的图片，
按目录排列顺序逐一匹配写入（文件名即产品名，含 ` · ` 分隔符）；`assets/img/products/`
已预存同名素材，其中 13 张与源目录字节一致，`美国研究生未来精英计划.png` 以源目录的
新版本覆盖。源目录中的 `微信图片_20261110160241_48_83.png` 为微信截图默认命名、
无法匹配任何产品，未写入。卡片横幅为 16:9 容器 + `object-fit: cover`（居中裁剪），
图片 `loading="lazy"`，桌面与移动端随栅格自适应缩放。

**课程模块折叠 / 展开**：课程源数据可在 `curriculumFacets` 中配置
`"collapsible": { "limit": 8, "tabletLimit": 4, "mobileLimit": 3 }` 启用渐进式披露
（当前仅"就业实习课程 · 岗位实习与导师带训"启用，56 门课程默认简要预览：桌面 4 列
2 行 / 平板 2 列 2 行 / 移动 3 行）。网格下方居中显示"展开全部课程模块（{n}）▼ /
收起课程模块"胶囊按钮，箭头随状态旋转、`aria-expanded` 同步切换；按钮元素不随网格
重建，键盘激活后焦点保持。计数与空状态始终按过滤后的全部结果计算，筛选 / 搜索 /
课程卡弹层逻辑不受折叠影响；未配置 `collapsible` 的产品（商业实践 / 冬夏校 / 大师课
/ 境外项目 / 英国产品）按钮隐藏、行为与布局不变。视口跨过 900px / 640px 档位时
自动刷新预览条数。

**首页 Find a course 卡片**：首页推荐课程由 `site-content.json → data.home_courses`
（产品 id 列表，当前为英国研究生未来成长计划 / 海外冬夏校课程 / 商业实践课程 3 张，
`ui.findCourse` 的眉标与标题统一为 `FEATURED`），`pages/home.js` 直接调用
`CourseProducts.card()` 渲染与「课程产品」页**同源同款**的 `cp-card`（封面 / 角标 /
眉标 / 中英标题 / 简介 / chips），容器为 `cp-grid cp-grid--featured`：桌面一行
3 列不留空轨道，≤900px 降为 2 列、≤640px 单列。点击经 `main.js` 全局委托打开同一
详情浮层；卡片内容随 `course-products.json` 更新自动同步，页面不再有占位卡片。

**校企资源来源**：`resources.json` 由 `tools/import_resources.py` 从上传的 `resources_fasion.json`
与 `logos_jpg_rounded/` 生成；25 条资源与 24 张 logo 按英文名的归一化形式容错匹配（忽略空格、
连字符与 Unicode 分解差异），图片以 ASCII slug 落在 `assets/img/resources/`，无 logo 的条目显示
文字占位。源图比例从 80×80 到 2334×1200 不等（含 115×447 竖排与 558×64 超宽横条），
导入时统一规范化为 640×360 横向 PNG 画布（等比适应居中留白、竖排 logo 逆时针旋转 90°），
卡片图片框因此能固定为 16:9、标题基线对齐。重新导入或修改 JSON 后，
记得执行 `python3 tools/build_data_bundle.py` 重建镜像。

**境外项目课程文档**：`tools/import_overseas_pdfs.py` 从
`/Users/szhan111/iCloud云盘（归档）/Desktop/SFK/SFK 教研管理/高端美研产品/SFK数据库搭建&AI智能体/境外项目`
递归读取 PDF（可用 `SFK_OVERSEAS_PDF_DIR` 覆盖），按「文件名 = `role_or_course` / `title`」的归一化
映射（NFKC → 统一连接号 → 去空白 → 小写）写入 `assets/pdf/courses/overseas/<原文件名>`，
并为 `overseas[].detail.curriculum[]` 的模块补充 `pdf` 与 `docLabel`。命中 PDF 的模块点击后由
`PosterModal` 直接打开 `is-pdf` 文档视图，并在顶部显示黑底标题条（课程名 + 新标签页打开入口）；
其余产品的 PDF 模块仍沿用原视图，形态类在每次打开时重置。

未命中且原本有 `poster` 的模块**保留原海报**，写入 `pdfMissing = 应有文件名`：
卡片右上角显示「PDF 待补充」角标、弹窗底部显示缺失说明、课程模块区汇总当前筛选下的缺失项。
`_ph` 占位卡（无海报）不参与映射，保持占位态不变。脚本只新增字段，运行前后断言既有键集合与
`poster` 值未改变。重新导入或修改 JSON 后同样需重建 `data.bundle.js`。

**长线旗舰产品 `meta.desc` 写法**：`longform[]` 的 6 张卡（3 研究生 + 3 本科）严格控制在
**50–80 字**（同时按字符总数与中文字数两种口径校验），共用四层信息骨架
「地区/学历 + 产品定位 → 核心机制 + 分层 → 资源与能力链 → 主页三段定位收束」，
统一以「被名校看见、被行业理解、向未来转化」作结（`ui.hero.sub` 的紧凑式）。
能力链与地区定位沿用 `时尚科系-全链路成长发展手册`（`…/SFK数据库搭建&AI智能体/时尚科系/`）：
研究生取「创意表达 → 商业落地」，本科前置为「手绘 → 系列叙事」；英国强调设计、商业与传播相连，
香港强调理解亚洲品牌与消费者。分层与 `chips` 一致；目标院校、学历等已由标题 / `eyebrow` / `chips`
呈现，不在 `desc` 内重复。3 张本科卡的详情区块仍为占位数据，仅 `meta.desc` 已写入。

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

### 美国研究生未来精英计划 · pptx 页序详情区

`longform` 中 `id: "changemakers"` 的点击详情页由 `tools/import_us_pg_deck.py` 从
`…/长线旗舰产品/美国研究生未来精英计划/美国时尚研究生_严格参照范例_20页.pptx` 的逐页内容写入
（同目录「逐页内容.docx」用于交叉校验；pptx 内嵌媒体 0 个，全部为文字与形状版式）。
原始 `slideN.xml` 的 `<a:t>` 与 `python-pptx` 解析结果逐页比对，P1–P20 解析零遗漏；
写入按下列页序规则，其中 P1 只取黄色小标题与页底 4 个指标标签。

数据落在 `changemakers.detail.sections[]`：**只新增 `detail` 键**，不改动
`meta / snapshot / curriculum / whySFK / closing`；脚本运行前后逐键断言其它数据等价，可重复执行。
`detail` 不含 `desc / chips / curriculum / facets`。详情页顶部标题区的简介与标签按
「产品专属详情数据（`courses_industry` / `courses_academic`）→ 卡片 `meta.desc / meta.chips`
→ `detailPlaceholder` 占位模板」取数，保证卡片与详情页顶部标题区**一一对应**；
占位模板仅在 `meta` 同样缺失时出现（如 `elite-incubator`，其 `meta.desc` 为空、
卡片简介留白待教研补充）。卡片渲染器对空 `meta.desc / meta.chips` 也不再输出
空段落 / 空容器。`internship` 与 `bizpractice` 在 `courses_industry` 中带有更具体的
专属简介与标签，详情页优先展示该专属文案。
旧的通用 `curriculum` 区域（含筛选栏、模块卡、缺失提示）不再出现在 `sections` 中；
该产品的顶层 `curriculum` 数据、`detailPlaceholder.curriculum` 占位模板、
`curriculumBlock()` / `renderCurriculum()` 渲染器与 PDF / 海报弹窗全部保留，供其它产品复用。
详情页在 P20 收尾区之后，以**末尾新增的「课程模块 · CURRICULUM」区域**结束（详见下文）。

| pptx 页 | 详情页区域 | `type` / `id` |
|---|---|---|
| P2 | 产品总览导航，8 张卡跳转对应区域（详情页第 1 区，编号 `01`） | `deckNav` / `deck-p2` |
| P1 | 扉页：插在「产品总览」与「产品定位」之间，黄色小标题「从时尚创作，到跨学科研究与创新实践」作标题，含页底 4 个指标标签（7 特色赛道 / 5 核心培养优势 / 8 申请成长步骤 / 20 内容页）（编号 `02`） | `deckGrid` `variant=stats` / `deck-p1` |
| P3 | 产品定位 · BEFORE / AFTER | `deckSplit` / `deck-p3` |
| P4 | 为什么选择美国 · 4 项能力 | `deckGrid` / `deck-p4` |
| P5 | 八步成长方法 | `deckGrid` / `deck-p5` |
| P6 | 五大培养优势 | `deckGrid` / `deck-p6` |
| P7 + P8 | 重点课程与项目：续页眉保留，5 张卡整合成一排 | `deckRow` / `deck-p7-8` |
| P9 | Meta Lab 研究实验 | `deckGrid` / `deck-p9` |
| P10 | 项目 + 科研双路径 | `deckSplit` / `deck-p10` |
| P11 | 国际学术现场 | `deckGrid` / `deck-p11` |
| P12–P18 | 七大赛道：同一区域内 7 个标签筛选，每组 2 所院校 / 项目 | `deckTracks` / `deck-p12-18` |
| P19 | 美研成长路径 8 步 | `deckGrid` / `deck-p19` |
| P20 | 收尾主张 | `deckStatement` / `deck-p20` |
| 课程模块 | 末尾新增：从两个课程分类详情页筛入的 7 张课程卡片，按分类来源分组 | `courseCards` / `deck-curriculum` |

**区域编号 `no`**：按**详情页展示顺序**从 `01` 起重新连续排列，因此「产品总览」为 `01`、
P1 扉页区为 `02`；P7 + P8 合并区占 `07 / 08` 两个号；P12–P18 合并区统一记为 `12`，
其后 P19 / P20 顺延为 `13` / `14`。展开复合编号后是 `01`–`14`，无重复、无跳号（导入脚本内断言）。
`deck-p7-8` 的续页眉编号与七大赛道标签 `01`–`07` 属于区域内标记，不参与区域编号序列。
末尾的 CURRICULUM 区域属于课程模块、不带 `no`，因此 `01`–`14` 序列保持不变。

P1 区与其它区域共用 `.cd-deck__head` 页眉（黑底编号 + 英文眉标 + 中文大标题）、
`.cd-section` 分隔线与 `.cd-deck-grid` 四列描边卡；指标数字用品牌粉，不引入 pptx 的黄色，
保持站点纯黑 + 品牌粉 + 白的令牌体系。

交互：导航卡 `data-deck-target` 用 `scrollIntoView` 跳到对应 `id`；赛道标签
`data-deck-track` / `data-deck-panel` 由 `CourseProducts.deckTrack()` 在同一区域内切换显隐，
不重建 DOM、不影响滚动位置。所有区域复用 `.cd-section` 的分隔线节奏与 SFK 令牌，
900 / 640px 断点逐级降列（P1 指标卡内容极短，640px 下保留 2 列）；
其它产品未提供 `sections` 时仍走默认四段版式。

#### 末尾「课程模块 · CURRICULUM」的筛选课程卡片

`type: "courseCards"` / `id: "deck-curriculum"` 是 `detail.sections` 中**唯一且位于末尾**的区域，
由 `build_curriculum_section()` 从 `assets/data/courses_academic.json` 每次重新生成并整体替换
（脚本内断言：仅 1 个 `courseCards`、必须位于末尾、组内与跨组卡片标题不重复、无旧 `curriculum` 残留），
因此重复运行不会重复追加。

| 分类来源 | 对应课程目录详情页 | 筛入卡片 |
|---|---|---|
| `summerwinter.curriculum` | 海外冬夏校课程 · 顶尖院校在地学习 | 5 门 |
| `masterclass.curriculum` | 海外大师课程 · 教授视角与方法论 | 2 门 |

筛选条件为**同时满足**：`facets.status == "招募中"`，且课程定位适配研究生申请者
（`is_pg_friendly()`：排除纯本科 / `BA` 定位，纳入 `研究生` / `本研` / `MA` / `跨学科`）。
两个分类中处于「招募中」的卡片共 7 张，全部命中；往期课程与纯本科定位课程不写入。
排序按**原分类来源分组**，组内保持源数据顺序。

卡片对象从源 JSON **完整深拷贝**、不改写任何字段：`title`（课程名称）、
`program`（授课教授及所属院校）、`desc`（`suitable_for` 课程简介 / 适配说明）、
`tags`（适配学历等）、`eyebrow` / `cat` / `poster` / `posterFull` / `pdf` / `split` / `facets`
均保持原值，海报与招生文档的点击交互一并保留。

渲染上 `courseCards()` 复用 `curriculumCard(c)` 与 `.cd-curriculum-grid` / `.cd-curriculum-card`，
只在分组层补充 `.cd-deck-courses__*` 的标题与间距样式，不引入新的卡片组件；
区域标题沿用 `T.courseDetail.curriculumLabel`（`课程模块 · CURRICULUM`）。
每个分组都带 `emptyNote`：若某分类下无符合条件的课程，渲染 `.cd-deck-courses__empty` 对应说明，
不渲染空网格（当前数据两个分组均有卡片）。这 7 张卡与前述页序卡共用下节的统一规范。

#### 详情页卡片设计规范 · NORMALIZED CARD SYSTEM

本产品点击详情页内 P2–P20 的各页序卡与末尾 7 张课程卡收敛到同一套卡片语言，
实现为 `assets/css/style.css` 中的一层规范化规则，**作用域仅 `.cd-deck` / `.cd-deck-courses`**：
其它产品详情页（含通用 CURRICULUM、PDF / 海报弹窗）完全不受影响；渲染器与数据均无需改动。

**令牌**（`:root` 的 `--deck-*`；颜色全部取自既有 SFK 色板，不引入新色值）：

| 令牌 | 值 / 用途 |
|---|---|
| `--deck-pad` | `clamp(14px, 1.5vw, 20px)` 卡片内边距 |
| `--deck-inset` / `--deck-gap` | `8px` 卡内元素间距 / `12px` 栅格间距 |
| `--deck-card-min` / `--deck-radius` | `128px` 最小高度 / `0` 直角矩形 |
| `--deck-kicker / title / text / foot` | `10 / 15 / 12 / 11px` 四级字号 |
| `--deck-tracking` / `--deck-lh` | `.14em` 英文眉标字距 / `1.65` 正文行高 |
| `--deck-move` / `--deck-shadow` | `.2s var(--ease-out)` / 统一粉色投影 |

**三类组件**：内容卡（`.cd-deck-nav__card`、`cd-deck-split__col`、`cd-deck-grid__item`、
`cd-deck-row__card`、`.cd-deck-school`、`.cd-deck-statement__pillar`、末尾 `.cd-curriculum-card`）
统一骨架；赛道标签是控件，沿用边框与文字规范但不设最小高度；黑底主张区与深色海报卡只覆盖
`--deck-bg / fg / sub / accent / line / tag-*` 语义色变量，骨架与层级不变，因此不会出现黑底黑字。

**信息层级**（同类元素跨卡片一致）：

| 层级 | 字号 / 字重 | 颜色 | 截断 / 换行 |
|---|---|---|---|
| 眉标 · 编号 · 英文 | `10px` / semibold / `--font-en` / `.14em` uppercase | `--deck-accent` | 单行省略 |
| 标题 | `15px` / bold / `--font-display` | `--deck-fg` | 最多 2 行 clamp + `overflow-wrap: anywhere` |
| 副题 · 项目名 | `12px` / semibold | `--deck-accent` | 自然换行 |
| 正文 · 说明 · 课程简介 | `12px` / 400 / 行高 `1.65` | `--deck-sub` | 自然换行，不再单行省略（信息不丢失） |
| 贴底补充 | `11px` / 400 / 顶部 1px 细线 | `--deck-sub` | `margin-top: auto`，跨卡同一水平线 |
| 标签 | `10px` / medium / `.04em` / 直角描边 | `--deck-accent` | 单行省略 |

复合标题（院校中文名、赛道名，内嵌标签 / 图标）与横向院校卡保留自身布局，只对齐字体层级；
海报上的分类 / PDF 浮层角标沿用全站课程卡组件，不属于卡内信息层级。

**视觉节奏**：所有栅格（含末尾课程栅格）统一 `gap: var(--deck-gap)` + `grid-auto-rows: 1fr`
保证同行等高；每张卡统一 1px 描边 + 2px 品牌粉顶线 + 直角；课程卡 `padding: 0`，
把内边距交给 `.cd-curriculum-card__body`，海报仍满宽铺陈。

**交互状态**分两级且全页一致：一级为所有卡片 / 控件共用的「描边转粉 + 统一投影 + 背景不变」，
二级只给可点元素（导航卡、赛道标签、可点课程卡）加 `translateY(-2px)`；
`:focus-visible` 保留 2px 粉色外描边，`prefers-reduced-motion` 下取消位移。

**响应式**：640px 以下只缩放三个令牌（`--deck-pad: 14px` / `--deck-gap: 10px` /
`--deck-card-min: 112px`）；末尾课程栅格改为跟随页序栅格的同一组断点
（1024px 仍 4 列 → 900px 2 列 → 640px 1 列），不再沿用通用课程模块的 3 列中间态。

#### 英国产品详情页 · 源站复用（art-humanities_demo）

「课程产品」页 `overseas-anxinban`（英国产品）卡片的详情页由
`tools/import_anxin_detail.py` 从 art-humanities_demo 的 `anxin-ban` 完整复用：
`data/course-details.json`（heroDesc / flow / closing）、`data/anxin-courses.json`
（3 门课程）、`data/course-products.json`（`curriculumFacets` 筛选组）。写入该产品
`detail` 键：`desc`（hero 简介，命中 hero 取数链第一优先级）、`sections` =
[`deckGrid` 三步流程（升学通 / 安心伴 / 毕无忧，源站 label「项目定位 · POSITIONING」
原文作区域眉标）→ `curriculum` 课程模块（3 张课程卡 + 3 个筛选主组，与源站结构一致）
→ `cta` 收尾]，不含源站没有的 snapshot / whySFK 段，不渲染任何占位。

**字段映射**：课程卡 `program` = 源站 `role_or_course`（卡片主标题）、`title` = 源站
`university`（所属院校行，与弹窗副标题一致）、`tags` = 源站
`[suitable_for, level, location, outcomes]`、`desc` = `professor`、`cat` = `program_type`
（左上角标兼筛选值）；源站步骤配色（teal/green/mint）归一到本站单色设计系统，
文案逐字保留。源站课程卡无 PDF → 不写 `pdf` 字段，点击走海报弹层（PosterModal）；
课程海报复制到 `assets/img/courses/uk-programs/`。本站卡片 `meta.chips`
（"3门课程"）与源站的空格差异属本站既有数据，按约定保留不改。

**渲染器增强**（向后兼容）：`cta` 收尾区新增 `desc` / `tags` 条件渲染（对应源站
closing 的说明与标签），closing 全空时整块不渲染（顺带消除占位产品的空 CTA 块）；
新增 `.cd-cta__desc / .cd-cta__tags` 黑底半透明白样式。脚本写文件前断言源站文本
零遗漏（heroDesc、flow 三步、closing、3 门课程全部字段、筛选组），重复运行字节一致。

#### 英国 / 香港研究生计划 · 同构详情页

「长线旗舰产品」中另外两张研究生卡片 `longform2`（英国研究生未来成长计划）与
`longform3`（香港研究生升学计划）由 `tools/import_uk_hk_pg_decks.py` 按前例改造，
脚本直接 `import import_us_pg_deck` 复用 `H() / sec() / school()`、
`build_curriculum_section()` 与文本级插入 / 幂等断言，不另写一套逻辑。

| 产品 | pptx（同目录逐页文案 `.docx` 交叉校验） | 页数 | 区域数 | 编号 |
|---|---|---|---|---|
| `longform2` | `长线旗舰产品/英国研究生未来成长计划/英国研究生未来成长计划_严格范例_20页全部可编辑.pptx` | 20 | 15（14 页序 + 课程模块） | `01`–`14` |
| `longform3` | `长线旗舰产品/香港研究生升学计划/香港时尚研究生七大赛道_严格按范例_22页.pptx` | 22 | 16（15 页序 + 课程模块） | `01`–`16` |

**展示逻辑与前例逐项一致**：P2 总览导航为第 1 区 `01`，P1 扉页（黄色小标题 + 页底
4 个指标）插在其后为 `02`；七大赛道页合并为一个 `deckTracks` 区域；收尾页
`deckStatement`；末尾追加唯一的 `courseCards` 课程模块（同两个课程目录分类、
同「招募中 + 适配研究生」筛选、同 5 + 2 张卡片）。区域编号按展示顺序连续、
无重复无跳号（香港 P7 + P8 合并区占 `07 / 08`）。所有区域只使用
`deckNav / deckGrid / deckSplit / deckRow / deckTracks / deckStatement / courseCards`
七种既有版式，因此**自动继承上一节的统一卡片设计规范，无需新增任何 CSS**；
导航卡 `target` 与赛道 `tabs / tracks` 按各自文档页序重新指向，不串到其它产品。

**内容取舍**：pptx 的 shape 原文为权威来源，同目录逐页文案 `.docx` 作结构化输入；
写文件前断言两份文档的全部 pptx run 已进入 `sections`（英国 332 条 / 香港 365 条，
零遗漏）。版式页眉、页码、重复 tab 标签与 P1 大标题按前例同样列入装饰白名单。
香港赛道页多出的「作品集建议 / 匹配说明」写入 track 的可选 `note`，由
`deckTracks()` 条件渲染；`deckRow()` / `deckTracks()` 的可选字段也改为条件渲染，
避免空元素。美国产品不提供这些字段，输出与改造前完全一致。

其余约束同前例：只新增 / 更新各产品的 `detail` 键，顶层 `meta / snapshot /
curriculum / whySFK / closing` 逐键比对不动；重复运行字节一致；数据改动后重建
`data.bundle.js` 并升级版本号。本科版与其它产品未提供 `sections`，仍走默认四段版式。

### 学科卡片与详情正文的来源

`#/subjects` 的 18 张卡片、`#/subjects/<slug>` 的详情正文、以及「01 时装设计」的 1.1–1.5 翻页，
统一由 `tools/import_subjects.py` 从 `SUBJECTS/SFK_Fashion_专业介绍与学习优势.docx` 生成（可重复执行）：

| 文档层级 | 数据位置 | 页面呈现 |
|---|---|---|
| `01`–`18` 序号标题 | `data.subjects[].num / zh / en / id` | 卡片编号、中文名、英文名与链接 |
| 标题下简介 | `data.subjects[].intro` | 详情页顶部标题区，接在英文专业名之后 |
| 「为什么在 SFK Fashion 学习{专业名}」下的 5 条 | `data.subjects[].points[]` | 详情页黑底区域的学习优势（专业研究 → 职业发展） |
| `1.1`–`1.5` | `data.subjects[0].areas[]` | 01 详情页左右翻页的 5 个细分领域 |

配图取自同一目录，按**文件名序号**与卡片一一对应，压缩后写入 `assets/img/subjects/<序号> <中文名>.jpg`，
路径登记在 `data.subject_images`；01 的 5 张细分领域图写在 `areas[].image`，18 的竖版图写在 `portrait`。
因此所有卡片都复用 `01 时装设计` 原有的 `.subject-tile--photo` 布局，卡片模板无需改动。

**详情页版式**：顶部 `.page-hero--subject` 以该卡片的图片铺底，文字叠加其上；原「学科概览」区已移除。
所有学科的学习优势区统一复用 `.sd-areas` 黑底骨架（`.sd-pager` + `.sd-page` 两栏）：01 为 1.1–1.5
五页翻页，其余 17 张为单页（隐藏翻页控件，工具条显示 `{序号} / {专业名}`），18 的竖版图用作单页舞台配图。
栏目标题由 `ui.subjects.whyTitle` 的 `{name}` 插值为对应专业名。

> 文档只有中文标题，英文专业名与语义化 `id` 由 `tools/import_subjects.py` 的 `EN` 映射维护。
> 修改或重新导入后，记得执行 `python3 tools/build_data_bundle.py` 重建镜像。

---

## 四、交互机制

| 机制 | 实现位置 | 行为 |
|---|---|---|
| 路由 | `router.js › route()` | `#/a/b/c?query` → 分发到 `pages/*` 的渲染器，写入 `#app-main`，同步导航高亮与 `on-sub` 态 |
| 滚动记忆 | `router.js › ScrollMemory` | 站内跳转新页面回顶；前进/后退还原离开时的位置（`sessionStorage`，键 `fd-scroll:<hash>`）；刷新按新页面处理 |
| 视图状态 | `pages/offer.js › _inited`、`course-products.js › _level` | 学科/课程筛选与 Offer 的申请季、国家、搜索词、展开态跨路由保留 |
| 弹层 | `components.js › Modal` | 栈式管理：Esc 只关最上层、按需锁 `body` 滚动、关闭后焦点归还触发元素 |
| 细分领域翻页 | `pages/subjects.js › SubjectAreas` | 局部替换舞台 DOM，不改写 hash（滚动位置不变）；左右按钮 / 分页点 / 方向键，1.1–1.5 循环；其余学科为单页同款布局，无翻页控件 |
| 事件委托 | `main.js › bindGlobalEvents()` | 课程卡 / Offer 卡在 `document` 上委托，路由重渲染后依然生效 |
| 校企资源跑马灯 | `pages/resources.js › ResourcesSection` | 双份 logo 无缝左移（按 `speedPxPerSec` 匀速、走完一组回卷）；悬停暂停并显示详情浮层，移开即恢复滚动并隐藏浮层（键盘 focus 等价，无点击固定态）；完整介绍常驻下方「资源名录」；`prefers-reduced-motion` 下停动画并允许手动横滚 |
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

**Subject 卡片网格**：`#/subjects` 的 `.list-grid` 额外带作用域类 `.list-grid--subjects`。
照片卡的媒体层是绝对定位，整行都是照片卡时行高只剩文字区、卡片会塌陷成矮条；作用域内
用 `::before` 撑出 16:9 透明块，把媒体高度还回文档流，使 18 张卡保持「01 时装设计」
调整前的近方形大图卡几何（列数 / 间距 / 宽高比 / 视觉层级一致）。
`minmax(min(280px, 100%), 1fr)` 保证极窄屏不横向溢出，其它页面的 `.list-grid` 不受影响。

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
| `server/` + `admin.html` / `login.html` | `server/` + `admin.html` / `login.html` | 后台管理系统同源复用；本站裁掉内容编辑与云端账号（见下） |

---

## 八、后台管理系统（复用 art-humanities_demo）

### 启动与入口

```bash
npm install
npm start              # http://127.0.0.1:8020/  （PORT / HOST 可覆盖）
```

- 账号：`zhangshaopeng1@xdf.cn` / `88888888`，角色 `admin`（超级管理员，
  生效权限 `view_site` + `manage_accounts` + `manage_roles`）。密码只以 bcrypt 哈希存于
  `server/data/accounts.json`。
- **全站登录闸门**：除登录页自身、认证接口与登录页渲染所需的静态资源（`PUBLIC_PATHS` 白名单）外，
  任何地址（`/`、`index.html`、`assets/**`、`assets/data/*.json`、`/admin`、`/api/*`）未登录一律
  302 到 `login.html?next=原地址`；XHR / 子资源请求返回 401 JSON，不会被重定向成 HTML。
  已登录访问 `login.html` 自动回主页；`next` 只接受站内地址，登录后原路返回。
- **登录表单**：用户名 + 密码 + 提交按钮；空输入分别提示「请输入用户名和密码。」／
  「请输入用户名（账号或公司邮箱）。」／「请输入密码。」；凭证错误提示
  「用户名或密码错误，请检查后重新输入。」；IP 15 分钟内最多 8 次失败尝试。
- **会话与退出**：`httpOnly` + HMAC 签名 cookie `sfk_fashion_session`（12h，带密码指纹），
  会话期间刷新 / 跳深层链接都保持登录；会话失效时 `auth-guard.js` 立即跳回登录页。
  顶部导航栏不放登出按钮；登出入口保留在移动端下拉菜单底部，以及后台页顶栏「退出登录」与底部「登出」标签，
  三处都调用 `POST /api/auth/logout` 清除会话并返回登录页。
- **管理操作**：所有管理接口（账号增删改、改密、审计、使用概览/导出）都要求已认证；
  `role === 'admin'` 才能读 `/api/audit` 与 `/api/usage/overview|export`。
- **后台入口**：登录后导航栏右上角显示「姓名首字头像 + 用户姓名 + 箭头」胶囊按钮（→ `/admin`），
  替代原「目录 / CONTENTS」按钮；悬停变主色粉底并轻微上浮，按下缩放，键盘聚焦有描边。
  该按钮在桌面 / 平板 / 手机均常驻右上角，窄屏自动压缩搜索框与按钮尺寸避免溢出。
  原 CONTENTS 全屏目录页及其底部会话组已整体移除（DOM、样式、文案均已清理）。
- **后台页脚复用主页页脚**：后台管理系统所有页面（当前为 `/admin`，由
  `server/app.js` 的 `sendAdminPage()` 统一注入外壳）不再使用独立的后台页脚，
  而是与主页加载同一份 `assets/js/site-footer.js` + `assets/css/site-footer.css`，
  由 `SiteFooter.render()` 生成完全相同的 DOM。页脚数据统一取自
  `assets/data/site-content.json`：主页由 `DATA.load()` 提供，后台由服务端从同一份
  JSON 注入 `window.__SFK_FOOTER_DATA__`。共享样式使用 `--sf-footer-*` 私有字面值令牌，
  并在 `.site-footer` 作用域内重置继承样式，因此前台（`style.css`）与后台
  （`admin-site.css` / `admin.css` / `admin-fashion.css`）两套不同的字体、字号、行高、
  平滑与焦点描边设置都不会造成差异；响应式断点同为 1080px / 640px。
  旧 `server/views/admin-footer.html` 与 `admin-site.css` 中的 `.site-footer` 规则已删除。
  登录页是全屏身份验证页、原本无页脚，保持原样。
- 会话 cookie 名与源站 `sfk_film_session` 隔离，避免同源多站点串会话。

### 复用了什么

| 模块 | 来源 | 说明 |
|---|---|---|
| 认证 / 会话 / 限流 | `server/app.js`、`server/lib/session.js` | HMAC-SHA256 签名 cookie、密码指纹、IP 限流 |
| 账号与 RBAC | `server/lib/accounts.js`、`permissions.js` | 账号范围 `all / position / self`，角色 ∪ 附加权限 |
| 审计 / 使用概览 / Excel | `server/lib/audit.js`、`usage.js`、`xlsx.js` | 操作日志、活跃地图、使用概览、`.xlsx` 导出 |
| 页面外壳 | `server/views/`、`admin.html`、`login.html` | 顶栏 / 底部标签 / 页脚挂载点由服务端注入占位符 |
| 共享页脚 | `assets/js/site-footer.js`、`assets/css/site-footer.css` | 主页与后台同一份 DOM 与样式，数据同源 `site-content.json` |
| 前端 | `assets/js/auth-guard.js`、`auth-login.js`、`admin*.js` | 登录态显形、打点、账号表格与筛选、日志分页 |
| 视觉 | `assets/css/auth.css`、`admin-site.css`、`admin.css` | 版式骨架不变，配色由 `admin-fashion.css` 覆写为本站粉黑体系 |

### 三处刻意裁剪（保证不覆盖已有功能与数据）

1. **登录保护只作用于页面访问层**：闸门在 `server/app.js` 统一拦截，页面结构、hash 路由、
   `assets/data/*.json` 的内容与后台已有的 169 个账号一字未改；登录后仍是原来的主页。
   `file://` 直开 / 纯静态服务没有服务端，不具备会话校验能力，仅作本地开发预览。
2. **不引入内容编辑模块**：不加载 `content` / `uploads`，不注册 `/data/*.json` 快照路由与
   `/api/content/*`。页面数据仍唯一来自 `assets/data/*.json`，后台不会改写任何已写入内容。
3. **账号库单源本地**：`server/lib/account-cloud.js` 恒为关闭，忽略 `TCB_*` / `CLOUDBASE_APIKEY`
   等环境变量；账号只读写本站 `server/data/accounts.json`。

### 账号管理命令

```bash
npm run account:list
npm run account:add -- someone@xdf.cn 888888 --role admin
npm run account:passwd -- someone@xdf.cn 新密码
npm run account:hash -- 密码
```

**排查**

| 现象 | 检查点 |
|---|---|
| 打开站点直接是登录页 | 预期行为：未登录访问任何地址都会跳登录页 |
| 右上角看不到用户姓名按钮 | 必须通过 Node 服务（`8020`）访问；静态预览没有闸门标记也不会显形入口 |
| 点后台跳回登录页 | 会话过期（12h）、改密后指纹失效或已退出，重新登录即可 |
| 登录页图片 / 字体 / 样式 404 | 检查 `server/app.js` 的 `PUBLIC_PATHS` 是否包含该资源 |
| 8020 端口占用 | `PORT=8021 npm start` |
| 账号库被忽略 | 检查 `AUTH_STORE_FILE` / `AUTH_STAFF_JSON` 是否指向别处 |

### 站点内容管理

以超级管理员或协作管理员登录后，进入管理系统，使用一级导航「院校详情 / Offer 成果 / 课程内容 / 学科介绍 / 校企资源 / 视频故事」。支持学科、视频故事、院校、Offer、校企资源、长线课程、课程目录、境外项目与留学服务；纯占位页面未开放。院校与 Offer 页面按国家 / 地区切换二级标签，课程页面按产品介绍与课程目录切换；标签显示实际条数。选择分类后可搜索、新增、编辑、删除，嵌套条目可添加、移除与上移。

图片、PDF、MP4 / WebM 支持上传、更换或移除；首页 hero 不参与编辑。默认图片上限 5 MB、PDF 50 MB、视频 200 MB。文件先上传，再保存条目才会发布。媒体路径也可填写站内路径或 HTTPS 地址。产品详情里的课程目录从相应课程分类实时同步。

运行 `npm start` 后访问后台；静态预览不连接内容管理。修改保存在 `server/data/content.json`，上一版本为 `.bak`，上传文件在 `server/data/uploads/`；部署时需持久保存这些目录。并发编辑同一条目时会阻止覆盖，需要重新打开。保存后刷新前台查看。

验证：`npm test` 运行隔离的数据测试；`npm run test:http` 额外验证角色访问、HTTP 发布、上传与跨站写入保护，需要允许本地监听端口。
