// The portrait bands now draw ONE photo plate, sourced from the CMS `photo_url`, where
// they used to stack a bundled garden backdrop plus a transparent portrait cutout. That
// is invisible to the band diffs -- they render the fallback, which is a pixel merge of
// the very layers it replaced, so the bands look identical either way. What this checks
// is that the plate is actually wired to the API and that the name block reads real data
// instead of silently falling through to the design's own copy, which is how the
// `data.pengantin` / `data.content.pengantin` mismatch survived unnoticed.
//
//   pnpm dev & node scripts/check-plate.mjs [port]
import { chromium } from 'playwright'

const PORT = process.argv[2] || 5175
const URL = `http://localhost:${PORT}/`

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

const api = await fetch(`${URL}api/v1/service/menu/getHome/demo-envelop`).then((r) => r.json())
const rows = api?.data?.content?.pengantin ?? []
const expect = Object.fromEntries(rows.map((p) => [p.type, p]))
check(rows.length === 2, `payload has both pengantin rows (${rows.length})`)

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 375, height: 800 },
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
})
await page.goto(URL, { waitUntil: 'networkidle' })
await page.click('.opening__envelope')
await page.waitForTimeout(600)

// `plate` is also the reveal treatment for the inner frame, and the groom's leaf.
const PLATE_LAYERS = { groom: 3, bride: 2 }

for (const band of ['groom', 'bride']) {
  const want = expect[band]
  await page.locator(`.${band}`).scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  const plates = await page.locator(`.${band} .lyr--plate`).evaluateAll((els) =>
    els.map((e) => ({ src: e.getAttribute('src'), w: e.clientWidth, h: e.clientHeight })),
  )
  // One fewer than before: the separate garden backdrop is gone.
  check(plates.length === PLATE_LAYERS[band], `${band}: ${PLATE_LAYERS[band]} plate layers (${plates.length})`)
  check(plates[0]?.src === want?.photo_url, `${band}: plate src is the CMS photo_url`)

  // The plate must still fill its 360x409 box at the 375px design width.
  check(plates[0]?.w === 360 && plates[0]?.h === 409, `${band}: plate box 360x409 (${plates[0]?.w}x${plates[0]?.h})`)

  // Loaded, not a broken-image placeholder.
  const ok = await page.locator(`.${band} .lyr--plate`).first().evaluate((e) => e.naturalWidth > 0)
  check(ok, `${band}: plate image actually decoded`)

  const nick = (await page.locator(`.${band}__nickname`).innerText()).trim()
  const full = (await page.locator(`.${band}__name`).innerText()).trim()
  const parents = (await page.locator(`.${band}__parents`).innerText()).trim()
  check(nick === want?.nickname.trim(), `${band}: nickname from API ("${nick}")`)
  check(full === want?.name.trim(), `${band}: full name from API ("${full}")`)
  check(parents.includes(want?.child_of.trim()), `${band}: parent line from API ("${parents}")`)

  await page.locator(`.${band}`).screenshot({ path: `/tmp/band-${band}.png` })
}

/*
 * The not-yet-uploaded case. Collapsing the two layers into one means a wedding with no
 * photo would render a bare garden -- worse than what it replaced -- unless the bundled
 * merge stands in. Strip photo_url from the payload and confirm it does.
 */
const blank = await browser.newPage({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' })
await blank.route('**/getHome/**', async (route) => {
  const res = await route.fetch()
  const body = await res.json()
  for (const p of body?.data?.content?.pengantin ?? []) p.photo_url = null
  await route.fulfill({ response: res, body: JSON.stringify(body) })
})
await blank.goto(URL, { waitUntil: 'networkidle' })
await blank.click('.opening__envelope')
await blank.waitForTimeout(600)

for (const band of ['groom', 'bride']) {
  await blank.locator(`.${band}`).scrollIntoViewIfNeeded()
  await blank.waitForTimeout(400)
  const plate = blank.locator(`.${band} .lyr--plate`).first()
  const src = await plate.getAttribute('src')
  check(/plate-.*-merged/.test(src || ''), `${band}: no photo_url falls back to the bundled merge`)
  check(await plate.evaluate((e) => e.naturalWidth > 0), `${band}: fallback plate decoded`)
}

await browser.close()
console.log(fails.length ? `\n${fails.length} FAILED` : '\nall ok')
process.exit(fails.length ? 1 : 0)
