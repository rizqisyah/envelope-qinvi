// The wish band's pixel diff is blind to almost everything that matters here. Its
// fallback is the design's own four cards, so an empty live list scores PERFECTLY --
// which is exactly what a wrong API key produces. That was real: useWedding read
// `data.wishes` where the API sends `data.ucapan`, and nothing but a mock that sends
// the right key can catch it.
//
//   pnpm dev & node scripts/check-wish.mjs [port]
import { chromium, webkit } from 'playwright'

const PORT = process.argv[2] || 5177
const ORIGIN = `http://localhost:${PORT}`

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch()

async function open({ home = {}, post = 'ok', motion = 'reduce', engine } = {}) {
  const ctx = await (engine || browser).newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: motion,
  })
  const page = await ctx.newPage()
  const posts = []
  await page.route('**/getHome/**', (r) =>
    r.fulfill({
      json: {
        success: true,
        data: { wedding: {}, pengantin: [], acara: [], gallery: [], ...home },
      },
    }),
  )
  await page.route('**/ucapan/**', (r) => {
    posts.push({ url: r.request().url(), method: r.request().method(), body: r.request().postDataJSON() })
    if (post === 'http500') return r.fulfill({ status: 500, json: { message: 'Server sedang sibuk' } })
    if (post === 'soft-fail') return r.fulfill({ json: { success: false, message: 'Ucapan ditolak' } })
    if (post === 'list')
      return r.fulfill({
        json: {
          success: true,
          data: [
            { id: 9, guest_name: 'Dari Server', message: 'Balasan penuh', created_at: null },
            { id: 8, guest_name: 'Lama', message: 'Sudah ada', created_at: null },
          ],
        },
      })
    if (post === 'bare') return r.fulfill({ json: { success: true } })
    return r.fulfill({ json: { success: true, data: { id: 7, guest_name: 'Baru', message: 'Dari API' } } })
  })
  await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(2300)
  await page.locator('.wish').scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  return { ctx, page, posts }
}

const rows = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('.wish__card')].map((c) => ({
      name: c.querySelector('.wish__name').innerText.trim(),
      time: c.querySelector('.wish__time').innerText.trim(),
      message: c.querySelector('.wish__message').innerText.trim(),
      h: c.getBoundingClientRect().height,
    })),
  )

const fill = async (page, name, message) => {
  await page.fill('#wish-name', name)
  await page.fill('#wish-message', message)
}

// --- the API key. This is the assertion that would have caught `wishes` vs `ucapan` ---
{
  const { ctx, page } = await open({
    home: { ucapan: [{ id: 1, guest_name: 'Rina', message: 'Selamat ya!', created_at: null }] },
  })
  const r = await rows(page)
  check(
    r.length === 1 && r[0].name === 'Rina',
    `the list reads the API's \`ucapan\` key (got ${JSON.stringify(r.map((x) => x.name))})`,
  )
  await ctx.close()
}

// --- with nothing configured it must be the design's four cards, verbatim ---
{
  const { ctx, page } = await open()
  const r = await rows(page)
  check(
    r.map((x) => x.name).join(',') === 'Anggun,Amri,Amanda,Gilang',
    `fallback is the design's four cards (got ${r.map((x) => x.name)})`,
  )
  /*
   * Card height is 72 + lines*18, so these four numbers ARE the design's line counts
   * (4/2/1/1). If the browser's emoji font wrapped card 1 to five lines the whole stack
   * below it would move, and the panel geometry with it -- this is the guard for that.
   */
  check(
    r.map((x) => x.h).join(',') === '144,108,90,90',
    `cards keep the design's heights 144/108/90/90 (got ${r.map((x) => x.h)})`,
  )
  check(
    r[0].message.includes('diberahi') && r[0].message.includes('kesehatan✨'),
    "card 1 keeps the design's own copy, typo and emoji spacing included",
  )
  check(r[0].time === '2 hari lalu' && r[1].time === '3 hari lalu', 'fallback times match the design')

  // The design's own cards total 432 in a 428 panel -- it clips the last one, and that
  // clipped edge is the affordance that there is more. A panel that grew instead would
  // move every band below it.
  const box = await page.locator('.wish__panel').boundingBox()
  const scrollH = await page.locator('.wish__panel').evaluate((n) => n.scrollHeight)
  check(Math.abs(box.height - 428) < 0.6, `panel is a fixed 428 tall (got ${box.height.toFixed(1)})`)
  check(scrollH === 432, `and it scrolls its 432 of cards (got ${scrollH})`)
  await ctx.close()
}

// --- a long list must not grow the band ---
{
  const many = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    guest_name: `Tamu ${i}`,
    message: 'Selamat menempuh hidup baru, semoga bahagia selalu bersama keluarga kecil kalian.',
    created_at: null,
  }))
  const { ctx, page } = await open({ home: { ucapan: many } })
  const box = await page.locator('.wish__panel').boundingBox()
  const sheet = await page.locator('.sheet').boundingBox()
  check(Math.abs(box.height - 428) < 0.6, `8 wishes keep the panel at 428 (got ${box.height.toFixed(1)})`)
  // 8749 is Frame 242's own height; see check-footer.mjs for why that number is the one
  // that validates every band above it.
  check(Math.abs(sheet.height - 8749) < 1, `and the sheet at 8749 (got ${sheet.height.toFixed(0)})`)
  await ctx.close()
}

// --- the payload, and the three response shapes the API can answer with ---
{
  const { ctx, page, posts } = await open({ home: { ucapan: [] } })
  await fill(page, '  Ahmad  ', '  Selamat!  ')
  await page.click('.wish__send')
  await page.waitForTimeout(400)
  check(posts.length === 1, `submitting posts once (got ${posts.length})`)
  check(
    (posts[0]?.url || '').includes('/v1/service/menu/ucapan/'),
    `it hits the ucapan endpoint (got ${posts[0]?.url})`,
  )
  check(
    JSON.stringify(posts[0]?.body) === JSON.stringify({ guest_name: 'Ahmad', message: 'Selamat!' }),
    `body is exactly { guest_name, message }, trimmed (got ${JSON.stringify(posts[0]?.body)})`,
  )
  const r = await rows(page)
  check(r[0]?.name === 'Baru', `a single created row is prepended (got ${r[0]?.name})`)
  check(
    (await page.inputValue('#wish-message')) === '',
    'the message box clears so the same wish is not sent twice',
  )
  await ctx.close()
}
{
  const { ctx, page } = await open({ home: { ucapan: [] }, post: 'list' })
  await fill(page, 'Ahmad', 'Selamat!')
  await page.click('.wish__send')
  await page.waitForTimeout(400)
  const r = await rows(page)
  check(
    r.map((x) => x.name).join(',') === 'Dari Server,Lama',
    `a full refreshed list replaces the old one (got ${r.map((x) => x.name)})`,
  )
  await ctx.close()
}
{
  // The API may acknowledge with no row at all; the wish still has to appear.
  const { ctx, page } = await open({ home: { ucapan: [] }, post: 'bare' })
  await fill(page, 'Ahmad', 'Selamat!')
  await page.click('.wish__send')
  await page.waitForTimeout(400)
  const r = await rows(page)
  check(
    r[0]?.name === 'Ahmad' && r[0]?.message === 'Selamat!',
    `a bodiless 200 still shows the wish locally (got ${JSON.stringify(r[0])})`,
  )
  check(r[0]?.time === 'baru saja', `and stamps it "baru saja" (got "${r[0]?.time}")`)
  await ctx.close()
}

// --- validation stops the request; it does not merely colour a field ---
{
  const { ctx, page, posts } = await open()
  await fill(page, '', 'Selamat!')
  await page.click('.wish__send')
  await page.waitForTimeout(300)
  check(posts.length === 0, `an empty name fires no request (got ${posts.length})`)
  await fill(page, 'Ahmad', '   ')
  await page.click('.wish__send')
  await page.waitForTimeout(300)
  check(posts.length === 0, `a blank message fires no request (got ${posts.length})`)
  check((await page.locator('.wish__error').count()) === 1, 'and an error is shown')
  await ctx.close()
}

// --- both failure shapes ---
for (const [mode, want] of [
  ['http500', 'Server sedang sibuk'],
  ['soft-fail', 'Ucapan ditolak'],
]) {
  const { ctx, page } = await open({ post: mode })
  await fill(page, 'Ahmad', 'Selamat!')
  await page.click('.wish__send')
  await page.waitForTimeout(500)
  const msg = (await page.locator('.wish__error').innerText().catch(() => '')).trim()
  check(msg === want, `${mode} surfaces the API's message (got "${msg}")`)
  check(!(await page.locator('.wish__send').isDisabled()), `${mode} re-enables the send button`)
  check(
    (await page.inputValue('#wish-message')) === 'Selamat!',
    `${mode} keeps the typed message so it can be retried`,
  )
  await ctx.close()
}

/*
 * Geometry, under both engines. The input and textarea are `border: 0` with a pinned
 * height and radius 10, which is the combination WebKit has its own opinion about, and
 * both are below the 16px threshold that makes mobile Safari zoom on focus.
 */
const GEOMETRY = [
  ['.wish__heading', 6811, 78, 238.5, null],
  ['.wish__body', 6883, 45, 302.71, null],
  ['.wish__label--name', 6948, 48, null, null],
  ['.wish__field--name', 6979, 48.22, 285.31, 36],
  ['.wish__label--message', 7035, 47, null, null],
  ['.wish__field--message', 7086, 47.18, 286.12, 84],
  ['.wish__panel', 7230, 42, 309.96, 428],
]

for (const [engineName, engine] of [
  ['chromium', browser],
  ['webkit', await webkit.launch()],
]) {
  const { ctx, page } = await open({ engine })
  const sheet = await page.locator('.sheet').boundingBox()
  for (const [sel, top, left, w, h] of GEOMETRY) {
    const b = await page.locator(sel).boundingBox()
    const got = { top: b.y - sheet.y, left: b.x - sheet.x, w: b.width, h: b.height }
    const bad = [
      Math.abs(got.top - top) > 0.6 ? `top ${got.top.toFixed(1)}!=${top}` : '',
      Math.abs(got.left - left) > 0.6 ? `left ${got.left.toFixed(1)}!=${left}` : '',
      w !== null && Math.abs(got.w - w) > 0.6 ? `w ${got.w.toFixed(1)}!=${w}` : '',
      h !== null && Math.abs(got.h - h) > 0.6 ? `h ${got.h.toFixed(1)}!=${h}` : '',
    ].filter(Boolean)
    check(bad.length === 0, `[${engineName}] ${sel} sits where Frame 242 draws it${bad.length ? ` (${bad})` : ''}`)
  }
  const fields = await page.evaluate(() =>
    [...document.querySelectorAll('.wish__field')].map((f) => ({
      size: parseFloat(getComputedStyle(f).fontSize),
      resize: getComputedStyle(f).resize,
      tag: f.tagName.toLowerCase(),
    })),
  )
  check(
    fields.every((f) => f.size >= 16),
    `[${engineName}] both fields are at least 16px, so focus does not zoom (got ${fields.map((f) => f.size)})`,
  )
  // A user-draggable textarea would move the panel and everything below it.
  check(
    fields.find((f) => f.tag === 'textarea')?.resize === 'none',
    `[${engineName}] the textarea cannot be resized`,
  )
  const wired = await page.evaluate(() =>
    [...document.querySelectorAll('.wish__label')].map((l) => {
      const c = document.getElementById(l.getAttribute('for') || '')
      return c ? c.tagName.toLowerCase() : null
    }),
  )
  check(
    JSON.stringify(wired) === JSON.stringify(['input', 'textarea']),
    `[${engineName}] both labels point at their control (got ${JSON.stringify(wired)})`,
  )
  await ctx.close()
  if (engineName === 'webkit') await engine.close()
}

/*
 * A MySQL-style timestamp -- space, no T, no zone -- is what the API actually sends.
 * Chromium parses it; bare WebKit returns NaN, and relativeTime would then swallow the
 * failure by returning ''. Both engines must print a time.
 */
for (const [engineName, engine] of [
  ['chromium', browser],
  ['webkit', await webkit.launch()],
]) {
  const iso = new Date(Date.now() - 3 * 86400_000)
  const pad = (n) => String(n).padStart(2, '0')
  const mysql = `${iso.getFullYear()}-${pad(iso.getMonth() + 1)}-${pad(iso.getDate())} ${pad(iso.getHours())}:${pad(iso.getMinutes())}:00`
  const { ctx, page } = await open({
    engine,
    home: { ucapan: [{ id: 1, guest_name: 'Rina', message: 'Hai', created_at: mysql }] },
  })
  const t = (await rows(page))[0]?.time
  check(t === '3 hari lalu', `[${engineName}] a MySQL-style created_at reads "3 hari lalu" (got "${t}")`)
  await ctx.close()
  if (engineName === 'webkit') await engine.close()
}

// --- reduced motion forces opacity 1 and would hide a missing fade ---
{
  const { ctx, page } = await open({ motion: 'no-preference' })
  check((await page.locator('.wish.is-in').count()) === 1, 'the reveal fires on scroll')
  await page.waitForTimeout(2800) // the cascade's last flower: 1400ms delay + 1100 fade
  const dim = await page.evaluate(() =>
    ['.wish__heading', '.wish__body', '.wish__form', '.wish__panel', '.wish__fl--daisy']
      .map((s) => [s, Number(getComputedStyle(document.querySelector(s)).opacity)])
      .filter(([, o]) => o < 0.99)
      .map(([s]) => s),
  )
  check(dim.length === 0, `every revealed element reaches full opacity (dim: ${dim})`)
  await ctx.close()
}

// --- the two flat plates are pictures of form controls ---
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await ctx.newPage()
  const asked = []
  page.on('request', (r) => asked.push(r.url()))
  await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(3000)
  const leaked = ['2594-425', '2594-426'].filter((n) => asked.some((u) => u.includes(n)))
  check(leaked.length === 0, `the flat input and textarea plates are never fetched (leaked: ${leaked})`)
  await ctx.close()
}

await browser.close()
if (fails.length) {
  console.log(`\n${fails.length} failed`)
  process.exitCode = 1
}
