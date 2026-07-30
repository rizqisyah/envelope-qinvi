"""Score whatever scripts/sweep-text.mjs just shot, best first.

A real answer looks like a sharp minimum -- the RSVP band's body copy scored 3.13 at
its winner against 13.0 and 10.5 one px either side. A flat list means the box is
mostly background and the sweep found nothing; widen or move the box.

    python3 scripts/sweep-score.py
"""
import json
from PIL import Image, ImageChops

REF = '.figma-tmp/frame242-full.png'  # scale 1, so 1px == 1 design px

job = json.load(open('.figma-tmp/sweep.json'))
x0, y0, x1, y1 = job['box']
ref = Image.open(REF).convert('RGB').crop((x0, y0, x1, y1))
n = (x1 - x0) * (y1 - y0)

out = []
for v, path in job['shots']:
    live = Image.open(path).convert('RGB').crop((x0, y0, x1, y1))
    d = ImageChops.difference(ref, live).convert('L')
    out.append((sum(i * c for i, c in enumerate(d.histogram())) / n, v))

for e, v in sorted(out):
    print(f'{v:>6}  {e:.4f}')
