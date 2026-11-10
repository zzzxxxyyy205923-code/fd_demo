#!/usr/bin/env python3
"""把「校企资源」JSON 与 logo 图片导入本站。

用法：python3 tools/import_resources.py [源JSON路径]

做两件事（可重复执行，结果幂等）：
  1. 读取上传的 resources_fasion.json（25 条），按 logo 文件名 / 英文名的归一化形式
     在 logos_jpg_rounded/ 中容错匹配图片；源图比例差异极大（80×80 ~ 2334×1200，
     另有 115×447 竖排与 558×64 超宽横条），统一规范化为 640×360 横向画布：
     等比适应并居中留白，明显竖排的 logo 逆时针旋转 90° 转为横向，
     以 ASCII slug + .png 输出到 assets/img/resources/。
  2. 生成 assets/data/resources.json：文案、滚动速度与 partners 数组，
     字段与 art-humanities_demo 的校企资源保持一致（intro / collab）。

生成后请执行：python3 tools/build_data_bundle.py
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = Path(
    "/var/folders/x3/xm6j4bsj7mjcqmyfpt6g_26w0000gn/T/codebuddy-dropped-files/"
    "c602b80d-3d88-49bc-935c-05ceb19390ce/resources_fasion.json"
)
IMG_SRC = Path(
    "/Users/szhan111/iCloud云盘（归档）/Desktop/SFK/SFK 教研管理/高端美研产品/"
    "SFK数据库搭建&AI智能体/时尚科系/logos_jpg_rounded"
)
OUT_JSON = ROOT / "assets/data/resources.json"
OUT_IMG = ROOT / "assets/img/resources"
CANVAS = (640, 360)
CANVAS_BG = "#F3F3F3"          # 与 --grey-pale / 卡片图片底一致

META = {
    "eyebrow": "RESOURCES",
    "title": "校企资源",
    "intro": "汇集品牌、美术馆与独立设计师工作室等合作资源；滑动浏览 logo，悬停查看合作内容。",
    "countLabel": "{n} 家合作品牌与机构",
    "marqueeEyebrow": "PARTNERS",
    "marqueeTitle": "合作品牌与机构",
    "directoryEyebrow": "DIRECTORY",
    "directoryTitle": "资源名录",
    "logoPlaceholder": "LOGO",
    "logoAlt": "{name} Logo",
    "cardAria": "查看 {name} 合作内容",
    "hoverEyebrow": "COOPERATION",
    "introFallback": "合作内容整理中",
    "speedPxPerSec": 46,
}


def norm(name):
    """归一化用于匹配：NFC + 只保留字母数字，忽略空格/连字符/点/大小写。"""
    s = unicodedata.normalize("NFC", name)
    return "".join(c for c in s.lower() if c.isalnum())


def slug(name):
    """生成 URL 安全的 ASCII 文件名：去音调、非字母数字转连字符。"""
    n = unicodedata.normalize("NFKD", name)
    n = "".join(c for c in n if not unicodedata.combining(c))
    return re.sub(r"[^A-Za-z0-9]+", "-", n).strip("-").lower() or "partner"


def normalize(src, dst):
    """等比适应到统一横向画布；竖排字标逆时针旋转 90°，避免撑破卡片图片框。"""
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    w, h = im.size
    if h / w > 1.5:
        im = im.rotate(90, expand=True)
    im = ImageOps.pad(im, CANVAS, method=Image.Resampling.LANCZOS,
                      color=CANVAS_BG, centering=(0.5, 0.5))
    im.save(dst, "PNG", optimize=True)


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.exists():
        sys.exit(f"找不到源数据：{src}")
    rows = json.loads(src.read_text(encoding="utf-8"))
    if not IMG_SRC.is_dir():
        sys.exit(f"找不到 logo 目录：{IMG_SRC}")

    files = [f for f in IMG_SRC.iterdir() if f.is_file() and not f.name.startswith(".")]
    by_norm = {norm(f.stem): f for f in files}
    OUT_IMG.mkdir(parents=True, exist_ok=True)

    used, partners, matched = {}, [], set()
    for row in rows:
        name_en = (row.get("nameEn") or "").strip()
        name_cn = (row.get("nameCn") or "").strip()
        logo_field = (row.get("logo") or "").strip()

        hit = None
        for cand in (logo_field, name_en):
            if not cand:
                continue
            found = by_norm.get(norm(Path(cand).stem))
            if found:
                hit = found
                break
        if logo_field and not hit:
            sys.exit(f"logo 未匹配：{name_en} → {logo_field}")

        logo = ""
        if hit:
            base = slug(name_en)
            n = used.get(base, 0)
            used[base] = n + 1
            stem = base if n == 0 else f"{base}-{n + 1}"
            filename = stem + ".png"
            normalize(hit, OUT_IMG / filename)
            logo = f"assets/img/resources/{filename}"
            matched.add(hit.name)

        course = (row.get("合作课程") or "").strip()
        collab = [c.strip() for c in re.split(r"[,，、/]+", course) if c.strip()]
        partners.append({
            "id": slug(name_en),
            "nameEn": name_en,
            "nameCn": name_cn,
            "logo": logo,
            "intro": (row.get("合作内容") or "").strip(),
            "collab": collab,
        })

    ids = [p["id"] for p in partners]
    assert len(ids) == len(set(ids)), "存在重复的 partner id，请检查 nameEn"

    # 统一为 .png 后，清掉上一版遗留的 jpg/jpeg 副本
    keep = {p["logo"].rsplit("/", 1)[-1] for p in partners if p["logo"]}
    stale = [f for f in OUT_IMG.iterdir()
             if f.is_file() and not f.name.startswith(".") and f.name not in keep]
    for f in stale:
        f.unlink()

    payload = dict(META, partners=partners)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    for p in partners:
        if p["logo"] and not (ROOT / p["logo"]).exists():
            sys.exit(f"图片缺失：{p['logo']}")
    print(f"资源 {len(partners)} 条｜logo {len(matched)} 张（统一 {CANVAS[0]}×{CANVAS[1]}）｜"
          f"无 logo 占位 {sum(1 for p in partners if not p['logo'])} 条｜清理旧文件 {len(stale)} 个")
    unused = [f.name for f in files if f.name not in matched]
    if unused:
        print("未被引用：", unused)
    print(f"已生成 {OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
