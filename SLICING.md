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
python3 scripts/locate.py <asset> <hintX> <hintY>     # one asset, if nothing covers it
python3 scripts/solve_band.py .figma-ref/bands/<band>.json   # a whole stack
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

Both were fixed with small focused jobs (`envelope-florals.json`,
`save-the-date.json`) rather than by widening the main one.

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
| 5 | 1960–2160 | Divider — drape + pearls + "And" | `divider/` (10) |
| 6 | 2160–2740 | Bride — Allysa | `bride/` (6) |
| 7 | 2740–3480 | Glimpse of Us — polaroids, green envelope, "09.09.26" | `glimpse/` (22) |
| 8 | 3480–3980 | Gallery — hero photo + thumbnails | `gallery/` (2) |
| 9 | 3980–4560 | Akad | `akad/` (1) |
| 10 | 4560–5180 | Resepsi | `resepsi/` (1) |
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
| `page/01_..._bg-strip` | 405 × 6683 | Bleeds 15px each side |
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

## Known gaps

- Two nodes exported blank and were dropped: `2594:479`, `2594:480` (both "mutiara last page").
  If pearls are missing along the footer, they are the reason.
- `DEFAULT_SLUG` in `src/lib/api.ts` and the `name` field in `package.json` are both still
  `tema-elegan-putih`, carried over from the previous template. Neither is this project's slug.
- Frame 242: the hero, envelope and groom bands are built. `InviteBody` renders them plus 12
  placeholders and owns the two page-wide backdrops. `BottomNav` is still a stub.
  `CoverSection` (Frame 241) is done.
- The envelope band's quote body wraps to 11 lines where Figma sets 10 — the browser's Playfair
  runs marginally wider, and the design leaves no slack (its own last line ends 5px past the
  card art). `useFitText` shrinks the copy ~2% so it always lands inside the card.
- Enlarging the card instead was measured and rejected: the card asset is the whole envelope
  composition, so stretching it drags the flap, the Save The Date sub-card and the wax seal down
  with it. +4% takes the band from 6.3 to 13.1 / 255 against the design, +7% to 15.8. Change
  `{ src: card, ... h: 566 }` in `EnvelopeSection.vue` if that trade is ever wanted.
- `2594:178` ("Wedding Invitation") reports fill `#ffffff` but renders about `#c8c8c8`. The node
  carries a blend mode the MCP doesn't expose, and pure white is invisible on the stamp, so the
  colour is sampled from the frame render. Same for the Arabic run in `2551:174`: reported 10/14,
  actually renders in a fallback face at roughly 13/27.

## Re-exporting from Figma

The Figma MCP server writes only inside the session's working directory, so run the session from
this directory to have exports land here directly.
