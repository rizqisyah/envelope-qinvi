<script setup lang="ts">
/*
 * Figma Frame 242, y 4052-4639 = Group 245 (2594:371). Coordinates are frame-local
 * x and band-local y (frame y minus 4052), in the group's own child order (first
 * child = bottom). Solved with scripts/solve_band.py against
 * .figma-ref/bands/akad.json; band composite 2.24/255, art rows 2.93/255.
 *
 * Everything else -- markup, reveal, text placement, the Maps control -- is in
 * CeremonyBand.vue, which Resepsi shares. Only the numbers live here.
 *
 * Three of Figma's declared positions were wrong and each lied differently:
 *   2594:319  rotated. Declared x 308 with a 142-wide export that was NOT clipped,
 *             which is impossible on a 375 frame -- x must be <= 233, and 233 is a
 *             sharp minimum over a 90-row sweep.
 *   2594:328  rotated the same way; the clip rule caps x at 285, which is also
 *             where it scores best. The band solve had walked it to 341.
 *   2594:329  declared x 84, actually 14 -- exactly one asset width out. At 84 it
 *             lands under the card, so its leave-one-out reads 0.000 and it looks
 *             like a hidden layer rather than a misplaced one.
 *   2594:330  declared x 88, actually 44 -- one asset width again, and far enough
 *             that the solver's own window never reached it.
 * Meanwhile 2594:323/324/325 are right-edge clipped, and the clip width *proves*
 * their x (69 = 375-306, 60 = 375-315), so those needed no solving at all.
 */
import CeremonyBand, { type Layer } from './CeremonyBand.vue'

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

const behind: Layer[] = [
  { src: hops, x: 306, y: 85, w: 69, h: 122, kind: 'right', in: 900 },
  { src: envelope, x: 32, y: 0, w: 316, h: 382, kind: 'envelope', in: 0 },
  { src: lilyBack, x: 233, y: 28, w: 142, h: 204, kind: 'right', in: 1000 },
  { src: orchid, x: 14, y: 91, w: 70, h: 95, kind: 'left', in: 700 },
  { src: card, x: 31, y: 39, w: 316, h: 319.5, kind: 'card', in: 350 },
]

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
</script>

<template>
  <!--
    Heading placement: 2560:211 and 2560:213, hidden in Figma. Measured off the
    design screenshot through two independent registrations (the envelope apex the
    crop includes, then the paper edges of a second shot), agreeing to ~1px.
  -->
  <CeremonyBand
    name="akad"
    :height="587"
    :event-index="0"
    :behind="behind"
    :front="front"
    heading-line2="Akad Nikah"
    :heading-a="{ top: -78.4, left: 24.94 }"
    :heading-b="{ top: -46.2, left: 93.93 }"
  />
</template>
