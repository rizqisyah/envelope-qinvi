#!/usr/bin/env python3
"""Bounding box of the glyph ink in the last scripts/fit-text.mjs pair.

Prints the browser's ink box and, for comparison, the same box measured off the
Figma render minus the solved band composite -- the composite carries no text, so
differencing it isolates the design's own glyphs.

    python3 scripts/ink.py <clipX> <clipY> [bandY0]
"""
import sys
from PIL import Image, ImageChops

cx, cy = int(sys.argv[1]), int(sys.argv[2])
band_y0 = int(sys.argv[3]) if len(sys.argv) > 3 else None


def bbox(diff, label, ox, oy, thr=40):
    px = diff.load()
    pts = [(x, y) for y in range(diff.height) for x in range(diff.width) if px[x, y] > thr]
    if not pts:
        return print(f"{label:6} no ink")
    xs, ys = [p[0] + ox for p in pts], [p[1] + oy for p in pts]
    print(
        "%-6s x %d..%d w %d | y %d..%d h %d  n=%d"
        % (label, min(xs), max(xs), max(xs) - min(xs), min(ys), max(ys), max(ys) - min(ys), len(pts))
    )


on = Image.open(".figma-tmp/ink-on.png").convert("RGB")
off = Image.open(".figma-tmp/ink-off.png").convert("RGB")
bbox(ImageChops.difference(on, off).convert("L"), "web", cx, cy)

if band_y0 is not None:
    fig = Image.open(".figma-tmp/frame242-full.png").convert("RGB")
    comp = Image.open(".figma-tmp/band-solved.png").convert("RGB")
    w, h = on.size
    a = fig.crop((cx, cy, cx + w, cy + h))
    b = comp.crop((cx, cy - band_y0, cx + w, cy - band_y0 + h))
    bbox(ImageChops.difference(a, b).convert("L"), "figma", cx, cy)
