// The gallery band's pixel diff runs with an empty API, so the plate is all it
// scores -- the carousel itself would ship unexercised. This stubs getHome with a
// three-photo payload and asserts the parts the diff cannot see: that every overlay
// lands on its Figma slot rect, that a thumb drives the main photo, that prev/next
// wrap, and that the lightbox escapes `.sheet`'s clip.
//
//   pnpm dev & node scripts/check-gallery.mjs [port]
import { chromium } from 'playwright'

const PORT = process.argv[2] || 5177
const URL = `http://localhost:${PORT}/`
const PHOTOS = ['/p0.png', '/p1.png', '/p2.png']

// Figma slot rects, band-local (band top = frame y 3501). Same numbers as
// .figma-ref/bands/gallery.json.
const SLOTS = {
  '.gallery__main': { x: 34.05, y: 0, w: 307.59, h: 288.73 },
  '.gallery__nav--prev': { x: 13.39, y: 122.63, w: 40.39, h: 41.28 },
  '.gallery__nav--next': { x: 327.12, y: 122.63, w: 40.39, h: 41.28 },
}
const THUMB_XS = [43.49, 116.78, 190.07, 263.36]

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 375, height: 812 },
  reducedMotion: 'reduce',
})

// A 1x1 png per slot, so `src` is comparable without any network round trip.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
)
for (const p of PHOTOS) {
  await page.route(`**${p}`, (r) => r.fulfill({ contentType: 'image/png', body: PNG }))
}
await page.route('**/getHome/**', (r) =>
  r.fulfill({
    json: {
      success: true,
      data: {
        wedding: { title: 'Test' },
        pengantin: [],
        acara: [],
        gallery: PHOTOS.map((p, i) => ({ image_url: p, caption: `Foto ${i}` })),
      },
    },
  }),
)

await page.goto(URL, { waitUntil: 'networkidle' })
await page.click('.opening__envelope')
await page.waitForTimeout(2500)
await page.locator('.gallery').scrollIntoViewIfNeeded()
await page.waitForTimeout(600)

// --- geometry: every overlay on its Figma rect ---
const band = await page.locator('.gallery').boundingBox()
const px = (await page.locator('.sheet').boundingBox()).width / 375
// `:nth-of-type` would count every button in the band, so thumbs go through
// locator.nth() instead.
const targets = [
  ...Object.entries(SLOTS).map(([sel, rect]) => [sel, page.locator(sel), rect]),
  ...THUMB_XS.map((x, i) => [
    `thumb ${i + 1}`,
    page.locator('.gallery__thumb').nth(i),
    { x, y: 296.14, w: 68.82, h: 70.86 },
  ]),
]
for (const [label, locator, rect] of targets) {
  const box = await locator.boundingBox()
  const want = { x: band.x + rect.x * px, y: band.y + rect.y * px, w: rect.w * px, h: rect.h * px }
  const off = Math.max(
    Math.abs(box.x - want.x),
    Math.abs(box.y - want.y),
    Math.abs(box.width - want.w),
    Math.abs(box.height - want.h),
  )
  check(off < 1.5, `${label} on its slot rect (max off ${off.toFixed(2)}px)`)
}

// A box within 0.01px still says nothing about the rounded-corner AA. The stub is a
// flat colour, so any ring of the plate's baked stock couple leaking around a slot
// is unmistakable here -- this is the only look anyone gets at the band with photos.
await page.locator('.gallery').screenshot({ path: '.figma-tmp/gallery-live.png' })

// --- every photo opens the preview, and a thumb selects its own photo on the way ---
const mainSrc = () => page.locator('.gallery__main img').getAttribute('src')
const lbSrc = () => page.locator('.gl-lightbox__photo').getAttribute('src')
const escape = async () => {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
}
check((await mainSrc()).endsWith(PHOTOS[0]), 'main starts on the first photo')

await page.locator('.gallery__thumb').nth(2).click()
await page.waitForTimeout(300)
check((await lbSrc()).endsWith(PHOTOS[2]), 'thumb 3 previews photo 3')
await escape()
check((await mainSrc()).endsWith(PHOTOS[2]), 'thumb 3 also selects photo 3')
check(
  await page.locator('.gallery__thumb').nth(2).evaluate((n) => n === document.activeElement),
  'focus restored to the thumb that opened the preview',
)

// Slot 4 of 4 with 3 photos wraps back to photo 1 -- the design repeats a short set.
await page.locator('.gallery__thumb').nth(3).click()
await page.waitForTimeout(300)
check((await lbSrc()).endsWith(PHOTOS[0]), 'thumb 4 wraps to photo 1 with 3 photos')
await escape()

// --- prev/next browse without opening the preview, and wrap at both ends ---
await page.click('.gallery__nav--prev')
check((await mainSrc()).endsWith(PHOTOS[2]), 'prev from the first photo wraps to the last')
check((await page.locator('.gl-lightbox').count()) === 0, 'prev does not open the preview')
await page.click('.gallery__nav--next')
check((await mainSrc()).endsWith(PHOTOS[0]), 'next from the last photo wraps to the first')

// --- lightbox is teleported out of .sheet, so it is not clipped to the card ---
await page.click('.gallery__main')
await page.waitForTimeout(400)
const lb = await page.locator('.gl-lightbox').boundingBox()
const inSheet = (await page.locator('.sheet .gl-lightbox').count()) > 0
check(!inSheet, 'lightbox rendered outside .sheet')
check(
  await page.locator('.gl-lightbox__close').evaluate((n) => n === document.activeElement),
  'focus moves into the lightbox on open',
)
check(
  lb.width >= 375 && lb.height >= 812 - 1,
  `lightbox fills the viewport (${lb.width}x${lb.height})`,
)
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
check((await page.locator('.gl-lightbox').count()) === 0, 'Escape closes the lightbox')
check(
  (await page.evaluate(() => document.body.style.overflow)) === '',
  'body scroll unlocked on close',
)
check(
  await page.locator('.gallery__main').evaluate((n) => n === document.activeElement),
  'focus restored to the photo on close',
)

await page.close()

/*
 * Second pass: an empty gallery, which is what a local preview and every
 * unconfigured invitation actually renders. The slots have to fall back to the
 * design's own two shots, or there is nothing on the band to click.
 */
const bare = await browser.newPage({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' })
await bare.route('**/getHome/**', (r) =>
  r.fulfill({ json: { success: true, data: { wedding: {}, pengantin: [], acara: [], gallery: [] } } }),
)
await bare.goto(URL, { waitUntil: 'networkidle' })
await bare.click('.opening__envelope')
await bare.waitForTimeout(2500)
await bare.locator('.gallery').scrollIntoViewIfNeeded()
await bare.waitForTimeout(600)
check((await bare.locator('.gallery__thumb').count()) === 4, 'four thumbs render with no API photos')
check(
  (await bare.locator('.gallery__main img').getAttribute('src')).includes('photo-2'),
  'main falls back to the design’s full-length shot',
)
await bare.click('.gallery__main')
await bare.waitForTimeout(400)
check((await bare.locator('.gl-lightbox').count()) === 1, 'preview opens with no API photos')
await bare.close()

await browser.close()
if (fails.length) {
  console.log(`\n${fails.length} failed`)
  process.exitCode = 1
}
