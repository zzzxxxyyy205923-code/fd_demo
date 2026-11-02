#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 assets/data/*.json 生成 assets/js/data.bundle.js（本地直开的镜像）

背景：
    file:// 协议下浏览器把本地文件视为不透明来源，fetch / XHR 一律被 CORS 拦截，
    无法直接读取 JSON；而 <script src> 不受此限制。
    因此生成一份「原样搬运」的镜像，供双击 index.html 时使用。

约束：
    JSON 仍是唯一事实来源，本脚本只做序列化搬运，不做任何内容加工。
    修改 assets/data/*.json 后需重新执行一次。

用法：
    python3 tools/build_data_bundle.py
"""

import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'assets', 'data')
OUT = os.path.join(ROOT, 'assets', 'js', 'data.bundle.js')

# 逻辑名 → JSON 文件名（必须与 assets/js/data.js 的 FILES 保持一致）
FILES = [
    ('site', 'site-content'),
    ('courseProducts', 'course-products'),
    ('coursesIndustry', 'courses_industry'),
    ('coursesAcademic', 'courses_academic'),
    ('offers', 'offers'),
]

HEADER = """/* ═══════════════════════════════════════════════════════════
   ⚠ 自动生成文件 —— 请勿手动编辑
   由 tools/build_data_bundle.py 从 assets/data/*.json 原样生成。

   用途：file:// 双击打开时，浏览器禁止 fetch 读取本地 JSON，
        数据层改用本文件（<script src> 不受 CORS 限制）。
   维护：改数据请改 assets/data/*.json，然后重新运行
        python3 tools/build_data_bundle.py
═══════════════════════════════════════════════════════════ */
window.__SFK_DATA__ = {
"""


def main():
    parts = []
    for key, name in FILES:
        path = os.path.join(DATA_DIR, name + '.json')
        with io.open(path, encoding='utf-8') as f:
            payload = json.load(f)
        text = json.dumps(payload, ensure_ascii=False, indent=2)
        # 防止文本中出现截断 <script> 的序列 / 破坏 JS 字面量的行分隔符
        text = text.replace('</', '<\\/')
        text = text.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
        indented = '\n'.join('    ' + line if line else line for line in text.split('\n'))
        parts.append('  "%s": %s' % (key, indented.lstrip()))

    with io.open(OUT, 'w', encoding='utf-8') as f:
        f.write(HEADER)
        f.write(',\n'.join(parts))
        f.write('\n};\n')

    print('generated %s (%d bytes)' % (os.path.relpath(OUT, ROOT), os.path.getsize(OUT)))


if __name__ == '__main__':
    main()
