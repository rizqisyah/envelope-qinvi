// The akad and resepsi bands are the same card twice, so they get one check.
// Their pixel diff runs against the design's own fallback copy and cannot see
// whether the API's fields reach the card, how they are formatted, or -- because
// both headings are hidden in Figma and in neither the export nor the reference
// render -- whether the headings are placed at all. This covers all three, plus
// the two formatter edge cases the design never exercises: an open-ended time
// range, and a bare YYYY-MM-DD date, which is parsed as UTC midnight and reads as
// the day before anywhere west of Greenwich unless it is built as a local date.
//
//   pnpm dev & node scripts/check-ceremony.mjs [port]
import { chromium } from 'playwright'

const PORT = process.argv[2] || 5177
const URL = `http://localhost:${PORT}/`

/*
 * Heading boxes are layout AABBs, not ink: `boundingBox()` includes the line box
 * and both side bearings, so they are wider and taller than the ink each placement
 * was measured from. Akad's was captured from the state whose *ink* was verified
 * against the design screenshot to under a pixel, through two independent
 * registrations (envelope apex, then paper edges) -- see SLICING.md.
 *
 * Resepsi's is not an independent measurement and does not pretend to be. Its two
 * Figma nodes sit exactly (-0.05, +594.85) from akad's, so its three translatable
 * anchors are akad's plus that offset, and all three land within 0.01px. `x1` is
 * larger only because "Resepsi Nikah" is a longer string than "Akad Nikah".
 */
const BANDS = [
  {
    name: 'akad',
    index: 0,
    line2: 'Akad Nikah',
    want: { x0: 24.9, y0: 3937.1, x1: 281.3, y1: 4042.9 },
  },
  {
    name: 'resepsi',
    index: 1,
    line2: 'Resepsi Nikah',
    want: { x0: 24.88, y0: 4531.93, x1: 306.76, y1: 4637.79 },
  },
]

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch()

/*
 * `events` is what this band should show. It is padded out to the band's own index
 * so akad reads acara[0] and resepsi acara[1] -- which also proves the two cards do
 * not read each other's event.
 */
async function render(band, events, tz = 'Asia/Jakarta', motion = 'reduce') {
  const acara = [...Array.from({ length: band.index }, () => ({})), ...events]
  const page = await browser.newPage({
    viewport: { width: 375, height: 812 },
    reducedMotion: motion,
    timezoneId: tz,
  })
  await page.route('**/getHome/**', (r) =>
    r.fulfill({ json: { success: true, data: { wedding: {}, pengantin: [], acara, gallery: [] } } }),
  )
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(2200)
  await page.locator(`.${band.name}`).scrollIntoViewIfNeeded()
  // Each heading's own chain is 250ms delay + a 1400ms fade, so with motion on the
  // reveal has to be allowed to finish before opacity means anything.
  await page.waitForTimeout(motion === 'reduce' ? 500 : 4200)
  const text = async (sel) => (await page.locator(sel).innerText()).replace(/\s+/g, ' ').trim()
  const sheet = await page.locator('.sheet').boundingBox()
  const heads = []
  for (const h of await page.locator(`.${band.name} .band__heading span`).all()) {
    const b = await h.boundingBox()
    heads.push({ x: b.x - sheet.x, y: b.y - sheet.y, w: b.width, h: b.height })
  }
  const out = {
    heads,
    line2: await text(`.${band.name} .band__heading-b`),
    opacity: await page
      .locator(`.${band.name} .band__heading span`)
      .first()
      .evaluate((n) => getComputedStyle(n).opacity),
    date: await text(`.${band.name} .band__date`),
    time: await text(`.${band.name} .band__time`),
    venue: await text(`.${band.name} .band__venue`),
    address: await text(`.${band.name} .band__address`),
    href: await page.locator(`.${band.name} .band__maps`).getAttribute('href'),
    addressOverflow: await page
      .locator(`.${band.name} .band__address`)
      .evaluate((n) => n.scrollHeight - n.clientHeight),
    isLink: (await page.locator(`.${band.name} a.band__maps`).count()) === 1,
  }
  await page.close()
  return out
}

for (const band of BANDS) {
  console.log(`\n--- ${band.name} ---`)

  /*
   * 2029-04-21 is a real Saturday. Frame 242's own copy reads "Saturday, 19 April
   * 2029", which is a Thursday -- the design's mock data does not agree with itself,
   * so the fallback strings below are asserted literally, not derived.
   */
  const live = await render(band, [
    {
      event_date: '2029-04-21',
      event_time: '08:00:00 - 10:00:00',
      location_name: `Masjid Al-Azhar (${band.name})`,
      address: 'Jl. Sisingamangaraja, Kebayoran Baru, Jakarta Selatan',
      maps_url: `https://maps.example/${band.name}`,
    },
  ])
  check(live.date === 'Saturday, 21 April 2029', `date renders weekday + date (got "${live.date}")`)
  check(live.time === '08.00 WIB - 10.00 WIB', `time range formatted (got "${live.time}")`)
  check(live.venue === `Masjid Al-Azhar (${band.name})`, `venue comes from acara[${band.index}]`)
  check(live.address.startsWith('Jl. Sisingamangaraja'), 'address comes from the API')
  check(
    live.isLink && live.href === `https://maps.example/${band.name}`,
    'Maps is a real link to maps_url',
  )

  // --- a bare date must not slip a day west of UTC (it would read Friday 20 April) ---
  const west = await render(
    band,
    [{ event_date: '2029-04-21', event_time: '08:00 - 10:00' }],
    'America/New_York',
  )
  check(west.date === 'Saturday, 21 April 2029', `date holds west of UTC (got "${west.date}")`)

  /*
   * The address box is exactly the design's three lines with no slack, and the API's
   * addresses run longer than the one Frame 242 was drawn with. useFitText has to keep
   * it inside the card -- and it only can because the leading scales with the type.
   */
  const long = await render(band, [
    {
      event_date: '2029-04-21',
      address:
        'Gedung Serba Guna Balai Kartini Lantai 3, Jl. Jenderal Gatot Subroto Kaveling 37, RT 006 / RW 002, Kelurahan Kuningan Timur, Kecamatan Setiabudi, Jakarta Selatan, DKI Jakarta 12950',
    },
  ])
  check(
    long.addressOverflow <= 1,
    `a 180-char address stays in its box (overflow ${long.addressOverflow}px)`,
  )
  check(
    live.addressOverflow <= 1,
    `the design's own address stays in its box (overflow ${live.addressOverflow}px)`,
  )

  // --- an end of 23:59 is how the API says "no end time" ---
  const open = await render(band, [{ event_date: '2029-04-21', event_time: '19:00 - 23:59' }])
  check(open.time === '19.00 WIB - Selesai', `open-ended range (got "${open.time}")`)

  // --- the heading, which the pixel diff cannot score at all ---
  check(live.heads.length === 2, `both heading lines render (got ${live.heads.length})`)
  check(live.line2 === band.line2, `second line reads "${band.line2}" (got "${live.line2}")`)
  const block = {
    x0: Math.min(...live.heads.map((h) => h.x)),
    y0: Math.min(...live.heads.map((h) => h.y)),
    x1: Math.max(...live.heads.map((h) => h.x + h.w)),
    y1: Math.max(...live.heads.map((h) => h.y + h.h)),
  }
  // The rotation has to survive the reveal's end state, so a flattened heading
  // shows up here as a box of the wrong shape.
  const off = Math.max(...Object.keys(band.want).map((k) => Math.abs(block[k] - band.want[k])))
  check(off < 2, `heading block where its ink was verified (max off ${off.toFixed(1)}px)`)

  /*
   * Every other assertion here runs under reduced motion, where the media query forces
   * everything visible -- so a band element left out of the `.is-in` fade is invisible
   * in the real thing and passes every check. That is exactly what happened to the akad
   * heading once. One pass with motion on, after the reveal has run, is the guard.
   */
  const motion = await render(band, [], 'Asia/Jakarta', 'no-preference')
  check(motion.opacity === '1', `heading fades in with motion on (opacity ${motion.opacity})`)
  check(
    motion.heads.length === 2 && motion.heads.every((h) => h.w > 100),
    'heading keeps its rotated box with motion on',
  )

  // --- with no acara the card shows the copy Frame 242 was drawn with ---
  const bare = await render(band, [])
  check(bare.date === 'Saturday, 19 April 2029', `fallback date (got "${bare.date}")`)
  check(bare.time === '10.00 WIB - 12.00 WIB', `fallback time (got "${bare.time}")`)
  check(bare.venue === 'Rumah mempelai wanita', 'fallback venue')
  check(bare.address.startsWith('Jl. Melati Raya No. 27'), 'fallback address')
  check(!bare.isLink, 'no maps_url leaves the button inert rather than a dead link')
}

/*
 * The two cards must not read the same event. With two distinct events configured,
 * each band's venue has to be its own -- a positional off-by-one would silently show
 * the akad ceremony under the Resepsi heading.
 */
console.log('\n--- both cards at once ---')
const two = [
  { event_date: '2029-04-21', location_name: 'Masjid Al-Azhar' },
  { event_date: '2029-04-22', location_name: 'Balai Kartini' },
]
const pair = await Promise.all(BANDS.map((b) => render({ ...b, index: 0 }, two)))
check(pair[0].venue === 'Masjid Al-Azhar', `akad shows acara[0] (got "${pair[0].venue}")`)
check(pair[1].venue === 'Balai Kartini', `resepsi shows acara[1] (got "${pair[1].venue}")`)
check(pair[0].date === 'Saturday, 21 April 2029', `akad date (got "${pair[0].date}")`)
check(pair[1].date === 'Sunday, 22 April 2029', `resepsi date (got "${pair[1].date}")`)

await browser.close()
if (fails.length) {
  console.log(`\n${fails.length} failed`)
  process.exitCode = 1
}
