#!/usr/bin/env python3
"""Cut the gallery band's two stock shots out of its own plate.

The carousel needs photos to be clickable before any API supplies them, and the
only source of the design's own shots is the flattened group export. Cropping them
back out means the unconfigured render is still pixel-identical to Figma in the main
slot and in thumbs 1 and 3, instead of showing nothing at all.

Registration: the plate's origin is design (4.55, 3497) at scale 2 -- see
.figma-ref/bands/gallery.json. Slot rects are the same numbers GallerySection uses.

    python3 scripts/crop-gallery-fallback.py
"""
from PIL import Image

PLATE = "src/assets/gallery/parts/01_2560-183_group-219.webp"
OUT = "src/assets/gallery/fallback"
ORIGIN = (4.55, 3497.0)  # design coords of the export's top-left
SCALE = 2

# (name, design x, y, w, h) -- 2560:196 is thumb slot 1, 2560:189 the main slot.
CROPS = [
    ("photo-1", 43.49, 3797.14, 68.82, 70.86),  # the close-up, thumbs 1 and 3
    ("photo-2", 34.05, 3501.00, 307.59, 288.73),  # the full-length shot, main slot
]


def main() -> None:
    plate = Image.open(PLATE).convert("RGB")
    for name, x, y, w, h in CROPS:
        px = round((x - ORIGIN[0]) * SCALE)
        py = round((y - ORIGIN[1]) * SCALE)
        box = (px, py, px + round(w * SCALE), py + round(h * SCALE))
        assert box[2] <= plate.width and box[3] <= plate.height, f"{name} falls off the plate"
        plate.crop(box).save(f"{OUT}/{name}.webp", quality=92, method=6)
        print(f"{name}.webp  {box}")


if __name__ == "__main__":
    main()
