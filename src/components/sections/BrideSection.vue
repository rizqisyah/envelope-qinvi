<script setup lang="ts">
/*
 * Figma Frame 242, y 2014-2810. Coordinates are frame-local minus 2014, sizes are
 * the exports' own, and the array is in Figma's child order -- see SLICING.md on
 * why grouping layers by entrance instead is a stacking bug the pixel diff cannot
 * see. Solved with scripts/solve_band.py against .figma-ref/bands/bride.json.
 *
 * Same construction as the hero and the groom: `2551:188` is paper and ornate
 * frame flattened into one layer with a transparent aperture, painted ABOVE the
 * portrait, and the hole is what crops the photo into the frame.
 */
import { computed } from 'vue'
import { useFitText } from '../../composables/useFitText'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

import garden from '../../assets/bride/parts/01_2551-186_bg-bride.webp' // z10, shared with the groom
import portrait from '../../assets/bride/parts/04_2551-198_photo.webp' // z18
import innerFrame from '../../assets/bride/parts/02_2551-189_sdvbsdbsddb-4.webp' // z19
import paperFrame from '../../assets/bride/parts/00_2551-188_sdvbsdbsddb-3.webp' // z20
import glimpseWash from '../../assets/glimpse/parts/00_2560-278_vdsvzdsvd-1.webp' // z21
import ornament from '../../assets/bride/parts/g214_2558-122_ornament.webp' // z22, inside Group 214
import calla from '../../assets/bride/parts/03_2588-135_vdf-3.webp' // z67

type Layer = { src: string; x: number; y: number; w: number; h: number; kind: string; in: number }

// z10-z22. Everything after the wash paints on top of it.
// `in` is entrance order, not z-order: the frame lands first and the garden plate
// fills its aperture after, so the plate never reads as a bare floating rectangle.
const behind: Layer[] = [
  { src: garden, x: 8, y: 147, w: 360, h: 409, kind: 'plate', in: 260 },
  { src: portrait, x: 108, y: 241, w: 160, h: 279, kind: 'portrait', in: 520 },
  { src: innerFrame, x: 23, y: 133, w: 341, h: 435, kind: 'plate', in: 0 },
  { src: paperFrame, x: 0, y: 0, w: 375, h: 796, kind: 'paper', in: 0 },
  /*
   * z21 belongs to the glimpse band, but it is a top-to-bottom alpha gradient
   * that paints above this band's paper and below the name block below -- so the
   * only place it can go is between them. GlimpseSection must not draw it again.
   */
  { src: glimpseWash, x: 0, y: 542, w: 375, h: 385, kind: 'paper', in: 0 },
  { src: ornament, x: 132, y: 596, w: 120, h: 33, kind: 'ornament', in: 1500 },
]

// z67, above every band around it.
const front: Layer = { src: calla, x: 233, y: 215, w: 137, h: 200, kind: 'front', in: 900 }

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
const fitParents = useFitText()
const { bride } = useWedding()

// Fallbacks are the copy set in Frame 242, so an unconfigured render matches it.
const nickname = computed(() => bride.value?.nickname || bride.value?.name?.split(' ')[0] || 'Allysa')
const fullName = computed(() => bride.value?.name || 'Ayu Shella Pratni')
const parents = computed(
  () => bride.value?.parents || 'Putri Pertama dari Bapak Heri\n& Ibu Sofie',
)
</script>

<template>
  <section :ref="el" class="bride" :class="{ 'is-in': shown }" aria-labelledby="bride-heading">
    <img
      v-for="(l, i) in behind"
      :key="i"
      :src="l.src"
      alt=""
      :style="box(l)"
      class="lyr"
      :class="`lyr--${l.kind}`"
    />

    <h2 id="bride-heading" class="bride__nickname">{{ nickname }}</h2>
    <p class="bride__name">{{ fullName }}</p>
    <p :ref="fitParents" class="bride__parents">{{ parents }}</p>

    <img :src="front.src" alt="" :style="box(front)" class="lyr lyr--front" />
  </section>
</template>

<style scoped>
.bride {
  position: relative;
  height: calc(796 * var(--px));
  overflow: visible;
}

.bride > * {
  position: absolute;
  margin: 0;
  text-align: center;
}

.bride__nickname {
  top: calc(556 * var(--px));
  left: calc(91 * var(--px));
  width: calc(202 * var(--px));
  font-family: var(--font-script);
  font-size: calc(40 * var(--px));
  font-weight: 400;
  line-height: calc(38 * var(--px));
  color: var(--brown-soft);
}

.bride__name {
  top: calc(621 * var(--px));
  left: calc(35 * var(--px));
  width: calc(321 * var(--px));
  font-family: var(--font-caps);
  font-size: calc(20 * var(--px));
  line-height: calc(38 * var(--px));
  color: var(--brown-soft);
}

.bride__parents {
  top: calc(660 * var(--px));
  left: calc(31 * var(--px));
  width: calc(321 * var(--px));
  height: calc(83 * var(--px));
  white-space: pre-line;
  font-family: var(--font-serif-alt);
  font-size: calc(15 * var(--px) * var(--fit, 1));
  line-height: calc(22 * var(--px));
  color: var(--brown-soft);
}

.lyr {
  pointer-events: none;
}

/*
 * Reveal: the frame settles, the garden plate fills its aperture, the portrait
 * rises into it, the
 * calla sweeps in from the right, then the name block writes itself out.
 */
.bride .lyr,
.bride__nickname,
.bride__name,
.bride__parents {
  opacity: 0;
  transition:
    opacity 1500ms ease-out var(--in, 0ms),
    transform 2000ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.bride.is-in .lyr,
.bride.is-in .bride__nickname,
.bride.is-in .bride__name,
.bride.is-in .bride__parents {
  opacity: 1;
  transform: none;
}

.lyr--plate {
  transform: translateY(calc(26 * var(--px))) scale(0.97);
}

.lyr--portrait {
  transform: translateY(calc(30 * var(--px))) scale(0.94);
}

/*
 * The paper layers never fade: outside the frame's aperture this IS the band's
 * opaque paper, and the wash below it is what hides the drape's lower edge. Any
 * opacity under 1 ghosts the garden photo's rectangle through both.
 */
/*
 * Scoped: `.bride .lyr` above is (0,2,0) and outranks a bare `.lyr--paper`, so
 * unscoped this rule never applied and the paper faded like everything else.
 */
.bride .lyr--paper {
  opacity: 1;
  transition: none;
}

.lyr--ornament {
  transform: scaleX(0.2);
}

.lyr--front {
  transform: translateX(calc(26 * var(--px))) scale(0.9);
}

.bride__nickname {
  --in: 1250ms;
  transform: translateY(calc(20 * var(--px)));
}

.bride__name {
  --in: 1650ms;
  transform: translateY(calc(16 * var(--px)));
}

.bride__parents {
  --in: 1850ms;
  transform: translateY(calc(14 * var(--px)));
}

@media (prefers-reduced-motion: reduce) {
  .bride .lyr,
  .bride__nickname,
  .bride__name,
  .bride__parents {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
