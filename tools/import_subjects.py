#!/usr/bin/env python3
"""从「SFK_Fashion_专业介绍与学习优势.docx」同步 Subject 学科数据。

用法：python3 tools/import_subjects.py

做三件事（可重复执行，结果幂等）：
  1. 解析 DOCX：一级序号 01–18 → 学科卡片；1.1–1.5 → 「01 时装设计」细分领域。
     每节按信息层级抽取：专业简介 → 为什么在 SFK Fashion 学习这个专业 → 5 条学习优势。
  2. 按图片文件名的序号把 SUBJECTS/ 下素材压缩写入 assets/img/subjects/，
     文件名保留「序号 + 中文专业名」，与卡片一一对应。
  3. 只替换 site-content.json 的 subjects / subject_images 两块和 ui.subjects.intro，
     其余字段逐字保留。

改完数据后请执行：python3 tools/build_data_bundle.py
"""
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS_DIR = Path(
    "/Users/szhan111/iCloud云盘（归档）/Desktop/SFK/SFK 教研管理/高端美研产品/"
    "SFK数据库搭建&AI智能体/时尚科系/SUBJECTS"
)
DOCX = SUBJECTS_DIR / "SFK_Fashion_专业介绍与学习优势.docx"
JSON_PATH = ROOT / "assets/data/site-content.json"
IMG_DST = ROOT / "assets/img/subjects"
IMG_PREFIX = "assets/img/subjects/"

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
TITLE = re.compile(r"^(\d{2})\s+(.+)$")
AREA = re.compile(r"^(1\.\d)\s*(.+)$")
WHY = "为什么在 SFK Fashion 学习这个专业"

# 文档只有中文标题，英文专业名与语义化 id 在此与序号一一对应。
EN = {
    "01": ("fashion-design", "Fashion Design"),
    "02": ("textiles-materials", "Textiles & Materials"),
    "03": ("costume-design-stage-screen", "Costume Design for Stage & Screen"),
    "04": ("fashion-print-design", "Fashion Print Design"),
    "05": ("fashion-knitwear-design", "Fashion Knitwear Design"),
    "06": ("jewellery-design", "Jewellery Design"),
    "07": ("accessories-footwear-design", "Accessories & Footwear Design"),
    "08": ("pattern-cutting-garment-construction", "Pattern Cutting & Garment Construction"),
    "09": ("fashion-communication", "Fashion Communication"),
    "10": ("fashion-styling-hair-makeup", "Fashion Styling, Hair & Make-up"),
    "11": ("digital-virtual-fashion", "Digital & Virtual Fashion"),
    "12": ("fashion-photography", "Fashion Photography"),
    "13": ("fashion-film-moving-image", "Fashion Film & Moving Image"),
    "14": ("fashion-marketing", "Fashion Marketing"),
    "15": ("luxury-brand-management", "Luxury Brand Management"),
    "16": ("fashion-journalism-content-creation", "Fashion Journalism & Content Creation"),
    "17": ("fashion-retail-brand-management", "Fashion Retail & Brand Management"),
    "18": ("fashion-psychology", "Fashion Psychology"),
    "1.1": ("menswear-design", "Menswear Design"),
    "1.2": ("womenswear-design", "Womenswear Design"),
    "1.3": ("sportswear-design", "Sportswear Design"),
    "1.4": ("haute-couture", "Haute Couture"),
    "1.5": ("lingerie-intimate-apparel", "Lingerie & Intimate Apparel Design"),
}
POINT_LABELS = ["专业研究", "行业合作", "前沿教研", "海外教授", "职业发展"]


def paragraphs(docx):
    with zipfile.ZipFile(docx) as z:
        root = ET.fromstring(z.read("word/document.xml"))

    def text_of(p):
        out = []
        for node in p.iter():
            if node.tag == W + "t":
                out.append(node.text or "")
            elif node.tag == W + "tab":
                out.append("\t")
            elif node.tag == W + "br":
                out.append("\n")
        return "".join(out).strip()

    result = []
    for p in root.find(W + "body").iter(W + "p"):
        text = text_of(p)
        if not text:
            continue
        ppr = p.find(W + "pPr")
        style, num_id, bold = "", None, False
        if ppr is not None:
            ps = ppr.find(W + "pStyle")
            style = (ps.get(W + "val") if ps is not None else "") or ""
            npr = ppr.find(W + "numPr")
            if npr is not None:
                ni = npr.find(W + "numId")
                num_id = ni.get(W + "val") if ni is not None else None
            bold = ppr.find(".//" + W + "rPr/" + W + "b") is not None or bool(p.findall(".//" + W + "rPr/" + W + "b"))
        result.append({"text": text, "style": style, "numId": num_id, "bold": bold})
    return result


def build_model(paras):
    heads = []
    for i, p in enumerate(paras):
        m1, m2 = TITLE.match(p["text"]), AREA.match(p["text"])
        if (m1 or m2) and p["style"] in ("3", "31"):
            m = m1 or m2
            heads.append({"i": i, "num": m.group(1), "zh": m.group(2).strip(), "kind": "top" if m1 else "area"})

    model = []
    for n, h in enumerate(heads):
        end = heads[n + 1]["i"] if n + 1 < len(heads) else len(paras)
        intro, points, why = [], [], False
        for p in paras[h["i"] + 1:end]:
            t = p["text"]
            if t == WHY:
                why = True
            elif p["numId"] == "7" or re.match(r"^(专业研究|行业合作|前沿教研|海外教授|职业发展)\s{2,}", t):
                parts = re.split(r"\s{2,}", t, 1)
                if len(parts) == 2:
                    points.append({"t": parts[0].strip(), "d": parts[1].strip()})
            elif p["bold"] and not p["style"]:
                intro.append(t)
        assert why, f"{h['num']} 缺少栏目「{WHY}」"
        assert len(intro) == 1, f"{h['num']} 简介段数量异常：{len(intro)}"
        assert [x["t"] for x in points] == POINT_LABELS, f"{h['num']} 学习优势条目异常：{[x['t'] for x in points]}"
        model.append({**h, "intro": intro[0], "points": points})

    tops = [x for x in model if x["kind"] == "top"]
    areas = [x for x in model if x["kind"] == "area"]
    assert [x["num"] for x in tops] == [f"{i:02d}" for i in range(1, 19)], "一级序号不是 01–18"
    assert [x["num"] for x in areas] == ["1.1", "1.2", "1.3", "1.4", "1.5"], "细分领域不是 1.1–1.5"
    return tops, areas


def convert(src, dst):
    """等比缩放并转 JPEG，保留「序号 + 中文名」文件名，控制静态站点体积。"""
    IMG_DST.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["sips", "-Z", "1400", "-s", "format", "jpeg", "-s", "formatOptions", "72", str(src), "--out", str(dst)],
        check=True, capture_output=True,
    )


def import_images(tops, areas):
    by_num = {x["num"]: x["zh"] for x in tops}
    area_zh = {x["num"]: x["zh"] for x in areas}
    images, portraits, area_images = {}, {}, {}

    for src in sorted(SUBJECTS_DIR.iterdir()):
        if src.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        m = TITLE.match(src.name)
        if not m or m.group(1) not in by_num:
            continue
        num = m.group(1)
        zh = by_num[num]
        is_portrait = "竖" in src.stem
        name = f"{num} {zh}-竖.jpg" if is_portrait else f"{num} {zh}.jpg"
        dst = IMG_DST / name
        convert(src, dst)
        if is_portrait:
            portraits[num] = IMG_PREFIX + name
        else:
            images[num] = IMG_PREFIX + name

    area_dir = SUBJECTS_DIR / "01 时装设计"
    for src in sorted(area_dir.iterdir()):
        m = AREA.match(src.name)
        if not m or src.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        num = m.group(1)
        name = f"{num} {area_zh[num]}.jpg"
        convert(src, IMG_DST / name)
        area_images[num] = IMG_PREFIX + name

    for num in [x["num"] for x in tops[1:]]:
        assert num in images, f"缺少 {num} 的卡片图片"
    for num in [x["num"] for x in areas]:
        assert num in area_images, f"缺少 {num} 的细分领域图片"
    return images, portraits, area_images


def js_block(key, value):
    lines = json.dumps(value, ensure_ascii=False, indent=2).split("\n")
    tail = "    " + lines[-1] + ","
    body = [lines[0]] + ["    " + line for line in lines[1:-1]] + [tail]
    return '\n'.join(["    " + '"' + key + '": ' + body[0]] + body[1:])


def main():
    if not DOCX.exists():
        sys.exit(f"找不到文档：{DOCX}")
    tops, areas = build_model(paragraphs(DOCX))
    images, portraits, area_images = import_images(tops, areas)

    subjects = []
    for x in tops:
        slug, en = EN[x["num"]]
        item = {
            "id": slug, "zh": x["zh"], "en": en, "num": x["num"],
            "intro": x["intro"], "points": x["points"],
        }
        if x["num"] in portraits:
            item["portrait"] = portraits[x["num"]]
        if x["num"] == "01":
            item["areas"] = [
                {
                    "id": EN[a["num"]][0], "num": a["num"], "zh": a["zh"], "en": EN[a["num"]][1],
                    "image": area_images[a["num"]], "intro": a["intro"], "points": a["points"],
                }
                for a in areas
            ]
        subjects.append(item)

    subject_images = {"fashion-design": IMG_PREFIX + "fashion-design.jpeg"}
    for x in tops[1:]:
        subject_images[EN[x["num"]][0]] = images[x["num"]]

    text = JSON_PATH.read_text(encoding="utf-8")
    lines = text.split("\n")

    def swap(key, value):
        opener = '"' + key + '": ' + ('[' if isinstance(value, list) else '{')
        start = next(i for i, l in enumerate(lines) if l.strip().startswith(opener))
        closing = "    ]," if isinstance(value, list) else "    },"
        end = next(i for i in range(start + 1, len(lines)) if lines[i] == closing)
        lines[start:end + 1] = js_block(key, value).split("\n")

    swap("subjects", subjects)
    swap("subject_images", subject_images)

    old_intro = "从时装设计到可持续时尚，20 个学科方向覆盖时尚产业全链路。点击任意学科，按学历层次进入课程检索。"
    new_intro = "从时装设计到时尚心理学，{n} 个学科方向覆盖时尚产业全链路。点击任意学科，查看专业介绍并按学历层次进入课程检索。"
    assert text.count(old_intro) == 1, "ui.subjects.intro 原文已变化，请确认后再同步"
    out = "\n".join(lines).replace(old_intro, new_intro)
    JSON_PATH.write_text(out, encoding="utf-8")

    payload = json.loads(out)
    assert len(payload["data"]["subjects"]) == 18
    assert len(payload["data"]["subjects"][0]["areas"]) == 5
    assert len(payload["data"]["subject_images"]) == 18
    print(f"学科 {len(subjects)} 个｜细分领域 {len(areas)} 个｜卡片图片 {len(subject_images)} 张")
    print(f"已更新 {JSON_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
