#!/usr/bin/env python3
"""Import the designer's home-carousel posters.

Source: /workspace/store-posters/carousel/{he,en,ar,ru}/<tab>-<n>.png (1080x1920, counter n/N baked in).
For every slide in client/src/lib/carousel.ts ({ id, designed }) it writes
assets/carousel/{lang}/<slide-id>-w360|w630.{webp,jpg} (and the client/public copy) and removes stale files
(any file in those folders that does not belong to a listed slide). Each language uses its own folder.
Run from the repo root: python3 scripts/import-carousel-posters.py [source-dir]
"""
import os, re, sys
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

SRC = sys.argv[1] if len(sys.argv) > 1 else "/workspace/store-posters/carousel"
LANGS = ["he", "en", "ru", "ar"]
OUTS = ("assets/carousel", "client/public/assets/carousel")
pairs = re.findall(r'id: "([a-z-]+)", designed: "([a-z0-9-]+)"', open("client/src/lib/carousel.ts").read())
if not pairs:
    sys.exit("no slides found in carousel.ts")
missing = []
for out in OUTS:
    for lang in LANGS:
        os.makedirs(f"{out}/{lang}", exist_ok=True)
keep = {lang: set() for lang in LANGS}
for lang in LANGS:
    for sid, stem in pairs:
        src = next((os.path.join(SRC, lang, stem + e) for e in (".png", ".jpg", ".jpeg", ".webp") if os.path.exists(os.path.join(SRC, lang, stem + e))), None)
        if not src:
            missing.append((lang, stem))
            continue
        im = Image.open(src).convert("RGB")
        if abs(im.width / im.height - 9 / 16) > 0.01:
            sys.exit(f"not 9:16: {src} {im.size}")
        for out in OUTS:
            for w, h, suf in ((630, 1120, "w630"), (360, 640, "w360")):
                r = im.resize((w, h), Image.LANCZOS)
                r.save(f"{out}/{lang}/{sid}-{suf}.jpg", quality=84, optimize=True, progressive=True)
                r.save(f"{out}/{lang}/{sid}-{suf}.webp", quality=82, method=6)
        for suf in ("w630", "w360"):
            keep[lang] |= {f"{sid}-{suf}.jpg", f"{sid}-{suf}.webp"}
removed = 0
for out in OUTS:
    for entry in os.listdir(out):
        p = f"{out}/{entry}"
        if entry not in LANGS:  # old shots/ folder etc.
            os.system(f"rm -rf '{p}'"); removed += 1; continue
        for f in os.listdir(p):
            if f not in keep[entry]:
                os.remove(f"{p}/{f}"); removed += 1
print("slides:", len(pairs), "languages:", len(LANGS), "stale removed:", removed, "missing:", missing)
