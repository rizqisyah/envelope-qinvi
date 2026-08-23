<script setup lang="ts">
/*
 * Figma Frame 242, y 7700-8749 -- the last band, and the only one that reaches the
 * frame's own bottom edge. Coordinates are frame-local x and band-local y (frame y minus
 * 7700). 33 layers in three groups plus 8 TEXT nodes.
 *
 * Two nodes are NOT here: 2594:479/480 ("mutiara last page") exported blank, and rows
 * 7620-7800 of the render carry no pearls at all, which confirms the drop.
 *
 * Group 176 (the credit block) was exported whole at 714x216, but that export wraps four
 * TEXT nodes, so it was deleted and only its two buttons kept.
 *
 * 2594:208 is the couple's PHOTOGRAPH, not artwork. The sliced plate is the fallback; the
 * API's image goes over it, the same way the gallery treats its photos.
 *
 * Placement notes worth carrying:
 *   - Eight right-side layers sit at exactly `375 - exportWidth`. Their declared x puts
 *     them partly or wholly off-frame (2594:463 declares x 409, past the frame entirely)
 *     while the export came back unclipped, so that value is an upper bound from the clip
 *     rule -- and the worth probe chose exactly it in all eight cases.
 *   - 2594:214 is 78x109 EXACT and still wrong: declared x 355 leaves 20px on frame but
 *     the export is the full 78, so x <= 297. A local refine had walked it to 367, which
 *     the cap rules out; solved to 277.
 *   - 2594:207 was walked 81px up by the worth probe and is 81px better at its DECLARED y
 *     when scored over the whole band. It is fully buried (locate.py err 113), so the
 *     local box the probe measures over is not the box that matters.
 *   - 2594:476 is gypsophila: 2.7% opaque, white on white paper, worth 0.000 everywhere.
 *     The clip rule placed it -- exported 101 = 104-3 is a LEFT clip, so it begins at
 *     frame x 0, not at its declared 101, where it sat visibly in the middle of a band
 *     the render leaves empty there.
 */
import { computed } from 'vue'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

import orchid from '../../assets/footer/parts/04_2594-459.webp'
import topLeft from '../../assets/footer/parts/00_2594-462.webp'
import topRight from '../../assets/footer/parts/01_2594-463.webp'
import lilyLeft from '../../assets/footer/parts/05_2594-467.webp'
import lilyRight from '../../assets/footer/parts/06_2594-466.webp'
import budRight from '../../assets/footer/parts/07_2594-473.webp'
import leafLeft from '../../assets/footer/parts/09_2594-477.webp'
import leafRight from '../../assets/footer/parts/10_2594-478.webp'
import gypLeft from '../../assets/footer/parts/11_2594-476.webp'
import gypRight from '../../assets/footer/parts/12_2594-475.webp'
import callaRight from '../../assets/footer/parts/13_2594-472.webp'
import callaLeft from '../../assets/footer/parts/14_2594-471.webp'
import daisyLeft from '../../assets/footer/parts/15_2594-469.webp'
import daisyRight from '../../assets/footer/parts/16_2594-470.webp'
import envBack from '../../assets/footer/parts/19_2594-203_cascasc-2.webp'
import envInner from '../../assets/footer/parts/17_2594-207.webp'
import envFront from '../../assets/footer/parts/20_2594-204_defcew-2.webp'
import couplePlate from '../../assets/footer/parts/21_2594-208_img-8300.webp'
import orchidSpray from '../../assets/footer/parts/18_2594-220.webp'
import orchidRight from '../../assets/footer/parts/22_2594-292.webp'
import roseLeft from '../../assets/footer/parts/23_2594-211.webp'
import roseRight from '../../assets/footer/parts/25_2594-212.webp'
import vdfLeft from '../../assets/footer/parts/26_2594-215_vdf-4.webp'
import vdfRight from '../../assets/footer/parts/24_2594-216_vdf-5.webp'
import leafLo from '../../assets/footer/parts/27_2594-214.webp'
import leafLo2 from '../../assets/footer/parts/28_2594-213.webp'
import sprigLo from '../../assets/footer/parts/29_2594-219.webp'
import daisyLo from '../../assets/footer/parts/30_2594-218.webp'
import bloomLo from '../../assets/footer/parts/31_2594-435.webp'
import stemLo from '../../assets/footer/parts/32_2594-217.webp'
import budLo from '../../assets/footer/parts/33_2594-210.webp'
import igBtn from '../../assets/footer/parts/g176_2594-445_ig.webp'
import waBtn from '../../assets/footer/parts/g176_2594-449_wa.webp'

type Layer = { src: string; x: number; y: number; w: number; h: number; in: number }

/**
 * Everything under the couple photo, in Figma paint order. `y` is band-local; a negative
 * y is art that hangs above this band's own top, which two of these do.
 */
const under: Layer[] = [
  // Pulled 18px off its probed x 3, so the leaf bleeds past the left edge the way
  // its frame-clipped twin does on the right.
  { src: leafLeft, x: -15, y: 74, w: 86, h: 98.5, in: 700 },
  { src: leafRight, x: 306, y: 78, w: 69, h: 98.5, in: 750 },
  { src: orchidRight, x: 260, y: 374, w: 115, h: 173, in: 1500 },
  { src: roseLeft, x: 0, y: 365, w: 101, h: 134.5, in: 1450 },
  { src: roseRight, x: 281, y: 370, w: 94, h: 134.5, in: 1500 },
  { src: envBack, x: 17, y: 353, w: 349, h: 416, in: 1100 },
  { src: envInner, x: 56, y: 321, w: 274, h: 412, in: 1150 },
  { src: orchidSpray, x: 266, y: 327, w: 93, h: 125, in: 1550 },
  { src: vdfLeft, x: 0, y: 395, w: 115, h: 217, in: 1600 },
  { src: vdfRight, x: 261, y: 390, w: 114, h: 217, in: 1600 },
  { src: leafLo, x: 277, y: 422, w: 78, h: 109, in: 1650 },
]

/** Everything over it, still in Figma paint order. */
const over: Layer[] = [
  { src: leafLo2, x: 28, y: 422, w: 78, h: 109, in: 1650 },
  { src: bloomLo, x: 283, y: 499, w: 91.5, h: 94, in: 1750 },
  { src: sprigLo, x: 276, y: 476, w: 73, h: 98, in: 1700 },
  { src: stemLo, x: 188, y: 514, w: 84, h: 182, in: 1800 },
  { src: envFront, x: 31, y: 345, w: 320, h: 425, in: 1200 },
  { src: budLo, x: 157, y: 580, w: 69, h: 87, in: 1900 },
  { src: daisyLo, x: 34, y: 480, w: 67, h: 67, in: 1750 },
]

/** The top-of-band cascade, which paints above the group and above the copy. */
const top: Layer[] = [
  { src: orchid, x: 146, y: 15, w: 102, h: 92, in: 0 },
  { src: topLeft, x: 0, y: -92, w: 154, h: 219, in: 150 },
  { src: topRight, x: 236, y: -92, w: 139, h: 219, in: 150 },
  { src: lilyRight, x: 263, y: 63, w: 112, h: 193, in: 400 },
  { src: lilyLeft, x: 0, y: 56, w: 127, h: 193, in: 400 },
  { src: gypRight, x: 291, y: 134, w: 84, h: 104, in: 900 },
  { src: gypLeft, x: 0, y: 131, w: 101, h: 104, in: 900 },
  { src: callaLeft, x: -15, y: 148, w: 61.5, h: 83.5, in: 550 },
  { src: callaRight, x: 327, y: 141, w: 48, h: 83.5, in: 550 },
  { src: daisyLeft, x: -1, y: 202, w: 58, h: 58, in: 850 },
  { src: daisyRight, x: 320, y: 202, w: 55, h: 58, in: 850 },
  { src: budRight, x: 335, y: 72, w: 40, h: 35, in: 250 },
  // 2594:474 is byte-identical to 2594:473, so it reuses that export.
  { src: budRight, x: 14, y: 72, w: 40, h: 35, in: 250 },
]

const { el, shown } = useReveal()
const { wedding, groom, bride, spousePhoto, activeSpousePhotoTransform } = useWedding()

/*
 * The design's own string is "Antonio + Aliyah", where the bride is "Ayu Shella Pratni
 * (Allysa)" -- an inconsistency in the design, recorded in SLICING.md. So the live line
 * and the reference line differ by construction and the text rows never diff clean once
 * `pengantin` is populated. Live names win; the design's literal is the fallback.
 */
const coupleLine = computed(() => {
  const g = (groom.value as any)?.name?.split(' ')[0]
  const b = (bride.value as any)?.name?.split(' ')[0]
  return g && b ? `${g} + ${b}` : 'Antonio + Aliyah'
})

/*
 * 2594:208 is a photograph. The sliced plate keeps an unconfigured render matching the
 * design; a configured one shows the couple.
 */
const couplePhoto = computed(() => spousePhoto.value || couplePlate)

/*
 * "Created with Love by, @25ribuaja x Qinvi" is the template vendor's credit, not the
 * couple's, so the Instagram handle is the vendor's own -- the same one the production app
 * hardcodes. No WhatsApp number is known for it, and a `wa.me/` with no number is a dead
 * link, so that button renders as art unless the API supplies one.
 */
const IG_URL = 'https://instagram.com/25ribuaja'
const waUrl = computed(() => (wedding.value?.vendor_whatsapp as string) || '')
</script>

<template>
  <footer :ref="el" class="footer" :class="{ 'is-in': shown }" aria-labelledby="footer-heading">
    <img
      v-for="(l, i) in under"
      :key="`u${i}`"
      :src="l.src"
      alt=""
      class="footer__lyr"
      :style="{
        top: `calc(${l.y} * var(--px))`,
        left: `calc(${l.x} * var(--px))`,
        width: `calc(${l.w} * var(--px))`,
        height: `calc(${l.h} * var(--px))`,
        '--in': `${l.in}ms`,
      }"
    />

    <!-- z105: the couple photograph, inside the envelope the layers above and below form. -->
    <img
      :src="couplePhoto"
      alt="Foto mempelai"
      class="footer__photo"
    />

    <img
      v-for="(l, i) in over"
      :key="`o${i}`"
      :src="l.src"
      alt=""
      class="footer__lyr"
      :style="{
        top: `calc(${l.y} * var(--px))`,
        left: `calc(${l.x} * var(--px))`,
        width: `calc(${l.w} * var(--px))`,
        height: `calc(${l.h} * var(--px))`,
        '--in': `${l.in}ms`,
      }"
    />

    <h2 id="footer-heading" class="footer__thanks">Thank You !</h2>
    <p class="footer__body">
      We sincerely thank you for your presence, prayers, and blessings on our special day.
    </p>
    <p class="footer__couple">{{ coupleLine }}</p>

    <p class="footer__by">Created with Love by,</p>
    <p class="footer__vendor footer__vendor--a">@25ribuaja</p>
    <p class="footer__vendor footer__vendor--x">x</p>
    <p class="footer__vendor footer__vendor--b">Qinvi</p>

    <a class="footer__btn footer__btn--ig" :href="IG_URL" target="_blank" rel="noopener">
      <img :src="igBtn" alt="" />
      <span class="footer__sr">Instagram @25ribuaja</span>
    </a>
    <!-- No number configured means no link: the art still ships, the dead href does not. -->
    <a
      v-if="waUrl"
      class="footer__btn footer__btn--wa"
      :href="`https://wa.me/${waUrl}`"
      target="_blank"
      rel="noopener"
    >
      <img :src="waBtn" alt="" />
      <span class="footer__sr">WhatsApp</span>
    </a>
    <span v-else class="footer__btn footer__btn--wa" aria-hidden="true">
      <img :src="waBtn" alt="" />
    </span>

    <!-- z134-146: the whole top cascade paints above the copy and the envelope. -->
    <img
      v-for="(l, i) in top"
      :key="`t${i}`"
      :src="l.src"
      alt=""
      class="footer__lyr"
      :style="{
        top: `calc(${l.y} * var(--px))`,
        left: `calc(${l.x} * var(--px))`,
        width: `calc(${l.w} * var(--px))`,
        height: `calc(${l.h} * var(--px))`,
        '--in': `${l.in}ms`,
      }"
    />
  </footer>
</template>

<style scoped>
/* 1049 = 7700 to 8749, the frame's own bottom edge. */
.footer {
  position: relative;
  height: calc(1001 * var(--px));
  overflow: visible;
}

.footer > * {
  position: absolute;
  margin: 0;
}

.footer img {
  pointer-events: none;
}

.footer__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* 2594:208 — 342x342 at (17, 8054). A live photo of any aspect fills the same box. */
/* Adjusted width and left to match envInner (274px wide at x: 56) per user request */
.footer__photo {
  top: calc(321 * var(--px));
  left: calc(56 * var(--px));
  width: calc(274 * var(--px));
  height: calc(412 * var(--px));
  object-fit: cover;
}

/*
 * 2594:436 — Pinyon Script 40, #000000. Figma reports no lineHeight and a 50-tall box, so
 * the line is centred inside it and the node y is not the text top. Centred on the box's
 * own centre (194.5) rather than left-aligned as declared, so a longer string stays put.
 */
/* `top` 129, swept: 3.10 against 12.5 and 13.4 either side. */
.footer__thanks {
  top: calc(129 * var(--px));
  left: calc(104 * var(--px));
  width: calc(181 * var(--px));
  font-family: var(--font-script);
  font-size: calc(40 * var(--px));
  line-height: calc(46 * var(--px));
  font-weight: 400;
  text-align: center;
  color: #000000;
}

/* 2594:296 — Pochaevsk 15/24, #7c4a15, centred. */
.footer__body {
  top: calc(178 * var(--px));
  left: calc(74 * var(--px));
  width: calc(249 * var(--px));
  font-family: var(--font-thanks);
  font-size: calc(15 * var(--px));
  line-height: calc(24 * var(--px));
  text-align: center;
  color: #7c4a15;
}

/*
 * The design repeated the thank-you sentence a second time just above this credit
 * (2594:438). The client asked for it gone, so the credit block and the buttons below it
 * move up 93px and the band loses 48 -- otherwise deleting the sentence just leaves a
 * hole between the envelope and "Created with Love by,". The gap closes from 69px to 24,
 * and the extra band tail lifts the buttons off the bottom nav, which they overlapped by
 * 20px even before this change.
 */
/* 2594:295 — Pinyon Script 36 in a 45-tall box, same centring as the heading. */
.footer__couple {
  /* Swept to 268: 5.86 against 9.62 and 14.6. Same auto-box centring as the heading. */
  top: calc(268 * var(--px));
  left: calc(77 * var(--px));
  width: calc(230 * var(--px));
  font-family: var(--font-script);
  font-size: calc(36 * var(--px));
  line-height: calc(42 * var(--px));
  text-align: center;
  color: #000000;
}

/* 2594:440-443 — Pinyon Script 24/24, #742e2e. */
.footer__by,
.footer__vendor {
  font-family: var(--font-script);
  font-size: calc(24 * var(--px));
  line-height: calc(24 * var(--px));
  text-align: center;
  color: #742e2e;
}

.footer__by {
  top: calc(794 * var(--px));
  left: calc(90 * var(--px));
  width: calc(224 * var(--px));
}

/*
 * Three centred boxes that each declare 172.9 wide and overlap heavily; what places them
 * is their centres -- 104.45, 203.65, 288.55.
 */
.footer__vendor {
  top: calc(826 * var(--px));
  width: calc(172.9 * var(--px));
}

.footer__vendor--a {
  left: calc(18 * var(--px));
}

.footer__vendor--x {
  left: calc(117.2 * var(--px));
}

.footer__vendor--b {
  left: calc(202.1 * var(--px));
}

/*
 * The two buttons keep their exact 45x30 art and are padded out to a 44px touch target,
 * which costs nothing visually because the padding is transparent.
 */
.footer__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(45 * var(--px));
  height: calc(44 * var(--px));
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.footer__btn img {
  width: calc(45 * var(--px));
  height: calc(30 * var(--px));
}

a.footer__btn:hover,
a.footer__btn:focus-visible {
  transform: scale(1.08);
}

a.footer__btn:focus-visible {
  outline: calc(2 * var(--px)) solid #742e2e;
  outline-offset: calc(2 * var(--px));
  border-radius: calc(8 * var(--px));
}

.footer__btn--ig {
  top: calc(864 * var(--px));
  left: calc(155 * var(--px));
}

.footer__btn--wa {
  top: calc(865 * var(--px));
  left: calc(211 * var(--px));
}

.footer__btn--wa img {
  height: calc(29.5 * var(--px));
}

.footer__lyr {
  position: absolute;
}

/*
 * Reveal: the orchid medallion and the top cascade open first, then the copy, then the
 * envelope assembles around the photograph. Everything shares one transition so the whole
 * band is one gesture rather than 33 independent ones.
 */
.footer__lyr,
.footer__photo,
.footer__thanks,
.footer__body,
.footer__couple,
.footer__by,
.footer__vendor,
.footer__btn {
  opacity: 0;
  transition:
    opacity 1100ms ease-out var(--in, 0ms),
    transform 1500ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.footer.is-in .footer__lyr,
.footer.is-in .footer__photo,
.footer.is-in .footer__thanks,
.footer.is-in .footer__body,
.footer.is-in .footer__couple,
.footer.is-in .footer__by,
.footer.is-in .footer__vendor,
.footer.is-in .footer__btn {
  opacity: 1;
  transform: none;
}

.footer__lyr {
  transform: translateY(calc(10 * var(--px)));
}

.footer__thanks {
  --in: 300ms;
  transform: translateY(calc(14 * var(--px)));
}

.footer__body {
  --in: 500ms;
  transform: translateY(calc(12 * var(--px)));
}

.footer__couple {
  --in: 700ms;
  transform: translateY(calc(12 * var(--px)));
}

.footer__photo {
  --in: 1250ms;
  transform: translateY(calc(16 * var(--px)));
}

.footer__by {
  --in: 2100ms;
}

.footer__vendor {
  --in: 2200ms;
}

.footer__btn {
  --in: 2350ms;
  transform: translateY(calc(8 * var(--px)));
}

@media (prefers-reduced-motion: reduce) {
  .footer__lyr,
  .footer__photo,
  .footer__thanks,
  .footer__body,
  .footer__couple,
  .footer__by,
  .footer__vendor,
  .footer__btn {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
