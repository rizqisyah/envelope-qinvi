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
import { computed, ref } from 'vue'
import { useFitText } from '../../composables/useFitText'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'
import { parentLine } from '../../lib/format'

/*
 * z9 (garden) and z11 (portrait) used to be two layers. getHome serves `photo_url` as
 * one opaque 360x409 image with the background already in it -- the same box the garden
 * occupied -- so the client swaps the whole plate by uploading one file from the CMS.
 * This bundled merge of the two original exports is only the not-yet-uploaded fallback;
 * regenerate it with scripts/merge-plate.py.
 */
import plateFallback from '../../assets/groom/parts/plate-groom-merged.webp'
import innerFrame from '../../assets/groom/parts/02_2594-171_sdvbsdbsddb-5.webp' // z16
import paperFrame from '../../assets/groom/parts/00_2551-179_sdvbsdbsddb-2.webp' // z17
import leaf from '../../assets/groom/parts/09_2594-142.webp' // z30
import ornament from '../../assets/groom/parts/g213_2558-114_ornament.webp' // z46, inside Group 213
import calla from '../../assets/groom/parts/04_2588-131_vdf-1.webp' // z66

// z52, z60 and z64 -- the bells, the orchid and the pearl strand -- are Figma's
// groom layers too, but they paint above the divider's drape, which renders after
// this component. DividerSection.vue owns them.

type Layer = { src: string; x: number; y: number; w: number; h: number; kind: string; in: number }

const { el, shown } = useReveal()
const fitParents = useFitText()
const fitNickname = useFitText()
const { groom } = useWedding()

/*
 * photo_url is a cross-origin upload host, so a 404 there would leave a broken-image
 * icon where a designed layer belongs. Fall back to the bundled merge instead.
 */
const plateFailed = ref(false)
const plate = computed(() => (!plateFailed.value && groom.value?.photo_url) || plateFallback)

function onLayerError(e: Event) {
  if ((e.target as HTMLImageElement).src !== plateFallback) plateFailed.value = true
}

/*
 * Array order is Figma's z-order and must stay that way; `in` is the entrance
 * order, which is deliberately different. The frame lands first and the photo
 * plate fills its aperture after, so the plate never reads as a bare rectangle
 * floating on the paper — same treatment as the bride's.
 */
const behind = computed<Layer[]>(() => [
  { src: plate.value, x: 8, y: 120, w: 360, h: 450, kind: 'plate', in: 260 },
  { src: innerFrame, x: 45, y: 146, w: 285, h: 410, kind: 'plate', in: 0 },
  { src: paperFrame, x: 0, y: 0, w: 375, h: 796, kind: 'paper', in: 0 },
  { src: leaf, x: 26, y: 666, w: 86, h: 95, kind: 'plate', in: 760 },
])

const front: Layer[] = [{ src: calla, x: 0, y: 226, w: 136, h: 200, kind: 'front', in: 900 }]

function box(l: Layer, delay = l.in) {
  return {
    top: `calc(${l.y} * var(--px))`,
    left: `calc(${l.x} * var(--px))`,
    width: `calc(${l.w} * var(--px))`,
    height: `calc(${l.h} * var(--px))`,
    '--in': `${delay}ms`,
  }
}

// Fallbacks are the copy set in Frame 242, so an unconfigured render matches it.
const nickname = computed(() => groom.value?.nickname?.trim() || groom.value?.name?.trim().split(' ')[0] || 'Antonio')
const fullName = computed(() => groom.value?.name?.trim() || 'Antonio Josua Setiyadi')
const parents = computed(
  () => parentLine(groom.value) || 'Putra Pertama dari Bapak Tono\n& Ibu Ratna',
)
</script>

<template>
  <section :ref="el" class="groom" :class="{ 'is-in': shown }" aria-labelledby="groom-heading">
    <img v-for="(l, i) in behind" :key="`b${i}`" :src="l.src" alt="" :style="box(l)" class="lyr" :class="`lyr--${l.kind}`" @error="onLayerError" />

    <h2 :ref="fitNickname" id="groom-heading" class="groom__nickname">{{ nickname }}</h2>
    <img :src="ornament" alt="" :style="box({ src: ornament, x: 131, y: 585, w: 120, h: 29, kind: 'ornament', in: 1500 })" class="lyr groom__ornament" />
    <p class="groom__name">{{ fullName }}</p>
    <p :ref="fitParents" class="groom__parents">{{ parents }}</p>

    <img v-for="(l, i) in front" :key="`f${i}`" :src="l.src" alt="" :style="box(l)" class="lyr lyr--front" />
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
  /*
   * Widened from the design's 202px box to the full text column, keeping the same
   * centre, and fitted to its own single line. `nickname` is the SHORT name -- the
   * design sizes this slot for "Antonio" -- but the CMS lets a client type anything,
   * and an over-long value used to wrap into three lines straight through the ornament
   * and the name below it. A short name renders identically either way.
   */
  top: calc(556 * var(--px));
  left: calc(30.5 * var(--px));
  width: calc(321 * var(--px));
  height: calc(38 * var(--px));
  font-family: var(--font-script);
  font-size: calc(40 * var(--px) * var(--fit, 1));
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
  /*
   * A no-op for the bundled exports, which are all cut to their box. It matters for the
   * CMS plate: a client can upload any aspect ratio and cover keeps it filling the
   * frame's aperture instead of squashing.
   */
  object-fit: cover;
  object-position: center;
}

/*
 * Reveal: the frame settles, the photo plate fills its aperture, the calla sweeps
 * in from the left, then the name block writes itself out. The plate used to be two
 * beats -- garden, then portrait rising into it -- but it is one image now.
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

.lyr--plate {
  transform: translateY(calc(24 * var(--px))) scale(0.97);
}

/*
 * Outside the frame's aperture this IS the band's opaque paper. Fading it in
 * showed the garden plate's bare rectangle sitting on the sheet for the first
 * half-second — the "background berlapis" the client flagged. Same fix as the
 * bride's paper layer.
 */
/* Scoped, because `.groom .lyr` above outranks a bare `.lyr--paper`. */
.groom .lyr--paper {
  opacity: 1;
  transition: none;
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
