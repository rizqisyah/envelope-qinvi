<script lang="ts">
/** `<script setup>` has no named exports, so the two bands' shared types live here. */
export type Layer = {
  src: string
  x: number
  y: number
  w: number
  h: number
  /** Which entrance the layer takes: it sweeps in from the side it sits on. */
  kind: 'envelope' | 'card' | 'pin' | 'left' | 'right'
  /** Entrance delay in ms. */
  in: number
}

/** Frame-local x and band-local y of one heading line, in design px. */
export type HeadingLine = { top: number; left: number }
</script>

<script setup lang="ts">
/*
 * The card Frame 242 draws twice: Akad (Group 245, y 4052) and Resepsi (Group 244,
 * y 4639). An olive envelope, a white scalloped card, florals over both of its
 * edges, and five TEXT nodes that were exported around -- so the copy is live.
 *
 * What is shared lives here: the markup, the reveal choreography, the text
 * placement, and the Maps control. What is NOT shared is every coordinate. Group
 * 244 is Group 245 translated by (-8, +587), but the two bands still keep their own
 * layer tables rather than deriving one from the other -- see SLICING.md, "A whole
 * band can be another band, moved". The numbers are the part that was expensive to
 * verify and the part most likely to need a per-band exception; a `dx` prop would
 * bury both. Note especially that the hidden heading does NOT ride the group's
 * offset (it shifts (-0.05, +594.85)), which is why `heading` is its own prop and
 * is never computed from the layers.
 */
import { computed } from 'vue'
import { formatEventDate, formatEventTime } from '../../lib/format'
import { useFitText } from '../../composables/useFitText'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

const props = defineProps<{
  /** Band name, used as the section's class and as the heading's id prefix. */
  name: string
  /** Band height in design px: to the next band's top, not to the art's bottom. */
  height: number
  /** Which entry of `acara` this card shows. Positional -- the list is ordered. */
  eventIndex: number
  /** Painted below the card's copy, in Figma's own child order. */
  behind: Layer[]
  /** Painted above it: the pin, then the florals that cross the card's edges. */
  front: Layer[]
  /** The band's own second heading line, e.g. "Akad Nikah". */
  headingLine2: string
  /** Measured, never derived from the layer offset. `top` is negative: the heading
   *  sits in the bare rows above this band's own top. */
  headingA: HeadingLine
  headingB: HeadingLine
}>()

function box(l: Layer) {
  return {
    top: `calc(${l.y} * var(--px))`,
    left: `calc(${l.x} * var(--px))`,
    width: `calc(${l.w} * var(--px))`,
    height: `calc(${l.h} * var(--px))`,
    '--in': `${l.in}ms`,
  }
}

function place(h: HeadingLine) {
  return { top: `calc(${h.top} * var(--px))`, left: `calc(${h.left} * var(--px))` }
}

const { el, shown } = useReveal()
const fitAddress = useFitText()
const { acara } = useWedding()

/*
 * Fallbacks are the copy Frame 242 draws on the card, so an unconfigured render
 * matches the design. Both cards carry identical mock text there, which is why a
 * payload with one event leaves the second card on the design's own strings.
 */
const event = computed(() => (acara.value as any[])[props.eventIndex] ?? null)

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
  <section
    :ref="el"
    class="band"
    :class="[name, { 'is-in': shown }]"
    :style="{ height: `calc(${height} * var(--px))` }"
    :aria-labelledby="`${name}-heading`"
  >
    <img
      v-for="(l, i) in behind"
      :key="`b${i}`"
      :src="l.src"
      alt=""
      :style="box(l)"
      class="lyr"
      :class="`lyr--${l.kind}`"
    />

    <h2 :id="`${name}-heading`" class="band__heading">
      <span class="band__heading-a" :style="place(headingA)">It’s the day!</span>
      <span class="band__heading-b" :style="place(headingB)">{{ headingLine2 }}</span>
    </h2>

    <p class="band__date">{{ when.weekday }},<br />{{ when.date }}</p>
    <p class="band__time">{{ time }}</p>
    <p class="band__venue">{{ venue }}</p>
    <p :ref="fitAddress" class="band__address">{{ address }}</p>

    <!--
      The Maps plate is a flat #eed891 rounded rect with a uniform radius 6 and no
      effects, so it is drawn rather than shipped as an image -- that also makes it a
      real link with real states instead of a picture of a button.
    -->
    <a v-if="mapsUrl" class="band__maps" :href="mapsUrl" target="_blank" rel="noopener noreferrer"
      >Maps</a
    >
    <!-- Visible copy, so no aria-hidden: an inert span is already not a control. -->
    <span v-else class="band__maps band__maps--off">Maps</span>

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
.band {
  position: relative;
  overflow: visible;
}

.band > * {
  position: absolute;
  margin: 0;
  text-align: center;
  color: var(--maroon-title);
}

.lyr {
  pointer-events: none;
}

/*
 * "It's the day! / <band>" -- two independently placed Pinyon Script lines rotated
 * together, in the bare-paper gap ABOVE this band's own top, which is why their
 * `top` values are negative. Both bands' nodes are hidden in Figma, so they are in
 * neither the export nor the reference render, and their declared coordinates are
 * the rotated-node kind that says nothing about where the art lands. Akad's angle
 * and position were measured off the design screenshot instead, through two
 * independent registrations; Resepsi's are akad's plus the pair's own (-0.05,
 * +594.85). See SLICING.md.
 *
 * Both Figma boxes are auto-width and left-anchored -- "Resepsi Nikah" is 234 wide
 * against "Akad Nikah"'s 202 and still starts at the same x -- so `nowrap` off
 * `left` is the faithful growth direction for the longer string.
 */
.band__heading {
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  font-weight: 400;
}

.band__heading span {
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
 * The `top` values were measured, not derived: placed at each TEXT node's own y,
 * the browser put the ink 6px high on the Meow Script date, 4px on the two Ovo
 * lines at line-height 24, and 3px on the 8/12 address. Horizontal centres and
 * glyph widths matched Figma to the pixel first try, so only `top` is corrected.
 *
 * `left` is the akad node's x; Resepsi's is 8 less, applied by the modifier at the
 * bottom of this file rather than threaded through as a prop -- unlike the heading,
 * these five really do ride the group's offset.
 */
.band__date {
  top: calc(78 * var(--px));
  left: calc(104 * var(--px));
  width: calc(172.14 * var(--px));
  font-family: var(--font-hand);
  font-size: calc(20 * var(--px));
  line-height: calc(24 * var(--px));
}

.band__time {
  top: calc(136 * var(--px));
  left: calc(104 * var(--px));
  width: calc(172.14 * var(--px));
  font-family: var(--font-serif-alt);
  font-size: calc(13 * var(--px));
  line-height: calc(24 * var(--px));
}

.band__venue {
  top: calc(192 * var(--px));
  left: calc(68 * var(--px));
  width: calc(240 * var(--px));
  font-family: var(--font-serif-alt);
  font-size: calc(12 * var(--px));
  font-weight: 400;
  line-height: calc(24 * var(--px));
}

.band__address {
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

.band__maps {
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

.band__maps:hover,
.band__maps:focus-visible {
  filter: brightness(1.06);
  transform: translateY(calc(-1 * var(--px)));
}

.band__maps--off {
  cursor: default;
}

/*
 * Reveal: the envelope rises, the card opens out of it, the florals sweep in from
 * the side each one sits on, then the card's copy writes itself out. The longest
 * chain has to land inside the window useReveal opens it in -- the band fires a
 * quarter up the viewport, so a scroll carries the bottom of the card away well
 * before 4s. Last motion here settles at 1750 + 1900 = 3.65s.
 */
.band .lyr,
.band__heading span,
.band__date,
.band__time,
.band__venue,
.band__address,
.band__maps {
  opacity: 0;
  transition:
    opacity 1400ms ease-out var(--in, 0ms),
    transform 1900ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.band.is-in .lyr,
.band.is-in .band__date,
.band.is-in .band__time,
.band.is-in .band__venue,
.band.is-in .band__address,
.band.is-in .band__maps {
  opacity: 1;
  transform: none;
}

/*
 * The heading has to carry its rotation in the end state too: there is only one
 * `transform`, so the shared `transform: none` above would flatten it.
 */
.band__heading span {
  transform: rotate(-12.25deg) translateY(calc(16 * var(--px)));
  --in: 250ms;
}

/*
 * `opacity` has to be repeated here, not just `transform`: pulling the heading out
 * of the shared `.is-in` rule to keep its rotation also pulled it out of the fade,
 * and the reduced-motion override below hides that from any check that does not run
 * one pass with motion on. See SLICING.md.
 */
.band.is-in .band__heading span {
  opacity: 1;
  transform: rotate(-12.25deg);
}

.band__heading-b {
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

.band__date {
  --in: 1000ms;
  transform: translateY(calc(14 * var(--px)));
}

.band__time {
  --in: 1200ms;
  transform: translateY(calc(12 * var(--px)));
}

.band__venue {
  --in: 1400ms;
  transform: translateY(calc(10 * var(--px)));
}

.band__address {
  --in: 1550ms;
  transform: translateY(calc(8 * var(--px)));
}

.band__maps {
  --in: 1750ms;
  transform: scale(0.86);
}

/*
 * Resepsi's five TEXT nodes ride Group 244's (-8, +587) like every other child of
 * the group, so only `left` differs and only by the group offset. Kept as a
 * modifier rather than a prop: it is the same shift the layer tables already carry,
 * and writing it once here is harder to get wrong than five more props.
 */
.band.resepsi .band__date,
.band.resepsi .band__time {
  left: calc(96 * var(--px));
}

.band.resepsi .band__venue {
  left: calc(60 * var(--px));
}

.band.resepsi .band__address {
  left: calc(108 * var(--px));
}

.band.resepsi .band__maps {
  left: calc(153.1 * var(--px));
}

@media (prefers-reduced-motion: reduce) {
  .band .lyr,
  .band__date,
  .band__time,
  .band__venue,
  .band__address,
  .band__maps {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .band__heading span {
    opacity: 1;
    transform: rotate(-12.25deg);
    transition: none;
  }
}
</style>
