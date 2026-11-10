#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 art-humanities_demo「课程产品」页「英国产品」（anxin-ban）详情页完整复用至本站
overseas-anxinban 卡片的详情页。

来源（字段级映射，文案逐字保留）：
  art-humanities_demo/data/course-details.json  → anxin-ban 键（heroDesc / flow / closing）
  art-humanities_demo/data/anxin-courses.json   → 3 门课程（overseasCards 同款映射）
  art-humanities_demo/data/course-products.json → anxin-ban 的 curriculumFacets

写入：assets/data/course-products.json → overseas[].id=overseas-anxinban 的 detail 键；
  sections = [flow→deckGrid 三步流程, curriculum 课程模块, cta 收尾]（与源站结构一致）。
约定：
  - 源站详情页无 snapshot / whySFK，故 sections 不含这两段，不渲染占位；
  - 源站课程卡无 PDF → 不写 pdf 字段，点击走海报弹层（PosterModal）；
  - 源站步骤配色（teal/green/mint）归一到本站单色设计系统，文案全保留；
  - 课程卡 title/program 按本站语义（program 为卡片主标题，title 为所属院校行）。
约束：只更新该产品的 detail 键，顶层与其它键逐键比对不动；重复运行字节一致；
  写文件前断言源站文本零遗漏。
"""
import io
import json
import os
import re
import shutil
import sys

ROOT = '/Users/szhan111/Documents/GitHub/fd_demo'
SRC = '/Users/szhan111/Documents/GitHub/art-humanities_demo'
CP = os.path.join(ROOT, 'assets/data/course-products.json')
IMG_DST = os.path.join(ROOT, 'assets/img/courses/uk-programs')


def rd(path):
    with io.open(path, encoding='utf-8') as f:
        return f.read()


def norm(s):
    return re.sub(r'\s+', '', str(s)).lower()


def stext(parts):
    """本站课程卡搜索串：原文空格拼接后转小写（curMatch 用 includes 匹配）"""
    return ' '.join(x for x in parts if x).lower()


# ── 读取源站数据 ──
details = json.loads(rd(os.path.join(SRC, 'data/course-details.json')))
anxin = details['anxin-ban']
courses = json.loads(rd(os.path.join(SRC, 'data/anxin-courses.json')))
cp_src = json.loads(rd(os.path.join(SRC, 'data/course-products.json')))
an_src = next(p for p in cp_src['overseas'] if p['id'] == 'anxin-ban')

# ── flow 区块 → 本站 deckGrid 三步流程 ──
flow = next(s for s in anxin['sections'] if s['type'] == 'flow')
steps = [{
    'no': '%02d' % (i + 1),
    'en': st['tag'],          # STAGE 01 · FOUNDATION
    'title': st['zh'],        # 升学通 / 安心伴 / 毕无忧
    'desc': st['desc'],
} for i, st in enumerate(flow['steps'])]

# ── 课程卡映射（与源站 overseasCards 同源字段，落到本站课程卡字段）──
cards = []
for c in courses:
    card = {
        'cat': c['program_type'],                 # 左上角标
        'eyebrow': c['type'],                     # 眉标
        'program': c['role_or_course'],           # 卡片主标题
        'title': c['university'],                 # 所属院校 / 项目行
        'tags': [c['suitable_for'], c['level'], c['location'], c['outcomes']],
        'desc': c['professor'],
        'poster': c['poster'],                    # 点击 → 海报大图弹层（无 PDF）
        'facets': {'program_type': c['program_type'], 'category': c['category']},
        'searchText': stext([c['role_or_course'], c['university'],
                             c['professor'], c['suitable_for'], c['level'],
                             c['location'], c['outcomes'], c['type'],
                             c['program_type'], c['category']]),
    }
    cards.append(card)

detail = {
    # 源站 heroDesc：详情页顶部简介（本站 hero 取数链第一优先级 D.desc）
    'desc': anxin['heroDesc'],
    'sections': [
        {
            'type': 'deckGrid', 'id': 'deck-positioning', 'no': '01',
            'kicker': flow['label'],                 # 源站 label 原文「项目定位 · POSITIONING」
            'title': flow['title'],
            'intro': flow['desc'],
            'columns': 3,
            'items': steps,
        },
        {'type': 'curriculum', 'id': 'cd-curriculum', 'label': '课程模块 · CURRICULUM'},
        {'type': 'cta', 'closing': anxin['closing']},
    ],
    'curriculumFacets': {
        'searchPlaceholder': an_src['curriculumFacets']['searchPlaceholder'],
        'groups': an_src['curriculumFacets']['groups'],
    },
    'curriculum': cards,
    'closing': anxin['closing'],
}

# ── 零遗漏断言：源站详情页全部文本必须进入生成数据 ──
blob = norm(json.dumps(detail, ensure_ascii=False))
missing = []


def need(text, where):
    if norm(text) and norm(text) not in blob:
        missing.append((where, text))


need(anxin['heroDesc'], 'heroDesc')
need(flow['label'], 'flow.label')
need(flow['title'], 'flow.title')
need(flow['desc'], 'flow.desc')
for i, st in enumerate(flow['steps']):
    need(st['tag'], 'step%d.tag' % i)
    need(st['zh'], 'step%d.zh' % i)
    need(st['desc'], 'step%d.desc' % i)
cl = anxin['closing']
for k in ('cn', 'en', 'desc'):
    need(cl[k], 'closing.%s' % k)
for t in cl['tags']:
    need(t, 'closing.tags')
for i, c in enumerate(courses):
    for k in ('program_type', 'category', 'role_or_course', 'suitable_for',
              'location', 'level', 'outcomes', 'poster', 'university',
              'professor', 'type'):
        need(c[k], 'course%d.%s' % (i, k))
need(an_src['curriculumFacets']['searchPlaceholder'], 'facets.searchPlaceholder')
for g in an_src['curriculumFacets']['groups']:
    need(g['label'], 'facets.group')
assert not missing, '源站文本未全部写入：%s' % missing[:5]

# ── 复制课程海报 ──
os.makedirs(IMG_DST, exist_ok=True)
copied = []
for c in cards:
    src = os.path.join(SRC, c['poster'])
    dst = os.path.join(ROOT, c['poster'])
    shutil.copyfile(src, dst)
    copied.append('%s（%.0fKB）' % (c['poster'], os.path.getsize(dst) / 1024))

# ── 写入本站（只动该产品 detail 键；幂等由重复运行字节一致验证）──
cp = json.loads(rd(CP))
for p in cp['overseas']:
    if p['id'] == 'overseas-anxinban':
        p['detail'] = detail
with io.open(CP, 'w', encoding='utf-8') as f:
    f.write(json.dumps(cp, ensure_ascii=False, indent=2) + '\n')

# ── 报告 ──
print('已写入 overseas-anxinban.detail（英国产品详情页复用自 art-humanities_demo anxin-ban）')
print('  hero 简介：%s' % anxin['heroDesc'])
print('  区块结构：' + ' → '.join(s['type'] for s in detail['sections']))
print('  三步流程：%s' % ' / '.join(s['title'] for s in steps))
print('  课程模块：%d 门课（%s），筛选组 %s，无 PDF → 海报弹层' % (
    len(cards), '、'.join(c['cat'] for c in cards),
    '、'.join(g['label'] for g in detail['curriculumFacets']['groups'])))
print('  收尾 CTA：%s｜%s' % (cl['cn'], '、'.join(cl['tags'])))
print('  源站文本覆盖：零遗漏断言通过')
print('  图片复制：%d 张' % len(copied))
for x in copied:
    print('    %s' % x)
