#!/usr/bin/env python3
"""Find where a sliced asset actually lands on the Figma frame render.

Figma's reported bounds lie in two situations, both common in this file:
a rotated node reports its UNROTATED size at the transform origin, and any
export can be silently clipped to the parent frame. When an asset's pixel size
disagrees with its node's declared size, the coordinates cannot be trusted --
match the asset against the frame render instead.

    python3 scripts/locate.py src/assets/quote/parts/02_2609-108.webp 217 1016

Prints the top-left corner in frame-local design px, plus a match error in
0-255 per channel. Under ~15 is a real match; above ~40 means the asset is not
visible at that spot (occluded, hidden, or the hint is far off).
"""
import sys
import random
from PIL import Image

REF = ".figma-tmp/frame242-full.png"  # scale 1, so 1px == 1 design px
SCALE = 2  # every other asset is exported at 2x
RADIUS = 160  # how far from the hint to search
SAMPLES = 900


def load_asset(path):
    im = Image.open(path).convert("RGBA")
    return im.resize((im.width // SCALE, im.height // SCALE), Image.LANCZOS)


def opaque_points(im, limit):
    px = im.load()
    pts = [
        (x, y, px[x, y][:3])
        for y in range(0, im.height, 2)
        for x in range(0, im.width, 2)
        if px[x, y][3] > 240
    ]
    if not pts:
        return []
    random.seed(0)
    return random.sample(pts, min(limit, len(pts)))


def locate(path, hint_x, hint_y):
    ref = Image.open(REF).convert("RGB")
    rp = ref.load()
    asset = load_asset(path)
    pts = opaque_points(asset, SAMPLES)
    if not pts:
        return None, "asset is fully transparent"

    def score(ox, oy):
        total = 0
        for x, y, (r, g, b) in pts:
            pr, pg, pb = rp[x + ox, y + oy]
            total += abs(pr - r) + abs(pg - g) + abs(pb - b)
        return total / len(pts)

    xs = range(max(0, hint_x - RADIUS), min(ref.width - asset.width, hint_x + RADIUS) + 1)
    ys = range(max(0, hint_y - RADIUS), min(ref.height - asset.height, hint_y + RADIUS) + 1)
    if not xs or not ys:
        return None, "asset does not fit inside the frame at that hint"

    best = min((score(ox, oy), ox, oy) for oy in ys[::3] for ox in xs[::3])
    err, bx, by = best
    for oy in range(max(ys.start, by - 4), min(ys.stop, by + 5)):
        for ox in range(max(xs.start, bx - 4), min(xs.stop, bx + 5)):
            s = score(ox, oy)
            if s < err:
                err, bx, by = s, ox, oy
    return (bx, by, asset.width, asset.height, err), None


def main():
    args = sys.argv[1:]
    if len(args) < 3 or len(args) % 3:
        sys.exit(__doc__)
    for i in range(0, len(args), 3):
        path, hx, hy = args[i], int(args[i + 1]), int(args[i + 2])
        found, err = locate(path, hx, hy)
        name = path.split("/")[-1]
        if err:
            print(f"{name:38} {err}")
            continue
        x, y, w, h, e = found
        drift = f"  (hint was {hx},{hy})" if (x, y) != (hx, hy) else ""
        print(f"{name:38} x={x:<5} y={y:<6} {w}x{h:<6} err={e:6.2f}{drift}")


if __name__ == "__main__":
    main()
