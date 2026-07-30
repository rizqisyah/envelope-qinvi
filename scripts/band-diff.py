"""Score a band of the LIVE sheet against the Figma render, and dump a ref/built/diff strip.

This is the number every band record's `verification.canonical` quotes. Shoot the sheet
first with `node scripts/sheet-shot.mjs` -- NOT shot.mjs, whose sheet shot is
deviceScaleFactor 2 and has to be downscaled, which softens every glyph and inflates a
band's score by 20-40%.

    node   scripts/sheet-shot.mjs
    python3 scripts/band-diff.py <y0> <y1> [x0] [x1]

Pick y0/y1 as the band's ART ROWS -- the first and last row that actually carry
artwork -- not its group box. Those differ, sometimes by a lot: the RSVP band's group
starts at 6173 but a floral hangs 61 rows above it, and the gift band's group runs 120
rows past its last card. Padding a window with bare paper only drags the mean down, and
the resulting number is not comparable to any other band's. Whatever you pick, write it
into the band record next to the figure.
"""
import sys
from PIL import Image, ImageChops

REF = '.figma-tmp/frame242-full.png'  # scale 1, so 1px == 1 design px
LIVE = '.figma-tmp/web-sheet-1x.png'
OUT = '.figma-tmp/band-live-3up.png'

y0, y1 = int(sys.argv[1]), int(sys.argv[2])
x0 = int(sys.argv[3]) if len(sys.argv) > 3 else 0
x1 = int(sys.argv[4]) if len(sys.argv) > 4 else 375

ref = Image.open(REF).convert('RGB')
live = Image.open(LIVE).convert('RGB')
# Refuse to resample rather than quietly report a softened, inflated number.
if live.width != 375:
    sys.exit(f'{LIVE} is {live.width} wide, not 375 -- shoot it with scripts/sheet-shot.mjs')

a, b = ref.crop((x0, y0, x1, y1)), live.crop((x0, y0, x1, y1))
d = ImageChops.difference(a, b)
mean = sum(i * n for i, n in enumerate(d.convert('L').histogram())) / ((x1 - x0) * (y1 - y0))
print(f'rows {y0}-{y1}, x {x0}-{x1}: {mean:.3f} / 255')

w, h = a.size
strip = Image.new('RGB', (w * 3 + 8, h), (20, 20, 20))
for i, im in enumerate((a, b, d)):
    strip.paste(im, (i * (w + 4), 0))
strip.save(OUT)
print(f'wrote {OUT}')
