<script setup lang="ts">
/*
 * Figma Frame 242, y 5119-5485: a silver tray, a scalloped white ticket
 * (2610:112 "sdc 1") and florals over both. Coordinates are frame-local x and
 * band-local y (frame y minus 5119), in z order from frame242-zorder.json --
 * which is NOT the order the export filenames are numbered in.
 *
 * THE TEXT IS NOT AN ASSET. 2610:113 is a flattened bitmap of "0 Days 0 Hours 0
 * Minutes 0 Seconds" -- 96.4% transparent, pure glyphs, and with no TEXT node
 * anywhere in the document to recover it from. It is not shipped: a countdown has
 * to tick, so the four cells are live DOM and the bitmap is masked out of the
 * band's solve. Its typography was measured off the bitmap's own ink instead
 * (cell centres, cap height, baseline, colour) -- see SLICING.md.
 *
 * Placement here did NOT come from solve_band.py. That minimises the error of the
 * finished stack, which is the wrong objective for a layer that may not belong
 * where Figma put it: it walked three layers to their window edges and stalled at
 * 3.03. Maximising WORTH instead -- err(absent) - err(present) over the same box --
 * placed every layer and took the band to 2.22. Details in
 * .figma-ref/bands/countdown.json.
 *
 * Two of Figma's x values are out by exactly the asset's own width, the same
 * signature as the akad band's 2594:329/330:
 *   2610:115  declared 70, actually 10 (60 wide). At 70 the big calla sits on top
 *             of the ticket, where the render has clean paper.
 *   2610:120  declared 45, actually 18 (27 wide).
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import { parseEventStart, remainingUntil } from '../../lib/format'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

import tray from '../../assets/countdown/parts/00_2610-111_tray.webp'
import sprig from '../../assets/countdown/parts/01_2610-131.webp'
import ticket from '../../assets/countdown/parts/06_2610-112_sdc-1.webp'
import delphLeft from '../../assets/countdown/parts/04_2610-119.webp'
import delphMid from '../../assets/countdown/parts/05_2610-126.webp'
import lilyRight from '../../assets/countdown/parts/02_2610-114.webp'
import calla from '../../assets/countdown/parts/08_2610-115.webp'
import valleyRight from '../../assets/countdown/parts/03_2610-116.webp'
import leafA from '../../assets/countdown/parts/14_2610-117.webp'
import stem from '../../assets/countdown/parts/11_2610-125.webp'
import leafB from '../../assets/countdown/parts/16_2610-122.webp'
import pomA from '../../assets/countdown/parts/12_2610-118.webp'
import pomB from '../../assets/countdown/parts/15_2610-121.webp'
import budA from '../../assets/countdown/parts/10_2610-120.webp'
import budB from '../../assets/countdown/parts/13_2610-123.webp'
import budC from '../../assets/countdown/parts/09_2610-124.webp'

type Layer = { src: string; x: number; y: number; w: number; h: number; kind: string; in: number }

// z 149-151: the tray, its sprig, and the ticket the copy is printed on.
const behind: Layer[] = [
  { src: tray, x: 0, y: 0, w: 210, h: 281, kind: 'tray', in: 0 },
  { src: sprig, x: 145, y: 4, w: 111, h: 157, kind: 'right', in: 700 },
  { src: ticket, x: 22, y: 90, w: 353, h: 122.5, kind: 'ticket', in: 300 },
]

// z 153-165: every floral paints ABOVE the ticket and above the copy.
const front: Layer[] = [
  { src: delphLeft, x: 0, y: 57, w: 37, h: 140, kind: 'left', in: 900 },
  { src: delphMid, x: 8, y: 71, w: 57, h: 118, kind: 'left', in: 1000 },
  { src: lilyRight, x: 289, y: 38, w: 67, h: 119, kind: 'right', in: 850 },
  { src: calla, x: 10, y: 107, w: 60, h: 90, kind: 'left', in: 1150 },
  { src: valleyRight, x: 321, y: 48, w: 51, h: 77, kind: 'right', in: 950 },
  { src: leafA, x: 6, y: 177, w: 45, h: 40, kind: 'left', in: 1400 },
  { src: stem, x: 33, y: 166, w: 40, h: 100, kind: 'left', in: 1250 },
  { src: leafB, x: 29, y: 186, w: 31, h: 28, kind: 'left', in: 1500 },
  { src: pomA, x: 0, y: 166, w: 35, h: 31, kind: 'left', in: 1300 },
  { src: pomB, x: 0, y: 182, w: 46.5, h: 54.5, kind: 'left', in: 1350 },
  { src: budA, x: 18, y: 161, w: 27, h: 25, kind: 'left', in: 1450 },
  { src: budB, x: 25, y: 166, w: 27, h: 28, kind: 'left', in: 1550 },
  { src: budC, x: 339, y: 125, w: 27, h: 28, kind: 'right', in: 1100 },
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

/*
 * Cell centres read off the bitmap's own ink: the four digits and the four labels
 * agree on them to within 0.25px, and the spacing is NOT uniform (75.5, 74.1, 76.0),
 * so these are measured rather than derived from the ticket's width.
 */
const CELLS = [
  { key: 'days' as const, label: 'Days', cx: 87.5 },
  { key: 'hours' as const, label: 'Hours', cx: 163.0 },
  { key: 'minutes' as const, label: 'Minutes', cx: 237.13 },
  { key: 'seconds' as const, label: 'Seconds', cx: 313.13 },
]
const CELL_W = 74

const { el, shown } = useReveal()
const { acara, themeOverride, wedding } = useWedding()

function parseCustomDate(str: string): Date {
  const m = str.match(/(\d{1,2})\s*[/|-]\s*(\d{1,2})\s*[/|-]\s*(\d{4})(?:\s*[,|-]?\s*(\d{1,2})\s*[.:]\s*(\d{1,2}))?/)
  if (m) {
    const [_, d, mo, y, h, mi] = m
    return new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      h ? Number(h) : 0,
      mi ? Number(mi) : 0
    )
  }
  return new Date(str)
}

const target = computed(() => {
  const w = wedding.value as any
  const t = themeOverride.value as any
  
  const overrideDate = 
    t?.TanggalCountdown || 
    t?.words?.TanggalCountdown || 
    t?.countdown_date || 
    t?.words?.countdown_date ||
    w?.TanggalCountdown ||
    w?.countdown_date

  if (overrideDate) {
    const d = parseCustomDate(String(overrideDate))
    if (!Number.isNaN(d.getTime())) return d
  }
  const e = (acara.value as any[])[0]
  return e ? parseEventStart(e.event_date, e.event_time) : null
})

// The design ships 0 0 0 0, so an unconfigured render matches the reference.
const now = ref(Date.now())
const left = computed(() => remainingUntil(target.value, now.value))

/*
 * The tick starts on reveal, not on mount. This band is mounted for the whole
 * session -- the cover is what unmounts, InviteBody never does -- so a tick started
 * at setup would rewrite four cells every second forever, including while the guest
 * is thousands of pixels away and has never seen the clock. `shown` latches true
 * once and never goes back, so this fires at most once and needs no teardown of its
 * own beyond the unmount guard.
 *
 * `now` is seeded at setup regardless, so the first frame after reveal is already
 * correct rather than a second stale.
 */
let timer = 0
watch(
  shown,
  (on) => {
    if (!on || timer) return
    now.value = Date.now()
    timer = window.setInterval(() => (now.value = Date.now()), 1000)
  },
  { immediate: true },
)
onUnmounted(() => window.clearInterval(timer))

function cellStyle(cx: number) {
  return { left: `calc(${cx - CELL_W / 2} * var(--px))`, width: `calc(${CELL_W} * var(--px))` }
}
</script>

<template>
  <section :ref="el" class="countdown" :class="{ 'is-in': shown }" aria-labelledby="countdown-label">
    <img
      v-for="(l, i) in behind"
      :key="`b${i}`"
      :src="l.src"
      alt=""
      :style="box(l)"
      class="lyr"
      :class="`lyr--${l.kind}`"
    />

    <h2 id="countdown-label" class="countdown__sr">Menghitung hari menuju hari bahagia</h2>

    <!--
      One live region for the whole clock, polite and updating on the minute's worth
      of change only in spirit -- a per-second announcement would be unusable, so the
      seconds cell is aria-hidden and the region carries the coarse remainder.
    -->
    <p class="countdown__sr" aria-live="polite">
      {{ left.days }} hari {{ left.hours }} jam {{ left.minutes }} menit lagi
    </p>

    <div
      v-for="c in CELLS"
      :key="c.key"
      class="countdown__cell"
      :style="cellStyle(c.cx)"
      aria-hidden="true"
    >
      <span class="countdown__value">{{ left[c.key] }}</span>
      <span class="countdown__label">{{ c.label }}</span>
    </div>

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
/* 366 = to the gift group's own top at y 5485; the art stops at 5400. */
.countdown {
  position: relative;
  height: calc(366 * var(--px));
  overflow: visible;
}

.countdown > * {
  position: absolute;
  margin: 0;
}

.lyr {
  pointer-events: none;
}

.countdown__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/*
 * The four cells. `top` values are measured, not derived: the bitmap puts the digit
 * ink at band y 128.5-148.5 and the labels' cap top at 159.5 on a 169.0 baseline,
 * and these are the box positions that land the browser's ink there.
 */
/*
 * The digit and the label are positioned independently, NOT stacked in a flex
 * column. Stacked, the digit's line box sets where the label starts, so retuning the
 * digit size silently moves every label -- which is exactly what made an early
 * font sweep rank the same label config three points apart depending on the digit
 * size it happened to be paired with.
 */
.countdown__cell {
  top: 0;
  height: calc(200 * var(--px));
  /* #875e16, sampled from the darkest 5% of the bitmap's opaque pixels. */
  color: #875e16;
}

.countdown__cell > span {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
}

/*
 * Type recovered from the bitmap, since there is no TEXT node to read it off.
 *
 * Digits: EB Garamond, and this one is not close -- it is the only candidate whose
 * "0" has the bitmap's aspect (0.636 against 0.634) and it beat every other family
 * on the diff regardless of which label font it was paired with.
 *
 * Labels: Poltawski Nowy at the (size, tracking) its least-squares fit against the
 * four measured ink widths gives. Every candidate set "Minutes" ~6% wide at the
 * bitmap's cap height, which is tracking, not the wrong family -- so each family was
 * fitted for size AND tracking together and only then compared. Poltawski (5.885)
 * and Cormorant Garamond (5.766) are a statistical tie: the same family swings
 * 5.8-9.6 across small parameter changes, so 0.12 is noise. Poltawski wins the tie
 * because @fontsource ships it at 400, which is the weight this needs, while
 * Cormorant is only imported at 700 and would render synthetically. 31.4 vs 31.8 on
 * the digits is the same kind of tie; 31.8 is what the ink-height fit predicts.
 */
.countdown__value {
  display: block;
  font-family: var(--font-serif);
  top: calc(121.25 * var(--px));
  font-size: calc(31.4 * var(--px));
  line-height: calc(31.4 * var(--px));
  font-variant-numeric: lining-nums;
}

.countdown__label {
  display: block;
  top: calc(158.5 * var(--px));
  font-family: var(--font-guest);
  font-size: calc(12.52 * var(--px));
  line-height: calc(12.52 * var(--px));
  letter-spacing: calc(-0.235 * var(--px));
}

/*
 * Reveal: the tray settles, the ticket slides out of it, then the florals sweep in
 * from the side each one sits on. The digits fade last so the clock reads as
 * starting. Longest chain settles at 1550 + 1900 = 3.45s.
 */
.countdown .lyr,
.countdown__cell {
  opacity: 0;
  transition:
    opacity 1400ms ease-out var(--in, 0ms),
    transform 1900ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.countdown.is-in .lyr,
.countdown.is-in .countdown__cell {
  opacity: 1;
  transform: none;
}

.lyr--tray {
  transform: translateY(calc(26 * var(--px))) scale(0.94);
}

.lyr--ticket {
  transform: translateY(calc(18 * var(--px))) scale(0.96);
}

.lyr--left {
  transform: translateX(calc(-22 * var(--px))) rotate(-6deg);
}

.lyr--right {
  transform: translateX(calc(22 * var(--px))) rotate(6deg);
}

.countdown__cell {
  --in: 1200ms;
  transform: translateY(calc(10 * var(--px)));
}

@media (prefers-reduced-motion: reduce) {
  .countdown .lyr,
  .countdown__cell {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
