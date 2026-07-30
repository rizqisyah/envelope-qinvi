// Find where a block of live text really belongs by sweeping one CSS declaration on
// the RUNNING page and scoring the finished pixels against the Figma render.
//
// Why not measure ink: a text row in this file always has artwork behind it -- the
// gift band's cards and florals, the RSVP band's olive arch and floral cascade. An ink
// measurement catches that artwork and reports a position that is off by a couple of
// px in whichever direction the background happens to pull. Sweeping the whole box
// includes the background in both terms, so it cancels.
//
//   pnpm dev & node scripts/sweep-text.mjs <selector> <prop> <from> <to> <y0> <y1> [x0] [x1]
//   python3 scripts/sweep-score.py
//
// Values are swept in design px and applied as calc(v * var(--px)), which is the unit
// every band positions in. Shots land in .figma-tmp/ alongside the frame render.
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const [sel, prop, from, to, y0, y1, x0 = 0, x1 = 375] = process.argv.slice(2)
if (!sel || !prop || from === undefined) {
  console.error('usage: node scripts/sweep-text.mjs <selector> <prop> <from> <to> <y0> <y1> [x0] [x1]')
  process.exit(1)
}
const PORT = process.env.PORT || 5177
const OUT = '.figma-tmp'

const browser = await chromium.launch()
// deviceScaleFactor 1 so the shot is 1:1 with the scale-1 frame render.
const page = await browser.newPage({
  viewport: { width: 375, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
})
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.click('.opening__envelope')
await page.waitForTimeout(2400)

// Every band is viewport-gated, so walk the whole sheet before shooting any of it.
const h = await page.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < h; y += 400) {
  await page.evaluate((t) => window.scrollTo(0, t), y)
  await page.waitForTimeout(100)
}
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(500)

const shots = []
for (let v = Number(from); v <= Number(to); v += 1) {
  await page.evaluate(
    ([s, p, val]) => {
      let tag = document.getElementById('sweep')
      if (!tag) {
        tag = document.createElement('style')
        tag.id = 'sweep'
        document.head.appendChild(tag)
      }
      tag.textContent = `${s} { ${p}: calc(${val} * var(--px)) !important; }`
    },
    [sel, prop, v],
  )
  await page.waitForTimeout(60)
  const file = `${OUT}/sweep-${v}.png`
  await page.locator('.sheet').screenshot({ path: file })
  shots.push([v, file])
}
await browser.close()
writeFileSync(`${OUT}/sweep.json`, JSON.stringify({ shots, box: [+x0, +y0, +x1, +y1] }))
console.log(`${shots.length} shots of ${sel} { ${prop} }, box ${x0},${y0}-${x1},${y1}`)
