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

// Frames mid-stagger, to eyeball the entrances themselves.
const motion = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 })
await motion.goto(URL, { waitUntil: 'networkidle' })
await motion.waitForTimeout(1100)
await motion.screenshot({ path: `${OUT}/web-entrance.png` })
await motion.click('.opening__envelope')
await motion.waitForTimeout(2200)
await motion.screenshot({ path: `${OUT}/web-hero-reveal.png` })
// The reduced-motion shots below force everything visible, so they can't tell us
// whether useReveal actually fired. This can.
const revealed = (await motion.locator('.hero.is-in').count()) === 1
await motion.close()

// The cover's only job is to open the invitation — assert it actually does.
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 })
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.click('.opening__envelope')
await page.waitForTimeout(3000)
const opened = await page.locator('#invite').isVisible()
const coverGone = (await page.locator('.opening').count()) === 0
await page.screenshot({ path: `${OUT}/web-opened.png` })
await page.close()

// The invitation sheet at exactly 375 CSS px wide, so it lines up 1:1 with the
// Figma frame render for a pixel diff. Reduced motion pins every reveal open.
const sheet = await browser.newPage({
  viewport: { width: 375, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
})
await sheet.goto(URL, { waitUntil: 'networkidle' })
await sheet.waitForTimeout(800)
await sheet.click('.opening__envelope')
await sheet.waitForTimeout(2500)
await sheet.locator('.hero').screenshot({ path: `${OUT}/web-hero.png` })
// Scroll the whole sheet past the viewport first: the reveals are viewport-gated
// and the fit-to-box pass needs each block to have been rendered at least once.
for (let y = 0; y < 4200; y += 400) {
  await sheet.evaluate((to) => window.scrollTo(0, to), y)
  await sheet.waitForTimeout(250)
}
await sheet.waitForTimeout(1500)
await sheet.evaluate(() => window.scrollTo(0, 0))
await sheet.waitForTimeout(400)
await sheet.locator('.sheet').screenshot({ path: `${OUT}/web-sheet.png` })
await sheet.close()
await browser.close()

console.log(`invite visible after click: ${opened}`)
console.log(`cover removed after transition: ${coverGone}`)
console.log(`hero reveal fired: ${revealed}`)
if (errors.length) console.log(errors.join('\n'))
if (!opened || !revealed) process.exitCode = 1
