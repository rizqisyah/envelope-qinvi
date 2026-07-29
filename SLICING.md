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

## Frame 242 — section map

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
| Reddit Sans | 15 | Frame 241 "THE WEDDING OF" |
| Platypi | 14 | Frame 241 "Dear Mr/ Mrs/ Ms" |
| Poltawski Nowy | 16 | Frame 241 guest name |

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
- Frame 242's components are still stubs — `InviteBody` and `BottomNav`. `CoverSection` is built
  (Frame 241).

## Re-exporting from Figma

The Figma MCP server writes only inside the session's working directory, so run the session from
this directory to have exports land here directly.
