<script setup lang="ts">
/*
 * Figma Frame 242, y 2810-3501 -- the densest band in the frame: a green envelope
 * holding two polaroids, a hanging paper tag and the date plate, buried in
 * florals. Coordinates are frame-local minus 2810, sizes are the exports' own.
 * Solved with scripts/solve_band.py against .figma-ref/bands/glimpse.json.
 *
 * Three things worth knowing before editing:
 *
 * 1. The scalloped plate the date is printed on is `2555:112`, and it lives in
 *    `assets/gallery/` -- sections are derived from y, and that node is rotated so
 *    Figma reports y 3405, some 310px below where it renders. Nothing else in the
 *    frame explains those pixels; the band scored 9.98 with it missing.
 * 2. The tag and its title are rotated 9.9 degrees clockwise. The tag's export
 *    carries the rotation; the title is live text, so it needs the transform.
 * 3. All three date lines ride the plate's tilt -- one shared -9.5deg. They are
 *    three separate TEXT nodes and the render does not agree with itself to better
 *    than a couple of degrees; see the note above their rules.
 *
 * The z-order runs straight through the text nodes (z39-z41 and z45 sit between
 * florals), so the layer arrays below are split at those points rather than
 * grouped by entrance. See SLICING.md on why grouping would be a silent bug.
 */
import { computed } from 'vue'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'
import { formatShortDate } from '../../lib/format'

import tag from '../../assets/glimpse/parts/01_2560-175.webp' // z23
import envBack from '../../assets/glimpse/parts/11_2555-109_cascasc-1.webp' // z24
import sprigTall from '../../assets/glimpse/parts/03_2610-128.webp' // z25
import sprigMid from '../../assets/glimpse/parts/05_2610-129.webp' // z26
import sprigShort from '../../assets/glimpse/parts/04_2610-130.webp' // z27
import polaroidLeft from '../../assets/glimpse/parts/09_2556-127_group-229.webp' // z28
import polaroidRight from '../../assets/glimpse/parts/08_2556-126_group-228.webp' // z29
import plate from '../../assets/gallery/parts/00_2555-112.webp' // z31 — see note 1
import anthurium from '../../assets/glimpse/parts/13_2586-107.webp' // z32
import stamp from '../../assets/glimpse/parts/19_2556-128.webp' // z33
import daisy from '../../assets/glimpse/parts/18_2560-168.webp' // z34 and z63, same art
import ribbon from '../../assets/glimpse/parts/16_2558-108.webp' // z35
import envFront from '../../assets/glimpse/parts/10_2555-110_defcew-1.webp' // z36
import lily from '../../assets/glimpse/parts/22_2588-127_vdf-2.webp' // z37
import seal from '../../assets/glimpse/parts/21_2558-116.webp' // z38
import bells from '../../assets/glimpse/parts/12_2558-109.webp' // z42
import amaranth from '../../assets/glimpse/parts/06_2610-127.webp' // z43
import bellsSmall from '../../assets/glimpse/parts/15_2560-171.webp' // z44
import orchidWhite from '../../assets/glimpse/parts/14_2560-170.webp' // z59
import rose from '../../assets/glimpse/parts/17_2560-169.webp' // z62
import orchidDark from '../../assets/glimpse/parts/02_2592-136.webp' // z68
import hellebore from '../../assets/glimpse/parts/07_2594-143.webp' // z75

type Layer = { src: string; x: number; y: number; w: number; h: number; kind: string; in: number }

// z23-z38: the envelope, what it holds, and the plate.
const stack: Layer[] = [
  { src: tag, x: 32, y: -52, w: 267.5, h: 311, kind: 'tag', in: 200 },
  { src: envBack, x: 7, y: 221, w: 352, h: 419, kind: 'envelope', in: 0 },
  { src: sprigTall, x: 44, y: 53, w: 54, h: 137, kind: 'stem', in: 1500 },
  { src: sprigMid, x: 29, y: 94, w: 63, h: 113.5, kind: 'stem', in: 1620 },
  { src: sprigShort, x: 77, y: 101, w: 30, h: 95, kind: 'stem', in: 1740 },
  { src: polaroidLeft, x: 12, y: 152, w: 205, h: 303.5, kind: 'photo', in: 500 },
  { src: polaroidRight, x: 145, y: 123, w: 230, h: 299.5, kind: 'photo', in: 700 },
  { src: plate, x: 0, y: 185, w: 375, h: 422, kind: 'plate', in: 950 },
  { src: anthurium, x: 243, y: 262, w: 132, h: 170, kind: 'bloom', in: 1400 },
  { src: stamp, x: 141, y: 418, w: 135, h: 133, kind: 'bloom', in: 1900 },
  { src: daisy, x: 111, y: 437, w: 82, h: 82, kind: 'bloom', in: 1800 },
  { src: ribbon, x: 19, y: 303, w: 124.5, h: 128, kind: 'stem', in: 1300 },
  { src: envFront, x: 22, y: 214, w: 335.5, h: 421.5, kind: 'envelope', in: 250 },
  { src: lily, x: 86, y: 394, w: 236, h: 184.5, kind: 'bloom', in: 2100 },
  { src: seal, x: 133, y: 437, w: 121, h: 122, kind: 'seal', in: 2200 },
]

// z42-z44: three stems that paint over the envelope front but under the date.
const overFront: Layer[] = [
  { src: bells, x: 0, y: 220, w: 101.5, h: 184.5, kind: 'stem', in: 1550 },
  { src: amaranth, x: 183, y: 106, w: 45, h: 113, kind: 'stem', in: 1650 },
  { src: bellsSmall, x: -1, y: 284, w: 92, h: 140, kind: 'stem', in: 1450 },
]

// z59-z75: the last blooms, above everything including the date.
const front: Layer[] = [
  { src: orchidWhite, x: 21, y: 274, w: 115, h: 132.5, kind: 'bloom', in: 2000 },
  { src: rose, x: 10, y: 349, w: 69, h: 61, kind: 'bloom', in: 1700 },
  { src: daisy, x: 38, y: 377, w: 82, h: 82, kind: 'bloom', in: 1600 },
  { src: orchidDark, x: 199, y: 48, w: 141.5, h: 129.5, kind: 'bloom', in: 1100 },
  { src: hellebore, x: 178, y: 110, w: 86, h: 86, kind: 'bloom', in: 1250 },
]

function box(l: Layer) {
  return {
    top: `calc(${l.y} * var(--px))`,
    left: `calc(${l.x} * var(--px))`,
    width: `calc(${l.w} * var(--px))`,
    height: `calc(${l.h} * var(--px))`,
    '--in': `${l.in}ms`,
  }
}

const { el, shown } = useReveal()

/*
 * The design's own date. `useWedding().acara` is typed `any[]` and no band has
 * established which field holds a display date yet, so guessing one here would
 * just be wrong in a way nothing catches. Bind this when the Akad band lands and
 * the event shape is pinned down -- noted in SLICING.md.
 */
/*
 * The design prints 09. 09. 26 -- day, month, two-digit year. `formatShortDate` is a third
 * formatter because neither formatEventDate ("Saturday" / "19 April 2029") nor
 * formatEventTime produces that shape. Falls back to the design's own string, so an
 * unconfigured render still matches the reference.
 */
const { acara } = useWedding()

const dateLine = computed(() => formatShortDate((acara.value as any[])[0]?.event_date) || '09. 09. 26')
</script>

<template>
  <section :ref="el" class="glimpse" :class="{ 'is-in': shown }" aria-labelledby="glimpse-heading">
    <img
      v-for="(l, i) in stack"
      :key="`s${i}`"
      :src="l.src"
      alt=""
      :style="box(l)"
      class="lyr"
      :class="`lyr--${l.kind}`"
    />

    <!-- z39-z41 -->
    <p class="glimpse__save">Save the date</p>
    <h2 id="glimpse-heading" class="glimpse__title">
      <span class="glimpse__title-caps">The<br />Glimpse of</span>
      <span class="glimpse__title-us">US</span>
    </h2>
    <p class="glimpse__married">We’re getting married</p>

    <img
      v-for="(l, i) in overFront"
      :key="`o${i}`"
      :src="l.src"
      alt=""
      :style="box(l)"
      class="lyr"
      :class="`lyr--${l.kind}`"
    />

    <!-- z45 -->
    <p class="glimpse__date">{{ dateLine }}</p>

    <img
      v-for="(l, i) in front"
      :key="`f${i}`"
      :src="l.src"
      alt=""
      :style="box(l)"
      class="lyr"
      :class="`lyr--${l.kind}`"
    />
  </section>
</template>

<style scoped>
.glimpse {
  position: relative;
  height: calc(691 * var(--px));
  overflow: visible;
}

.glimpse > * {
  position: absolute;
  margin: 0;
}

.lyr {
  pointer-events: none;
}

/*
 * z39/z45/z41: axis-aligned, on a plate that is not. The `top` values are the
 * nodes' own minus 17 / 24 / 30 -- CSS centres the glyphs in the 48px line box
 * where Figma hangs them from the top of it, so the declared y renders that much
 * too low. Measured with scripts/fit-text.mjs; same class of fix as CoverSection's
 * two lines.
 */
.glimpse__save,
.glimpse__date,
.glimpse__married {
  left: calc(54.44 * var(--px));
  width: calc(275 * var(--px));
  text-align: center;
  color: var(--brown-mid);
  line-height: calc(48 * var(--px));
}

/*
 * These two ride the plate's tilt with the verse below. A rotation sweep scored
 * against the render bottoms out at -7 for this pair and -8.5/-9 for the verse —
 * three separate TEXT nodes, and the render does not agree with itself to better
 * than a couple of degrees. -9.5 is one shared value inside that spread, chosen so
 * the block reads as printed on one card rather than three lines that each drift.
 *
 * `top` is then re-measured, because rotating about the box centre moves the ink:
 * 323.5 puts this line's ink centroid at 3171.2 against the render's 3169.7. The
 * date's own top needed no change.
 */
.glimpse__save,
.glimpse__date {
  transform: rotate(-9.5deg);
}

.glimpse__save {
  top: calc(323.5 * var(--px));
  font-family: var(--font-serif);
  font-size: calc(21 * var(--px));
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.glimpse__date {
  top: calc(358.7 * var(--px));
  left: calc(63.38 * var(--px));
  font-family: var(--font-serif);
  font-size: calc(36 * var(--px));
}

/*
 * Two corrections to note 3 above, both measured off the render rather than read
 * off the API:
 *
 * - `2555:119` really is the Pinyon Script the API reports. SLICING.md said it
 *   renders in Meow Script; that reading came from an ink width measured in a
 *   horizontal window, which clips this line and makes it look 40px narrower than
 *   it is. Meow sets the line upright where the render is visibly slanted.
 * - This line alone IS rotated. Least-squares over the render's ink puts its
 *   baseline at -7 degrees running x 117-292 — the same ~175px Pinyon sets at the
 *   declared 24. Flat and unrotated it ran off the card's right edge onto the
 *   green envelope, which is what the client flagged.
 *
 * The fit reads shallow — it is taken on the bottom of the ink, and this script's
 * descenders drag it about a degree and a half. A pixel sweep of the angle puts
 * this line at -8.5/-9; it now carries the -9.5 the two lines above it share.
 *
 * The tilt has to be repeated in every reveal state below, exactly as the tag's
 * title does — one `transform` property, and the tilt is not part of the entrance.
 */
.glimpse__married {
  top: calc(393 * var(--px));
  left: calc(63.39 * var(--px));
  font-family: var(--font-script);
  font-size: calc(24 * var(--px));
  transform: rotate(-9.5deg);
}

/*
 * z40. Printed on the tag, so it carries the tag's 9.9deg. The rotation has to
 * be repeated in the reveal transform below -- one `transform` property, and the
 * tilt is not part of the animation.
 */
.glimpse__title {
  /* Node is at (38.87, -4); the offset lines the rotated ink up with the render. */
  top: calc(14 * var(--px));
  left: calc(18.87 * var(--px));
  width: calc(275 * var(--px));
  text-align: center;
  color: var(--ink);
  font-weight: 400;
  transform: rotate(9.9deg);
}

.glimpse__title-caps {
  display: block;
  font-family: var(--font-serif);
  font-size: calc(27 * var(--px));
  line-height: calc(36 * var(--px));
  text-transform: uppercase;
}

.glimpse__title-us {
  display: block;
  font-family: var(--font-script);
  font-size: calc(34 * var(--px));
  line-height: calc(44 * var(--px));
}

/*
 * Reveal: the envelope settles, the polaroids slide out of it, the plate drops in,
 * the tag swings down on its string, then the florals are laid on one at a time
 * and the seal presses last.
 */
.glimpse .lyr,
.glimpse__save,
.glimpse__date,
.glimpse__married,
.glimpse__title {
  opacity: 0;
  transition:
    opacity 1400ms ease-out var(--in, 0ms),
    transform 2000ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.glimpse.is-in .lyr {
  opacity: 1;
  transform: none;
}

.glimpse.is-in .glimpse__save,
.glimpse.is-in .glimpse__date {
  opacity: 1;
  transform: rotate(-9.5deg);
}

.glimpse.is-in .glimpse__married {
  opacity: 1;
  transform: rotate(-9.5deg);
}

.glimpse.is-in .glimpse__title {
  opacity: 1;
  transform: rotate(9.9deg);
}

.lyr--envelope {
  transform: translateY(calc(30 * var(--px))) scale(0.97);
}

/* Out of the envelope, not onto it. */
.lyr--photo {
  transform: translateY(calc(46 * var(--px))) scale(0.96);
}

.lyr--plate {
  transform: translateY(calc(34 * var(--px)));
}

.lyr--tag {
  transform: translateY(calc(-40 * var(--px))) rotate(-6deg);
  transform-origin: 22% 6%; /* the punch hole, so it swings from its string */
}

.lyr--stem {
  transform: scale(0.9) translateY(calc(14 * var(--px)));
}

.lyr--bloom {
  transform: scale(0.72) rotate(-8deg);
}

.lyr--seal {
  transform: scale(1.5);
}

.glimpse__save {
  --in: 2350ms;
  transform: translateY(calc(10 * var(--px))) rotate(-9.5deg);
}

.glimpse__date {
  --in: 2500ms;
  transform: translateY(calc(10 * var(--px))) rotate(-9.5deg);
}

.glimpse__married {
  --in: 2700ms;
  transform: translateY(calc(10 * var(--px))) rotate(-9.5deg);
}

.glimpse__title {
  --in: 900ms;
}

@media (prefers-reduced-motion: reduce) {
  .glimpse .lyr {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .glimpse__save,
  .glimpse__date {
    opacity: 1;
    transform: rotate(-9.5deg);
    transition: none;
  }

  .glimpse__married {
    opacity: 1;
    transform: rotate(-9.5deg);
    transition: none;
  }

  .glimpse__title {
    opacity: 1;
    transform: rotate(9.9deg);
    transition: none;
  }
}
</style>
