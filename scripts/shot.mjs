// Visual check for the sliced screens: screenshots the running dev server at three
// viewports, then clicks the cover open. Compare .figma-tmp/web-*.png against the
// Figma reference render. Usage: pnpm dev & node scripts/shot.mjs [port]
import { chromium } from 'playwright'

const PORT = process.argv[2] || 5177
const URL = `http://localhost:${PORT}/?to=Ahmad%20%26%20Salma`
const OUT = '.figma-tmp'
const VIEWPORTS = [
  ['mobile', 375, 725], // the Figma frame itself
  ['phone812', 375, 812], // a real phone
  ['desktop', 1440, 900],
]

const browser = await chromium.launch()
const errors = []

// reducedMotion pins the entrance stagger and the hint's breathing loop to their
// end state, so these shots are deterministic *and* exercise the reduced-motion path.
for (const [name, width, height] of VIEWPORTS) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  })
  page.on('pageerror', (e) => errors.push(`[${name}] pageerror: ${e.message}`))
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}/web-${name}.png` })
  await page.close()
}

// One frame mid-stagger, to eyeball the entrance itself.
const motion = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 })
await motion.goto(URL, { waitUntil: 'networkidle' })
await motion.waitForTimeout(600)
await motion.screenshot({ path: `${OUT}/web-entrance.png` })
await motion.close()

// The cover's only job is to open the invitation — assert it actually does.
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 })
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.click('.opening__envelope')
await page.waitForTimeout(1200)
const opened = await page.locator('#invite').isVisible()
const coverGone = (await page.locator('.opening').count()) === 0
await page.screenshot({ path: `${OUT}/web-opened.png` })
await page.close()
await browser.close()

console.log(`invite visible after click: ${opened}`)
console.log(`cover removed after transition: ${coverGone}`)
if (errors.length) console.log(errors.join('\n'))
if (!opened) process.exitCode = 1
