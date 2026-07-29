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
  { src: floralLeft, x: -48, y: 421, w: 83, h: 131 },
  { src: floralLeft2, x: 83, y: 463, w: 66, h: 99 },
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
  { src: sprig, x: 357, y: 348, w: 79, h: 76 },
  { src: spray, x: 275, y: 224, w: 104, h: 101 },
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

const { el, shown } = useReveal(0.1)
const { quoteVerse, quoteText, quoteArabic } = useWedding()
</script>

<template>
  <section :ref="el" class="envelope" :class="{ 'is-in': shown }" aria-labelledby="quote-heading">
    <img v-for="(l, i) in behind" :key="`b${i}`" :src="l.src" alt="" :style="box(l, i * 90)" class="lyr" />

    <p class="envelope__stamp-text">Wedding<br />Invitation</p>

    <img v-for="(l, i) in middle" :key="`m${i}`" :src="l.src" alt="" :style="box(l, 300 + i * 120)" class="lyr" />

    <h2 id="quote-heading" class="envelope__verse">{{ quoteVerse }}</h2>
    <p class="envelope__save">Save<br />The<br />Date</p>
    <p class="envelope__arabic envelope__quote">{{ quoteArabic }}</p>
    <blockquote class="envelope__quote envelope__quote-id">&ldquo;{{ quoteText }}&rdquo;</blockquote>

    <img v-for="(l, i) in front" :key="`f${i}`" :src="l.src" alt="" :style="box(l, 800 + i * 90)" class="lyr" />
  </section>
</template>

<style scoped>
/*
 * 475 = the groom backdrop's top (y 1235) minus this band's top (760). The card
 * and its florals run past that, exactly as they do in Figma, and the groom band
 * paints over the overhang — which is also what hides the two lowest florals.
 * Until that band exists they stay visible; that is the design's z-order, not a bug.
 */
.envelope {
  position: relative;
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
 * own line-height, so they are two blocks pinned to the y where each one's ink
 * actually starts in the frame render (1037 and 1130, minus this band's 760).
 */
.envelope__quote {
  left: calc(73 * var(--px));
  width: calc(155 * var(--px));
  font-family: var(--font-quote);
  font-size: calc(10 * var(--px));
  line-height: calc(14 * var(--px));
  color: var(--brown-mid);
}

.envelope__arabic {
  top: calc(272 * var(--px));
  font-family: var(--font-arabic);
  /*
   * Figma reports 10/14 for the whole node, but it renders the Arabic run in a
   * fallback face with a much larger em -- 13/27 is what actually matches the
   * frame render's ink.
   */
  font-size: calc(13 * var(--px));
  line-height: calc(27 * var(--px));
  direction: rtl;
}

.envelope__quote-id {
  top: calc(361 * var(--px));
}

.lyr {
  pointer-events: none;
}

/*
 * Reveal: the envelope and its stamp settle first, then the card slides up out of
 * it as if being drawn out, and the text on the card follows.
 */
.envelope .lyr,
.envelope__stamp-text,
.envelope__verse,
.envelope__save,
.envelope__quote {
  opacity: 0;
  transition:
    opacity 1400ms ease-out var(--in, 0ms),
    transform 1700ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
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
  --in: 500ms;
  transform: translateY(calc(-14 * var(--px)));
}

.envelope__verse {
  --in: 1500ms;
}

.envelope__save {
  --in: 1700ms;
}

.envelope__quote {
  --in: 1900ms;
  transform: translateY(calc(16 * var(--px)));
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
