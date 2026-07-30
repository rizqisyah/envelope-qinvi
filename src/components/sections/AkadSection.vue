<script setup lang="ts">
/*
 * Figma Frame 242, y 4052-4639 = Group 245 (2594:371): the olive envelope, the
 * white scalloped card, florals over both of its edges, and five TEXT nodes that
 * were exported around -- so the copy here is live and comes from `acara[0]`.
 * Coordinates are frame-local minus 4052, in the group's own child order (first
 * child = bottom). Solved with scripts/solve_band.py against
 * .figma-ref/bands/akad.json; band composite 2.24/255.
 *
 * Three of Figma's declared positions were wrong and each lied differently:
 *   2594:319  rotated. Declared x 308 with a 142-wide export that was NOT clipped,
 *             which is impossible on a 375 frame -- x must be <= 233, and 233 is a
 *             sharp minimum over a 90-row sweep.
 *   2594:328  rotated the same way; the clip rule caps x at 285, which is also
 *             where it scores best. The band solve had walked it to 341.
 *   2594:330  declared x 88, actually 44 -- exactly one asset width out, and far
 *             enough that the solver's own window never reached it.
 * Meanwhile 2594:323/324/325 are right-edge clipped, and the clip width *proves*
 * their x (69 = 375-306, 60 = 375-315), so those needed no solving at all.
 *
 * Resepsi (Group 244) is this composition again from y 4639. When that band lands,
 * the shared parts belong in one component -- they are not shared yet.
 */
import { computed } from 'vue'
import { formatEventDate, formatEventTime } from '../../lib/format'
import { useFitText } from '../../composables/useFitText'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

import hops from '../../assets/akad/parts/g245_2594-323.webp'
import envelope from '../../assets/akad/parts/g245_2594-318_envelope.webp'
import lilyBack from '../../assets/akad/parts/g245_2594-319.webp'
import orchid from '../../assets/akad/parts/g245_2594-329.webp'
import card from '../../assets/akad/parts/g245_2594-320.webp'
import pin from '../../assets/akad/parts/g245_2594-344_pin.webp'
import callaLeft from '../../assets/akad/parts/g245_2594-321_vdf-7.webp'
import lilyFront from '../../assets/akad/parts/g245_2594-326.webp'
import sweetPea from '../../assets/akad/parts/g245_2594-324.webp'
import roseRight from '../../assets/akad/parts/g245_2594-325.webp'
import roseLeft from '../../assets/akad/parts/g245_2594-330.webp'
import callaRight from '../../assets/akad/parts/g245_2594-327.webp'
import gypsophila from '../../assets/akad/parts/g245_2594-328.webp'

type Layer = { src: string; x: number; y: number; w: number; h: number; kind: string; in: number }

// Everything the text is printed on: hops, envelope, the buried lily and orchid,
// then the card itself.
const behind: Layer[] = [
  { src: hops, x: 306, y: 85, w: 69, h: 122, kind: 'right', in: 900 },
  { src: envelope, x: 32, y: 0, w: 316, h: 382, kind: 'envelope', in: 0 },
  { src: lilyBack, x: 233, y: 28, w: 142, h: 204, kind: 'right', in: 1000 },
  /*
   * 2594:329 paints below the card, and at this position 98% of its ink falls inside
   * the card's opaque alpha -- checked directly against the card's own mask, because
   * a 0.000 leave-one-out alone would look the same if the coordinates were simply
   * wrong somewhere covered. A probe does report a marginally better x of 20, but
   * that is the window's edge and worth only 0.26/255: white orchid matching the
   * other white florals, the low-contrast false minimum SLICING.md warns about.
   * Kept so the paint order matches Figma; if it ever shows, the card moved.
   */
  { src: orchid, x: 84, y: 91, w: 70, h: 95, kind: 'left', in: 700 },
  { src: card, x: 32, y: 39, w: 316, h: 319.5, kind: 'card', in: 350 },
]

// The pin, then the florals that paint over the card's edges.
const front: Layer[] = [
  { src: pin, x: 182, y: 168, w: 16.5, h: 23, kind: 'pin', in: 1800 },
  { src: callaLeft, x: 44, y: 39, w: 67, h: 119, kind: 'left', in: 800 },
  { src: lilyFront, x: 277, y: 91, w: 65, h: 116, kind: 'right', in: 1100 },
  { src: sweetPea, x: 306, y: 146, w: 69, h: 104, kind: 'right', in: 1250 },
  { src: roseRight, x: 315, y: 176, w: 60, h: 56, kind: 'right', in: 1400 },
  { src: roseLeft, x: 44, y: 119, w: 44, h: 39, kind: 'left', in: 950 },
  { src: callaRight, x: 315, y: 218, w: 59.5, h: 80.5, kind: 'right', in: 1550 },
  { src: gypsophila, x: 285, y: 236, w: 90, h: 114.5, kind: 'right', in: 1700 },
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
const fitAddress = useFitText()
const { acara } = useWedding()

// Akad is the first event; Resepsi will be the second. Fallbacks are the copy set
// on the card in Frame 242, so an unconfigured render matches the design.
const event = computed(() => (acara.value as any[])[0] ?? null)

const when = computed(
  () => formatEventDate(event.value?.event_date) ?? { weekday: 'Saturday', date: '19 April 2029' },
)
const time = computed(
  () => formatEventTime(event.value?.event_time) || '10.00 WIB - 12.00 WIB',
)
const venue = computed(() => event.value?.location_name || 'Rumah mempelai wanita')
const address = computed(
  () =>
    event.value?.address ||
    'Jl. Melati Raya No. 27, RT 004/RW 006, Kelurahan Cikini, Kecamatan Menteng, Jakarta Pusat, DKI Jakarta 10330',
)
const mapsUrl = computed(() => event.value?.maps_url || '')
</script>

<template>
  <section :ref="el" class="akad" :class="{ 'is-in': shown }" aria-labelledby="akad-venue">
    <img
      v-for="(l, i) in behind"
      :key="`b${i}`"
      :src="l.src"
      alt=""
      :style="box(l)"
      class="lyr"
      :class="`lyr--${l.kind}`"
    />

    <p class="akad__date">{{ when.weekday }},<br />{{ when.date }}</p>
    <p class="akad__time">{{ time }}</p>
    <h2 id="akad-venue" class="akad__venue">{{ venue }}</h2>
    <p :ref="fitAddress" class="akad__address">{{ address }}</p>

    <!--
      2594:342 is a flat #eed891 rounded rect with a uniform radius 6 and no effects,
      so it is drawn rather than shipped as an image -- that also makes it a real
      link with real states instead of a picture of a button.
    -->
    <a
      v-if="mapsUrl"
      class="akad__maps"
      :href="mapsUrl"
      target="_blank"
      rel="noopener noreferrer"
      >Maps</a
    >
    <!-- Visible copy, so no aria-hidden: an inert span is already not a control. -->
    <span v-else class="akad__maps akad__maps--off">Maps</span>

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
.akad {
  position: relative;
  height: calc(587 * var(--px));
  overflow: visible;
}

.akad > * {
  position: absolute;
  margin: 0;
  text-align: center;
  color: var(--maroon-title);
}

.lyr {
  pointer-events: none;
}

/*
 * The `top` values were measured, not derived: placed at each TEXT node's own y,
 * the browser put the ink 6px high on the Meow Script date, 4px on the two Ovo
 * lines at line-height 24, and 3px on the 8/12 address. Horizontal centres and
 * glyph widths matched Figma to the pixel first try, so only `top` is corrected.
 */
.akad__date {
  top: calc(78 * var(--px));
  left: calc(104 * var(--px));
  width: calc(172.14 * var(--px));
  font-family: var(--font-hand);
  font-size: calc(20 * var(--px));
  line-height: calc(24 * var(--px));
}

.akad__time {
  top: calc(136 * var(--px));
  left: calc(104 * var(--px));
  width: calc(172.14 * var(--px));
  font-family: var(--font-serif-alt);
  font-size: calc(13 * var(--px));
  line-height: calc(24 * var(--px));
}

.akad__venue {
  top: calc(192 * var(--px));
  left: calc(68 * var(--px));
  width: calc(240 * var(--px));
  font-family: var(--font-serif-alt);
  font-size: calc(12 * var(--px));
  font-weight: 400;
  line-height: calc(24 * var(--px));
}

.akad__address {
  top: calc(217 * var(--px));
  left: calc(116 * var(--px));
  width: calc(147 * var(--px));
  height: calc(36 * var(--px));
  font-family: var(--font-serif-alt);
  font-size: calc(8 * var(--px) * var(--fit, 1));
  /*
   * The leading scales too. The box is exactly the design's three lines with no
   * slack, so shrinking only the glyphs cannot buy a fourth line -- and the API's
   * addresses run longer than the one Frame 242 was drawn with.
   */
  line-height: calc(12 * var(--px) * var(--fit, 1));
}

/* 2594:342 + 2594:343 as one control. */
.akad__maps {
  top: calc(271 * var(--px));
  left: calc(161.08 * var(--px));
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(59.79 * var(--px));
  height: calc(26.79 * var(--px));
  border-radius: calc(6 * var(--px));
  background: #eed891;
  font-family: var(--font-sans);
  font-size: calc(10 * var(--px));
  line-height: calc(16.8 * var(--px));
  color: var(--ink);
  text-decoration: none;
  transition:
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 240ms ease-out;
}

.akad__maps:hover,
.akad__maps:focus-visible {
  filter: brightness(1.06);
  transform: translateY(calc(-1 * var(--px)));
}

.akad__maps--off {
  cursor: default;
}

/*
 * Reveal: the envelope rises, the card opens out of it, the florals sweep in from
 * the side each one sits on, then the card's copy writes itself out. The longest
 * chain has to land inside the window useReveal opens it in -- the band is 587px
 * tall and fires a quarter up the viewport, so a scroll carries the bottom of the
 * card away well before 4s. Last motion here settles at 1750 + 1900 = 3.65s.
 */
.akad .lyr,
.akad__date,
.akad__time,
.akad__venue,
.akad__address,
.akad__maps {
  opacity: 0;
  transition:
    opacity 1400ms ease-out var(--in, 0ms),
    transform 1900ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.akad.is-in .lyr,
.akad.is-in .akad__date,
.akad.is-in .akad__time,
.akad.is-in .akad__venue,
.akad.is-in .akad__address,
.akad.is-in .akad__maps {
  opacity: 1;
  transform: none;
}

.lyr--envelope {
  transform: translateY(calc(38 * var(--px))) scale(0.96);
}

.lyr--card {
  transform: translateY(calc(22 * var(--px))) scale(0.92);
}

.lyr--left {
  transform: translateX(calc(-24 * var(--px))) rotate(-6deg);
}

.lyr--right {
  transform: translateX(calc(24 * var(--px))) rotate(6deg);
}

.lyr--pin {
  transform: translateY(calc(-10 * var(--px))) scale(0.6);
}

.akad__date {
  --in: 1000ms;
  transform: translateY(calc(14 * var(--px)));
}

.akad__time {
  --in: 1200ms;
  transform: translateY(calc(12 * var(--px)));
}

.akad__venue {
  --in: 1400ms;
  transform: translateY(calc(10 * var(--px)));
}

.akad__address {
  --in: 1550ms;
  transform: translateY(calc(8 * var(--px)));
}

.akad__maps {
  --in: 1750ms;
  transform: scale(0.86);
}

@media (prefers-reduced-motion: reduce) {
  .akad .lyr,
  .akad__date,
  .akad__time,
  .akad__venue,
  .akad__address,
  .akad__maps {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
