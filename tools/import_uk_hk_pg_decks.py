#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把「英国研究生未来成长计划」(longform2) 与「香港研究生升学计划」(longform3)
两份 pptx 的逐页内容写入 course-products.json 中各自产品的 detail.sections。

与前例 tools/import_us_pg_deck.py 完全同构：
    - 权威来源为 pptx（原始 <a:t> / shape 文本），同目录「逐页文案.docx」作结构化输入与交叉校验；
    - 复用前例的 H() / sec() / school() / track() / build_curriculum_section() 与文本级插入工具；
    - 只在各产品对象上新增 / 更新顶层 detail 键，其它键逐字不动，可重复执行；
    - 展示顺序：P2 总览导航(01) → P1 扉页指标(02) → 逐页内容 → 收尾主张 → 末尾筛选课程模块；
    - 合并页占复合编号，区域 no 按展示顺序连续、无重复、无跳号；
    - 末尾 CURRICULUM 从两个课程分类筛「招募中 + 适配研究生」卡片，与前例共用同一份结果；
    - 区域类型全部落在前例的 deckNav / deckGrid / deckSplit / deckRow / deckTracks /
      deckStatement / courseCards 渲染器内，因此自动继承统一卡片设计规范，无需新增样式。

用法：
    python3 tools/import_uk_hk_pg_decks.py
"""

import copy
import glob
import io
import json
import os
import re
import sys

from docx import Document
from pptx import Presentation

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import import_us_pg_deck as base

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, 'assets', 'data', 'course-products.json')
SOURCE_BASE = os.path.expanduser(
    '~/iCloud云盘（归档）/Desktop/SFK/SFK 教研管理/高端美研产品/'
    'SFK数据库搭建&AI智能体/时尚科系/长线旗舰产品')

DECKS = [
    {'id': 'longform2', 'dir': '英国研究生未来成长计划', 'pages': 20, 'expect': 15},
    {'id': 'longform3', 'dir': '香港研究生升学计划', 'pages': 22, 'expect': 16},
]


# ── 文档读取 ────────────────────────────────────────────────
def source_files(folder):
    d = os.path.join(SOURCE_BASE, folder)
    pptx = glob.glob(os.path.join(d, '*.pptx'))
    docx = glob.glob(os.path.join(d, '*.docx'))
    assert len(pptx) == 1 and len(docx) == 1, '文档数量异常：%s' % d
    return pptx[0], docx[0]


def docx_pages(path):
    """按「第 NN 页｜标题」切分，返回 ({页号: 逐条文案}, {页号: 页标题})。"""
    pages, titles, cur = {}, {}, None
    for p in Document(path).paragraphs:
        t = p.text.strip()
        if not t:
            continue
        m = re.match(r'^第\s*(\d+)\s*页[｜|](.*)$', t)
        if m:
            cur = int(m.group(1))
            pages[cur] = []
            titles[cur] = m.group(2).strip()
        elif cur is not None:
            pages[cur].append(t)
    return pages, titles


def pptx_runs(path):
    """pptx 全部 shape 的 run 原文，用于覆盖校验。"""
    out = {}
    for i, slide in enumerate(Presentation(path).slides, 1):
        texts = []
        for sh in slide.shapes:
            if not sh.has_text_frame:
                continue
            for para in sh.text_frame.paragraphs:
                for run in para.runs:
                    t = run.text.strip()
                    if t:
                        texts.append(t)
        out[i] = texts
    return out


# ── 小工具 ──────────────────────────────────────────────────
def kv(line):
    a, _, b = line.partition('｜')
    return a.strip(), b.strip()


def pairs(lines, start, count):
    return [(lines[start + 2 * i], lines[start + 2 * i + 1]) for i in range(count)]


def triplets(lines, start, count, keys=('no', 'title', 'desc')):
    return [dict(zip(keys, lines[start + 3 * i:start + 3 * i + 3])) for i in range(count)]


def numbered_item(line):
    """「01 标题｜说明」→ {no,title,desc}"""
    m = re.match(r'^(\d{2})\s+(.+?)｜(.+)$', line)
    assert m, '编号条目格式异常：%s' % line
    return {'no': m.group(1), 'title': m.group(2).strip(), 'desc': m.group(3).strip()}


def en_item(line, no=None):
    """「EN｜说明」→ {no,title:EN,desc:说明}，沿用前例 P6 的编号卡层级。"""
    en, desc = kv(line)
    item = {'title': en, 'desc': desc}
    if no:
        item['no'] = no
    return item


def parse_school(raw):
    """「伦敦时装学院 LCF」/「西敏斯特大学 University of Westminster」→ (cn,en,abbr)"""
    m = re.match(r'^(.+?)\s+([A-Za-z][A-Za-z\s&.\-]*)$', raw.strip())
    if not m:
        return raw.strip(), raw.strip(), raw.strip()[:2]
    cn, en = m.group(1).strip(), m.group(2).strip()
    # 缩写型院校（LCF / RCA / CSM）只保留缩写方块，避免与英文名重复
    if len(en) <= 4 and en.isupper():
        return cn, '', en
    abbr = ''.join(w[0] for w in re.split(r'\s+', en) if w).upper()[:3]
    return cn, en, abbr


def norm(s):
    return re.sub(r'\s+', '', s)


# ── 英国：20 页 ─────────────────────────────────────────────
def uk_tracks(pg):
    tabs, tracks = [], []
    for n in range(10, 17):
        L = pg[n]
        d = {}
        for line in L:
            m = re.match(r'^([^：｜]+)[：｜]\s*(.*)$', line)
            if m:
                d.setdefault(m.group(1).strip(), m.group(2).strip())
        name = d.get('赛道', '')
        en = d.get('研究主题', '')
        no = '%02d' % (n - 9)
        tabs.append({'no': no, 'name': name})
        cn1, en1, ab1 = parse_school(d.get('代表院校一', ''))
        cn2, en2, ab2 = parse_school(d.get('代表院校二', ''))
        schools = [
            base.school(cn1, en1, ab1, d.get('课程一', ''), d.get('课程说明一', '')),
            base.school(cn2, en2, ab2, d.get('课程二', ''), d.get('课程说明二', '')),
        ]
        t = {'no': no, 'name': name, 'en': en,
             'theme': d.get('研究关键词', ''), 'schools': schools,
             'note': '作品集建议：' + d.get('作品集建议', '')}
        tracks.append(t)
    return tabs, tracks


def uk_sections(pg, titles=None):
    S = []

    # P2 总览导航（8 张卡）
    L = pg[2]
    nav = triplets(L, 3, 8, keys=('no', 'title', 'note'))
    targets = ['deck-p3', 'deck-p4', 'deck-p5', 'deck-p6', 'deck-p7',
               'deck-p8', 'deck-p10-16', 'deck-p18']
    for item, target in zip(nav, targets):
        item['target'] = target
    S.append(base.sec('deckNav', 'deck-p2', base.H(
        '01', L[0], L[1], intro=L[2],
        aside={'eyebrow': 'UK POSTGRADUATE PROGRAM',
               'lines': ['Explore Your Direction.', 'Build Your Practice.', 'Shape Your Future.']},
        items=nav)))

    # P1 扉页：黄色小标题 + 页底 4 个指标（与前例同样的取舍）
    L = pg[1]
    S.append(base.sec('deckGrid', 'deck-p1', base.H(
        '02', 'UK POSTGRADUATE PROGRAM', L[2],
        subtitle=L[3], variant='stats', columns=4,
        items=[{'value': L[4 + 2 * i], 'title': L[5 + 2 * i]} for i in range(4)])))

    # P3 产品定位 BEFORE / AFTER
    L = pg[3]
    b_k, b_t = kv(L[3])
    a_k, a_t = kv(L[5])
    S.append(base.sec('deckSplit', 'deck-p3', base.H(
        '03', L[0], L[1], L[2], arrow='→',
        cols=[
            {'eyebrow': b_k, 'title': b_t, 'bullets': [L[4]]},
            {'eyebrow': a_k, 'title': a_t, 'bullets': [L[6]]},
        ],
        footer=L[7])))

    # P4 为什么选择英国（4 项）
    L = pg[4]
    items = []
    for i, (label, desc) in enumerate(pairs(L, 3, 4), 1):
        en, title = kv(label)
        items.append({'no': '%02d' % i, 'en': en, 'title': title, 'desc': desc})
    S.append(base.sec('deckGrid', 'deck-p4', base.H(
        '04', L[0], L[1], L[2], columns=2, items=items)))

    # P5 SFK 方法（7 步）
    L = pg[5]
    S.append(base.sec('deckGrid', 'deck-p5', base.H(
        '05', L[0], L[1], L[2], columns=4,
        items=triplets(L, 3, 7), footer=L[24])))

    # P6 五大培养优势
    L = pg[6]
    items = []
    for label, desc in pairs(L, 2, 5):
        m = re.match(r'^(\d{2})\s+(.+)$', label)
        items.append({'no': m.group(1), 'title': m.group(2), 'desc': desc})
    S.append(base.sec('deckGrid', 'deck-p6', base.H(
        '06', L[0], L[1], columns=2, items=items)))

    # P7 重点课程（5 卡一排，沿用前例 deckRow 骨架）
    L = pg[7]
    cards = [{'en': c['no'], 'title': c['title'], 'note': c['desc']}
             for c in triplets(L, 3, 5)]
    S.append({'type': 'deckRow', 'id': 'deck-p7', 'no': '07', 'pages': [{
        'no': '07', 'kicker': L[0], 'title': L[1], 'intro': L[2], 'cards': cards,
    }]})

    # P8 商业实践 × 海外教授（双栏对照）
    L = pg[8]
    cols = []
    for label, desc in pairs(L, 3, 2):
        cn, en = kv(label)
        cols.append({'eyebrow': en, 'title': cn, 'bullets': [desc]})
    S.append(base.sec('deckSplit', 'deck-p8', base.H(
        '08', L[0], L[1], L[2], cols=cols)))

    # P9 项目体验（3 项）
    L = pg[9]
    items = []
    for i in range(3):
        en = L[3 + 2 * i]
        cn, desc = kv(L[4 + 2 * i])
        items.append({'en': en, 'title': cn, 'desc': desc})
    S.append(base.sec('deckGrid', 'deck-p9', base.H(
        '09', L[0], L[1], L[2], columns=3, items=items)))

    # P10–P16 七大赛道（一个区域、7 个标签）
    tabs, tracks = uk_tracks(pg)
    S.append(base.sec('deckTracks', 'deck-p10-16', base.H(
        '10', '七大赛道 / SEVEN PATHWAYS', '七大赛道，匹配代表性英研项目',
        '按专业研究与实际作品集需求匹配英国代表性硕士课程。',
        tabs=tabs, tracks=tracks)))

    # P17 优秀成长案例
    L = pg[17]
    S.append(base.sec('deckGrid', 'deck-p17', base.H(
        '11', L[0], L[1], L[2], columns=3,
        items=[{'title': a, 'desc': b} for a, b in pairs(L, 3, 3)])))

    # P18 成长路径（7 步）
    L = pg[18]
    S.append(base.sec('deckGrid', 'deck-p18', base.H(
        '12', L[0], L[1], columns=4, items=triplets(L, 2, 7))))

    # P19 申请收获（6 项）
    L = pg[19]
    items = []
    for i, (label, desc) in enumerate(pairs(L, 2, 6), 1):
        en, title = kv(label)
        items.append({'no': '%02d' % i, 'en': en.split(' ', 1)[-1],
                      'title': title, 'desc': desc})
    S.append(base.sec('deckGrid', 'deck-p19', base.H(
        '13', L[0], L[1], columns=3, items=items)))

    # P20 收尾主张
    L = pg[20]
    pillars = [p.strip() for p in re.split(r'[｜|]', L[4]) if p.strip()]
    S.append(base.sec('deckStatement', 'deck-p20', base.H(
        '14', L[0], L[1], subtitle=L[2], note=L[3],
        pillars=pillars, footer='英国研究生未来成长计划')))

    S.append(base.build_curriculum_section())
    return S


# ── 香港：22 页 ─────────────────────────────────────────────
def hk_tracks(pg):
    tabs, tracks = [], []
    for n in range(12, 19):
        L = pg[n]
        m = re.match(r'^(\d{2})\s*/\s*07｜(.+?)\s*·\s*(.+)$', L[0])
        assert m, '赛道页标题格式异常：%s' % L[0]
        no, name, en = m.group(1), m.group(2).strip(), m.group(3).strip()
        tabs.append({'no': no, 'name': name})
        d = {}
        for line in L[1:]:
            k, _, v = line.partition('｜')
            d.setdefault(k.strip(), v.strip())
        schools = []
        for key in ('代表项目 A', '代表项目 B'):
            raw = d.get(key, '')
            parts = [p.strip() for p in raw.split('｜')]
            uni = parts[0] if parts else ''
            program = parts[1] if len(parts) > 1 else ''
            schools.append({
                'cn': uni, 'en': '', 'abbr': uni[:1], 'program': program,
                'tag': '代表项目' if key.endswith(' A') else '关联项目', 'desc': '',
            })
        t = {'no': no, 'name': name, 'en': en,
             'theme': d.get('核心能力', ''), 'schools': schools,
             'note': '｜'.join(x for x in (
                 '作品集建议：' + d.get('作品集建议', ''),
                 '匹配说明：' + d.get('匹配说明', '')) if x)}
        tracks.append(t)
    return tabs, tracks


def hk_sections(pg, titles):
    S = []
    T = titles

    # P2 总览导航（8 张卡）
    L = pg[2]
    targets = ['deck-p3', 'deck-p4', 'deck-p5', 'deck-p6', 'deck-p7-8',
               'deck-p9', 'deck-p10', 'deck-p12-18']
    nav = []
    for i in range(8):
        title, note = kv(L[1 + i])
        m = re.match(r'^(\d{2})\s+(.+)$', title)
        nav.append({'no': m.group(1) + ' / ' + m.group(2),
                    'title': m.group(2), 'note': note, 'target': targets[i]})
    S.append(base.sec('deckNav', 'deck-p2', base.H(
        '01', 'HONG KONG FASHION / POSTGRADUATE PROGRAM', L[0],
        aside={'eyebrow': 'HONG KONG POSTGRADUATE PROGRAM',
               'lines': ['Target Your Direction.', 'Build Your Practice.', 'Step Into Your Future.']},
        items=nav)))

    # P1 扉页：黄色小标题 + 页底 4 个指标（数值 / 标签取自 pptx P01）
    L = pg[1]
    stats = [('7', '个时尚赛道'), ('5', '个核心课程模块'),
             ('4', '类项目呈现'), ('8', '阶段成长路径')]
    S.append(base.sec('deckGrid', 'deck-p1', base.H(
        '02', 'HONG KONG POSTGRADUATE PROGRAM', kv(L[0])[1],
        subtitle=L[2], variant='stats', columns=4,
        items=[{'value': v, 'title': t} for v, t in stats])))

    # P3 定位 BEFORE / AFTER
    L = pg[3]
    p_k, p_t = kv(L[0])
    b_k, b_t = kv(L[2])
    a_k, a_t = kv(L[3])
    S.append(base.sec('deckSplit', 'deck-p3', base.H(
        '03', p_k, T[3], p_t, note=L[1], arrow='→',
        cols=[
            {'eyebrow': b_k, 'title': '原有逻辑',
             'bullets': [x for x in re.split('[；;]', b_t) if x]},
            {'eyebrow': a_k, 'title': '目标导向',
             'bullets': [x for x in re.split('[；;]', a_t) if x]},
        ])))

    # P4 为什么选择香港（4 项）
    L = pg[4]
    k, sub = kv(L[0])
    items = [en_item(L[1 + i], '%02d' % (i + 1)) for i in range(4)]
    S.append(base.sec('deckGrid', 'deck-p4', base.H(
        '04', k, T[4], sub, columns=2, items=items)))

    # P5 SFK 方法（8 步）
    L = pg[5]
    k, sub = kv(L[0])
    S.append(base.sec('deckGrid', 'deck-p5', base.H(
        '05', k, T[5], sub, columns=4,
        items=[numbered_item(L[1 + i]) for i in range(8)])))

    # P6 五大培养优势
    L = pg[6]
    k, sub = kv(L[0])
    S.append(base.sec('deckGrid', 'deck-p6', base.H(
        '06', k, T[6], sub, columns=2,
        items=[numbered_item(L[1 + i]) for i in range(5)])))

    # P7 + P8 重点课程（3 + 2 张卡，与前例 deckRow 一致）
    L7, L8 = pg[7], pg[8]
    k7, sub7 = kv(L7[0])
    k8, sub8 = kv(L8[0])
    cards7 = []
    for i in range(3):
        title, desc = kv(L7[1 + i])
        cards7.append({'en': '%02d' % (i + 1), 'title': title, 'note': desc})
    cards8 = []
    for i in range(2):
        title, desc = kv(L8[1 + i])
        cards8.append({'en': '%02d' % (i + 4), 'title': title, 'note': desc})
    S.append({'type': 'deckRow', 'id': 'deck-p7-8', 'no': '07 / 08', 'pages': [
        {'no': '07', 'kicker': k7, 'title': T[7], 'intro': sub7, 'cards': cards7},
        {'no': '08', 'kicker': k8, 'title': T[8],
         'intro': sub8 + '｜' + L8[3], 'cards': cards8},
    ]})

    # P9 香港在地学习（4 项）
    L = pg[9]
    k, sub = kv(L[0])
    S.append(base.sec('deckGrid', 'deck-p9', base.H(
        '09', k, T[9], sub, columns=2,
        items=[en_item(L[1 + i], '%02d' % (i + 1)) for i in range(4)])))

    # P10 项目体验（3 项）
    L = pg[10]
    k, sub = kv(L[0])
    S.append(base.sec('deckGrid', 'deck-p10', base.H(
        '10', k, T[10], sub, subtitle='从屏幕到产品，从产品到空间', columns=3,
        items=[en_item(L[1 + i]) for i in range(3)], footer=L[4])))

    # P11 作品集（4 项）
    L = pg[11]
    k, sub = kv(L[0])
    S.append(base.sec('deckGrid', 'deck-p11', base.H(
        '11', k, T[11], sub, columns=2,
        items=[en_item(L[1 + i], '%02d' % (i + 1)) for i in range(4)],
        footer=L[5])))

    # P12–P18 七大赛道（同一区域、7 个标签筛选）
    tabs, tracks = hk_tracks(pg)
    S.append(base.sec('deckTracks', 'deck-p12-18', base.H(
        '12', '院校与专业推荐 / SCHOOL & PROGRAM RECOMMENDATIONS', T[12],
        tabs=tabs, tracks=tracks)))

    # P19 案例展示
    L = pg[19]
    k, sub = kv(L[0])
    items = []
    for i in range(3):
        title, desc = kv(L[1 + i])
        items.append({'title': title, 'desc': desc})
    S.append(base.sec('deckGrid', 'deck-p19', base.H(
        '13', k, T[19], sub, columns=3, items=items, note=L[4])))

    # P20 成长路径（8 步）
    L = pg[20]
    k, sub = kv(L[0])
    S.append(base.sec('deckGrid', 'deck-p20', base.H(
        '14', k, T[20], sub, columns=4,
        items=[numbered_item(L[1 + i]) for i in range(8)])))

    # P21 核心规划（6 项）
    L = pg[21]
    k, sub = kv(L[0])
    S.append(base.sec('deckGrid', 'deck-p21', base.H(
        '15', k, T[21], sub, columns=3,
        items=[en_item(L[1 + i], '%02d' % (i + 1)) for i in range(6)])))

    # P22 收尾主张
    L = pg[22]
    pillars = [p.strip() for p in L[2].split('｜') if p.strip()]
    S.append(base.sec('deckStatement', 'deck-p22', base.H(
        '16', 'HONG KONG POSTGRADUATE PROGRAM', T[22],
        subtitle=L[0], note=L[1], pillars=pillars,
        footer='咨询课程顾问 / Talk to an Advisor')))

    S.append(base.build_curriculum_section())
    return S


# ── 文本级写入：沿用前例的幂等 / 逐键断言 ───────────────────────
def write_detail(product_id, sections, expect):
    with io.open(TARGET, encoding='utf-8') as f:
        text = f.read()
    before = json.loads(text)
    baseline = copy.deepcopy(before)
    next(p for p in baseline['longform'] if p['id'] == product_id).pop('detail', None)

    anchor = text.find('"id": "%s"' % product_id)
    assert anchor >= 0, '未找到产品 %s' % product_id
    start = text.rfind('{', 0, anchor)
    end = base.object_span(text, start)
    keys = base.top_level_keys(text, start, end)
    names = [k[0] for k in keys if k[0] != 'detail']
    if 'detail' in [k[0] for k in keys]:
        k_start = next(k[1] for k in keys if k[0] == 'detail')
        k_end = next(k[2] for k in keys if k[0] == 'detail')
        cut = k_start
        j = cut - 1
        while j > start and text[j].isspace():
            j -= 1
        if text[j] == ',':
            cut = j
        text = text[:cut] + text[k_end:]
        end = base.object_span(text, start)
        keys = base.top_level_keys(text, start, end)

    detail = {'sections': sections}
    block = json.dumps(detail, ensure_ascii=False, indent=2)
    block = '\n'.join(('      ' + line) if n else line
                      for n, line in enumerate(block.split('\n')))
    prefix = text[:end].rstrip()
    text = prefix + ',\n      "detail": ' + block + '\n    ' + text[end:]

    after = json.loads(text)
    probe = copy.deepcopy(after)
    prod = next(p for p in probe['longform'] if p['id'] == product_id)
    assert 'detail' in prod, 'detail 未写入'
    assert set(prod.keys()) - {'detail'} == set(names), '原有顶层键发生变化'
    del prod['detail']
    assert probe == baseline, '除 detail 外的数据被改动，已中止'
    assert len(sections) == expect, '分区数量异常：%d' % len(sections)
    assert not any(s['type'] == 'curriculum' for s in sections), '旧版课程模块区仍残留'
    course = [s for s in sections if s['type'] == 'courseCards']
    assert len(course) == 1 and course[0] is sections[-1], 'CURRICULUM 区域重复或不在末尾'
    for g in course[0]['groups']:
        assert g['emptyNote'] and len({c['title'] for c in g['cards']}) == len(g['cards'])
    numbers = []
    for s in sections:
        if 'no' in s:
            numbers.extend(int(n) for n in re.findall(r'\d+', s['no']))
    assert numbers == list(range(1, len(numbers) + 1)), '编号不连续：%s' % numbers

    with io.open(TARGET, 'w', encoding='utf-8') as f:
        f.write(text)
    return numbers


# ── 原文覆盖校验 ────────────────────────────────────────────
IGNORE_RE = [
    r'^\d+\s*/\s*\d+$',               # 页码 03 / 22
    r'^第\s*\d+\s*页',
    r'^\d{1,2}$',
    r'^[A-Z\s/&.·×→-]{1,6}$',
]
DECOR = {
    # 前例同样只取 P1 的黄色小标题与页底 4 个指标，其余为版式装饰
    'UK POSTGRADUATEPROGRAM', 'Explore Your Direction.Build Your Practice.Shape Your Future.',
}
# PPT 版式页眉 / 重复标签 / 页码 / 栏目标签：不属于逐页正文，与前例同样不写入
DECOR_RE = [
    r'^(?:UK|HONG KONG) POSTGRADUATE PROGRAM\s*\|',
    r'^Hong Kong Fashion Postgraduate Program$',
    r'^香港时尚\s*/\s*研究生$',
    r'^香港时尚研究生\s*/\s*[A-Z0-9]+$',
    r'^PROJECT [AB]\s*/',
    r'^\d{2}\s*/\s*22$',
    r'^05 珠宝配饰$',
]


PREFIX_WORDS = {
    '赛道', '研究主题', '代表院校一', '代表院校二', '课程一', '课程二',
    '课程说明一', '课程说明二', '研究关键词', '核心研究', '作品集建议',
    '匹配说明', '核心能力', '核心方法', '代表项目A', '代表项目B', '交付重点', '来源',
}


def coverage(sections, runs):
    """逐条核对 pptx 原文是否已进入结构化数据；组合标签按语义片段比对。"""
    blob = norm(json.dumps(sections, ensure_ascii=False))
    missing = []
    for page, texts in runs.items():
        for t in texts:
            t = t.replace('\x0b', ' ').strip()
            if len(norm(t)) < 3 or t in DECOR:
                continue
            if any(re.match(p, t) for p in IGNORE_RE + DECOR_RE):
                continue
            if norm(t) in blob:
                continue
            parts = [norm(x) for x in re.split(r'[｜|:：；;\s●]+', t) if len(norm(x)) >= 2]
            parts = [p for p in parts if p not in PREFIX_WORDS and not p.isdigit()]
            if parts and all(p in blob for p in parts):
                continue
            missing.append((page, t))
    return missing


def main():
    for spec in DECKS:
        pptx, docx = source_files(spec['dir'])
        pg, titles = docx_pages(docx)
        runs = pptx_runs(pptx)
        assert len(pg) == spec['pages'] == len(runs), '页数不一致：%s' % spec['dir']
        sections = (uk_sections(pg, titles) if spec['id'] == 'longform2'
                    else hk_sections(pg, titles))
        missing = coverage(sections, runs)
        assert not missing, 'pptx 原文未全部写入：%s' % missing[:5]
        numbers = write_detail(spec['id'], sections, spec['expect'])
        print('已写入 %s.detail.sections：%d 个区域' % (spec['id'], len(sections)))
        print('  来源：%s / %s' % (os.path.basename(pptx), os.path.basename(docx)))
        print('  页序：' + ' → '.join(s.get('no', '课程模块') for s in sections))
        print('  编号展开：01–%02d（%d 个号）' % (max(numbers), len(numbers)))
        cg = sections[-1]['groups']
        print('  课程模块：' + ' / '.join('%s %d 门' % (g['label'], len(g['cards'])) for g in cg))
        print('  原文覆盖：%d 条 pptx run，未覆盖 %d 条' % (
            sum(len(v) for v in runs.values()), len(missing)))
        for p, t in missing[:40]:
            print('    P%02d  %s' % (p, t[:100]))
        print('  其他数据：逐键比对通过，未改动')


if __name__ == '__main__':
    main()
