import { computed, ref } from 'vue'
import { formatName } from '../lib/format'
import { useWedding } from './useWedding'

/*
 * One font scale for BOTH full names, so the groom and bride blocks set their names at
 * the same size. Each name stays on one line: in the groom band there is only ~99px
 * between the ornament and the divider's pearls, and a wrapped name plus the stacked
 * "dari / Bapak / & Ibu" parents is ~126px -- which used to either collide with the
 * pearls or shrink the whole block until it was too small to read. One line of name
 * leaves the parents at their full size.
 *
 * Measured on a canvas, so it works while the bands sit behind the cover with no box.
 */
const NAME_PX = 20 // .groom__name / .bride__name at --name-fit 1
const LETTER_SPACING = 0.02 // em, as in the CSS
const BOX = 315 // design px: the 321px bio column, less slack for canvas-vs-DOM rounding
const MIN_SCALE = 0.6

const fontTick = ref(0)
const requested = new Set<string>()
let ctx: CanvasRenderingContext2D | null = null

function fontSpec(): string {
  const family =
    getComputedStyle(document.documentElement).getPropertyValue('--font-name').trim() ||
    '"Playfair", serif'
  return `600 ${NAME_PX}px ${family}`
}

function measure(text: string): number {
  if (!text) return 0
  ctx ??= document.createElement('canvas').getContext('2d')
  if (!ctx) return 0
  const spec = fontSpec()
  // The name face may not be loaded yet (it is only used behind the cover), and the
  // fallback's widths would stick. Ask for it and measure again once it lands.
  if (!requested.has(spec)) {
    requested.add(spec)
    document.fonts?.load(spec).then(() => fontTick.value++).catch(() => {})
  }
  ctx.font = spec
  return ctx.measureText(text).width + LETTER_SPACING * NAME_PX * text.length
}

export function useNameFit() {
  const { groom, bride, theme, themeOverride } = useWedding()
  return computed(() => {
    // Re-measure when a font arrives or the theme swaps the name face.
    void fontTick.value
    void theme.value
    void themeOverride.value
    const widest = Math.max(measure(formatName(groom.value?.name)), measure(formatName(bride.value?.name)))
    return widest > BOX ? Math.max(MIN_SCALE, BOX / widest) : 1
  })
}
