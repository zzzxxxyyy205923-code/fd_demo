# -*- coding: utf-8 -*-
"""生成 fd_demo/assets/js/offers.js（window.SFK_OFFERS）

输入：offers_fashion.json（扁平行数组：年份 / 学校名称(中文) / 学校名称(英文) / 国家标签 / offer数量）
输出：OfferSection 所需结构 { hero, rows, filters, seasonFilters, groups }

1) 申请季合并：同一院校 + 同一年份下，Spring 行的数量并入该年份的 Fall，
   筛选标签只保留 24Fall / 25Fall / 26Fall。
2) 数字高亮（hl=1）：2026 US News 世界大学排名前 30 + 指定院校名单
   （美国常春藤盟校 / 文理学院等）。命中后该院校卡片数字走
   .offer-card__count--hl 样式（SFK 粉 + 光晕，等价艺术人文站 brand 高亮）。

用法：python3 tools/gen_offers_fashion.py [源JSON路径]
"""
import json
import re
import sys
from collections import OrderedDict

DEFAULT_SRC = '/var/folders/x3/xm6j4bsj7mjcqmyfpt6g_26w0000gn/T/codebuddy-dropped-files/b8acb66a-b1ee-448f-8df2-09a2e1e9d7f3/offers_fashion.json'
DST = '/Users/szhan111/Documents/GitHub/fd_demo/assets/js/offers.js'

# 国家标签顺序固定为：美国、英国、港新澳、日韩、欧洲、其它
FILTERS = [
    ('US', '美国'),
    ('UK', '英国'),
    ('HK_SG', '港新澳'),
    ('JP', '日韩'),
    ('EU', '欧洲'),
    ('OTHER', '其它'),
]
LABEL2ID = {label: gid for gid, label in FILTERS}
ORDER = [gid for gid, _ in FILTERS]

# ── 数字高亮名单 ────────────────────────────────────────────────────────────
# 2026-2027 U.S. News 世界大学排名 Top 30（含并列）
USNEWS_TOP30 = [
    '哈佛大学', '麻省理工学院', '斯坦福大学', '牛津大学', '剑桥大学', '清华大学',
    '加州大学伯克利分校', '耶鲁大学', '伦敦大学学院', '哥伦比亚大学',
    '加州大学洛杉矶分校', '华盛顿大学', '康奈尔大学', '帝国理工学院', '普林斯顿大学',
    '新加坡国立大学', '约翰斯霍普金斯大学', '宾夕法尼亚大学', '北京大学', '多伦多大学',
    '密歇根大学安娜堡分校', '加州大学旧金山分校', '加州理工学院', '加州大学圣地亚哥分校',
    '芝加哥大学', '西北大学', '南洋理工大学', '香港中文大学', '墨尔本大学', '杜克大学',
]
# 美国 · 常春藤盟校
IVY = ['哈佛大学', '耶鲁大学', '普林斯顿大学', '哥伦比亚大学', '宾夕法尼亚大学',
       '布朗大学', '达特茅斯学院', '康奈尔大学']
# 美国 · 文理学院（Liberal Arts Colleges）
LAC = ['威廉姆斯学院', '阿默斯特学院', '斯沃斯莫尔学院', '鲍登学院', '波莫纳学院',
       '韦尔斯利学院', '明德学院', '卡尔顿学院', '戴维森学院', '格林内尔学院',
       '哈弗福德学院', '科尔比学院', '史密斯学院', '巴纳德学院', '瓦萨学院',
       '里德学院', '欧柏林学院', '汉密尔顿学院', '三一学院', '科尔盖特大学',
       '拉斐特学院', '巴德学院', '里士满大学', '麦卡莱斯特学院', '斯基德莫尔学院',
       '迪金森学院', '惠特曼学院', '曼荷莲学院', '布林莫尔学院', '丹尼森大学',
       '圣奥拉夫学院', '惠顿学院', '巴克内尔大学', '匹泽学院', '西方学院']
# 指定院校
EXPLICIT = {
    'US': ['罗德岛设计学院', '纽约大学', '塔夫茨大学', '卡内基梅隆大学',
           '北卡罗莱纳大学教堂山分校', '北卡罗来纳大学教堂山分校'],
    'UK': ['伦敦艺术大学', '皇家艺术学院'],
    'HK_SG': ['香港大学', '香港中文大学'],
    'JP': ['武藏野美术大学', '多摩美术大学', '东京造形大学', '女子美术大学', '日本大学'],
}
# 名单按分组生效（Top 30 为全球榜，不限分组）
HL_BY_GROUP = {
    'US': set(USNEWS_TOP30) | set(IVY) | set(LAC) | set(EXPLICIT['US']),
    'UK': set(USNEWS_TOP30) | set(EXPLICIT['UK']),
    'HK_SG': set(USNEWS_TOP30) | set(EXPLICIT['HK_SG']),
    'JP': set(USNEWS_TOP30) | set(EXPLICIT['JP']),
    'EU': set(USNEWS_TOP30),
    'OTHER': set(USNEWS_TOP30),
}

src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
rows_raw = json.load(open(src, encoding='utf-8'))

buckets = OrderedDict()
total = 0
for it in rows_raw:
    zh = (it.get('学校名称(中文)') or '').strip()
    en = (it.get('学校名称(英文)') or '').strip()
    tag = (it.get('国家标签') or '').strip()
    gid = LABEL2ID.get(tag, 'OTHER')
    m = re.fullmatch(r'(\d{2})(Fall|Spring)', (it.get('年份') or '').strip())
    if not zh or not m:
        continue
    yy = m.group(1)
    n = int(it.get('offer数量') or 0)
    total += n
    b = buckets.setdefault((gid, zh), {'en': en, 'counts': {}, 'label': {}})
    if not b['en']:
        b['en'] = en
    # Spring 合并进同年 Fall：共用一个计数槽与一个 YYFall 标签
    b['counts'][yy] = b['counts'].get(yy, 0) + n
    b['label'][yy] = '%sFall' % yy

groups = OrderedDict()
hl_hit = OrderedDict()
for gid, zh in buckets:
    b = buckets[(gid, zh)]
    years = sorted(b['counts'].keys())
    seasons = [b['label'][y] for y in years]
    season_counts = OrderedDict((b['label'][y], str(b['counts'][y])) for y in years)
    cnt = sum(b['counts'][y] for y in years)
    hl = 1 if zh in HL_BY_GROUP.get(gid, set()) else 0
    if hl:
        hl_hit.setdefault(gid, []).append(zh)
    groups.setdefault(gid, []).append(OrderedDict([
        ('count', str(cnt)),
        ('zh', zh),
        ('en', b['en']),
        ('tags', []),
        ('seasons', seasons),
        ('seasonCounts', season_counts),
        ('hl', hl),
    ]))

ordered = OrderedDict()
for gid in ORDER:
    lst = groups.get(gid, [])
    lst.sort(key=lambda r: int(r['count']), reverse=True)
    ordered[gid] = lst

school_total = sum(len(v) for v in ordered.values())
season_filters = sorted({s for v in ordered.values() for r in v for s in r['seasons']})

data = OrderedDict([
    ('hero', OrderedDict([
        ('eyebrow', 'OFFERS 2024-2026'),
        ('title', 'offer展示'),
        ('desc', '2024–2026 三个申请季累计斩获 %d 枚 offer，覆盖美国、英国、港新澳、日韩、欧洲及全球 %d 所艺术院校与综合大学。' % (total, school_total)),
    ])),
    ('rows', 4),
    ('filters', [OrderedDict([('id', gid), ('label', label)]) for gid, label in FILTERS]),
    ('seasonFilters', season_filters),
    ('groups', ordered),
])

body = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
header = (
    '/* OFFER成果数据（SFK 时尚科系）\n'
    '   来源：offers_fashion.json（2024–2026 申请季，累计 %d 枚 offer / %d 所院校）\n'
    '   结构与字段同 OfferSection：{ hero, rows, filters, seasonFilters, groups }\n'
    '   申请季合并规则：同一院校同一年份的 Spring 已并入该年份 Fall，筛选标签仅保留 %s；\n'
    '   hl=1 的院校（US News 2026 世界排名 Top30 / 常春藤 / 文理学院 / 指定院校）数字走高亮样式。 */\n'
) % (total, school_total, ' / '.join(season_filters))

open(DST, 'w', encoding='utf-8').write(header + 'window.SFK_OFFERS = ' + body + ';\n')

print('total offers:', total, '| schools:', school_total, '| seasonFilters:', season_filters)
for gid in ORDER:
    print('  %-6s %2d 所  hl %d：%s' % (gid, len(ordered[gid]),
                                    len(hl_hit.get(gid, [])), '、'.join(hl_hit.get(gid, []))))
