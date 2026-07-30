// Shoot the whole invitation sheet at exactly 375 CSS px and deviceScaleFactor 1, so
// it lines up 1:1 with the scale-1 Figma frame render and needs no resampling.
//
// scripts/shot.mjs also writes a sheet shot, but at deviceScaleFactor 2 for eyeballing.
// Downscaling that 750-wide image to 375 softens every glyph and inflates a band's
// score by 20-40% -- the RSVP band reads 1.54 that way against its true 1.12. Use this
// one for any number that goes into a band record.
//
//   pnpm dev & node scripts/sheet-shot.mjs [port]
//   python3 scripts/band-diff.py <y0> <y1>
import { chromium } from 'playwright'

const PORT = process.argv[2] || 5177
const OUT = '.figma-tmp/web-sheet-1x.png'

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 375, height: 900 },
  deviceScaleFactor: 1,
  // Pins every reveal open, so the shot is deterministic. It also hides a missing fade
  // -- that is what the per-band checks' no-preference pass is for.
  reducedMotion: 'reduce',
})
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.click('.opening__envelope')
await page.waitForTimeout(2400)

// Every band below the fold is viewport-gated, so walk the sheet before shooting it.
const h = await page.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < h; y += 400) {
  await page.evaluate((t) => window.scrollTo(0, t), y)
  await page.waitForTimeout(120)
}
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(600)

// Report the sheet height: it should equal the sum of the built bands' heights, and a
// mismatch means some band's `height` is wrong even if the band itself diffs clean.
const box = await page.locator('.sheet').boundingBox()
console.log(`sheet ${box.width} x ${box.height}`)
await page.locator('.sheet').screenshot({ path: OUT })
await browser.close()
console.log(`wrote ${OUT}`)
