// The portrait bands' entrance order, which nothing else in this repo can see.
//
// Every other check and every band diff runs with `reducedMotion: 'reduce'`, and each
// band's reduced-motion block pins `opacity: 1`. So the reveal is invisible to all of
// them: the frame could arrive after the photo, or the band's opaque paper could fade
// in and show the photo plate's bare rectangle sitting on the sheet, and all 324
// assertions would still pass. That bare rectangle is exactly what the client flagged.
//
// It is also the failure mode CSS specificity produces silently: `.lyr--paper` is
// (0,1,0) and loses to `.bride .lyr` at (0,2,0), so the rule that keeps the paper
// opaque had no effect at all despite a comment asserting it did.
//
//   pnpm dev & node scripts/check-reveal.mjs [port]
import { chromium } from 'playwright'

const PORT = process.argv[2] || 5177
const URL = `http://localhost:${PORT}/`

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch()

/**
 * Scroll a band into view and sample every layer's opacity a few times while it
 * comes in. Returns one array of samples per class, in wall-clock order.
 */
async function trace(band, scrollTo, classes) {
  const page = await browser.newPage({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 1 })
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.click('.opening__envelope')
  await page.waitForTimeout(2200)
  await page.evaluate((y) => window.scrollTo(0, y), scrollTo)

  const samples = []
  for (const wait of [30, 200, 200, 300, 400]) {
    await page.waitForTimeout(wait)
    samples.push(
      await page.evaluate(
        ([b, cs]) =>
          cs.map((c) =>
            [...document.querySelectorAll(`.${b} .${c}`)].map((e) => +getComputedStyle(e).opacity),
          ),
        [band, classes],
      ),
    )
  }
  await page.close()
  return samples
}

for (const [band, y] of [
  ['groom', 1200],
  ['bride', 2000],
]) {
  // lyr--plate covers the frame AND the photo behind it, so read them positionally:
  // the arrays are in Figma z-order, and the photo is always the first plate. It used
  // to be two layers -- a garden backdrop with the portrait cutout over it -- but the
  // CMS serves one image with the background already in it, so there is one beat now.
  const s = await trace(band, y, ['lyr--paper', 'lyr--plate'])
  const paper = s.map((f) => f[0])
  const photo = s.map((f) => f[1][0])
  const frame = s.map((f) => f[1][1])

  check(
    paper.every((f) => f.every((v) => v === 1)),
    `[${band}] the band's own paper never fades in (got ${JSON.stringify(paper)})`,
  )
  // Strictly ahead at every sample: the frame must be readable before anything
  // lands inside its aperture, which is the whole point of the reordering.
  check(
    frame.every((v, i) => v >= photo[i]) && frame.at(-1) > photo.at(-1),
    `[${band}] the frame leads the photo plate (frame ${frame}, photo ${photo})`,
  )
  check(
    photo.at(-1) > 0,
    `[${band}] the photo plate does arrive (last ${photo.at(-1)})`,
  )
}

// And the whole thing must still land opaque, or the reorder has traded a layering
// artefact for a permanently half-faded band.
const page = await browser.newPage({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'networkidle' })
await page.click('.opening__envelope')
await page.waitForTimeout(2200)
for (const [band, y] of [
  ['groom', 1200],
  ['bride', 2000],
]) {
  await page.evaluate((t) => window.scrollTo(0, t), y)
  await page.waitForTimeout(3600)
  const min = await page.evaluate(
    (b) => Math.min(...[...document.querySelectorAll(`.${b} .lyr`)].map((e) => +getComputedStyle(e).opacity)),
    band,
  )
  check(min === 1, `[${band}] every layer settles fully opaque (min ${min})`)
}
await page.close()

await browser.close()
if (fails.length) {
  console.log(`\n${fails.length} failed`)
  process.exitCode = 1
}
