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
 * Scored: akad's art rows and these both come back at 2.93/255, with the worst row
 * at 4288 and 4875 -- 4875-587=4288, the same row of the same picture.
 *
 * Both of akad's asset-width lies repeat here with the same signature: 2594:349
 * declares x 76 for a 70-wide sprite (true x 6) and 2594:367 declares x 80 for a
 * 44-wide one (true x 36). Their akad twins were probed to ground truth, so these
 * are taken from the translation rather than re-probed.
 */
import CeremonyBand, { type Layer } from './CeremonyBand.vue'

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

const behind: Layer[] = [
  { src: hops, x: 298, y: 85, w: 77, h: 122, kind: 'right', in: 900 },
  { src: envelope, x: 24, y: 0, w: 316, h: 382, kind: 'envelope', in: 0 },
  { src: lilyBack, x: 225, y: 28, w: 150, h: 204, kind: 'right', in: 1000 },
  { src: orchid, x: 6, y: 91, w: 70, h: 95, kind: 'left', in: 700 },
  { src: card, x: 23, y: 39, w: 316, h: 319.5, kind: 'card', in: 350 },
]

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
</script>

<template>
  <!--
    480, not akad's 587: this band runs to the countdown group's own top at y 5119.
    Group 244's art stops at 5021 and rows 5021-5119 are bare paper in the render.

    Heading placement: 2560:261 and 2560:262, hidden like akad's and likewise in
    neither the export nor the reference render (rows 4560-4640 of frame242-full.png
    are bare paper, min luma 217). NOT the layers' (-8, +587) -- the heading is not a
    child of the group, so it shifts (-0.05, +594.85) from its akad twin instead, and
    the offset *between* the two lines is (+72.95, +30.85) in both pairs, so the
    rotation is the same. All three translatable anchors land within 0.01px.
  -->
  <CeremonyBand
    name="resepsi"
    :height="480"
    :event-index="1"
    :behind="behind"
    :front="front"
    heading-line2="Resepsi Nikah"
    :heading-a="{ top: -70.55, left: 24.89 }"
    :heading-b="{ top: -38.35, left: 93.88 }"
  />
</template>
