// Screenshots the divider's "And" twice, once as rendered and once with the word
// hidden, so scripts/fit-and.py can subtract the artwork and measure the glyph ink
// on its own. Figma's node box says nothing useful here: the type is 96px in a
// 40px-tall auto box, so the glyphs overhang it on every side, and Pinyon Script
// sets much wider in the browser than the file's own bounds imply.
//     node scripts/fit-and.mjs [port]
import { chromium } from 'playwright'

const PORT = process.argv[2] || 5177
const OUT = '.figma-tmp'
const CLIP = { x: 40, y: 1930, width: 320, height: 200 } // frame coordinates

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 900 }, reducedMotion: 'reduce' })
await page.goto(`http://localhost:${PORT}/?to=A`, { waitUntil: 'networkidle' })
await page.click('.opening__envelope')
await page.waitForTimeout(2500)
await page.evaluate(() => window.scrollTo(0, 1800))
await page.waitForTimeout(400)

// The clip is in page coordinates; CLIP is in the frame's.
const sheet = await page.evaluate(() => {
  const r = document.querySelector('.sheet').getBoundingClientRect()
  return { top: r.top + window.scrollY, left: r.left + window.scrollX }
})
const clip = { ...CLIP, x: CLIP.x + sheet.left, y: CLIP.y + sheet.top }

await page.screenshot({ path: `${OUT}/and-on.png`, clip, fullPage: true })
await page.evaluate(() => {
  document.querySelector('.divider__and').style.visibility = 'hidden'
})
await page.screenshot({ path: `${OUT}/and-off.png`, clip, fullPage: true })

const metrics = await page.evaluate(() => {
  const el = document.querySelector('.divider__and')
  const cs = getComputedStyle(el)
  return { fontSize: parseFloat(cs.fontSize), top: el.getBoundingClientRect().top + window.scrollY }
})
await browser.close()
console.log(JSON.stringify({ clip: CLIP, ...metrics }))
