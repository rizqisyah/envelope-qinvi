# Slicing notes — "adat jawa" Figma file

Template 3 comes from **two** frames on Page 1 of the Figma file **adat jawa**:

| Frame | Node | Size | What it is | Assets |
|-------|------|------|------------|--------|
| Frame 241 | `2548:110` | 375 × 725 | Opening cover / splash — olive envelope, "Click to open…" | `src/assets/opening/` |
| Frame 242 | `2550:131` | 375 × 8749 | The scrolling invitation behind it | every other `src/assets/*` |

`src/assets/cover/` is **not** Frame 241 — it is Frame 242's own cover section (white envelope +
"Wedding Invitation" stamp + "Save The Date" seal) at y 760–1000. Frame 241's slices live in
`src/assets/opening/`.

Frame 242 is a sibling of the frame that produced `slicing-wedding-template-2`.

Design direction differs from template-2: cream paper texture, embossed white ornate frames,
olive-green envelopes, gold script. Couple in the design: **Antonio Josua Setiyadi** &
**Ayu Shella Pratni (Allysa)** — footer text says "Aliyah", an inconsistency in the design.
All copy is data-driven via `useWedding()`, so these are placeholders only.

## Reference files

| File | What it is |
|------|------------|
| `.figma-ref/frame241-layout.json` | Frame 241: every graphic + text node, with the verified render position of each and why three nodes were dropped |
| `.figma-ref/frame242-zorder.json` | **Frame 242's 165 direct children in Figma child order** — the only file that carries z-order. Read this before building any band |
| `.figma-ref/bands/*.json` | Per-band layer stacks with solved coordinates, one file per built band (input and output of `scripts/solve_band.py`) |
| `.figma-ref/frame242-layout.json` | All 344 nodes incl. nested: id, type, name, parent, depth, x/y/w/h (frame-local), section, text, and `styles` (font family/size/weight/line-height/fills) |
| `.figma-ref/frame242-raw.json` | Untouched `get_selection` dump — regenerate the layout from this rather than re-querying Figma |
| `.figma-ref/asset-dedupe-map.json` | Which exports collapsed into which file (see "Deduped assets" below) |
| `src/assets/<section>/parts/*.webp` | Per-node exports at 2×, deduped |

The frame is **flat** — no section frames in Figma. Sections below were derived from node
y-positions and confirmed against a full-frame render. Node names in Figma are junk
(`sdvbsdbsddb 1`, `vdf 2`, `Photoroom 5`); the export filenames keep the node id so anything can
be traced back with `frame242-layout.json`.

## Frame 241 — opening cover (built)

Only four graphics survive; the whole screen is `CoverSection.vue`.

| z | Node | Asset | Frame-local box |
|---|------|-------|-----------------|
| 1 | `2548:133` "bac 1" | `opening/00_2548-133_paper-bg.webp` | full-bleed, `background-size: cover` |
| 2 | `2588:122` | `opening/01_2588-122_envelope.webp` | 361 × 361 @ (10, 173) |
| 3 | `2588:124` "vdf 1" | `opening/03_2588-124_lily.webp` | 264 × 165.5 @ (56, 386) |
| 4 | `2588:126` | `opening/02_2588-126_seal.webp` | 65 × 82 @ (162, 346) |

Dropped: `2548:88` (solid `#d9d9d9` base, fully covered by the opaque paper texture), `2548:185`
(claims 549 × 686, exports 1 × 1 — empty node), `2548:111` (iOS status-bar mockup).

**Two traps this frame set, worth checking on any other frame:**

1. **A rotated node's reported bounds are not where the art lands.** `vdf 1` reports
   143 × 254 @ (58, 528.9) but renders 264 × 165.5 @ (56, 386). Figma gives the *unrotated* size
   at the transform origin.
2. **Figma clips exports to the parent frame.** `bac 1` is 422 × 704 at (-22, 29) but exports
   375 × 696 — the bleed is gone. Don't assume the export matches the declared size.

Both were caught by exporting each node alone, then template-matching that export against a
full-frame render to find where it actually sits. Do the same for any node you can't place by eye:

```bash
pnpm dev & node scripts/shot.mjs   # 375×725, 375×812, 1440×900 + clicks the cover open
```

then diff `.figma-tmp/web-mobile.png` against `.figma-tmp/frame241-full.png`. The built cover
currently sits at a mean per-channel difference of **3.35 / 255** below the status-bar row.

## Placing a layer when Figma's coordinates lie

Three separate things make a node's reported bounds wrong, and they compound:

| Symptom | Cause |
|---------|-------|
| Export is *bigger* than the node in both axes | The node is rotated. Figma reports the unrotated size at the transform origin — it says nothing about where the art lands |
| Export is *smaller*, usually snapped to 375 wide | Figma clipped the export to the frame |
| Export is a few px bigger, same aspect | An effect (drop shadow) grew the export box |

So: **compare every export's pixel size against its node's declared size before
placing it.** If they disagree, the coordinates need solving, and the export's own
size — not the node's — is what you set in CSS.

Two tools do the solving, both diffing against `.figma-tmp/frame242-full.png`
(export Frame 242 at scale 1, so 1px == 1 design px):

```bash
python3 scripts/locate.py <asset> <hintX> <hintY>            # one asset, if nothing covers it
python3 scripts/solve_band.py .figma-ref/bands/<band>.json    # a whole stack
node   scripts/fit-text.mjs <port> <sel> <x> <y> <w> <h>      # where a text node's glyphs land
python3 scripts/ink.py <clipX> <clipY> [bandY0]               # ...turned into a bounding box
node   scripts/check-gallery.mjs <port>                       # the gallery carousel's own logic
node   scripts/check-ceremony.mjs <port>                      # the akad + resepsi cards' live copy
python3 scripts/crop-gallery-fallback.py                      # its stock photos, cut from its plate
```

`locate.py` only works when the asset is the topmost thing at its spot. In a dense
band it fails silently with a high error, because a floral buried under a card
matches nothing. `solve_band.py` composites the entire band in z order and moves
one layer at a time, so a buried layer is scored on whatever slice of it still
shows; it also handles layers that bleed off the left or top edge, and masks out
TEXT nodes, which cannot be composited and would otherwise read as a mismatch.

A layer that never improves is either genuinely buried or the search window never
reached it — the script says which. Two failure modes to watch for, both hit in
the envelope band:

- **The window never reached it.** Two florals there sit ~100px from their
  declared coordinates, far outside the default ±24. Read the frame render, get a
  hint by eye, and re-run a focused job over a narrow y range with a wide `search`.
- **A text mask gave the layer somewhere free to hide.** Masked pixels cost
  nothing, so the solver happily parked a floral spray on top of the "Save The
  Date" copy. If a solved layer lands on masked text, it is wrong.
- **The layer barely tints what it covers.** A thin white pearl string over white
  paper moves the error by almost nothing, so the solver slid the groom band's
  pearls 76px up onto the parents line and called it an improvement. When a layer
  is low-contrast against its backdrop, check it with `locate.py` — it matched the
  declared y exactly — or just trust the declared coordinates.
- **A whole element is missing, and no node explains it.** The glimpse band's date
  sits on a scalloped plate that matches nothing in the 345-node dump — the band
  scored 9.98 with a 330 × 162 hole in it. It is `2555:112`, exported into
  **`assets/gallery/`**: sections are derived from y, and that node is rotated, so
  Figma reports y 3405 while it renders at ~3095. When a band is missing something
  large, look for a rotated node filed under the neighbouring section before
  concluding the export is absent. `scan_nodes_by_types` over the frame plus an
  asset-to-node diff is the fast way to find it.
- **The declared coordinates were right all along.** The divider's pearl chain
  (`2560:178`) reports x 383 on a 375-wide frame, which reads as nonsense, so it
  got solved — and landed 200px off. It is simply frame-clipped: a 475-wide node
  at a negative x, exported 375 wide from the frame's left edge, so **x is 0 and
  the declared y is untouched**. When only the width was clipped, the reported y
  is still good; seed the solve from it before assuming the node is rotated.

These were fixed with small focused jobs (`envelope-florals.json`,
`save-the-date.json`) rather than by widening the main one.

**Confirm nothing is hiding before you ship a band.** Composite it once per layer
with that layer left out: if removing a layer does not make the band error worse,
its solved position is arbitrary and probably wrong. Every divider layer moved the
error by 0.13–3.2, so none of them were parked off-canvas.

**Pin the neighbouring band's overhang in the job.** The divider hangs 313px into
the bride band, and solving the bride without it left those rows comparing
artwork against bare paper: base error 4.77, and the frame layer solved against a
biased target. Pinning the 13 overhanging layers took the same band to 2.79 and
both solves then sat at their optimum already.

**A big text mask is a big hiding place.** The glimpse band's date block needs a
290 × 125 mask, and with the plate missing it needed another 330 × 162. Six layers
promptly solved *into* those holes, where masked pixels cost nothing — including a
white orchid that ended up printed across "We're getting married". The
leave-one-out pass is what caught them: all six contributed 0.00 to the band error.
Rule: a layer that contributes nothing, or that lands inside a mask, is unplaced —
read its position off the render instead. The lily `2588:127` shipped once at its
declared coordinates on exactly that evidence and was 237px out: rotated ~68°
(declared 117 × 208 portrait, export 236 × 184 landscape), and `locate.py` had
*declined* to run on it ("does not fit inside the frame") rather than disagreed, so
there was no second opinion. A probe over the region its footprint can reach found
a clean minimum 1.08/255 below having it absent. When a mask hides most of a
layer's footprint, score only the strip outside the mask — that is still a real
signal, and it is how `2560:171` was placed 55px from its declared x. Corollary: fill the hole if you can. Once
the plate was found and composited, the same band solved to 4.28 and only the two
genuinely-buried layers went quiet.

**Score the band you actually ship.** The glimpse job first ran to `y1: 3400`
against a component 691px tall, leaving the last 100 rows — the lily and the
envelope's bottom — unscored, so the quoted number was not a statement about the
band on screen. Set `y1` to where the next band's art really starts (3477 here:
`2560:190` sits 24px above its own group box at 3501).

**Low contrast defeats the check as well as the solve.** Getting the divider's
paint order wrong — bells, the pearl chain and the orchid all emitted too late —
moved the band diff by 0.15/255, because every overlap there is white pearls on
white daisies on white drape. A mean-difference metric cannot see a stacking bug
in that material. Keep each band's array in Figma's z order and carry the
animation delay on the layer; do not group layers by entrance, because the
grouping silently reorders the stack and nothing downstream will flag it.

**Figma's x can be off by exactly the asset's own width.** Two akad florals
(`2594:329`, `2594:330`) are size-exact — no rotation, no clipping, so by every rule
above their coordinates should be trustworthy — and both are placed one asset width
too far right: 84 → 14 for a 70-wide spray, 88 → 44 for a 44-wide rose. Worse, at the
declared x the orchid lands *under the card*, which reads exactly like a deliberately
hidden layer: 0.000 leave-one-out, no hole in the band, a plausible story. It was not
hidden, it was 70px out. When a size-exact layer contributes nothing, probe it at
`x - width` before concluding anything, and re-probe every other size-exact layer in
the band for the same shift — in the akad band the other five were all at their
declared x.

**A clipped export can *prove* a coordinate.** Three of the akad band's florals
report a width the export does not have — 81 → 69 at x 306, 98 → 69 at x 306,
63 → 60 at x 315 — and in every case the export width is exactly `375 - x`. That is
the frame clipping the right edge, which only happens if x is what Figma says, so
those three needed no solving at all. The same rule runs the other way and is
stronger: a rotated node whose export is *wider* than its declared box cannot sit
where Figma claims if `x + exportWidth > 375` and the export came back unclipped.
That caps x at `375 - exportWidth`, and for `2594:319` and `2594:328` the cap is
also where they score best — the band solve had walked 328 out to x 341, which the
clip rule rules out outright. Apply the cap before trusting a solver minimum.

**Shadow bleed is not symmetric, so register off the art, not the box.** Group 219
(the gallery carousel) declares 356.78 × 367 at (12, 3501) and exports 370.5 × 384.5 —
its rounded rects carry a drop shadow that bleeds 7.5 left, 6.3 right, 4 up and 13.5
down. Splitting the difference would have put it ~4px out. The main photo's own
edges are in the export as a hard alpha step (straight run x 59–672, rows 8–586 at
scale 2), and one child rect's declared position is enough to pin the origin from
there: `x0 = 34.05 − 59/2 = 4.55`, `y0 = 3501 − 8/2 = 3497`. Then confirm with a
±3px probe — a clean bowl, not a plateau. `solve_band.py` reports "no gradient" for
both an already-optimal layer and a hopeless one, so it cannot make that call.

## Placing live text on an exported card

The akad card is the first band with a real text block on it, and the measurement
is cheap enough that guessing is not worth it: place each TEXT node at its own
declared y, screenshot, and compare ink rows against the render with a colour
filter tight enough to exclude the artwork (`r - g > 35` picks the maroon copy out
of both the green florals and the gold button). Frame 242's card came back with
horizontal centres and glyph widths matching **to the pixel** on the first try — so
only `top` ever needs correcting, and the correction is per-block, not global:
6px for Meow Script 20/24, 4px for Ovo at line-height 24, 3px for Ovo 8/12.

Two things the copy itself taught us:

- **The design's mock data is not self-consistent.** The card reads "Saturday,
  19 April 2029"; that date is a Thursday. So the fallback strings are the design's
  literal text, and `scripts/check-ceremony.mjs` asserts them literally while testing
  the formatter against a date that really is a Saturday.
- **A bare `YYYY-MM-DD` is parsed as UTC midnight**, which renders as the day before
  anywhere west of Greenwich — the wedding would read Friday to a guest in New York.
  `src/lib/format.ts` builds date-only strings as local dates, and the check runs
  one case under `America/New_York` to keep it that way.

## Reduced motion hides a whole class of bug

Both `shot.mjs` and the band checks run with `reducedMotion: 'reduce'`, because that
pins every stagger to its end state and makes the shots deterministic. It also makes
them **blind to anything left out of the `.is-in` rule**: the reduced-motion block
forces `opacity: 1` on everything, so an element that never fades in is invisible in
the real invitation and passes every check.

That is exactly what happened to the akad heading. Pulling it out of the shared
`.is-in` rule — necessary, because it carries a rotation and there is only one
`transform` property — also pulled it out of the fade, and nothing caught it until
the band was looked at in a browser. Whenever a band element gets its own `.is-in`
rule, that rule needs `opacity: 1` as well as its transform, and the band's check
needs one pass with `reducedMotion: 'no-preference'` that waits out the longest
chain and asserts the computed opacity.

## The design has content the render does not

`scan_text_nodes` on Frame 242 returns 64 text nodes; `search_nodes` across the
document returns four more that belong to it and are in neither that list, the
344-node dump, nor `frame242-full.png`. They are **hidden layers** — `get_screenshot`
on one answers "No nodes to export". Two of them are the akad band's heading:

| Node | Frame-local box | Text |
|------|-----------------|------|
| `2560:211` | (11.05, 3977.09) 202 × 40 | It's the day! |
| `2560:213` | (84, 4007.94) 202 × 40 | Akad Nikah |
| `2560:261` | (11, 4571.94) 202 × 40 | It's the day! — Resepsi's |
| `2560:262` | (83.95, 4602.79) 234 × 40 | Resepsi Nikah |

Both pairs sit exactly 594.85 apart, so the Resepsi heading places off the akad one.
All four are Pinyon Script 40/38, `#000000`, centred — and all four are rotated, so
those declared boxes say nothing about where the art lands.

Three consequences worth knowing before you meet the next one:

- **`search_nodes` returns absolute canvas coordinates, everything else is
  frame-local.** Frame 242 sits at canvas (2548, −3230), so subtract that. A node
  reported at x 2559 is not off-canvas, it is at frame x 11.
- **Nothing can be solved against the render, because the render does not contain
  it.** Geometry has to come from a screenshot of the design instead. Recover the
  angle by deskew — rotate the ink and take the angle whose row histogram is
  sharpest (−12.25° here) — and the scale by rendering the same string at the same
  size in the browser and comparing ink widths (1.746 here, agreeing to 0.1% across
  both lines). For the absolute anchor, find something in the crop that *is* in the
  render: this one clipped the envelope's apex, which the asset's own alpha puts at
  frame (187, 4062). Then place, screenshot, measure the same extremal ink pixels,
  and shift — it converged in one iteration to under half a pixel.
- **Verify it twice, from different registrations.** A second screenshot of the same
  design — full frame width, so it registered off the paper edges (x 66..722 → scale
  1.752) instead of the envelope apex — put the block at frame x 31.4..278.5,
  y 3940.5..4034.1 and the angle at −12.25°, against a built 31..279 / 3939..4032 at
  −12.25°. Two independent paths inside a pixel is what makes this placeable at all.
- **Adding it makes the pixel diff worse, and that is correct.** The gallery band
  went 4.07 → 6.25 because rows 3900–4052 now carry copy the reference render does
  not have. Score the comparable rows instead: 3501–3900 is 4.96, unchanged.

## A band that is a component, not a picture

The gallery band is the first one whose content is *data*, and it needs a different
shape from the seven above it. `2560:183` contains nothing but rounded-rect photo
masks and two white circles — no floral z-order to recover — so the whole group
ships as **one plate** and the live photos are absolutely positioned over the slot
rects, which are exact (nothing in the group is rotated). Three things follow:

- **The plate is also the source of the empty state.** Leaving the overlays out
  until an API supplies photos looked like the lazy answer, but it means an
  unconfigured invitation — every local preview included — has nothing on the band
  to click. `scripts/crop-gallery-fallback.py` cuts the design's own two shots back
  out of the plate, so the slots are always populated and always clickable. The main
  slot and thumbs 1 and 3 get their crop at native size and stay pixel-exact;
  thumbs 2 and 4 show the main crop scaled down 4.5×, and the browser's resampling
  against Figma's puts them at ~17/255 where the exact ones sit at ~9. Cropping a
  third file at thumb size would fix it and is worth about 0.4/255 on the band —
  it was not judged worth a per-slot fallback mapping.
- **Redraw whatever an overlay covers.** The live main photo hides 20px of the
  left circle and 15px of the right one, and in Figma both circles paint *above*
  the photo — so they are re-drawn in CSS (`#fff`, radius 29, sampled off the
  render) instead of being left to the plate. Each slot also carries `Rectangle
  118`'s own `#d9d9d9` fill, so a slow or 404 photo degrades to the design's
  placeholder rather than uncovering the baked stock couple.
- **Animate the stage, not the overlays.** The overlays are glued to the plate's
  slots; anything that moves one alone slides the baked art into view underneath.
  The reveal moves `.gallery__stage` as one piece, and the per-photo zoom lives on
  the `<img>` inside each clipping slot.

**The pixel diff cannot see any of this.** A mean-difference number says nothing
about whether the carousel works, so `scripts/check-gallery.mjs` asserts what the
diff structurally can't, in two passes — a stubbed three-photo `getHome`, then an
empty one:

- every overlay's box against its Figma slot rect (all within 0.02px);
- tapping any photo opens the preview, and a thumb selects its own photo on the way,
  while the two nav circles browse without opening it;
- a short set repeats across the four slots, and prev/next wrap at both ends;
- the lightbox is teleported out of `.sheet` — `container-type: inline-size` makes
  `.sheet` the containing block for fixed descendants, so an unteleported
  `position: fixed` overlay is clipped to the card;
- focus moves into the viewer on open and back to whichever slot opened it on close,
  which is what `aria-modal` promises;
- with no configured photos the slots still populate and still open the preview.

It also writes `.figma-tmp/gallery-live.png`. A bounding box within 0.01px says
nothing about the rounded-corner AA, and the flat-colour stub makes any ring of the
plate's baked art leaking around a slot unmistakable.

## A whole band can be another band, moved

Resepsi (Group 244) is Akad (Group 245) again, and not merely "similar" — it is a
**rigid translation** by `(−8, +587)`. All 19 nodes, layers and TEXT alike, sit at
their twin's coordinate plus that offset, with no exceptions. Solving it would have
been re-deriving numbers that were already verified once.

Before trusting that, get more than one kind of evidence. Four here, and none of
them is "the declared coordinates match", because Figma's declared coordinates are
exactly what this file spends its length warning about:

1. **The declared coordinates match** — necessary, not sufficient. It says the two
   groups were built the same way; it says nothing about whether either is right.
2. **9 of the 14 exports are byte-identical.** `md5` the parts directories against
   each other. Same bytes means same art at the same size.
3. **The 5 that differ are the right-edge-clipped ones, and each is exactly 8px
   wider.** 69 → 77 hops, 69 → 77 sweet pea, 142 → 150 lily, 90 → 98 gypsophila:
   8px further from the right edge means 8px more of the sprite inside the frame.
   This is the clip rule doing real work — `375 − 77 = 298` *proves* the x without
   reference to the translation at all.
4. **The one asset that breaks the +8 pattern is the strongest evidence of all.**
   The big white rose is +3, not +8, because at x 307 it stops touching the right
   edge and exports at its full 63 instead of akad's clipped 60. A wrong hypothesis
   does not predict its own exceptions.

Then score it. Akad's art rows and Resepsi's art rows both come back at **2.93/255**,
and the worst row lands at 4288 and 4875 — `4875 − 587 = 4288`, the same row of the
same picture at the same magnitude. That is what a correct translation looks like:
not "good", but *identical*.

**The two lies repeat too.** Both of akad's asset-width errors (`2594:329` declaring
x 76 for a 70-wide sprite, `2594:367` declaring x 80 for a 44-wide one) recur here
with the same signature. Whatever produced that shift is systematic, so a band that
is a copy inherits its twin's corrections along with its coordinates.

**What does not ride the group's offset.** The hidden heading is not a child of the
group, so it does not move with it: the layers shift `(−8, +587)`, the heading shifts
`(−0.05, +594.85)`. Those differ by about 8px in both axes — close enough to look
plausible if you derive one from the other, and wrong enough to fail an ink check.
Measure each independently. In a shared component this must be a separate prop, never
computed from the layer offset.

**Verify first, extract second.** The two bands now share `CeremonyBand.vue`, but that
landed as a separate commit *after* Resepsi's diff was green. Extracting first would
have meant debugging a component written an hour earlier instead of plain code, and any
per-band exception would have had to be threaded through it under pressure.

What the shared component takes is the machinery — markup, reveal choreography, text
placement, the Maps control — and what it does not take is the coordinates. Each band
keeps its own layer table. A `dx` prop would have saved about thirty lines and buried
the two things this band proves are dangerous: that the numbers are the expensive part,
and that not everything in a band shares one offset.

## Frame 242 — three things that will bite you

**1. `frame242-layout.json` does not carry z-order.** It is sorted by `(depth, y)`, so its array
order is meaningless for stacking, and at `depth >= 1` its x/y are parent-relative, not
frame-local. Use `frame242-zorder.json` (child order = painted order, higher z = on top,
coordinates always frame-local) whenever layers overlap. The hero was built wrong twice before
this was noticed: `Group 234` paints *above* the two photos, and its transparent aperture is what
crops them into the ornate frame.

**2. Figma clips exports to the parent frame, silently.** `Group 234` is 375 × 724 at y −38, but
exports 375 × 686 — the 38px above the frame is gone, so the asset belongs at **y 0**, not y −38.
Always compare the export's pixel size against the node's declared size before placing it.

**3. `section` in `frame242-layout.json` is incomplete.** 105 of 344 nodes have `section: null`,
including ten top-level TEXT nodes that are real section headings — "The Bride & The Groom",
"And", "THE GLIMPSE OF US", "SAVE THE DATE", "09. 09. 26", "We're getting married",
"Thank You !", "Antonio + Aliyah". Never conclude a band has no text from that field alone.
`frame242-zorder.json` derives `section` from y for all 165 top-level children.

The two page-wide backdrops (`2550:130` paper at y 13, `2560:276` bg-strip at y 2821) are
**scale-1 exports** (375 × 8736 and 375 × 5928) while every other asset is scale 2 — a 2× export
of something 8700px tall exceeds what Figma will produce. Don't "fix" this by re-exporting.

## Frame 242 — section map

| # | y range | Section | Assets |
|---|---------|---------|--------|
| 1 | 0–760 | Hero — "The Bride & The Groom", ornate frame, couple portrait — **built** | `hero/` (2) + `footer/21_..._img-8300` |
| 2–3 | 760–1400 | Envelope — white envelope, stamp, "Save The Date", QS Ar-Rum 21 card — **built as one component** | `cover/` (5) + `quote/` (11) |
| 4 | 1235–2014 | Groom — ornate frame, portrait, name block — **built** | `groom/` (9) + `bride/01_..._bg-bride` |
| 5 | 1899–2160 | Divider — drape + pearls + "And" — **built, overlay only** | `divider/` (10) + 3 of `groom/` |
| 6 | 2014–2810 | Bride — Allysa — **built** | `bride/` (6) + `glimpse/00_..._vdsvzdsvd-1` |
| 7 | 2810–3501 | Glimpse of Us — polaroids, green envelope, "09.09.26" — **built** | `glimpse/` (22) + `gallery/00_2555-112` |
| 8 | 3501–4052 | Gallery — photo carousel — **built, one plate + live overlays**. Rows 3900–4052 carry the akad heading, which `AkadSection` owns | `gallery/01_..._group-219` |
| 9 | 4052–4639 | Akad — envelope + scalloped card, live event copy — **built** | `akad/` (14) |
| 10 | 4639–5119 | Resepsi — the akad composition translated by (−8, +587) — **built** | `resepsi/` (14) |
| 11 | 5180–5420 | Countdown — silver tray | `countdown/` (17) |
| 12 | 5420–6130 | Wedding Gift — bank cards + address | `gift/` (6) |
| 13 | 6130–6760 | RSVP — olive arch form | `rsvp/` (7) |
| 14 | 6760–7700 | Wedding Wish — form + wishes list | `wish/` (7) |
| 15 | 7700–8749 | Footer / Thank You + credits + IG/WA | `footer/` (32) |
| — | full page | Paper texture backdrop + long bg strip | `page/` (2) |

## Text is never baked into an asset

Ten groups (bride/groom name blocks, the quote card, the gift cards, the RSVP arch, both event
cards, the wish panel, the credits row) contain TEXT children. Exporting those groups whole would
have burned "Allysa", "Antonio", the bank account numbers and the event dates into pixels — copy
that `useWedding()` is supposed to supply. Those group exports were deleted and replaced with
their graphic-only descendants, named `g<group>_<nodeId>_*.webp`.

**If you export anything new: never export a node that has a TEXT descendant.** Walk down to the
highest subtree that contains none. `frame242-layout.json` has `parent` and `depth` for this.

## Deduped assets

Identical exports collapsed to one file, so an asset may live under a sibling section:

- The groom background is byte-identical to the bride's and only exists as
  `bride/parts/01_2551-186_bg-bride.webp`.
- The three gift cards share one card, one BCA logo and one copy icon.
- Akad and Resepsi are the same composition twice; each kept its own copy.

`.figma-ref/asset-dedupe-map.json` maps every dropped export to the file that replaced it.

## Intentional overflow

Some assets are wider or taller than the 375 frame and are clipped by it by design. Do not
"fix" these by scaling them to 375 — they are meant to bleed:

| Asset | Size | Note |
|-------|------|------|
| `page/00_..._paper-bg` | 375 × 9500 | Backdrop, 751px taller than the frame |
| `page/01_..._bg-strip` | 405 × 6683 | Declared at (-20, 2821), but 2821 + 6683 overshoots the frame, so the export is clipped on **both** axes to 375 × 5928 at x 0. Rendered by `InviteBody` |
| `divider/05_..._drape` | 812 × 356 | Drape bleeds well past both edges |
| `quote/00_..._bac-2` | 422 × 704 | Bleeds ~23px each side |

## Typography

Frame 242 uses a different type system from template-2 — `Playball` does not appear at all.
Installed and wired in `src/style.css`, tokens in `src/style/tokens.css`:

| Family | Sizes used | Role |
|--------|-----------|------|
| Pinyon Script | 20–96 | Display names, section titles |
| EB Garamond | 11–36 (400/600) | Body copy |
| Ovo | 8–15 | Small captions |
| Cormorant Garamond | 16 (700) | Emphasised serif |
| Noto Sans | 12–14 (300/400/600) | Arabic verse, wish list |
| Jost | 10–13 | UI labels |
| Playfair Display SC | 20 | Small-caps headings |
| Meow Script | 20 | "We're getting married" |
| Reddit Sans | 15 | Frame 241 "THE WEDDING OF" |
| Platypi | 14 | Frame 241 "Dear Mr/ Mrs/ Ms" |
| Poltawski Nowy | 16 | Frame 241 guest name |
| Playfair | 10 | Frame 242 quote-card body |

Frame 241 shares only Pinyon Script and Jost with Frame 242; the other three families above are
its own.

**Pochaevsk** (12px and 15px, 2 nodes in Frame 242) is still uninstalled, but `@fontsource/pochaevsk`
*does* exist (5.3.0) — an earlier note here claiming otherwise was wrong. Install it when those
two nodes get built. Find them with a `styles.fontFamily` search in the layout JSON.

Platypi and Poltawski Nowy render ~2px lower than Figma's auto line box, so `CoverSection` places
those two lines at y 532 / 553 instead of the reported 534 / 555.

Two things the Figma API gets wrong about this frame's type, both caught by
measuring the rendered ink with `node scripts/fit-text.mjs` + `python3 scripts/ink.py`
(they screenshot a text node with and without it rendered, so the artwork can be
subtracted and only the glyphs measured):

- **`2555:119` reports Pinyon Script and renders in Meow Script.** At the height the
  design draws it, Meow sets "We're getting married" 172px wide; Pinyon sets the
  same string 131px. The typography table below had it right and the API does not.
- **A `lineHeight` well over the font size renders low in CSS and high in Figma.**
  The three date lines are 24/36/24px type in 48px line boxes; at their declared y
  the browser puts the glyphs 17/24/30px lower than the render. `GlimpseSection`
  subtracts those. Do not "fix" this by changing line-height — that would move the
  block as a unit and lose the design's spacing.

The divider's "And" is worse: Figma says Pinyon Script 96, but the browser sets the same word ~14%
wider, so 96 overruns the drape. `DividerSection` uses **84** with a 4px/3px nudge, which puts the
glyph ink on exactly Figma's box (x 109–281, baseline 2074). Measure, don't trust the number —
`node scripts/fit-and.mjs` screenshots the word with and without it rendered so the artwork can be
subtracted and the ink measured on its own. The type is set in a 40px-tall auto box, so its
declared height tells you nothing about where the glyphs land.

## Known gaps

- Two nodes exported blank and were dropped: `2594:479`, `2594:480` (both "mutiara last page").
  If pearls are missing along the footer, they are the reason.
- `DEFAULT_SLUG` in `src/lib/api.ts` and the `name` field in `package.json` are both still
  `tema-elegan-putih`, carried over from the previous template. Neither is this project's slug.
- Frame 242: the hero, envelope, groom, divider, bride, glimpse, gallery and akad bands are
  built. `InviteBody` renders them plus 6 placeholders and owns the two page-wide backdrops.
  `BottomNav` is still a stub. `CoverSection` (Frame 241) is done.
- `2594:329`, a white orchid spray in the akad band, paints below the card and is 98% covered by
  it — measured against the card export's own alpha, not inferred from its 0.000 leave-one-out,
  which would look identical if the coordinates were simply wrong somewhere covered. A probe does
  prefer x 20 by 0.26/255, but that is the window's edge and is the white-on-white false minimum
  this file warns about. Kept in the stack so the paint order matches Figma.
- The akad address box is exactly the design's three lines with no slack, so `useFitText` scales
  its `line-height` as well as its `font-size` — shrinking only the glyphs cannot buy a fourth
  line. `check-ceremony.mjs` pushes a 180-character address through it, which lands with 1px to
  spare at the composable's `MIN_SCALE` of 0.72. Longer than that will overflow the card.
- Resepsi (Group 244) is the akad composition again from y 4639 — and it is a *rigid translation*
  of it, `(−8, +587)` on all 19 nodes. See "A whole band can be another band, moved" below.
- The akad card's Maps button (`2594:342`) is a flat `#eed891` rounded rect with uniform radius 6
  and no effects, so it is drawn in CSS rather than shipped as the exported image — which also
  makes it a real link with real states. With no `maps_url` it renders as an inert `<span>`
  rather than a dead link.
- The gallery band's height (551) assumes Akad has no art above y 4052, which is where its group
  box starts — rows 3868–4052 are bare paper in the render. Re-check when the Akad band lands.
- The gallery band's two nav circles are `Rectangle 118` fills, not icons: the design draws no
  arrows inside them. They ship as `aria-label`led buttons with a focus ring and no glyph, which
  is faithful but gives a sighted mouse user no affordance beyond the thumbnails. Add a chevron
  only if the design is allowed to change.
- The gallery lightbox is an addition — the design draws no viewer. Its fallback photos are
  cropped from a scale-2 plate, so the full-length shot is only 615 × 577 and looks soft
  full-screen. Configured photos come through at whatever the API serves.
- `BrideSection` paints `2560:278`, the glimpse band's backdrop. It is a top-to-bottom alpha
  gradient that sits above the bride's paper (z20 < z21) and below her name block (z21 < z22), so
  it can only be drawn between them — **`GlimpseSection` must not draw it again.** Same reasoning
  as the three groom layers the divider owns.
- The divider is a **pure overlay**: its art straddles y 2014, where the groom band ends and the
  bride band begins, so `DividerSection` has `height: 0` and places everything relative to that
  seam. It also carries `z-index: 2`, because the bride's paper backdrop renders after it in the
  DOM and would otherwise cover it — that matters as soon as the bride band exists.
- Three layers Figma files under the groom (`2560:155` bells, `2560:163` orchid, `2560:182` pearl
  strand) paint *above* the divider's drape, and the groom band renders first, so
  `DividerSection` owns them. Painting them from `GroomSection` buried them; moving them also took
  the groom band from 4.08 to 3.30 / 255.
- The envelope band's quote body wraps to 11 lines where Figma sets 10 — the browser's Playfair
  runs marginally wider, and the design leaves no slack (its own last line ends 5px past the
  card art). `useFitText` shrinks the copy ~2% so it always lands inside the card.
- Enlarging the card instead was measured and rejected: the card asset is the whole envelope
  composition, so stretching it drags the flap, the Save The Date sub-card and the wax seal down
  with it. +4% takes the band from 6.3 to 13.1 / 255 against the design, +7% to 15.8. Change
  `{ src: card, ... h: 566 }` in `EnvelopeSection.vue` if that trade is ever wanted.
- `GlimpseSection` still hardcodes the date as `09. 09. 26`. The akad band has now pinned the
  `acara` shape — `{ title, event_date, event_time, location_name, address, maps_url }` — so this
  can be bound to `acara[0].event_date` through `formatEventDate`. The design prints it as
  `09. 09. 26`, which is neither of the formats `src/lib/format.ts` produces, so it needs a third
  formatter rather than a straight swap.
- The glimpse band's title is rotated **9.9° clockwise** — measured off the tag
  export's own alpha edge, which is the only high-contrast straight line available.
  The tag's export carries its rotation; the title is live text, so `GlimpseSection`
  applies the transform, and repeats it in the reveal end-state because there is only
  one `transform` property. The three date lines are **not** rotated even though the
  plate under them is.
- `2594:178` ("Wedding Invitation") reports fill `#ffffff` but renders about `#c8c8c8`. The node
  carries a blend mode the MCP doesn't expose, and pure white is invisible on the stamp, so the
  colour is sampled from the frame render. Same for the Arabic run in `2551:174`: reported 10/14,
  actually renders in a fallback face at roughly 13/27.

## Re-exporting from Figma

The Figma MCP server writes only inside the session's working directory, so run the session from
this directory to have exports land here directly.
