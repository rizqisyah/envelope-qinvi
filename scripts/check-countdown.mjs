// The countdown's copy is the one thing in Frame 242 that the pixel diff can never
// score: the design bakes "0 Days 0 Hours 0 Minutes 0 Seconds" into a bitmap, so the
// reference render shows a stopped clock and a frozen build would match it perfectly.
// Everything that makes this a countdown rather than a picture is checked here.
//
// Time is pinned with page.clock so the day counts are deterministic -- asserting
// against a real `Date.now()` would make these expire.
//
//   pnpm dev & node scripts/check-countdown.mjs [port]
import { chromium } from 'playwright'

const PORT = process.argv[2] || 5177
const URL = `http://localhost:${PORT}/`

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch()

/** 2029-04-01 10:00 WIB, the instant every case below counts from. */
const T0 = new Date('2029-04-01T03:00:00.000Z')

async function read(acara, { tz = 'Asia/Jakarta', advanceMs = 0 } = {}) {
  const page = await browser.newPage({
    viewport: { width: 375, height: 812 },
    reducedMotion: 'reduce',
    timezoneId: tz,
  })
  // Start a minute BEFORE T0: the clock runs with real time while the page loads,
  // and pauseAt can only fast-forward, never rewind.
  await page.clock.install({ time: new Date(T0.getTime() - 60_000) })
  await page.route('**/getHome/**', (r) =>
    r.fulfill({ json: { success: true, data: { wedding: {}, pengantin: [], acara, gallery: [] } } }),
  )
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(2200)
  await page.locator('.countdown').scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  /*
   * install() lets the clock run with real time, so the seconds spent loading and
   * revealing would leak into the reading. Fast-forward to exactly T0 and stop there;
   * runFor is then the only thing that advances time.
   */
  await page.clock.pauseAt(T0)
  if (advanceMs) await page.clock.runFor(advanceMs)
  const cells = await page.locator('.countdown__cell').all()
  const out = []
  const sheet = await page.locator('.sheet').boundingBox()
  for (const c of cells) {
    const v = await c.locator('.countdown__value').innerText()
    const l = await c.locator('.countdown__label').innerText()
    const b = await c.boundingBox()
    out.push({ value: v.trim(), label: l.trim(), cx: b.x - sheet.x + b.width / 2 })
  }
  const live = (await page.locator('.countdown [aria-live]').innerText()).replace(/\s+/g, ' ').trim()
  await page.close()
  return { cells: out, live }
}

const vals = (r) => r.cells.map((c) => c.value).join(':')
const EVENT = { event_date: '2029-04-21', event_time: '10:00:00 - 12:00:00' }

// --- counts to acara[0]'s start: 2029-04-21 10:00 local is exactly 20 days out ---
const base = await read([EVENT])
check(base.cells.length === 4, `four cells render (got ${base.cells.length})`)
check(
  base.cells.map((c) => c.label).join(',') === 'Days,Hours,Minutes,Seconds',
  `labels read Days,Hours,Minutes,Seconds (got ${base.cells.map((c) => c.label).join(',')})`,
)
check(vals(base) === '20:0:0:0', `20 days out reads 20:0:0:0 (got ${vals(base)})`)

/*
 * The whole point of the band. A frozen clock renders identically to a ticking one in
 * any single screenshot, so the pixel diff cannot tell them apart -- only advancing
 * time and re-reading can.
 */
const ticked = await read([EVENT], { advanceMs: 1000 })
check(vals(ticked) === '19:23:59:59', `it actually ticks (after 1s: ${vals(ticked)})`)
const ticked5 = await read([EVENT], { advanceMs: 5000 })
check(vals(ticked5) === '19:23:59:55', `still ticking at 5s (${vals(ticked5)})`)

// --- a bare date means midnight local, so 2029-04-21 00:00 is 19d 14h out ---
const bare = await read([{ event_date: '2029-04-21' }])
check(vals(bare) === '19:14:0:0', `bare date anchors at local midnight (got ${vals(bare)})`)

/*
 * The same UTC-midnight trap formatEventDate has. From the same absolute instant, a
 * New York guest is 20d 1h from local midnight on the 21st; parsing the date as UTC
 * would put the target at 2029-04-20 20:00 EDT and read 19:21:0:0 instead.
 */
const west = await read([{ event_date: '2029-04-21' }], { tz: 'America/New_York' })
check(vals(west) === '20:1:0:0', `bare date holds west of UTC (got ${vals(west)})`)

// --- past and missing both clamp to the design's own 0 0 0 0 ---
const past = await read([{ event_date: '2020-01-01', event_time: '10:00:00' }])
check(vals(past) === '0:0:0:0', `a past date clamps to zero, never negative (got ${vals(past)})`)
const none = await read([])
check(vals(none) === '0:0:0:0', `no acara shows the design's own zeros (got ${vals(none)})`)

// --- it must read acara[0], not some other event ---
const two = await read([EVENT, { event_date: '2030-01-01', event_time: '10:00:00' }])
check(vals(two) === '20:0:0:0', `counts to acara[0], not a later event (got ${vals(two)})`)

/*
 * Cell centres, measured off the baked bitmap's own ink. The spacing is not uniform
 * (75.5, 74.1, 76.0), so these cannot be re-derived from the ticket's width if they
 * are ever lost -- and nothing else here would notice them drifting.
 */
const WANT_CX = [87.5, 163.0, 237.13, 313.13]
const off = Math.max(...base.cells.map((c, i) => Math.abs(c.cx - WANT_CX[i])))
check(off < 0.5, `cells centred where the bitmap's ink is (max off ${off.toFixed(2)}px)`)

// --- the screen-reader line must carry the real remainder, not the frozen zeros ---
check(
  base.live.includes('20 hari'),
  `the live region reports the real remainder (got "${base.live}")`,
)

// --- and the baked bitmap must not have crept back into the build ---
const page = await browser.newPage()
const asked = []
page.on('request', (r) => asked.push(r.url()))
await page.goto(URL, { waitUntil: 'networkidle' })
await page.click('.opening__envelope')
await page.waitForTimeout(3000)
await page.close()
check(
  !asked.some((u) => u.includes('2610-113')),
  'the baked countdown text (2610:113) is never fetched',
)

await browser.close()
if (fails.length) {
  console.log(`\n${fails.length} failed`)
  process.exitCode = 1
}
