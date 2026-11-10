#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把「境外项目」源目录中的 PDF，按文件名映射为课程模块可预览文档。

用法：
    python3 tools/import_overseas_pdfs.py
    SFK_OVERSEAS_PDF_DIR=/path/to/境外项目 python3 tools/import_overseas_pdfs.py

规则：
    1. 递归扫描源目录下的 *.pdf（源目录实际把文件放在同名子目录里）。
    2. 对 course-products.json 中 overseas[] 各产品的 detail.curriculum[]，
       用 role_or_course / title 与 PDF 文件名（去扩展名）做归一化匹配：
       NFKC → 统一连接号 → 去全部空白 → 小写。
    3. 命中：原样复制 PDF 到 assets/pdf/courses/overseas/<原文件名>，
       写入 pdf 路径与 docLabel（PDF 文档视图的标题）；既有 poster 等字段一律保留。
    4. 未命中且原本有 poster：保留原海报，写入 pdfMissing = 应有文件名，
       由页面显示「PDF 待补充」角标 / 弹窗提示 / 模块区汇总。
    5. 占位卡（_ph 且无 poster）不属于「课程海报」替换范围，保持占位态不变。
    6. 只新增字段；删除仅限本脚本自己生成的 pdf / docLabel / pdfMissing 标记，
       绝不删改任何既有键值（运行前后做键集合断言）。
"""

import io
import json
import os
import re
import shutil
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'assets', 'data', 'course-products.json')
DEST_REL = 'assets/pdf/courses/overseas'
DEST = os.path.join(ROOT, *DEST_REL.split('/'))

DEFAULT_SRC = ('/Users/szhan111/iCloud云盘（归档）/Desktop/SFK/SFK 教研管理/'
               '高端美研产品/SFK数据库搭建&AI智能体/境外项目')
SRC = os.environ.get('SFK_OVERSEAS_PDF_DIR', DEFAULT_SRC)

# 各种连接号统一成半角短横，避免源文件名与数据标题里的全角/长横不匹配
DASH_MAP = dict.fromkeys(map(ord, '‐‑‒–—－'), '-')


def norm(s):
    s = unicodedata.normalize('NFKC', str(s or ''))
    s = s.translate(DASH_MAP)
    s = re.sub(r'\s+', '', s)
    return s.lower()


def card_name(card):
    return card.get('role_or_course') or card.get('title') or ''


def scan_pdfs():
    if not os.path.isdir(SRC):
        raise SystemExit('源目录不存在：%s' % SRC)
    found = []
    for base, dirs, files in os.walk(SRC):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for name in files:
            if name.lower().endswith('.pdf'):
                found.append(os.path.join(base, name))
    found.sort()
    index = {}
    for path in found:
        stem = os.path.splitext(os.path.basename(path))[0]
        index.setdefault(norm(stem), []).append(path)
    dup = [k for k, v in index.items() if len(v) > 1]
    if dup:
        raise SystemExit('源目录存在重名 PDF，无法唯一映射：%s' % dup)
    return index


def main():
    index = scan_pdfs()
    with io.open(DATA, encoding='utf-8') as f:
        payload = json.load(f)

    products = payload.get('overseas', [])
    if not products:
        raise SystemExit('course-products.json 缺少 overseas 分区')

    # 运行前快照：用于断言「海报与既有字段不变」
    before = {}
    for product in products:
        for i, card in enumerate(((product.get('detail') or {}).get('curriculum') or [])):
            before[(product.get('id'), i)] = (set(card.keys()), card.get('poster'))

    os.makedirs(DEST, exist_ok=True)
    used = set()
    matched, missing, skipped = [], [], []

    for product in products:
        cards = ((product.get('detail') or {}).get('curriculum') or [])
        for card in cards:
            name = card_name(card)
            if card.get('_ph') and not card.get('poster'):
                skipped.append((product.get('id'), name))
                continue

            hits = index.get(norm(name), [])
            if hits:
                src = hits[0]
                fname = os.path.basename(src)
                dst = os.path.join(DEST, fname)
                shutil.copyfile(src, dst)
                with io.open(dst, 'rb') as f:
                    assert f.read(5) == b'%PDF-', '复制后不是有效 PDF：%s' % fname
                used.add(norm(name))
                card['pdf'] = DEST_REL + '/' + fname
                card['docLabel'] = card.get('title') or name
                card.pop('pdfMissing', None)          # 仅清除本脚本自己写过的缺失标记
                matched.append((name, fname))
            else:
                expected = name + '.pdf'
                # 若上一次导入留下本项目生成的路径，撤回；其余来源的 pdf 字段不动
                if str(card.get('pdf') or '').startswith(DEST_REL + '/'):
                    card.pop('pdf')
                card.pop('docLabel', None)            # 同上，仅清本脚本字段
                card['pdfMissing'] = expected
                missing.append((name, expected))

    # 断言：既有键与海报一个都没少 / 没改
    for product in products:
        cards = ((product.get('detail') or {}).get('curriculum') or [])
        for i, card in enumerate(cards):
            key = (product.get('id'), i)
            keys, poster = before[key]
            assert keys.issubset(set(card.keys())), '字段被删除：%s #%d' % key
            assert card.get('poster') == poster, '原海报被改写：%s #%d' % key

    orphan = sorted(k for k in index if k not in used)
    with io.open(DATA, 'w', encoding='utf-8') as f:
        f.write(json.dumps(payload, ensure_ascii=False, indent=2))

    print('源目录：%s' % SRC)
    print('已映射 PDF（%d）：' % len(matched))
    for name, fname in matched:
        print('  %s  →  %s/%s' % (name, DEST_REL, fname))
    print('缺失 PDF（%d，保留原海报并提示）：' % len(missing))
    for name, expected in missing:
        print('  %s  ←  应有 %s' % (name, expected))
    if skipped:
        print('占位卡（%d，无海报、不参与映射）：' % len(skipped))
        for pid, name in skipped:
            print('  %s / %s' % (pid, name))
    if orphan:
        print('未匹配的源 PDF（%d）：%s' % (len(orphan), orphan))
    print('已写入 %s' % os.path.relpath(DATA, ROOT))


if __name__ == '__main__':
    main()
