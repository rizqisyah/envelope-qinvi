// Measures where a live text node's glyphs actually land, by screenshotting the
// page twice -- once as rendered, once with that node hidden -- so the artwork can
// be subtracted and the ink measured on its own.
//
// Needed because Figma's numbers do not survive the trip: a node auto-sized to its
// own text says nothing about where the glyphs sit, and the browser sets these
// faces wider than Figma measures them (Pinyon Script by ~14%).
//
//     node scripts/fit-text.mjs <port> <selector> <x> <y> <w> <h>
//
// x/y/w/h are the clip window in frame coordinates. Writes .figma-tmp/ink-on.png
// and ink-off.png; scripts/ink.py turns those into a bounding box.
import { chromium } from 'playwright'

const [port = '5177', selector = '.divider__and', cx = '40', cy = '1930', cw = '320', ch = '200'] =
  process.argv.slice(2)
const OUT = '.figma-tmp'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 900 }, reducedMotion: 'reduce' })
await page.goto(`http://localhost:${port}/?to=A`, { waitUntil: 'networkidle' })
await page.click('.opening__envelope')
await page.waitForTimeout(2500)
await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, Number(cy) - 400))
await page.waitForTimeout(500)

// The clip is in page coordinates; the arguments are in the frame's.
const sheet = await page.evaluate(() => {
  const r = document.querySelector('.sheet').getBoundingClientRect()
  return { top: r.top + window.scrollY, left: r.left + window.scrollX }
})
const clip = {
  x: Number(cx) + sheet.left,
  y: Number(cy) + sheet.top,
  width: Number(cw),
  height: Number(ch),
}

await page.screenshot({ path: `${OUT}/ink-on.png`, clip, fullPage: true })
const found = await page.evaluate((sel) => {
  const el = document.querySelector(sel)
  if (!el) return null
  el.style.visibility = 'hidden'
  const cs = getComputedStyle(el)
  return { fontSize: parseFloat(cs.fontSize), lineHeight: cs.lineHeight }
}, selector)
if (!found) throw new Error(`no element matches ${selector}`)
await page.screenshot({ path: `${OUT}/ink-off.png`, clip, fullPage: true })
await browser.close()

console.log(JSON.stringify({ selector, clip: { x: Number(cx), y: Number(cy) }, ...found }))
