# -*- coding: utf-8 -*-
"""生成「海外冬夏校课程 / 海外大师课程」模块数据：
   源 JSON：courses_academic_fashion.json
   源资源：courses/夏冬校/img/courses/*、courses/大师课/img/courses/*
   输出：assets/img/courses/academic/*.jpg、assets/pdf/courses/academic/*.pdf
        assets/js/course-academic-data.js（window.SFK_ACADEMIC_COURSES）"""
import json, os, re, shutil

SRC = '/Users/szhan111/iCloud云盘（归档）/Desktop/SFK/SFK 教研管理/高端美研产品/SFK数据库搭建&AI智能体/时尚科系'
JSON_PATH = os.path.join(SRC, 'data/courses_academic_fashion.json')
RES = os.path.join(SRC, 'courses')
DST = '/Users/szhan111/Documents/GitHub/fd_demo'

IMG_DIR = os.path.join(DST, 'assets/img/courses/academic')
PDF_DIR = os.path.join(DST, 'assets/pdf/courses/academic')
os.makedirs(IMG_DIR, exist_ok=True)
os.makedirs(PDF_DIR, exist_ok=True)

rows = json.load(open(JSON_PATH, encoding='utf-8'))
rows = [r for r in rows if (r.get('role_or_course') or '').strip()]

# 资源文件 ↔ JSON 条目 映射（用户指定的 4 门 PDF 与 2 门 PDF.jpg 已在其中）
MAP = [
    # (源文件夹, 源文件名(不含扩展), JSON 中的 role_or_course 关键词, 媒体类型)
    ('夏冬校', '26冬校-RCA X 央美国际时尚虚拟交互研究生班', 'RCA X 央美国际时尚虚拟交互研究生班', 'poster'),
    ('夏冬校', '26夏校-UAL时尚本科1班', 'UAL时尚本科1班', 'poster'),
    ('夏冬校', '26夏校-UAL时尚本科2班', 'UAL时尚本科2班', 'poster'),
    ('夏冬校', '26夏校-UAL时尚本科3班', 'UAL时尚本科3班', 'poster'),
    ('夏冬校', '26夏校-国际时装周｜LCF秀场研创班', '国际时装周｜LCF秀场研创班', 'poster'),
    ('夏冬校', '26夏校-恒源祥｜LCF 时尚管理产业班', '恒源祥｜LCF 时尚管理产业班', 'poster'),
    ('夏冬校', '27冬校-中国国际时装周 X LCF 时尚传媒班', 'LCF 时尚传媒班', 'pdf'),
    ('夏冬校', '27冬校-中国国际时装周 X LCF 时尚管理班', 'LCF 时尚管理班', 'pdf'),
    ('夏冬校', '27冬校-中国国际时装周 X LCF 时尚设计班', 'UAL 时尚设计班', 'pdf'),
    ('夏冬校', '27冬校-时装周 X LCF 青年设计师10人联合秀场班', '青年设计师10人联合秀场班', 'pdfjpg'),
    ('夏冬校', '27冬校-时装周 X LCF 青年设计师5人菁英联秀班', '青年设计师5人菁英联秀班', 'pdfjpg'),
    ('大师课', '26F-服装设计本研大师课-PolyU-Caijun', '26F-服装设计本研大师课-PolyU-Caijun', 'pdf'),
    ('大师课', '25A-服装设计-BA-1V501', '25A-服装设计-BA-1V501', 'poster'),
    ('大师课', '26S-服装设计-BAMA-01', '26S-服装设计-BAMA-01', 'poster'),
    ('大师课', '26S-服装设计-BAMA-02', '26S-服装设计-BAMA-02', 'poster'),
    ('大师课', '26S-时尚传媒-BAMA', '26S-时尚传媒-BAMA', 'poster'),
    ('大师课', '26S-珠宝设计-BAMA', '26S-珠宝设计-BAMA', 'poster'),
    ('大师课', '26S-时尚管理-BAMA', '26S-时尚管理-BAMA', 'poster'),
    ('大师课', '26SP-服装设计-BA-01', '26SP-服装设计-BA-01', 'poster'),
    ('大师课', '26SP-服装设计-MA-02', '26SP-服装设计-MA-02', 'poster'),
    ('大师课', '26W-时尚管理-BAMA-02', '26W-时尚管理-BAMA-02', 'poster'),
    ('大师课', '26W-服装设计-BA-01', '26W-服装设计-BA-01', 'poster'),
]

def find_row(program_type, key):
    cand = [r for r in rows if r.get('program_type') == program_type and key in (r.get('role_or_course') or '')]
    if not cand:
        raise SystemExit('未匹配到 JSON 条目: %s / %s' % (program_type, key))
    return cand[0]

def recruit_status(folder, r):
    """分类：冬夏校 → 冬校 ｜ 27 为招募中；大师课 → PolyU ｜ Caijun 为招募中；其余为往期"""
    if folder == '夏冬校':
        return '招募中' if (r.get('tab') or '').strip() == '冬校 ｜ 27' else '往期'
    return '招募中' if 'PolyU-Caijun' in (r.get('role_or_course') or '') else '往期'


def primary_dir(suitable):
    s = (suitable or '').strip()
    first = re.split(r'[、,，/]', s)[0].strip()
    table = [
        ('时尚传媒', '时尚传媒'), ('虚拟时尚', '时尚传媒'),
        ('时尚管理', '时尚管理'), ('买手', '时尚管理'),
        ('珠宝', '珠宝设计'),
        ('服装', '服装设计'), ('面料', '服装设计'), ('纺织品', '服装设计'), ('可持续', '服装设计'),
        ('传媒', '时尚传媒'), ('时尚', '时尚设计'),
    ]
    for kw, v in table:
        if kw in first:
            return v
    return first or '其它方向'

def copy_file(folder, name, ext, dst_path):
    src = os.path.join(RES, folder, 'img', 'courses', name + ext)
    if not os.path.exists(src):
        raise SystemExit('缺少资源文件: %s' % src)
    shutil.copy2(src, dst_path)
    return True

data = {'summerwinter': {'curriculum': [], 'curriculumFacets': {}},
        'masterclass': {'curriculum': [], 'curriculumFacets': {}}}

used_rows = set()
seq = 0
for folder, base, key, kind in MAP:
    pt = '海外冬夏校' if folder == '夏冬校' else '海外大师课'
    r = find_row(pt, key)
    used_rows.add(id(r))

    img_name = 'academic_%03d.jpg' % seq
    copy_file(folder, base, '.jpg', os.path.join(IMG_DIR, img_name))
    card = {
        'cat': pt,
        'eyebrow': r.get('tab') or '',
        'title': r.get('role_or_course') or '',                       # 副标题：课程名
        'program': ' ｜ '.join([x for x in [r.get('university') or '', r.get('professor') or ''] if x]) or pt,
        'tags': [t for t in [r.get('level') or '', r.get('location') or '', r.get('type') or ''] if t],
        'desc': r.get('suitable_for') or '',
        'poster': 'assets/img/courses/academic/' + img_name,
        'facets': {
            'program_type': recruit_status(folder, r),
            'status': recruit_status(folder, r),
            'category': primary_dir(r.get('suitable_for')),
        },
        'split': 0,
    }
    if kind == 'pdf':
        pdf_name = 'academic_%03d.pdf' % seq
        copy_file(folder, base, '.pdf', os.path.join(PDF_DIR, pdf_name))
        card['pdf'] = 'assets/pdf/courses/academic/' + pdf_name
    elif kind == 'pdfjpg':
        # 点击弹出「同名 + PDF.jpg」大图
        seq += 1
        full_name = 'academic_%03d.jpg' % seq
        copy_file(folder, base + ' PDF', '.jpg', os.path.join(IMG_DIR, full_name))
        card['posterFull'] = 'assets/img/courses/academic/' + full_name
    card['searchText'] = ' '.join([card['title'], card['program'], card['desc'], r.get('tab') or '',
                                   r.get('type') or '', r.get('location') or '', r.get('level') or '']).lower()
    data['summerwinter' if folder == '夏冬校' else 'masterclass']['curriculum'].append(card)
    seq += 1

# 两个模块统一采用「招募中 / 往期」两档分类
GROUPS = [{'value': '招募中', 'label': '招募中'}, {'value': '往期', 'label': '往期'}]
data['summerwinter']['curriculumFacets'] = {'searchPlaceholder': '搜索课程 / 院校 / 方向…', 'groups': GROUPS}
data['masterclass']['curriculumFacets'] = {'searchPlaceholder': '搜索大师课 / 教授 / 方向…', 'groups': GROUPS}

out = '/* 海外冬夏校 / 海外大师课程模块数据：由 tools/gen_academic.py 从 courses_academic_fashion.json 生成\n' \
      '   点击行为：pdf → 弹出同名 PDF 招生文档；pdfjpg → 弹出「同名 + PDF.jpg」大图；其余 → 圆角海报大图 */\n' \
      'window.SFK_ACADEMIC_COURSES = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n'
open(os.path.join(DST, 'assets/js/course-academic-data.js'), 'w', encoding='utf-8').write(out)

print('夏冬校模块:', len(sw), '| 大师课模块:', len(mc))
print('PDF 弹出:', [c['title'][:22] for c in sw + mc if c.get('pdf')])
print('大图弹出:', [c['title'][:22] for c in sw + mc if c.get('posterFull')])
unmatched = [r.get('role_or_course') for r in rows if id(r) not in used_rows]
print('JSON 未使用条目:', unmatched)
print('图片:', len(os.listdir(IMG_DIR)), '| PDF:', len(os.listdir(PDF_DIR)))
