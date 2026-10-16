#!/usr/bin/env python3
"""Import the designer's home-carousel posters.

Source: /workspace/store-posters/carousel/{he,en,ar,ru}/<slide-id>.png|jpg|jpeg|webp (1080x1920).
Writes assets/carousel/{lang}/<slide-id>-w360|w630.{webp,jpg} (and the client/public copy) and
rewrites client/src/lib/carouselDesigned.ts. Only slide ids that exist in client/src/lib/carousel.ts are imported.
Run from the repo root: python3 scripts/import-carousel-posters.py [source-dir]
"""
import os, re, sys
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

SRC = sys.argv[1] if len(sys.argv) > 1 else "/workspace/store-posters/carousel"
LANGS = ["he", "en", "ru", "ar"]
# <designer stem> -> slide id, read from the "designed" fields in carousel.ts (a stem equal to a slide id also works).
src_ts = open("client/src/lib/carousel.ts").read()
stems = dict((m[1], m[0]) for m in re.findall(r'id: "([a-z-]+)", designed: "([a-z0-9-]+)"', src_ts))
ids = re.findall(r'id: "([a-z-]+)"', src_ts)
found = {l: [] for l in LANGS}
for lang in LANGS:
    d = os.path.join(SRC, lang)
    if not os.path.isdir(d):
        continue
    for name in sorted(os.listdir(d)):
        stem, ext = os.path.splitext(name)
        if ext.lower() not in (".png", ".jpg", ".jpeg", ".webp"):
            continue
        sid = stems.get(stem) or (stem if stem in ids else None)
        if not sid:
            print("skip (unknown slide id):", lang, name)
            continue
        im = Image.open(os.path.join(d, name)).convert("RGB")
        if abs(im.width / im.height - 9 / 16) > 0.01:
            print("skip (not 9:16):", lang, name, im.size)
            continue
        for out in ("assets/carousel", "client/public/assets/carousel"):
            os.makedirs(f"{out}/{lang}", exist_ok=True)
            for w, h, suf in ((630, 1120, "w630"), (360, 640, "w360")):
                r = im.resize((w, h), Image.LANCZOS)
                r.save(f"{out}/{lang}/{sid}-{suf}.jpg", quality=84, optimize=True, progressive=True)
                r.save(f"{out}/{lang}/{sid}-{suf}.webp", quality=82, method=6)
        found[lang].append(sid)
        print("imported", lang, sid)

body = "\n".join(f"  {l}: [{', '.join(repr(s).replace(chr(39), chr(34)) for s in sorted(set(found[l])))}]," for l in LANGS)
open("client/src/lib/carouselDesigned.ts", "w").write(f'''import type {{ Language }} from "@/contexts/LanguageContext";

/**
 * Slide ids that have a designed store poster per language in assets/carousel/{{lang}}/.
 * Written by scripts/import-carousel-posters.py. Leave a slide out to fall back to the approved poster or the real phone shot.
 */
export const DESIGNED: Record<Language, string[]> = {{
{body}
}};
''')
