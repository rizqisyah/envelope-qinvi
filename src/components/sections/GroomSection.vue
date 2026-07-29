<script setup lang="ts">
/*
 * Figma Frame 242, y 1235–2014. Coordinates are frame-local minus 1235, sizes are
 * the exports' own, and the order below is Figma's child order.
 * Solved with scripts/solve_band.py against .figma-ref/bands/groom.json.
 *
 * Same stacking trick as the hero: `2551:179` is paper and ornate frame flattened
 * into one layer with a transparent aperture, painted ABOVE the portrait — the
 * hole is what crops the photo into the frame.
 */
import { computed } from 'vue'
import { useFitText } from '../../composables/useFitText'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

import garden from '../../assets/bride/parts/01_2551-186_bg-bride.webp' // z9, deduped with the bride's
import portrait from '../../assets/groom/parts/03_2551-183_photo.webp' // z11
import innerFrame from '../../assets/groom/parts/02_2594-171_sdvbsdbsddb-5.webp' // z16
import paperFrame from '../../assets/groom/parts/00_2551-179_sdvbsdbsddb-2.webp' // z17
import leaf from '../../assets/groom/parts/09_2594-142.webp' // z30
import ornament from '../../assets/groom/parts/g213_2558-114_ornament.webp' // z46, inside Group 213
import calla from '../../assets/groom/parts/04_2588-131_vdf-1.webp' // z66

// z52, z60 and z64 -- the bells, the orchid and the pearl strand -- are Figma's
// groom layers too, but they paint above the divider's drape, which renders after
// this component. DividerSection.vue owns them.

type Layer = { src: string; x: number; y: number; w: number; h: number }

const behind: Layer[] = [
  { src: garden, x: 8, y: 147, w: 360, h: 409 },
  { src: portrait, x: 69, y: 226, w: 237, h: 319 },
  { src: innerFrame, x: 45, y: 146, w: 285, h: 410 },
  { src: paperFrame, x: 0, y: 0, w: 375, h: 796 },
  { src: leaf, x: 26, y: 666, w: 86, h: 95 },
]

const front: Layer[] = [{ src: calla, x: 0, y: 226, w: 136, h: 200 }]

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
const fitParents = useFitText()
const { groom } = useWedding()

// Fallbacks are the copy set in Frame 242, so an unconfigured render matches it.
const nickname = computed(() => groom.value?.nickname || groom.value?.name?.split(' ')[0] || 'Antonio')
const fullName = computed(() => groom.value?.name || 'Antonio Josua Setiyadi')
const parents = computed(
  () => groom.value?.parents || 'Putra Pertama dari Bapak Tono\n& Ibu Ratna',
)
</script>

<template>
  <section :ref="el" class="groom" :class="{ 'is-in': shown }" aria-labelledby="groom-heading">
    <img v-for="(l, i) in behind" :key="`b${i}`" :src="l.src" alt="" :style="box(l, i * 160)" class="lyr lyr--behind" />

    <h2 id="groom-heading" class="groom__nickname">{{ nickname }}</h2>
    <img :src="ornament" alt="" :style="box({ src: ornament, x: 131, y: 585, w: 120, h: 29 }, 1500)" class="lyr groom__ornament" />
    <p class="groom__name">{{ fullName }}</p>
    <p :ref="fitParents" class="groom__parents">{{ parents }}</p>

    <img v-for="(l, i) in front" :key="`f${i}`" :src="l.src" alt="" :style="box(l, 900 + i * 150)" class="lyr lyr--front" />
  </section>
</template>

<style scoped>
.groom {
  position: relative;
  height: calc(779 * var(--px));
  overflow: visible;
}

.groom > * {
  position: absolute;
  margin: 0;
  text-align: center;
}

.groom__nickname {
  top: calc(556 * var(--px));
  left: calc(90 * var(--px));
  width: calc(202 * var(--px));
  font-family: var(--font-script);
  font-size: calc(40 * var(--px));
  font-weight: 400;
  line-height: calc(38 * var(--px));
  color: var(--brown-soft);
}

.groom__name {
  top: calc(606 * var(--px));
  left: calc(30 * var(--px));
  width: calc(321 * var(--px));
  font-family: var(--font-caps);
  font-size: calc(20 * var(--px));
  line-height: calc(38 * var(--px));
  color: var(--brown-soft);
}

.groom__parents {
  top: calc(643 * var(--px));
  left: calc(30 * var(--px));
  width: calc(321 * var(--px));
  height: calc(83 * var(--px));
  white-space: pre-line;
  font-family: var(--font-serif-alt);
  font-size: calc(15 * var(--px) * var(--fit, 1));
  line-height: 1.47em;
  color: var(--brown-soft);
}

.lyr {
  pointer-events: none;
}

/*
 * Reveal: the frame settles, the portrait rises into its aperture, the calla
 * sweeps in from the left, the name wipes up, then the florals are laid on.
 */
.groom .lyr,
.groom__nickname,
.groom__name,
.groom__parents {
  opacity: 0;
  transition:
    opacity 1500ms ease-out var(--in, 0ms),
    transform 2000ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.groom.is-in .lyr,
.groom.is-in .groom__nickname,
.groom.is-in .groom__name,
.groom.is-in .groom__parents {
  opacity: 1;
  transform: none;
}

.lyr--behind {
  transform: translateY(calc(24 * var(--px))) scale(0.97);
}

.lyr--front {
  transform: translateX(calc(-26 * var(--px))) scale(0.94);
}

.groom__ornament {
  --in: 1500ms;
  transform: scaleX(0.2);
}

.groom__nickname {
  --in: 1250ms;
  transform: translateY(calc(20 * var(--px)));
}

.groom__name {
  --in: 1650ms;
  transform: translateY(calc(16 * var(--px)));
}

.groom__parents {
  --in: 1850ms;
  transform: translateY(calc(14 * var(--px)));
}

@media (prefers-reduced-motion: reduce) {
  .groom .lyr,
  .groom__nickname,
  .groom__name,
  .groom__parents {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
