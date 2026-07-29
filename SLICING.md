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
| `.figma-ref/frame242-layout.json` | All 316 nodes: id, type, name, x/y/w/h (frame-local), section, text content |
| `src/assets/<section>/parts/*.webp` | 139 deduped per-node exports at 2× |

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

## Known gaps

- Two nodes exported blank and were dropped: `2594:479`, `2594:480` (both "mutiara last page").
  If pearls are missing along the footer, they are the reason.
- `DEFAULT_SLUG` in `src/lib/api.ts` is a placeholder (`tema-elegan-putih`) — the real slug is
  still pending.
- Fonts are inherited from template-2 (`@fontsource/pinyon-script`, `@fontsource/playball`) and
  have not been checked against this frame's actual type.
- Components are not built yet. `CoverSection` / `InviteBody` / `BottomNav` are stubs.

## Re-exporting from Figma

The Figma MCP server writes only inside the session's working directory, so run the session from
this directory to have exports land here directly.
