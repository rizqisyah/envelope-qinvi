// The akad band's pixel diff runs against the design's own fallback copy, so it
// cannot see whether the API's fields reach the card or how they are formatted.
// This stubs `acara` and asserts the rendered strings, including the two formatter
// edge cases the design never exercises: an open-ended time range, and a bare
// YYYY-MM-DD date, which is parsed as UTC midnight and reads as the day before
// anywhere west of Greenwich unless it is built as a local date.
//
//   pnpm dev & node scripts/check-akad.mjs [port]
import { chromium } from 'playwright'

const PORT = process.argv[2] || 5177
const URL = `http://localhost:${PORT}/`

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch()

async function render(acara, tz = 'Asia/Jakarta') {
  const page = await browser.newPage({
    viewport: { width: 375, height: 812 },
    reducedMotion: 'reduce',
    timezoneId: tz,
  })
  await page.route('**/getHome/**', (r) =>
    r.fulfill({ json: { success: true, data: { wedding: {}, pengantin: [], acara, gallery: [] } } }),
  )
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(2200)
  await page.locator('.akad').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  const text = async (sel) => (await page.locator(sel).innerText()).replace(/\s+/g, ' ').trim()
  const out = {
    date: await text('.akad__date'),
    time: await text('.akad__time'),
    venue: await text('.akad__venue'),
    address: await text('.akad__address'),
    href: await page.locator('.akad__maps').getAttribute('href'),
    addressOverflow: await page
      .locator('.akad__address')
      .evaluate((n) => n.scrollHeight - n.clientHeight),
    isLink: (await page.locator('a.akad__maps').count()) === 1,
  }
  await page.close()
  return out
}

/*
 * 2029-04-21 is a real Saturday. Frame 242's own copy reads "Saturday, 19 April
 * 2029", which is a Thursday -- the design's mock data does not agree with itself,
 * so the fallback strings below are asserted literally, not derived.
 */
const live = await render([
  {
    event_date: '2029-04-21',
    event_time: '08:00:00 - 10:00:00',
    location_name: 'Masjid Al-Azhar',
    address: 'Jl. Sisingamangaraja, Kebayoran Baru, Jakarta Selatan',
    maps_url: 'https://maps.example/akad',
  },
])
check(live.date === 'Saturday, 21 April 2029', `date renders weekday + date (got "${live.date}")`)
check(live.time === '08.00 WIB - 10.00 WIB', `time range formatted (got "${live.time}")`)
check(live.venue === 'Masjid Al-Azhar', 'venue comes from location_name')
check(live.address.startsWith('Jl. Sisingamangaraja'), 'address comes from the API')
check(live.isLink && live.href === 'https://maps.example/akad', 'Maps is a real link to maps_url')

// --- a bare date must not slip a day west of UTC (it would read Friday 20 April) ---
const west = await render([{ event_date: '2029-04-21', event_time: '08:00 - 10:00' }], 'America/New_York')
check(west.date === 'Saturday, 21 April 2029', `date holds west of UTC (got "${west.date}")`)

/*
 * The address box is exactly the design's three lines with no slack, and the API's
 * addresses run longer than the one Frame 242 was drawn with. useFitText has to keep
 * it inside the card -- and it only can because the leading scales with the type.
 */
const long = await render([
  {
    event_date: '2029-04-21',
    address:
      'Gedung Serba Guna Balai Kartini Lantai 3, Jl. Jenderal Gatot Subroto Kaveling 37, RT 006 / RW 002, Kelurahan Kuningan Timur, Kecamatan Setiabudi, Jakarta Selatan, DKI Jakarta 12950',
  },
])
check(long.addressOverflow <= 1, `a 180-char address stays in its box (overflow ${long.addressOverflow}px)`)
check(live.addressOverflow <= 1, `the design's own address stays in its box (overflow ${live.addressOverflow}px)`)

// --- an end of 23:59 is how the API says "no end time" ---
const open = await render([{ event_date: '2029-04-21', event_time: '19:00 - 23:59' }])
check(open.time === '19.00 WIB - Selesai', `open-ended range (got "${open.time}")`)

// --- with no acara the card shows the copy Frame 242 was drawn with ---
const bare = await render([])
check(bare.date === 'Saturday, 19 April 2029', `fallback date (got "${bare.date}")`)
check(bare.time === '10.00 WIB - 12.00 WIB', `fallback time (got "${bare.time}")`)
check(bare.venue === 'Rumah mempelai wanita', 'fallback venue')
check(bare.address.startsWith('Jl. Melati Raya No. 27'), 'fallback address')
check(!bare.isLink, 'no maps_url leaves the button inert rather than a dead link')

await browser.close()
if (fails.length) {
  console.log(`\n${fails.length} failed`)
  process.exitCode = 1
}
