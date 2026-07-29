<script setup lang="ts">
/*
 * Figma Frame 242 divider, the drape-and-pearls break between the groom and the
 * bride. It is a pure overlay: its art straddles y 2014, where the groom band
 * ends and the bride band begins, so it claims no vertical space of its own and
 * every coordinate below is relative to that boundary (negative = above it).
 * Solved with scripts/solve_band.py against .figma-ref/bands/divider.json.
 *
 * Three layers here are labelled `groom` in Figma but sit ABOVE the divider's in
 * z order, so they have to be painted by this component -- see the note on
 * `front` below.
 */
import { useReveal } from '../../composables/useReveal'

import ribbonMid from '../../assets/divider/parts/03_2560-162.webp' // z47
import drape from '../../assets/divider/parts/05_2560-146_drape.webp' // z48
import ribbonRight from '../../assets/divider/parts/02_2560-151.webp' // z49
import ribbonLeft from '../../assets/divider/parts/04_2560-152.webp' // z50
import sprig from '../../assets/divider/parts/01_2560-153.webp' // z51
import roseLeft from '../../assets/divider/parts/07_2560-157.webp' // z53
import roseRight from '../../assets/divider/parts/10_2560-158.webp' // z54
import chain from '../../assets/divider/parts/00_2560-178.webp' // z55
import daisy from '../../assets/divider/parts/06_2560-164.webp' // z56 and z57, same art twice
import daisySmall from '../../assets/divider/parts/08_2560-161.webp' // z58

import bells from '../../assets/groom/parts/08_2560-155.webp' // z52
import orchid from '../../assets/groom/parts/07_2560-163.webp' // z60
import pearls from '../../assets/groom/parts/05_2560-182.webp' // z64

/*
 * `kind` picks the entrance, `in` is its delay. Both ride on the layer so the
 * array can stay in Figma's z order -- grouping these by entrance instead would
 * silently reorder the stack, and every overlap here is white on white, so
 * nothing in the pixel diff would flag it.
 */
type Layer = {
  src: string
  x: number
  y: number
  w: number
  h: number
  kind: 'drape' | 'bloom' | 'chain' | 'front'
  in: number
}

// z47–z60, in Figma's child order. z52 and z60 are the groom's (see below).
const layers: Layer[] = [
  { src: ribbonMid, x: 0, y: -109, w: 184.5, h: 258, kind: 'drape', in: 0 },
  { src: drape, x: 0, y: -74, w: 375, h: 387, kind: 'drape', in: 220 },
  { src: ribbonRight, x: 261, y: -113, w: 114, h: 188.5, kind: 'drape', in: 440 },
  { src: ribbonLeft, x: 0, y: -90, w: 86, h: 188.5, kind: 'drape', in: 660 },
  { src: sprig, x: 0, y: -115, w: 115, h: 171.5, kind: 'drape', in: 880 },
  { src: bells, x: 11, y: -128, w: 65, h: 121, kind: 'front', in: 1500 },
  { src: roseLeft, x: 0, y: -33, w: 91, h: 87, kind: 'bloom', in: 1100 },
  { src: roseRight, x: 322, y: -15, w: 53, h: 80, kind: 'bloom', in: 1280 },
  { src: chain, x: 0, y: -177, w: 375, h: 267, kind: 'chain', in: 700 },
  { src: daisy, x: 287, y: 28, w: 81, h: 81, kind: 'bloom', in: 1460 },
  { src: daisy, x: 50, y: -47, w: 81, h: 81, kind: 'bloom', in: 1640 },
  { src: daisySmall, x: 5, y: 27, w: 57, h: 57, kind: 'bloom', in: 1820 },
  { src: orchid, x: 271, y: -173, w: 104, h: 180, kind: 'front', in: 1660 },
]

/*
 * z64, and the word is z61 -- so the pearl strand is the one thing that paints
 * over "And", which is why it is emitted after the paragraph rather than with
 * the rest.
 */
const overWord: Layer = {
  src: pearls,
  x: -41,
  y: -269,
  w: 375,
  h: 422,
  kind: 'chain',
  in: 1000,
}

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
</script>

<template>
  <div :ref="el" class="divider" :class="{ 'is-in': shown }">
    <img
      v-for="(l, i) in layers"
      :key="i"
      :src="l.src"
      alt=""
      :style="box(l)"
      class="lyr"
      :class="`lyr--${l.kind}`"
    />

    <p class="divider__and">And</p>

    <img
      :src="overWord.src"
      alt=""
      :style="box(overWord)"
      class="lyr lyr--chain lyr--chain-groom"
    />
  </div>
</template>

<style scoped>
/*
 * Height 0 on purpose: the groom band ends and the bride band begins at the same
 * y, and this only paints across the seam. The z-index keeps it above the bride's
 * paper backdrop, which renders after it in the DOM and would otherwise cover it.
 */
.divider {
  position: relative;
  z-index: 2;
  height: 0;
  overflow: visible;
}

.divider > * {
  position: absolute;
  margin: 0;
}

.lyr {
  pointer-events: none;
}

.divider__and {
  /* Node is at (85, 25.07); the 4px/3px trim lines the browser's ink up with Figma's. */
  top: calc(22.07 * var(--px));
  left: calc(81 * var(--px));
  width: calc(202 * var(--px));
  text-align: center;
  font-family: var(--font-script);
  /*
   * Figma says 96, but Pinyon Script sets ~14% wider in the browser than the file
   * measures it, and the node is auto-sized -- so matching 96 would overrun the
   * drape. 84 puts the glyph ink on the same box as the Figma render; the node's
   * own x/y need no correction once the size is right. Measured with
   * scripts/fit-and.mjs.
   */
  font-size: calc(84 * var(--px));
  font-weight: 400;
  /* Figma's own line box is well under the type size, so the glyphs overhang it. */
  line-height: calc(38 * var(--px));
  color: var(--brown-soft);
}

/*
 * Reveal: the drape falls, its ribbons unfurl, the blooms drop on one at a time,
 * both pearl strands are drawn left to right, and the word lands last.
 */
.divider .lyr,
.divider__and {
  opacity: 0;
  transition:
    opacity 1400ms ease-out var(--in, 0ms),
    transform 2100ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms),
    clip-path 2400ms cubic-bezier(0.22, 1, 0.36, 1) var(--in, 0ms);
}

.divider.is-in .lyr,
.divider.is-in .divider__and {
  opacity: 1;
  transform: none;
}

.lyr--drape {
  transform: translateY(calc(-34 * var(--px))) scale(0.94);
}

.lyr--bloom {
  transform: translateY(calc(-22 * var(--px))) scale(0.7) rotate(-10deg);
}

/* Drawn on rather than faded in: the strand fills in from its left end. */
.lyr--chain {
  clip-path: inset(0 100% 0 0);
  transform: none;
}

.divider.is-in .lyr--chain {
  clip-path: inset(0 0 0 0);
}

.lyr--chain-groom {
  /* Same artwork, offset start, so the two strands do not draw in lockstep. */
  transition-duration: 1400ms, 2100ms, 3000ms;
}

.lyr--front {
  transform: translateX(calc(-20 * var(--px))) scale(0.9);
}

.divider__and {
  --in: 1900ms;
  transform: scale(0.55) rotate(-7deg);
  transform-origin: 50% 60%;
}

@media (prefers-reduced-motion: reduce) {
  .divider .lyr,
  .divider__and {
    opacity: 1;
    transform: none;
    clip-path: none;
    transition: none;
  }
}
</style>
