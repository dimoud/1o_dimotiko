#!/usr/bin/env python3
"""Φωτογραφίες σε WebP 1600/800 χωρίς EXIF (θέση GPS, συσκευή), μόνο όσες χρησιμοποιούνται.

    python3 ergaleia/fotografies.py <φάκελος uploads του WordPress> [λεπτά όριο]
Διαβάζει periexomeno/anartiseis.json + selides-wp.json, γράφει meson/fotografies/ και meson/arxeia/.
Ξανατρέχει χωρίς να ξαναφτιάχνει όσα υπάρχουν.
"""
import json, os, shutil, sys, time
from PIL import Image, ImageOps
RIZA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
U = sys.argv[1].rstrip('/') + '/'
LIM = float(sys.argv[2]) * 60 if len(sys.argv) > 2 else 1e9
t0 = time.time()
P = lambda *x: os.path.join(RIZA, *x)
a = json.load(open(P('periexomeno', 'anartiseis.json'))) + json.load(open(P('periexomeno', 'selides-wp.json')))
fot = sorted(x for x in set(f['arxeio'] for r in a for f in r['fotografies']) if os.path.exists(U + x))
for rel in fot:
    if time.time() - t0 > LIM:
        break
    base = os.path.splitext(rel)[0]
    for w in (1600, 800):
        dst = P('meson', 'fotografies', f'{base}-{w}.webp')
        if os.path.exists(dst):
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        im = ImageOps.exif_transpose(Image.open(U + rel)).convert('RGB')   # χωρίς EXIF στην έξοδο
        if im.width > w:
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        im.save(dst + '.tmp', 'WEBP', quality=78 if w == 1600 else 74, method=4)
        os.replace(dst + '.tmp', dst)
meg = {}
for rel in fot:
    p = P('meson', 'fotografies', f'{os.path.splitext(rel)[0]}-1600.webp')
    if os.path.exists(p):
        with Image.open(p) as im:
            meg[rel] = [im.width, im.height]
json.dump(meg, open(P('meson', 'fotografies', 'diastaseis.json'), 'w'))
for rel in sorted(set(f for r in a for f in r['arxeia'])):
    if os.path.exists(U + rel) and not os.path.exists(P('meson', 'arxeia', rel)):
        os.makedirs(os.path.dirname(P('meson', 'arxeia', rel)), exist_ok=True)
        shutil.copy2(U + rel, P('meson', 'arxeia', rel))
print('φωτογραφίες', len(meg), '/', len(fot))
