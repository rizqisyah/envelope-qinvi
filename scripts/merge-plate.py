#!/usr/bin/env python3
"""Flatten the garden plate and a portrait cutout into the single image the CMS serves.

The bands used to stack two layers -- a shared garden backdrop plus a transparent
portrait sitting on top -- but `photo_url` from getHome is one opaque 360x409 image
with the background already baked in. These merged files are the fallback for a
wedding that has not uploaded a photo yet, so the unconfigured render still matches
the design instead of showing a bare garden.

Offsets are the portrait's Figma box minus the garden's, doubled: the exports are 2x.

    python3 scripts/merge-plate.py
"""

from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "src" / "assets"
GARDEN = ASSETS / "bride" / "parts" / "01_2551-186_bg-bride.webp"

# Garden box is x8 y147 in frame-local CSS px; portraits are placed relative to it.
GARDEN_ORIGIN = (8, 147)
SCALE = 2

PLATES = [
    # (portrait file, its Figma x/y, output name)
    (ASSETS / "groom" / "parts" / "03_2551-183_photo.webp", (69, 226), "groom"),
    (ASSETS / "bride" / "parts" / "04_2551-198_photo.webp", (108, 241), "bride"),
]


def merge(portrait_path: Path, box_xy: tuple[int, int], side: str) -> Path:
    garden = Image.open(GARDEN).convert("RGBA")
    portrait = Image.open(portrait_path).convert("RGBA")

    offset = tuple((box_xy[i] - GARDEN_ORIGIN[i]) * SCALE for i in range(2))
    if offset[0] + portrait.width > garden.width or offset[1] + portrait.height > garden.height:
        raise SystemExit(f"{side}: portrait at {offset} overflows the {garden.size} garden")

    out = garden.copy()
    out.alpha_composite(portrait, offset)

    dest = ASSETS / side / "parts" / f"plate-{side}-merged.webp"
    # Opaque, like the CMS images -- the frame's aperture is what crops it.
    out.convert("RGB").save(dest, "WEBP", quality=88, method=6)
    print(f"{side}: pasted at {offset} -> {dest.name} ({dest.stat().st_size // 1024} kB)")
    return dest


if __name__ == "__main__":
    for portrait_path, box_xy, side in PLATES:
        merge(portrait_path, box_xy, side)
