<script setup lang="ts">
/*
 * Figma Frame 242, y 760–1400: the open envelope with the quote card lying on it,
 * the "Wedding Invitation" stamp and the "Save The Date" card.
 *
 * Figma calls this two bands, but they interleave in z — cover pieces sit both
 * under and over the quote card — so they are one component.
 *
 * Every x/y below is frame-local minus 760, and the sizes are the EXPORTS' own,
 * not the nodes' declared ones: several of these nodes are rotated or clipped, so
 * Figma's bounds do not describe where the art lands. Positions were solved with
 * scripts/solve_band.py against .figma-ref/bands/envelope.json.
 */
import { useFitText } from '../../composables/useFitText'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

import floralLeft from '../../assets/quote/parts/09_2594-456.webp' // z2
import floralLeft2 from '../../assets/quote/parts/10_2594-455.webp' // z4
import stamp from '../../assets/cover/parts/g239_2594-177_stamp.webp' // z69
import callas from '../../assets/cover/parts/02_2594-180.webp' // z70
import bouquet from '../../assets/cover/parts/03_2594-189.webp' // z71
import card from '../../assets/quote/parts/g238_2560-141_card.webp' // z72
import leafBig from '../../assets/quote/parts/g238_2594-140.webp' // z72.5
import lilies from '../../assets/cover/parts/01_2594-437.webp' // z73
import waxSeal from '../../assets/cover/parts/04_2594-141.webp' // z74
import bud from '../../assets/quote/parts/04_2594-183.webp' // z84 and z87
import blossom from '../../assets/quote/parts/03_2594-187.webp' // z85
import disc from '../../assets/quote/parts/05_2594-182_ellipse-9.webp' // z86
import sprig from '../../assets/quote/parts/08_2594-185.webp' // z88
import spray from '../../assets/quote/parts/02_2609-108.webp' // z89
import orchid from '../../assets/quote/parts/06_2609-109.webp' // z147

type Layer = { src: string; x: number; y: number; w: number; h: number }

const behind: Layer[] = [
  { src: floralLeft, x: 0, y: 315, w: 83, h: 131 },
  { src: floralLeft2, x: 17, y: 364, w: 66, h: 99 },
  { src: stamp, x: 168, y: -38, w: 207, h: 211 },
]

const middle: Layer[] = [
  { src: callas, x: 286, y: 76, w: 89, h: 107 },
  { src: bouquet, x: 236, y: 88, w: 104, h: 130 },
  { src: card, x: 0, y: 2, w: 375, h: 566 },
]

const front: Layer[] = [
  { src: leafBig, x: 220, y: 165, w: 77, h: 107 },
  { src: lilies, x: 172, y: 27, w: 122, h: 181 },
  { src: waxSeal, x: 250, y: 150, w: 47, h: 49 },
  { src: bud, x: 311, y: 301, w: 37, h: 56 },
  { src: blossom, x: 281, y: 281, w: 85, h: 85 },
  { src: disc, x: 243, y: 315, w: 97, h: 93 },
  { src: bud, x: 321, y: 332, w: 37, h: 56 },
  { src: sprig, x: 348, y: 343, w: 79, h: 76 },
  { src: spray, x: 322, y: 355, w: 104, h: 101 },
  { src: orchid, x: 271, y: 326, w: 66, h: 143 },
]

// Layers fade in bottom-of-the-stack first, so the composition assembles the way
// it was built rather than all at once.
function box(l: Layer, delay: number) {
  return {
    top: `calc(${l.y} * var(--px))`,
    left: `calc(${l.x} * var(--px))`,
    width: `calc(${l.w} * var(--px))`,
    height: `calc(${l.h} * var(--px))`,
    '--in': `${delay}ms`,
  }
}

const { el, shown } = useReveal()
const fitQuote = useFitText()
const { quoteVerse, quoteText, quoteArabic } = useWedding()
</script>

<template>
  <section :ref="el" class="envelope" :class="{ 'is-in': shown }" aria-labelledby="quote-heading">
    <img v-for="(l, i) in behind" :key="`b${i}`" :src="l.src" alt="" :style="box(l, i * 140)" class="lyr lyr--behind" />

    <p class="envelope__stamp-text">Wedding<br />Invitation</p>

    <img v-for="(l, i) in middle" :key="`m${i}`" :src="l.src" alt="" :style="box(l, 400 + i * 180)" class="lyr lyr--mid" />

    <h2 id="quote-heading" class="envelope__verse">{{ quoteVerse }}</h2>
    <p class="envelope__save">Save<br />The<br />Date</p>
    <!--
      One positioned block, two children in normal flow: the translation sits a
      fixed 19px under whatever height the verse takes, so a verse that wraps to
      four lines pushes it down instead of running into it.
    -->
    <div class="envelope__block">
      <p class="envelope__arabic envelope__quote">{{ quoteArabic }}</p>
      <blockquote :ref="fitQuote" class="envelope__quote envelope__quote-id">&ldquo;{{ quoteText }}&rdquo;</blockquote>
    </div>

    <img v-for="(l, i) in front" :key="`f${i}`" :src="l.src" alt="" :style="box(l, 1150 + i * 110)" class="lyr lyr--front" />
  </section>
</template>

<style scoped>
/*
 * 475 = the groom backdrop's top (y 1235) minus this band's top (760). The quote
 * card is 566 tall, so it and the last four lines of the translation hang 93px
 * past that into the groom band.
 *
 * In Figma the card is z72 and the groom's paper is z17 — the card paints OVER it.
 * In the DOM the groom renders after this section, so without the z-index its
 * paper covered the overhang and sliced the translation off mid-sentence. Nothing
 * else in this band reaches below 475, so raising the whole section is safe.
 */
.envelope {
  position: relative;
  z-index: 1;
  height: calc(475 * var(--px));
  overflow: visible;
}

.envelope > * {
  position: absolute;
  margin: 0;
  text-align: center;
}

.envelope__stamp-text {
  top: calc(7 * var(--px));
  left: calc(181 * var(--px));
  width: calc(185 * var(--px));
  font-family: var(--font-script);
  font-size: calc(32 * var(--px));
  line-height: calc(32 * var(--px));
  /*
   * Figma reports the fill as #ffffff, but it renders around #c8c8c8 on the stamp
   * — the node carries a blend mode the MCP does not expose. Pure white here is
   * invisible, so this is sampled from the frame render instead.
   */
  color: #c9c9c9;
}

.envelope__verse {
  top: calc(229 * var(--px));
  left: calc(58 * var(--px));
  width: calc(185 * var(--px));
  font-family: var(--font-script);
  font-size: calc(20 * var(--px));
  font-weight: 400;
  line-height: calc(48 * var(--px));
  color: var(--brown-mid);
}

.envelope__save {
  top: calc(207 * var(--px));
  left: calc(281 * var(--px));
  width: calc(68 * var(--px));
  font-family: var(--font-script);
  font-size: calc(36 * var(--px));
  line-height: calc(27 * var(--px));
  color: var(--brown-mid);
}

/*
 * Figma has these as one TEXT node split by a blank line, but the Arabic needs its
 * own line-height, so they are two blocks. Only the block they share is pinned —
 * to 276, the y where the verse's ink starts in the frame render (1036 minus this
 * band's 760). The translation then follows in flow.
 */
.envelope__block {
  top: calc(276 * var(--px));
  left: calc(73 * var(--px));
  width: calc(155 * var(--px));
}

.envelope__quote {
  width: 100%;
  margin: 0;
  text-align: center;
  font-family: var(--font-quote);
  font-size: calc(10 * var(--px) * var(--fit, 1));
  line-height: calc(1.4em);
  color: var(--brown-mid);
}

.envelope__arabic {
  font-family: var(--font-quran);
  /*
   * Figma reports 10/14 for the whole node, and the render sets the verse in three lines
   * whose ink tops are 1038 / 1053 / 1068 -- a 15px line box, not the 27 this once had.
   * 27 pushed the verse 36px past where it belongs and drove it into the translation
   * below, which then overflowed the card. Measured off the render, then swept.
   */
  /*
   * 11 is the largest size that still sets the verse in the design's three lines: at 12+
   * Noto Naskh wraps to four and crowds the translation. The render's own ink is smaller
   * still (about 8.75px per line against this face's 12.7), and 8px would score ~2/255
   * better -- but the design's face is not identifiable from the render and 8px Arabic
   * with diacritics is not legible on a phone. Line count and block height match (45
   * against the render's 41); the residual is glyph weight, and it is not chaseable.
   */
  font-size: calc(11 * var(--px));
  line-height: calc(15 * var(--px));
  direction: rtl;
}

.envelope__quote-id {
  /*
   * The render's own gap is 19: its verse ink ends at 1078 and the translation's
   * first line starts at 1097. 15, not 19, because this is measured off the box
   * and Noto Naskh hangs about 4px of descender below it. It was a pinned
   * `top: 363`, which read as 46 — what the client saw — and which a verse that
   * wrapped to four lines walked straight into.
   */
  margin-top: calc(15 * var(--px));
  /*
   * Fixed height so useFitText has a box to fit into. 145 lands the last line
   * well inside the card, whose bottom edge is at 568. Without this the copy —
   * which is data-driven and any length — spills off the card at narrow widths,
   * where the type gets small enough to pick up an extra line.
   */
  height: calc(145 * var(--px));
}

.lyr {
  pointer-events: none;
}

/*
 * Reveal, in the order the piece was assembled: the stems and the stamp settle,
 * the envelope and its card rise out of the fold as if being drawn out, the
 * printed copy follows, and the florals are laid on top one at a time.
 */
.envelope .lyr,
.envelope__stamp-text,
.envelope__verse,
.envelope__save,
.envelope__quote {
  opacity: 0;
  transition:
    opacity 1500ms ease-out var(--in, 0ms),
    transform 2000ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.lyr--behind {
  transform: translateY(calc(18 * var(--px))) scale(0.96);
}

/* The envelope and card are drawn upward out of the fold. */
.lyr--mid {
  transform: translateY(calc(64 * var(--px)));
}

.lyr--front {
  transform: scale(0.82);
  transform-origin: 60% 40%;
}

.envelope.is-in .lyr,
.envelope.is-in .envelope__stamp-text,
.envelope.is-in .envelope__verse,
.envelope.is-in .envelope__save,
.envelope.is-in .envelope__quote {
  opacity: 1;
  transform: none;
}

.envelope__stamp-text {
  --in: 700ms;
  transform: translateY(calc(-18 * var(--px)));
}

.envelope__verse {
  --in: 1750ms;
}

.envelope__save {
  --in: 1950ms;
}

.envelope__arabic {
  --in: 2150ms;
  transform: translateY(calc(14 * var(--px)));
}

.envelope__quote-id {
  --in: 2350ms;
  transform: translateY(calc(20 * var(--px)));
}

@media (prefers-reduced-motion: reduce) {
  .envelope .lyr,
  .envelope__stamp-text,
  .envelope__verse,
  .envelope__save,
  .envelope__quote {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
