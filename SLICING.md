# Slicing notes — Frame 242 ("adat jawa" Figma file)

Template 3. Source of truth: Figma file **adat jawa**, Page 1, node **`2550:131`** ("Frame 242"),
375 × 8749. Sibling of the frame that produced `slicing-wedding-template-2`.

Design direction differs from template-2: cream paper texture, embossed white ornate frames,
olive-green envelopes, gold script. Couple in the design: **Antonio Josua Setiyadi** &
**Ayu Shella Pratni (Allysa)** — footer text says "Aliyah", an inconsistency in the design.
All copy is data-driven via `useWedding()`, so these are placeholders only.

## Reference files

| File | What it is |
|------|------------|
| `.figma-ref/frame242-layout.json` | All 344 nodes incl. nested: id, type, name, parent, depth, x/y/w/h (frame-local), section, text, and `styles` (font family/size/weight/line-height/fills) |
| `.figma-ref/frame242-raw.json` | Untouched `get_selection` dump — regenerate the layout from this rather than re-querying Figma |
| `.figma-ref/asset-dedupe-map.json` | Which exports collapsed into which file (see "Deduped assets" below) |
| `src/assets/<section>/parts/*.webp` | Per-node exports at 2×, deduped |

The frame is **flat** — no section frames in Figma. Sections below were derived from node
y-positions and confirmed against a full-frame render. Node names in Figma are junk
(`sdvbsdbsddb 1`, `vdf 2`, `Photoroom 5`); the export filenames keep the node id so anything can
be traced back with `frame242-layout.json`.

## Section map

| # | y range | Section | Assets |
|---|---------|---------|--------|
| 1 | 0–760 | Hero — "The Bride & The Groom", ornate frame, couple portrait | `hero/` (2) |
| 2 | 760–1000 | Cover — white envelope, "Wedding Invitation" stamp, "Save The Date" seal | `cover/` (5) |
| 3 | 1000–1330 | Quote — QS Ar-Rum 21 card | `quote/` (10) |
| 4 | 1330–1960 | Groom — Antonio | `groom/` (9) |
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

**Pochaevsk** (12px and 15px, 2 nodes) is not on Fontsource and is not installed — those two
nodes will fall back. Find them with a `styles.fontFamily` search in the layout JSON.

## Known gaps

- Two nodes exported blank and were dropped: `2594:479`, `2594:480` (both "mutiara last page").
  If pearls are missing along the footer, they are the reason.
- `DEFAULT_SLUG` in `src/lib/api.ts` is a placeholder (`tema-elegan-putih`) — the real slug is
  still pending.
- Components are not built yet. `CoverSection` / `InviteBody` / `BottomNav` are stubs.

## Re-exporting from Figma

The Figma MCP server writes only inside the session's working directory, so run the session from
this directory to have exports land here directly.
