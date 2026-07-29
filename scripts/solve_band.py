#!/usr/bin/env python3
"""Solve the true screen position of every layer in a band of Frame 242.

Why this exists: `locate.py` matches one asset against the finished render, which
only works when that asset is the topmost thing at its spot. In a band like the
envelope, layers bury each other -- a floral under the quote card matches nothing.
So instead of matching a layer alone, this composites the WHOLE band in z order
and moves one layer at a time to minimise the error of the finished stack. An
occluded layer is then scored on whatever slice of it still shows.

Three more things it handles that a lone matcher cannot: layers that bleed off the
left or top edge (negative coordinates); TEXT nodes, which cannot be composited at
all and so are masked out of the error rather than counted as a mismatch; and
scoring a move only over the region the moved layer can reach, so a small floral
is not drowned out by a correct 375x560 card sitting next to it.

    python3 scripts/solve_band.py .figma-ref/bands/envelope.json

Job file:
    {"y0": 700, "y1": 1235,
     "layers": [{"id": "...", "asset": "src/assets/...webp", "x": 0, "y": 762,
                 "scale": 2, "solve": true, "search": 24}],
     "textMasks": [{"x": 181, "y": 767, "w": 185, "h": 58}]}

`solve: true` refines that layer's x/y; everything else is pinned. `search` is the
half-window in design px (default 24). Solved coordinates are written back to the
job file, and the finished stack lands in .figma-tmp/band-solved.png.

A layer whose error does not move at all is invisible in this band -- either it is
genuinely buried, or the position is far enough off that the window never reaches
the truth. The script says which.
"""
import json
import sys
from PIL import Image, ImageChops, ImageDraw

REF = ".figma-tmp/frame242-full.png"  # scale 1, so 1px == 1 design px
SCALE = 2
FRAME_W = 375
PASSES = 3


def load(path, scale=SCALE):
    im = Image.open(path).convert("RGBA")
    if scale == 1:
        return im
    return im.resize((max(1, im.width // scale), max(1, im.height // scale)), Image.LANCZOS)


def paste(canvas, im, x, y):
    """alpha_composite onto a band canvas, cropping whatever hangs off any edge."""
    cx, cy = max(0, -x), max(0, -y)
    if cx >= im.width or cy >= im.height:
        return
    px, py = x + cx, y + cy
    if px >= canvas.width or py >= canvas.height:
        return
    piece = im.crop(
        (cx, cy, min(im.width, cx + canvas.width - px), min(im.height, cy + canvas.height - py))
    )
    canvas.alpha_composite(piece, dest=(px, py))


def compose(layers, images, y0, height, lo=0, hi=None):
    canvas = Image.new("RGBA", (FRAME_W, height), (0, 0, 0, 0))
    for spec in layers[lo : hi if hi is not None else len(layers)]:
        paste(canvas, images[spec["id"]], int(round(spec["x"])), int(round(spec["y"])) - y0)
    return canvas


def make_mask(masks, y0, height):
    """White where the error counts, black over TEXT nodes we cannot draw."""
    m = Image.new("L", (FRAME_W, height), 255)
    d = ImageDraw.Draw(m)
    for r in masks:
        d.rectangle([r["x"], r["y"] - y0, r["x"] + r["w"], r["y"] - y0 + r["h"]], fill=0)
    return m


def band_error(ref, canvas, mask, box=None):
    flat = Image.new("RGB", canvas.size, (255, 255, 255))
    flat.paste(canvas, mask=canvas.getchannel("A"))
    diff = ImageChops.difference(ref, flat).convert("L")
    if box:
        diff, sub = diff.crop(box), mask.crop(box)
    else:
        sub = mask
    diff.paste(0, mask=ImageChops.invert(sub))
    hist = diff.histogram()
    counted = sum(sub.point(lambda v: 1 if v else 0).getdata())
    total = sum(i * n for i, n in enumerate(hist))
    return total / max(1, counted)


def solve_layer(idx, layers, images, ref, mask, y0, height):
    spec = layers[idx]
    im = images[spec["id"]]
    radius = spec.get("search", 24)

    below = compose(layers, images, y0, height, hi=idx)
    above = compose(layers, images, y0, height, lo=idx + 1)

    x0 = max(0, int(spec["x"]) - radius)
    y_top = max(0, int(spec["y"]) - y0 - radius)
    box = (
        x0,
        y_top,
        min(FRAME_W, int(spec["x"]) + im.width + radius),
        min(height, int(spec["y"]) - y0 + im.height + radius),
    )

    def score(x, y):
        canvas = below.copy()
        paste(canvas, im, x, y - y0)
        canvas.alpha_composite(above)
        return band_error(ref, canvas, mask, box)

    best = (score(int(spec["x"]), int(spec["y"])), int(spec["x"]), int(spec["y"]))
    start = best[0]
    for step in (4, 2, 1):
        bx, by = best[1], best[2]
        r = radius if step == 4 else step * 3
        for dy in range(-r, r + 1, step):
            for dx in range(-r, r + 1, step):
                s = score(bx + dx, by + dy)
                if s < best[0]:
                    best = (s, bx + dx, by + dy)
    spec["x"], spec["y"] = best[1], best[2]
    return start, best[0]


def main():
    path = sys.argv[1]
    job = json.load(open(path))
    y0, y1 = job["y0"], job["y1"]
    height = y1 - y0
    layers = job["layers"]
    images = {s["id"]: load(s["asset"], s.get("scale", SCALE)) for s in layers}
    ref = Image.open(REF).convert("RGB").crop((0, y0, FRAME_W, y1))
    mask = make_mask(job.get("textMasks", []), y0, height)

    def total():
        return band_error(ref, compose(layers, images, y0, height), mask)

    print(f"start  band error {total():.2f}")
    for p in range(PASSES):
        moved = False
        for i, spec in enumerate(layers):
            if not spec.get("solve"):
                continue
            before = (spec["x"], spec["y"])
            s0, s1 = solve_layer(i, layers, images, ref, mask, y0, height)
            after = (spec["x"], spec["y"])
            if after != before:
                moved = True
            flag = "  <-- no gradient: buried, or the window never reached it" if s1 >= s0 - 1e-9 and after == before else ""
            print(f'  pass{p + 1} {spec["id"]:12} x={after[0]:<5} y={after[1]:<6} local {s0:6.2f} -> {s1:6.2f}{flag}')
        if not moved:
            break

    band = compose(layers, images, y0, height)
    print(f"final  band error {total():.2f}")
    flat = Image.new("RGB", band.size, (255, 255, 255))
    flat.paste(band, mask=band.getchannel("A"))
    flat.save(".figma-tmp/band-solved.png")
    json.dump(job, open(path, "w"), indent=1)
    print("wrote .figma-tmp/band-solved.png and updated the job file")


if __name__ == "__main__":
    main()
