#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把「美国研究生未来精英计划」20 页 pptx 的逐页内容写入
assets/data/course-products.json 中 id=changemakers 的 detail.sections。

来源：
    ~/iCloud云盘（归档）/Desktop/SFK/SFK 教研管理/高端美研产品/
    SFK数据库搭建&AI智能体/时尚科系/长线旗舰产品/美国研究生未来精英计划/
    美国时尚研究生_严格参照范例_20页.pptx
    （同目录「美国时尚研究生_严格参照范例_逐页内容.docx」用于交叉校验）

展示顺序（与需求一致）：
    P2            详情页导航区，8 张卡点击跳转对应区域（编号 01）
    P1            扉页区，按需求插在「产品总览」与「产品定位」之间：
                  黄色小标题作区域标题 + 页底 4 个指标标签（编号 02）
    P3–P6         每页一个区域
    P7 + P8       合并为「重点课程与项目」一个区域，5 张卡整合成一排
    P9–P11        每页一个区域
    P12–P18       合并为「七大赛道」一个区域，7 个标签筛选同一区域内容
    P19、P20      每页一个区域
    末尾           新增「课程模块 · CURRICULUM」区域：从课程目录两个分类的详情页
                  筛选「招募中 + 适配研究生」的课程卡片，按分类来源分组写入

区域编号 no：按展示顺序从 01 起连续排列；P7+P8 合并区占 07 / 08 两个号；
    P12–P18 合并区统一记为 12，其后 P19 / P20 顺延为 13 / 14。
    展开后数字序列为 01–14，无重复、无跳号（脚本内断言）。

约束：
    - 只在 changemakers 对象上新增 / 更新顶层 detail 键，其他键逐字不动；
      其他产品、其他分区的数据同样保持不变（运行前后做整体比对断言）。
    - detail 只含 sections，不含 desc / chips / curriculum / facets 等字段，
      避免覆盖 hero 原有的取数逻辑。p.curriculum 数据、占位模板、curriculum
      渲染器与 PDF / 海报弹窗全部保留，其它产品不受影响。
    - 末尾 CURRICULUM 区域由 build_curriculum_section() 从
      assets/data/courses_academic.json 每次重新生成并整体替换，不会重复追加；
      卡片对象原样深拷贝，按分类来源分组、组内保持源数据顺序。
    - 幂等：重复运行生成的 JSON 字节完全一致。

用法：
    python3 tools/import_us_pg_deck.py
"""

import copy
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, 'assets', 'data', 'course-products.json')
PRODUCT_ID = 'changemakers'


def H(no, kicker, title, intro=None, **kw):
    """页眉公共字段：序号 / 眉标 / 标题 / 说明（+ 各版式自有字段）"""
    head = {'no': no, 'kicker': kicker, 'title': title}
    if intro:
        head['intro'] = intro
    head.update(kw)
    return head


def sec(kind, sec_id, head, **kw):
    out = {'type': kind, 'id': sec_id}
    out.update(head)
    out.update(kw)
    return out


def school(cn, en, abbr, program, desc):
    return {'cn': cn, 'en': en, 'abbr': abbr, 'program': program,
            'tag': '适配方向', 'desc': desc}


def track(no, name, en, theme, schools):
    return {'no': no, 'name': name, 'en': en, 'theme': theme,
            'schools': [school(*row) for row in schools]}


TABS = [
    {'no': '01', 'name': '男装设计'},
    {'no': '02', 'name': '女装设计'},
    {'no': '03', 'name': '戏服设计'},
    {'no': '04', 'name': '面料设计'},
    {'no': '05', 'name': '珠宝配饰'},
    {'no': '06', 'name': '时尚传媒'},
    {'no': '07', 'name': '时尚管理'},
]

TRACKS = [
    track('01', '男装设计', 'Menswear Design', '身体结构 · 男装廓形 · 文化身份', [
        ('帕森斯设计学院', 'Parsons School of Design', 'P',
         'MFA Fashion Design and Society',
         '以服装设计研究为基础，将男装作为个人系列与研究命题进行发展。'),
        ('普瑞特艺术学院', 'Pratt Institute', 'PR',
         'MFA Fashion Collection + Communication',
         '通过系列创作与视觉传播建立个人时尚设计语言。'),
    ]),
    track('02', '女装设计', 'Womenswear Design', '女性身体 · 系列实验 · 文化叙事', [
        ('帕森斯设计学院', 'Parsons School of Design', 'P',
         'MFA Fashion Design and Society',
         '围绕个人美学与社会文化议题，发展原创女装系列。'),
        ('纽约时装技术学院', 'Fashion Institute of Technology', 'FIT',
         'MFA Fashion Design',
         '注重研究、设计实验与创作实践，适合深化个人系列方向。'),
    ]),
    track('03', '戏服设计', 'Costume Design', '角色塑造 · 戏剧叙事 · 表演语境', [
        ('纽约大学', 'New York University', 'NYU',
         'MFA Design for Stage and Film',
         '以戏剧与影视制作语境进行角色、服装与舞台视觉设计。'),
        ('卡内基梅隆大学', 'Carnegie Mellon University', 'CMU',
         'MFA Costume Design',
         '针对表演与戏剧创作，发展服装研究、设计表达及制作能力。'),
    ]),
    track('04', '面料设计', 'Textile Design', '纤维研究 · 材料创新 · 表面语言', [
        ('罗德岛设计学院', 'Rhode Island School of Design', 'RISD',
         'MFA Textiles',
         '通过材料、织造、印花与纤维实验探索当代面料表达。'),
        ('萨凡纳艺术与设计学院', 'Savannah College of Art and Design', 'SCAD',
         'MFA Fibers',
         '面向纤维艺术、面料开发及跨媒介材料实践的进阶研究。'),
    ]),
    track('05', '珠宝配饰', 'Jewelry & Accessories', '材料工艺 · 身体佩戴 · 物件表达', [
        ('罗德岛设计学院', 'Rhode Island School of Design', 'RISD',
         'MFA Jewelry + Metalsmithing',
         '以金属、物件、身体与材料研究发展个人珠宝语言。'),
        ('萨凡纳艺术与设计学院', 'Savannah College of Art and Design', 'SCAD',
         'MFA Jewelry',
         '融合设计方法、制作工艺与系列呈现，适合当代珠宝方向。'),
    ]),
    track('06', '时尚传媒', 'Fashion Communication', '视觉叙事 · 时尚影像 · 传播策略', [
        ('普瑞特艺术学院', 'Pratt Institute', 'PR',
         'MFA Fashion Collection + Communication',
         '将时尚系列与传播语言连接，强调创意表达与视觉叙事。'),
        ('萨凡纳艺术与设计学院', 'Savannah College of Art and Design', 'SCAD',
         'MFA Photography（跨方向匹配）',
         '可通过摄影与视觉创作发展时尚影像作品；并非独立的时尚传媒学位。'),
    ]),
    track('07', '时尚管理', 'Fashion Management', '品牌战略 · 市场研究 · 商业创新', [
        ('纽约时装技术学院', 'Fashion Institute of Technology', 'FIT',
         'MPS Global Fashion Management',
         '聚焦全球时尚产业战略、领导力与管理；官网有职业经验条件。'),
        ('萨凡纳艺术与设计学院', 'Savannah College of Art and Design', 'SCAD',
         'MFA Luxury and Brand Management',
         '研究奢侈品牌定位、消费者体验与品牌策略。'),
    ]),
]


# ── 末尾「课程模块 · CURRICULUM」：从课程目录两个分类的详情页卡片筛选 ──
COURSE_SOURCE = os.path.join(ROOT, 'assets', 'data', 'courses_academic.json')
COURSE_GROUPS = [
    {
        'source': 'summerwinter',
        'label': '海外冬夏校课程 · 顶尖院校在地学习',
        'emptyNote': '「海外冬夏校课程 · 顶尖院校在地学习」下暂无同时满足「招募中」与适配研究生申请者的课程。',
    },
    {
        'source': 'masterclass',
        'label': '海外大师课程 · 教授视角与方法论',
        'emptyNote': '「海外大师课程 · 教授视角与方法论」下暂无同时满足「招募中」与适配研究生申请者的课程。',
    },
]


def is_pg_friendly(card):
    """适配研究生申请者：排除纯本科定位；显式研究生 / 本研 / MA / 跨学科方向纳入。
    判断只读取原卡片的 level 标签（tags[0]）与课程名称，不改写任何卡片信息。"""
    level = (card.get('tags') or [''])[0]
    name = card.get('title', '')
    if level == '本科' or '本科' in name or re.search(r'BA-|\bBA\b', name):
        return False
    return any(k in level or k in name for k in ('研究生', '本研', 'MA', '跨学科'))


def build_curriculum_section():
    """读取两个分类详情页的课程模块数据，按「招募中 + 适配研究生」筛选，
    完整深拷贝原卡片（课程名 / 院校与教授 / 适配方向 / 适配学历 / 海报 / 文档等），
    按分类来源分组、组内保持源顺序；该区域每次重新生成，避免重复添加。"""
    with io.open(COURSE_SOURCE, encoding='utf-8') as f:
        source = json.load(f)
    groups, all_titles = [], []
    for meta in COURSE_GROUPS:
        cards = [copy.deepcopy(c) for c in source[meta['source']]['curriculum']
                 if (c.get('facets') or {}).get('status') == '招募中' and is_pg_friendly(c)]
        titles = [c['title'] for c in cards]
        assert len(titles) == len(set(titles)), '同一分类下出现重复课程卡片'
        all_titles.extend(titles)
        groups.append({
            'source': meta['source'],
            'label': meta['label'],
            'note': ('共 %d 门 · 招募中 · 适配研究生申请者' % len(cards)) if cards else '',
            'emptyNote': meta['emptyNote'],
            'cards': cards,
        })
    assert len(all_titles) == len(set(all_titles)), '跨分类出现重复课程卡片'
    return {
        'type': 'courseCards',
        'id': 'deck-curriculum',
        'groups': groups,
    }


SECTIONS = [
    # ── P2 导航页：详情页第 1 区，编号 01 ──────────────────────
    sec('deckNav', 'deck-p2', H(
        '01', '产品总览 / SNAPSHOT', 'Think Across Disciplines.',
        subtitle='Research Through Design. Create What’s Next.',
        aside={
            'eyebrow': 'US POSTGRADUATE PROGRAM',
            'lines': ['跨越专业边界，', '用设计研究未来。'],
        },
        items=[
            {'no': '01 / Positioning', 'title': '产品定位',
             'note': '从完成作品，到提出问题', 'target': 'deck-p3'},
            {'no': '02 / Why US', 'title': '为什么选择美国',
             'note': '重视文化、创新与社会议题', 'target': 'deck-p4'},
            {'no': '03 / SFK Method', 'title': '八步成长方法',
             'note': 'POSITION → FUTURE', 'target': 'deck-p5'},
            {'no': '04 / Advantages', 'title': '五大培养优势',
             'note': '跨学科 · Research · Critique', 'target': 'deck-p6'},
            {'no': '05 / Core Courses', 'title': '重点课程与项目',
             'note': '方向探索与项目落地', 'target': 'deck-p7-8'},
            {'no': '06 / Meta Lab', 'title': 'Meta Lab研究',
             'note': 'Studio · Research · Critique', 'target': 'deck-p9'},
            {'no': '07 / Programs', 'title': '七大特色专业',
             'note': '七大赛道 · 院校匹配', 'target': 'deck-p12-18'},
            {'no': '08 / Journey', 'title': '美研成长路径',
             'note': '完整申请准备', 'target': 'deck-p19'},
        ])),

    # ── P1 扉页：按需求插在「产品总览」与「产品定位」之间，编号 02 ──
    sec('deckGrid', 'deck-p1', H(
        '02', 'US Graduate Elite Program', '从时尚创作，到跨学科研究与创新实践',
        variant='stats', columns=4,
        items=[
            {'value': '7', 'title': '特色赛道'},
            {'value': '5', 'title': '核心培养优势'},
            {'value': '8', 'title': '申请成长步骤'},
            {'value': '20', 'title': '内容页'},
        ])),

    # ── P3 产品定位 ────────────────────────────────────────────
    sec('deckSplit', 'deck-p3', H(
        '03', '产品定位 / POSITIONING', '从设计项目，到跨学科研究与创新实践',
        '美国的时尚研究生教育鼓励学生将设计、技术、社会、文化与商业议题联系起来。',
        note='SFK培养路径：以专业定位为起点，以可验证的研究方法为支撑，通过实验、原型和反思，呈现个人独立创作立场。',
        arrow='→',
        cols=[
            {'eyebrow': 'BEFORE · 作品导向', 'bullets': [
                '• 关注“做出什么”', '• 仅展示造型与视觉结果', '• 在单一设计领域寻找答案']},
            {'eyebrow': 'AFTER · 研究导向', 'bullets': [
                '✓ 提出值得探索的问题', '✓ 研究路径明确，开展实验与实践', '✓ 跨学科视角，形成个人创作方案']},
        ],
        footer='不止创造一个系列，更要回答一个值得探索的问题。')),

    # ── P4 为什么选择美国 ──────────────────────────────────────
    sec('deckGrid', 'deck-p4', H(
        '04', 'WHY US / 申请美国', '在跨学科教育中，重新定义时尚的边界',
        '时尚与技术、材料、影像、社会议题及品牌商业互相影响。美国院校强调研究、实验、个体表达与协作。',
        columns=2,
        items=[
            {'no': '01', 'en': 'INTERDISCIPLINARY', 'title': '跨学科',
             'desc': '打通服装、面料、影像、科技、商业与文化研究。'},
            {'no': '02', 'en': 'RESEARCH', 'title': '研究能力',
             'desc': '从研究问题、案例分析、田野观察到证据建构。'},
            {'no': '03', 'en': 'TECHNOLOGY', 'title': '技术探索',
             'desc': '数字打样、3D、可持续材料、交互与生产技术。'},
            {'no': '04', 'en': 'INNOVATION', 'title': '创新实践',
             'desc': '让个人观点与真实场景结合，形成可讨论的结果。'},
        ])),

    # ── P5 八步成长方法 ────────────────────────────────────────
    sec('deckGrid', 'deck-p5', H(
        '05', 'SFK METHOD / 培养方法', '我们如何培养一个美研申请者？',
        '从 Portfolio Building，到 Research & Innovation.',
        columns=4,
        items=[
            {'no': '1', 'en': 'POSITION', 'title': '专业定位', 'desc': '识别背景与个人优势'},
            {'no': '2', 'en': 'BUILD', 'title': '跨学科建构', 'desc': '建立 Design / Art / Business'},
            {'no': '3', 'en': 'QUESTION', 'title': '提出问题', 'desc': '从现象、社会与文化出发'},
            {'no': '4', 'en': 'CREATE', 'title': '设计实践', 'desc': '构建实验与原型'},
            {'no': '5', 'en': 'RESEARCH', 'title': '研究深化', 'desc': '数据与方法验证'},
            {'no': '6', 'en': 'CONNECT', 'title': '国际连接', 'desc': 'Critique 与国际反馈'},
            {'no': '7', 'en': 'PRESENT', 'title': '申请表达', 'desc': '作品集、文书、面试'},
            {'no': '8', 'en': 'FUTURE', 'title': '升学职业', 'desc': '明确学术与就业方向'},
        ],
        footer='核心逻辑：QUESTION → CREATE → RESEARCH')),

    # ── P6 五大培养优势 ────────────────────────────────────────
    sec('deckGrid', 'deck-p6', H(
        '06', '核心优势 / CORE ADVANTAGES', '五大培养优势',
        '以跨学科研究、技术实验与批判反馈，构建申请的长期竞争力。',
        columns=2,
        items=[
            {'no': '01', 'title': '跨学科创新能力', 'desc': '突破专业边界，形成问题意识',
             'note': 'Design / Art / Technology / Humanity / Business'},
            {'no': '02', 'title': 'AI与新技术实践', 'desc': '让AI工具赋能创新与交互',
             'note': '3D制作、生成式AI与数字设计'},
            {'no': '03', 'title': 'Meta Lab革新机制', 'desc': '从创作到Research-based Practice',
             'note': 'Studio → 研究问题 → 实验 → 反馈'},
            {'no': '04', 'title': '项目+科研双线成果', 'desc': '一个问题，两条成果形式',
             'note': '设计原型、研究方法、证据与结论'},
            {'no': '05', 'title': '多国国际学术反馈', 'desc': '国际导师与专业研究讨论',
             'note': 'Lecture / Critique / 作品表达'},
        ])),

    # ── P7 + P8 重点课程与项目（5 张卡整合成一排）────────────
    {'type': 'deckRow', 'id': 'deck-p7-8', 'no': '07 / 08', 'pages': [
        {'no': '07', 'kicker': '重点课程 / CORE COURSES',
         'title': '重点课程与项目',
         'intro': '五个核心模块，从申请需求到研究结果，逐层建立升学竞争力。',
         'cards': [
             {'en': 'STUDIO', 'title': '专业规划与方向探索',
              'note': '定位背景｜专业选择｜目标院校', 'desc': '建立七赛道申请路径'},
             {'en': 'RESEARCH', 'title': '跨学科创新能力',
              'note': 'Design｜Art｜Tech｜Humanity｜Business', 'desc': '形成跨领域问题意识'},
             {'en': 'PRACTICE', 'title': '自主命题 & 商业实践',
              'note': 'Research｜设计实验｜真实Brief', 'desc': '建立独立判断与实践能力'},
         ]},
        {'no': '08', 'kicker': 'CORE COURSES / PROGRAMS',
         'title': '重点课程与项目（续）',
         'intro': '围绕Meta Lab、国际反馈与申请表达建立可呈现的过程证据。',
         'cards': [
             {'en': 'META LAB', 'title': 'Meta Lab革新机制',
              'note': 'Studio｜Research｜Methodology｜Critique', 'desc': '建立可追溯的实验记录'},
             {'en': 'GLOBAL CRITIQUE', 'title': '国际学术与申请表达',
              'note': '海外教授｜作品集网站｜SP｜面试', 'desc': '让研究能被清晰说明'},
         ]},
    ]},

    # ── P9 Meta Lab ────────────────────────────────────────────
    sec('deckGrid', 'deck-p9', H(
        '09', 'META LAB / RESEARCH LAB', '不止 Studio，更是一场研究实验',
        '从设计项目走向 Research-based Practice：研究问题、方法、证据与讨论。',
        header={
            'eyebrow': 'META LAB', 'title': 'STUDIO + RESEARCH + CRITIQUE',
            'desc': '将项目推进到研究问题、方法、实验、数据、证据与讨论。',
        },
        columns=3,
        items=[
            {'en': 'STUDIO', 'title': '从创意进入跨学科制作', 'desc': '设计、技术、人文与商业'},
            {'en': 'RESEARCH', 'title': '把设计过程转化为可被讨论的研究', 'desc': 'Question · Method · Evidence'},
            {'en': 'CRITIQUE', 'title': '在多重视角中持续修正', 'desc': '海外教授、行业导师与团队反馈'},
        ])),

    # ── P10 项目 + 科研 ────────────────────────────────────────
    sec('deckSplit', 'deck-p10', H(
        '10', '项目+科研 / PROJECT + RESEARCH', '一个项目，可以走得更远',
        '围绕同一个研究问题，同时发展设计实践与学术研究两条成果路径。',
        cols=[
            {'eyebrow': 'DESIGN PRACTICE', 'title': '设计实践', 'sub': '设计概念与实体结果',
             'bullets': ['✓ Research Process', '✓ Prototype / Collection',
                         '✓ Interaction / Material', '✓ Final Outcome']},
            {'eyebrow': 'ACADEMIC RESEARCH', 'title': '学术研究', 'sub': '研究论证与验证',
             'bullets': ['✓ Research Question', '✓ Methodology',
                         '✓ Experiment / Evidence', '✓ Analysis / Paper']},
        ],
        footer='Design makes an idea tangible. Research makes an idea arguable.')),

    # ── P11 国际学术现场 ───────────────────────────────────────
    sec('deckGrid', 'deck-p11', H(
        '11', '国际学术 / GLOBAL CRITIQUE', '从 Studio，到国际学术现场',
        '通过海外教授、冬夏校、国际Lecture / Critique与多元专业反馈，学习如何阐述设计、研究与创新。',
        header={'tags': ['GLOBAL / LECTURE', 'INTERNATIONAL / CRITIQUE']},
        columns=5,
        items=[
            {'en': 'LEARN', 'title': '海外教授授课'},
            {'en': 'DISCUSS', 'title': 'Lecture / Critique'},
            {'en': 'EXPERIENCE', 'title': '冬夏校与国际项目'},
            {'en': 'REVIEW', 'title': '多维专业反馈'},
            {'en': 'CONNECT', 'title': '国际导师与同行交流'},
        ])),

    # ── P12–P18 七大赛道（同一区域、标签筛选）────────────────
    sec('deckTracks', 'deck-p12-18', H(
        '12', '院校与专业推荐 / SCHOOL & PROGRAM RECOMMENDATIONS',
        '七大赛道，匹配代表性美研项目',
        '按七大时尚赛道匹配项目，具体选校结合学生背景与作品方向个性化规划。',
        tabs=TABS, tracks=TRACKS)),

    # ── P19 成长路径 ───────────────────────────────────────────
    sec('deckGrid', 'deck-p19', H(
        '13', '成长路径 / LEARNING JOURNEY', '你的美研成长路径',
        '专业定位 → 跨学科建构 → 独立研究 → 商业实践 → Meta Lab → 国际反馈 → 申请表达 → 未来发展',
        columns=4,
        items=[
            {'no': '01', 'title': '专业定位', 'desc': '背景洞察与目标规划'},
            {'no': '02', 'title': '跨学科建构', 'desc': 'Design × Art × Business'},
            {'no': '03', 'title': '独立研究', 'desc': '研究命题与方法'},
            {'no': '04', 'title': '商业实践', 'desc': '真实Brief与设计产出'},
            {'no': '05', 'title': 'Meta Lab', 'desc': 'Studio / Research / Critique'},
            {'no': '06', 'title': '国际反馈', 'desc': '海外教授与多维评价'},
            {'no': '07', 'title': '申请表达', 'desc': 'Portfolio / SP / 面试'},
            {'no': '08', 'title': '未来发展', 'desc': '升学与职业衔接'},
        ],
        footer={
            'statement': '美研申请，不止一套作品集',
            'keywords': '跨学科 · 研究能力 · 技术探索 · 创新实践 · 学术表达 · 国际视野 · 职业实践',
        })),

    # ── P20 收尾 ───────────────────────────────────────────────
    sec('deckStatement', 'deck-p20', H(
        '14', 'US GRADUATE / CREATE WHAT’S NEXT', '跨越专业边界，用设计研究未知。',
        subtitle='Think across disciplines. Research through design. Create what’s next.',
        note='在美国时尚研究生申请中，作品集不只体现完成度，更呈现设计思考、文化研究、材料实验、研究方法以及未来的发展潜力。',
        pillars=['How I Think', 'What I Investigate', 'What I Can Create Next'],
        footer='美国时尚研究生 · 七大赛道')),

    # ── 末尾：课程模块 · CURRICULUM（两个课程目录分类的筛选结果）──
    build_curriculum_section(),
]


# ── 文本级插入：只改 changemakers 对象的 detail 键 ──────────────
KEY_RE = re.compile(r'\s*"((?:[^"\\]|\\.)*)"\s*:\s*')


def object_span(text, start):
    """start 指向 '{'，返回匹配 '}' 的索引（不含）。跳过字符串内的括号。"""
    depth, in_str, esc = 0, False, False
    for i in range(start, len(text)):
        c = text[i]
        if in_str:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == '"':
                in_str = False
            continue
        if c == '"':
            in_str = True
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return i
    raise ValueError('unclosed object')


def top_level_keys(text, start, end):
    """返回 [(key, key_start, value_end)]，只取对象顶层的键。"""
    out, i, dec = [], start + 1, json.JSONDecoder()
    while i < end:
        while i < end and (text[i].isspace() or text[i] == ','):
            i += 1
        if i >= end or text[i] == '}':
            break
        m = KEY_RE.match(text, i)
        if not m:
            raise ValueError('unexpected token near %d' % i)
        key = json.loads('"' + m.group(1) + '"')
        _, value_end = dec.raw_decode(text, m.end())
        out.append((key, i, value_end))
        i = value_end
    return out


def main():
    with io.open(TARGET, encoding='utf-8') as f:
        text = f.read()
    before = json.loads(text)
    baseline = copy.deepcopy(before)
    next(p for p in baseline['longform'] if p['id'] == PRODUCT_ID).pop('detail', None)

    needle = '"id": "%s"' % PRODUCT_ID
    anchor = text.find(needle)
    if anchor < 0:
        raise SystemExit('未找到产品 %s' % PRODUCT_ID)
    start = text.rfind('{', 0, anchor)
    end = object_span(text, start)
    keys = top_level_keys(text, start, end)
    names = [k[0] for k in keys if k[0] != 'detail']
    if 'detail' in [k[0] for k in keys]:
        # 幂等：删除旧的 detail 键（连同其前面的逗号），再重新插入
        k_start = next(k[1] for k in keys if k[0] == 'detail')
        k_end = next(k[2] for k in keys if k[0] == 'detail')
        cut = k_start
        j = cut - 1
        while j > start and text[j].isspace():
            j -= 1
        if text[j] == ',':
            cut = j
        text = text[:cut] + text[k_end:]
        end = object_span(text, start)
        keys = top_level_keys(text, start, end)

    detail = {'sections': SECTIONS}
    block = json.dumps(detail, ensure_ascii=False, indent=2)
    block = '\n'.join(('      ' + line) if n else line
                      for n, line in enumerate(block.split('\n')))
    prefix = text[:end].rstrip()
    text = prefix + ',\n      "detail": ' + block + '\n    ' + text[end:]

    after = json.loads(text)
    # 断言：除新增 detail 外，整份数据的所有键与值逐字等价
    probe = copy.deepcopy(after)
    prod = next(p for p in probe['longform'] if p['id'] == PRODUCT_ID)
    assert 'detail' in prod, 'detail 未写入'
    assert set(prod.keys()) - {'detail'} == set(names), '原有顶层键发生变化'
    del prod['detail']
    assert probe == baseline, '除 detail 外的数据被改动，已中止'
    assert len(detail['sections']) == 14, '分区数量异常'
    assert not any(s['type'] == 'curriculum' for s in detail['sections']), '旧版课程模块区仍残留'
    course_sections = [s for s in detail['sections'] if s['type'] == 'courseCards']
    assert len(course_sections) == 1, 'CURRICULUM 区域重复添加或缺失'
    assert course_sections[0] is detail['sections'][-1], 'CURRICULUM 区域必须位于末尾'
    for g in course_sections[0]['groups']:
        assert g['emptyNote'], '缺少空分类说明'
        titles = [c['title'] for c in g['cards']]
        assert len(titles) == len(set(titles)), '课程卡片重复'
    # 区域编号：复合编号（07 / 08）按占用号展开，整体必须是从 1 起连续、无重复、无跳号
    numbers = []
    for s in detail['sections']:
        if 'no' in s:
            numbers.extend(int(n) for n in re.findall(r'\d+', s['no']))
    assert numbers == list(range(1, len(numbers) + 1)), '区域编号不连续或重复：%s' % numbers

    with io.open(TARGET, 'w', encoding='utf-8') as f:
        f.write(text)

    print('已写入 %s.detail.sections：%d 个区域' % (PRODUCT_ID, len(detail['sections'])))
    print('页序：' + ' → '.join(s.get('no', '课程模块') for s in detail['sections']))
    print('赛道标签 %d 个 / 赛道内容 %d 组（每组 %d 所院校）' % (
        len(TABS), len(TRACKS), min(len(t['schools']) for t in TRACKS)))
    cg = course_sections[0]['groups']
    print('课程模块：' + ' / '.join('%s %d 门' % (g['label'], len(g['cards'])) for g in cg))
    print('其他数据：逐键比对通过，未改动')


if __name__ == '__main__':
    main()
