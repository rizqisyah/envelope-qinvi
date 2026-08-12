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
import { computed, ref } from 'vue'
import { useFitText } from '../../composables/useFitText'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'
import { parentLine } from '../../lib/format'

/*
 * z10 (garden) and z18 (portrait) used to be two layers. getHome serves `photo_url` as
 * one opaque 360x409 image with the background already in it -- the same box the garden
 * occupied -- so the client swaps the whole plate by uploading one file from the CMS.
 * This bundled merge of the two original exports is only the not-yet-uploaded fallback;
 * regenerate it with scripts/merge-plate.py.
 */
import plateFallback from '../../assets/bride/parts/plate-bride-merged.webp'
import innerFrame from '../../assets/bride/parts/02_2551-189_sdvbsdbsddb-4.webp' // z19
import paperFrame from '../../assets/bride/parts/00_2551-188_sdvbsdbsddb-3.webp' // z20
import glimpseWash from '../../assets/glimpse/parts/00_2560-278_vdsvzdsvd-1.webp' // z21
import ornament from '../../assets/bride/parts/g214_2558-122_ornament.webp' // z22, inside Group 214
import calla from '../../assets/bride/parts/03_2588-135_vdf-3.webp' // z67

type Layer = { src: string; x: number; y: number; w: number; h: number; kind: string; in: number }

const { el, shown } = useReveal()
const fitParents = useFitText()
const fitNickname = useFitText()
const { bride } = useWedding()

/*
 * photo_url is a cross-origin upload host, so a 404 there would leave a broken-image
 * icon where a designed layer belongs. Fall back to the bundled merge instead.
 */
const plateFailed = ref(false)
const plate = computed(() => (!plateFailed.value && bride.value?.photo_url) || plateFallback)

function onLayerError(e: Event) {
  if ((e.target as HTMLImageElement).src !== plateFallback) plateFailed.value = true
}

// z10-z22. Everything after the wash paints on top of it.
// `in` is entrance order, not z-order: the frame lands first and the photo plate
// fills its aperture after, so the plate never reads as a bare floating rectangle.
const behind = computed<Layer[]>(() => [
  { src: plate.value, x: 8, y: 120, w: 360, h: 450, kind: 'plate', in: 260 },
  { src: innerFrame, x: 23, y: 133, w: 341, h: 435, kind: 'plate', in: 0 },
  { src: paperFrame, x: 0, y: 0, w: 375, h: 796, kind: 'paper', in: 0 },
  /*
   * z21 belongs to the glimpse band, but it is a top-to-bottom alpha gradient
   * that paints above this band's paper and below the name block below -- so the
   * only place it can go is between them. GlimpseSection must not draw it again.
   */
  { src: glimpseWash, x: 0, y: 542, w: 375, h: 385, kind: 'paper', in: 0 },
  { src: ornament, x: 132, y: 596, w: 120, h: 33, kind: 'ornament', in: 1500 },
])

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

// Fallbacks are the copy set in Frame 242, so an unconfigured render matches it.
const nickname = computed(() => bride.value?.nickname?.trim() || bride.value?.name?.trim().split(' ')[0] || 'Allysa')
const fullName = computed(() => bride.value?.name?.trim() || 'Ayu Shella Pratni')
const parents = computed(
  () => parentLine(bride.value) || 'Putri Pertama dari Bapak Heri\n& Ibu Sofie',
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
      @error="onLayerError"
    />

    <h2 :ref="fitNickname" id="bride-heading" class="bride__nickname">{{ nickname }}</h2>
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
  /*
   * Widened from the design's 202px box to the full text column, keeping the same
   * centre, and fitted to its own single line. `nickname` is the SHORT name -- the
   * design sizes this slot for "Antonio" -- but the CMS lets a client type anything,
   * and an over-long value used to wrap into three lines straight through the ornament
   * and the name below it. A short name renders identically either way.
   */
  top: calc(556 * var(--px));
  left: calc(31.5 * var(--px));
  width: calc(321 * var(--px));
  height: calc(38 * var(--px));
  font-family: var(--font-script);
  font-size: calc(40 * var(--px) * var(--fit, 1));
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
 * in from the right, then the name block writes itself out. The plate used to be two
 * beats -- garden, then portrait rising into it -- but it is one image now.
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

/*
 * The paper layers never fade: outside the frame's aperture this IS the band's
 * opaque paper, and the wash below it is what hides the drape's lower edge. Any
 * opacity under 1 ghosts the photo plate's rectangle through both.
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
