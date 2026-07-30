<script setup lang="ts">
/*
 * Figma Frame 242, y 4639-5119 = Group 244 (2594:370). This is the akad band's
 * composition a second time, and it is a *rigid translation* of it: every one of
 * Group 244's 14 layers and 5 TEXT nodes sits at Group 245's coordinate minus 8 in
 * x and plus 587 in y, with no exceptions. So nothing here was solved -- the numbers
 * are AkadSection's verified ones with x - 8, and the band-local y is identical
 * because both groups start at their own band's top.
 *
 * Four independent confirmations that the shift is real, not assumed:
 *   - all 19 *declared* Figma coordinates differ by exactly (-8, +587);
 *   - 9 of the 14 exports are byte-identical to akad's;
 *   - the 5 that are not are the right-edge-clipped ones, and each is exactly 8px
 *     wider here (69 -> 77 hops, 69 -> 77 sweet pea, 142 -> 150 lily, 90 -> 98
 *     gypsophila) because 8px more of them falls inside the frame. The clip width
 *     *proves* the x: 375 - 77 = 298, 375 - 150 = 225, 375 - 98 = 277.
 *   - 2594:366, the big white rose, is the exception that confirms it: at x 307 it
 *     no longer touches the right edge, so it exports at its full 63 rather than
 *     akad's clipped 60. +3, not +8, and that is what the geometry predicts.
 *
 * Both of akad's asset-width lies repeat here with the same signature: 2594:349
 * declares x 76 for a 70-wide sprite (true x 6) and 2594:367 declares x 80 for a
 * 44-wide one (true x 36). Their akad twins were probed to ground truth, so these
 * are taken from the translation rather than re-probed.
 */
import { computed } from 'vue'
import { formatEventDate, formatEventTime } from '../../lib/format'
import { useFitText } from '../../composables/useFitText'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

import hops from '../../assets/resepsi/parts/g244_2594-346.webp'
import envelope from '../../assets/resepsi/parts/g244_2594-347_envelope.webp'
import lilyBack from '../../assets/resepsi/parts/g244_2594-348.webp'
import orchid from '../../assets/resepsi/parts/g244_2594-349.webp'
import card from '../../assets/resepsi/parts/g244_2594-350.webp'
import pin from '../../assets/resepsi/parts/g244_2594-362_pin.webp'
import callaLeft from '../../assets/resepsi/parts/g244_2594-363_vdf-8.webp'
import lilyFront from '../../assets/resepsi/parts/g244_2594-364.webp'
import sweetPea from '../../assets/resepsi/parts/g244_2594-365.webp'
import roseRight from '../../assets/resepsi/parts/g244_2594-366.webp'
import roseLeft from '../../assets/resepsi/parts/g244_2594-367.webp'
import callaRight from '../../assets/resepsi/parts/g244_2594-368.webp'
import gypsophila from '../../assets/resepsi/parts/g244_2594-369.webp'

type Layer = { src: string; x: number; y: number; w: number; h: number; kind: string; in: number }

// Everything the text is printed on: hops, envelope, the buried lily and orchid,
// then the card itself.
const behind: Layer[] = [
  { src: hops, x: 298, y: 85, w: 77, h: 122, kind: 'right', in: 900 },
  { src: envelope, x: 24, y: 0, w: 316, h: 382, kind: 'envelope', in: 0 },
  { src: lilyBack, x: 225, y: 28, w: 150, h: 204, kind: 'right', in: 1000 },
  { src: orchid, x: 6, y: 91, w: 70, h: 95, kind: 'left', in: 700 },
  { src: card, x: 23, y: 39, w: 316, h: 319.5, kind: 'card', in: 350 },
]

// The pin, then the florals that paint over the card's edges.
const front: Layer[] = [
  { src: pin, x: 174, y: 168, w: 16.5, h: 23, kind: 'pin', in: 1800 },
  { src: callaLeft, x: 36, y: 39, w: 67, h: 119, kind: 'left', in: 800 },
  { src: lilyFront, x: 269, y: 91, w: 65, h: 116, kind: 'right', in: 1100 },
  { src: sweetPea, x: 298, y: 146, w: 77, h: 104, kind: 'right', in: 1250 },
  { src: roseRight, x: 307, y: 176, w: 63, h: 56, kind: 'right', in: 1400 },
  { src: roseLeft, x: 36, y: 119, w: 44, h: 39, kind: 'left', in: 950 },
  { src: callaRight, x: 307, y: 218, w: 59.5, h: 80.5, kind: 'right', in: 1550 },
  { src: gypsophila, x: 277, y: 236, w: 98, h: 114.5, kind: 'right', in: 1700 },
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

/*
 * Resepsi is the second event. Index, not a title match: `acara` is an ordered list
 * and the design hard-codes two ceremonies in this order, so position is the
 * contract. A payload with one event leaves this card on the design's own copy --
 * which is what Frame 242 draws, since its two cards carry identical mock text.
 */
const event = computed(() => (acara.value as any[])[1] ?? null)

const when = computed(
  () => formatEventDate(event.value?.event_date) ?? { weekday: 'Saturday', date: '19 April 2029' },
)
const time = computed(() => formatEventTime(event.value?.event_time) || '10.00 WIB - 12.00 WIB')
const venue = computed(() => event.value?.location_name || 'Rumah mempelai wanita')
const address = computed(
  () =>
    event.value?.address ||
    'Jl. Melati Raya No. 27, RT 004/RW 006, Kelurahan Cikini, Kecamatan Menteng, Jakarta Pusat, DKI Jakarta 10330',
)
const mapsUrl = computed(() => event.value?.maps_url || '')
</script>

<template>
  <section :ref="el" class="resepsi" :class="{ 'is-in': shown }" aria-labelledby="resepsi-heading">
    <img
      v-for="(l, i) in behind"
      :key="`b${i}`"
      :src="l.src"
      alt=""
      :style="box(l)"
      class="lyr"
      :class="`lyr--${l.kind}`"
    />

    <h2 id="resepsi-heading" class="resepsi__heading">
      <span class="resepsi__heading-a">It’s the day!</span>
      <span class="resepsi__heading-b">Resepsi Nikah</span>
    </h2>

    <p class="resepsi__date">{{ when.weekday }},<br />{{ when.date }}</p>
    <p class="resepsi__time">{{ time }}</p>
    <p class="resepsi__venue">{{ venue }}</p>
    <p :ref="fitAddress" class="resepsi__address">{{ address }}</p>

    <!-- 2594:360, like akad's 2594:342, is a flat #eed891 rounded rect: drawn, not shipped. -->
    <a
      v-if="mapsUrl"
      class="resepsi__maps"
      :href="mapsUrl"
      target="_blank"
      rel="noopener noreferrer"
      >Maps</a
    >
    <!-- Visible copy, so no aria-hidden: an inert span is already not a control. -->
    <span v-else class="resepsi__maps resepsi__maps--off">Maps</span>

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
/*
 * 480, not akad's 587: this band runs to the countdown group's own top at y 5119.
 * Group 244's art stops at 5021 and rows 5021-5119 are bare paper in the render.
 */
.resepsi {
  position: relative;
  height: calc(480 * var(--px));
  overflow: visible;
}

.resepsi > * {
  position: absolute;
  margin: 0;
  text-align: center;
  color: var(--maroon-title);
}

.lyr {
  pointer-events: none;
}

/*
 * "It's the day! / Resepsi Nikah" -- 2560:261 and 2560:262, hidden in Figma exactly
 * like the akad pair and likewise in neither the export nor the reference render
 * (rows 4560-4640 of frame242-full.png are bare paper, min luma 217).
 *
 * Placed by translation off the akad heading, which was measured. Both lines sit
 * exactly (-0.05, +594.85) from their akad twins, and the offset *between* the two
 * lines is (+72.95, +30.85) in both pairs -- identical, so the rotation is the same
 * -12.25deg and the copy is rigid. Note this is NOT the layers' (-8, +587): the
 * heading is not a child of the group, so it does not ride the group's shift.
 */
.resepsi__heading {
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  font-weight: 400;
}

.resepsi__heading span {
  position: absolute;
  display: block;
  white-space: nowrap;
  font-family: var(--font-script);
  font-size: calc(40 * var(--px));
  line-height: calc(38 * var(--px));
  color: var(--ink);
  transform-origin: 0 0;
  transform: rotate(-12.25deg);
}

/*
 * Negative, so this lands in the bare rows at the bottom of the akad band. Both
 * Figma boxes are auto-width and left-anchored -- "Resepsi Nikah" is 234 wide against
 * "Akad Nikah"'s 202 and still starts at the same x -- so `nowrap` off `left` is
 * the faithful growth direction for the longer string.
 */
.resepsi__heading-a {
  top: calc(-70.55 * var(--px));
  left: calc(24.89 * var(--px));
}

.resepsi__heading-b {
  top: calc(-38.35 * var(--px));
  left: calc(93.88 * var(--px));
}

/* Akad's measured text placement, x - 8. The `top` values carry its corrections. */
.resepsi__date {
  top: calc(78 * var(--px));
  left: calc(96 * var(--px));
  width: calc(172.14 * var(--px));
  font-family: var(--font-hand);
  font-size: calc(20 * var(--px));
  line-height: calc(24 * var(--px));
}

.resepsi__time {
  top: calc(136 * var(--px));
  left: calc(96 * var(--px));
  width: calc(172.14 * var(--px));
  font-family: var(--font-serif-alt);
  font-size: calc(13 * var(--px));
  line-height: calc(24 * var(--px));
}

.resepsi__venue {
  top: calc(192 * var(--px));
  left: calc(60 * var(--px));
  width: calc(240 * var(--px));
  font-family: var(--font-serif-alt);
  font-size: calc(12 * var(--px));
  font-weight: 400;
  line-height: calc(24 * var(--px));
}

.resepsi__address {
  top: calc(217 * var(--px));
  left: calc(108 * var(--px));
  width: calc(147 * var(--px));
  height: calc(36 * var(--px));
  font-family: var(--font-serif-alt);
  font-size: calc(8 * var(--px) * var(--fit, 1));
  /* The leading scales with the type -- see AkadSection, same box, same reason. */
  line-height: calc(12 * var(--px) * var(--fit, 1));
}

/* 2594:360 + 2594:361 as one control. */
.resepsi__maps {
  top: calc(271 * var(--px));
  left: calc(153.1 * var(--px));
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

.resepsi__maps:hover,
.resepsi__maps:focus-visible {
  filter: brightness(1.06);
  transform: translateY(calc(-1 * var(--px)));
}

.resepsi__maps--off {
  cursor: default;
}

/* Same reveal choreography as akad; last motion settles at 1750 + 1900 = 3.65s. */
.resepsi .lyr,
.resepsi__heading span,
.resepsi__date,
.resepsi__time,
.resepsi__venue,
.resepsi__address,
.resepsi__maps {
  opacity: 0;
  transition:
    opacity 1400ms ease-out var(--in, 0ms),
    transform 1900ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.resepsi.is-in .lyr,
.resepsi.is-in .resepsi__date,
.resepsi.is-in .resepsi__time,
.resepsi.is-in .resepsi__venue,
.resepsi.is-in .resepsi__address,
.resepsi.is-in .resepsi__maps {
  opacity: 1;
  transform: none;
}

/*
 * The heading needs its own end state to keep the rotation, and that rule must
 * repeat `opacity: 1` -- leaving it out makes the heading invisible in the real
 * thing while every reduced-motion check still passes. See SLICING.md.
 */
.resepsi__heading span {
  transform: rotate(-12.25deg) translateY(calc(16 * var(--px)));
  --in: 250ms;
}

.resepsi.is-in .resepsi__heading span {
  opacity: 1;
  transform: rotate(-12.25deg);
}

.resepsi__heading-b {
  --in: 500ms;
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

.resepsi__date {
  --in: 1000ms;
  transform: translateY(calc(14 * var(--px)));
}

.resepsi__time {
  --in: 1200ms;
  transform: translateY(calc(12 * var(--px)));
}

.resepsi__venue {
  --in: 1400ms;
  transform: translateY(calc(10 * var(--px)));
}

.resepsi__address {
  --in: 1550ms;
  transform: translateY(calc(8 * var(--px)));
}

.resepsi__maps {
  --in: 1750ms;
  transform: scale(0.86);
}

@media (prefers-reduced-motion: reduce) {
  .resepsi .lyr,
  .resepsi__date,
  .resepsi__time,
  .resepsi__venue,
  .resepsi__address,
  .resepsi__maps {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .resepsi__heading span {
    opacity: 1;
    transform: rotate(-12.25deg);
    transition: none;
  }
}
</style>
