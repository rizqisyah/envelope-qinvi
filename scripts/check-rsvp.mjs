// The RSVP band is the first one in Frame 242 that talks back to the server, and the
// pixel diff can see none of it: the design draws three empty white plates and a
// picture of a button. A frozen mock of that art would score better than the working
// form does. Everything below is what the diff structurally cannot check -- the
// payload keys, validation, the two ways the API can fail, the two ways a guest can
// already have replied, and whether the labels are wired to the controls at all.
//
//   pnpm dev & node scripts/check-rsvp.mjs [port]
import { chromium } from 'playwright'

const PORT = process.argv[2] || 5177
const ORIGIN = `http://localhost:${PORT}`

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch()

/**
 * Opens the invitation with the RSVP band in view. `rsvp` decides how the POST is
 * answered; every request that reaches it is recorded in `posts`.
 */
async function open({ guest = null, rsvp = 'ok', to = '', motion = 'reduce', ctx: reuse } = {}) {
  const ctx = reuse || (await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: motion }))
  const page = await ctx.newPage()
  const posts = []
  await page.route('**/getHome/**', (r) =>
    r.fulfill({
      json: { success: true, data: { wedding: {}, pengantin: [], acara: [], gallery: [], guest } },
    }),
  )
  await page.route('**/hadir2/**', (r) => {
    const req = r.request()
    posts.push({ url: req.url(), method: req.method(), body: req.postDataJSON() })
    if (rsvp === 'http500') return r.fulfill({ status: 500, json: { message: 'Server sedang sibuk' } })
    if (rsvp === 'soft-fail') return r.fulfill({ json: { success: false, message: 'Nomor sudah terdaftar' } })
    return r.fulfill({ json: { success: true, data: { id: 1 } } })
  })
  await page.goto(`${ORIGIN}/${to}`, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(2300)
  await page.locator('.rsvp').scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  return { ctx, page, posts }
}

const fill = async (page, { name, phone, attend }) => {
  if (name !== undefined) await page.fill('#rsvp-name', name)
  if (phone !== undefined) await page.fill('#rsvp-phone', phone)
  if (attend !== undefined) await page.selectOption('#rsvp-attend', attend)
}

// --- the payload: the only thing that proves the form talks to the right endpoint ---
{
  const { ctx, page, posts } = await open()
  await fill(page, { name: '  Ahmad Setiawan  ', phone: '081234567890', attend: 'hadir' })
  await page.click('.rsvp__send')
  await page.waitForTimeout(400)

  check(posts.length === 1, `submitting posts exactly once (got ${posts.length})`)
  const p = posts[0] || {}
  check(p.method === 'POST', `it is a POST (got ${p.method})`)
  check(
    (p.url || '').includes('/v1/service/menu/hadir2/'),
    `it hits the hadir2 endpoint (got ${p.url})`,
  )
  const body = p.body || {}
  check(
    JSON.stringify(Object.keys(body).sort()) ===
      JSON.stringify(['attendance_status', 'guest_count', 'guest_name', 'phone']),
    `the body carries exactly the four API keys (got ${Object.keys(body).sort()})`,
  )
  check(body.guest_name === 'Ahmad Setiawan', `the name is trimmed (got "${body.guest_name}")`)
  check(body.phone === '081234567890', `the phone goes through (got "${body.phone}")`)
  check(body.attendance_status === 'hadir', `attendance_status is hadir (got "${body.attendance_status}")`)
  check(body.guest_count === 1, `an attending guest counts as 1 (got ${body.guest_count})`)

  // Success has to replace the form, or a guest can submit the same reply twice.
  check((await page.locator('.rsvp__thanks').count()) === 1, 'success shows the thank-you')
  check((await page.locator('.rsvp__form').count()) === 0, 'success removes the form')
  await ctx.close()
}

// --- declining sends 0, not 1 ---
{
  const { ctx, page, posts } = await open()
  await fill(page, { name: 'Salma Putri', attend: 'tidak_hadir' })
  await page.click('.rsvp__send')
  await page.waitForTimeout(400)
  check(
    posts[0]?.body?.attendance_status === 'tidak_hadir' && posts[0]?.body?.guest_count === 0,
    `declining sends guest_count 0 (got ${JSON.stringify(posts[0]?.body)})`,
  )
  await ctx.close()
}

// --- validation must stop the request, not just colour a field red ---
{
  const { ctx, page, posts } = await open()
  await fill(page, { attend: 'hadir' })
  await page.click('.rsvp__send')
  await page.waitForTimeout(400)
  check(posts.length === 0, `an empty name fires no request (got ${posts.length})`)
  check((await page.locator('.rsvp__error').count()) === 1, 'an empty name shows an error')

  await fill(page, { name: 'Budi', attend: '' })
  await page.click('.rsvp__send')
  await page.waitForTimeout(400)
  check(posts.length === 0, `no attendance choice fires no request (got ${posts.length})`)
  check((await page.locator('.rsvp__form').count()) === 1, 'a rejected submit keeps the form')
  await ctx.close()
}

// --- both failure shapes: an HTTP error, and a 200 that says success:false ---
for (const [mode, want] of [
  ['http500', 'Server sedang sibuk'],
  ['soft-fail', 'Nomor sudah terdaftar'],
]) {
  const { ctx, page } = await open({ rsvp: mode })
  await fill(page, { name: 'Ahmad', attend: 'hadir' })
  await page.click('.rsvp__send')
  await page.waitForTimeout(500)
  const msg = (await page.locator('.rsvp__error').innerText().catch(() => '')).trim()
  check(msg === want, `${mode} surfaces the API's own message (got "${msg}")`)
  check((await page.locator('.rsvp__form').count()) === 1, `${mode} keeps the form so it can be retried`)
  // A submit button left disabled after a failure is a dead end.
  check(
    !(await page.locator('.rsvp__send').isDisabled()),
    `${mode} re-enables the send button`,
  )
  await ctx.close()
}

// --- a guest who already replied: once from a local receipt, once from the API alone ---
{
  const { ctx, page } = await open()
  await fill(page, { name: 'Ahmad', attend: 'hadir' })
  await page.click('.rsvp__send')
  await page.waitForTimeout(400)
  // Same context, so localStorage survives -- which is the whole point.
  const again = await open({ ctx })
  check(
    (await again.page.locator('.rsvp__thanks').count()) === 1,
    'a reload still shows the thank-you (localStorage receipt)',
  )
  await ctx.close()
}
{
  const { ctx, page } = await open({ guest: { name: 'Dewi Lestari', has_rsvp: true } })
  check(
    (await page.locator('.rsvp__thanks').count()) === 1,
    'has_rsvp from the API alone shows the thank-you, with no local receipt',
  )
  await ctx.close()
}

// --- a named guest should not have to type their own name ---
{
  const { ctx, page } = await open({ guest: { name: 'Dewi Lestari' } })
  const v = await page.inputValue('#rsvp-name')
  check(v === 'Dewi Lestari', `a named guest gets their name prefilled (got "${v}")`)
  await ctx.close()
}

// --- the design draws labels above bare boxes; nothing else catches an unwired one ---
{
  const { ctx, page } = await open()
  const wired = await page.evaluate(() =>
    [...document.querySelectorAll('.rsvp__label')].map((l) => {
      const c = document.getElementById(l.getAttribute('for') || '')
      return c ? c.tagName.toLowerCase() : null
    }),
  )
  check(
    JSON.stringify(wired) === JSON.stringify(['input', 'input', 'select']),
    `all three labels point at their control (got ${JSON.stringify(wired)})`,
  )

  /*
   * Geometry the diff would catch only as a blur. Each of these is a sharp sweep
   * minimum, and three of them sit one px off some node's declared y.
   */
  const sheet = await page.locator('.sheet').boundingBox()
  const at = async (sel) => {
    const b = await page.locator(sel).boundingBox()
    return { top: b.y - sheet.y, left: b.x - sheet.x, w: b.width, h: b.height }
  }
  const want = [
    ['.rsvp__arch', 6173, 35, 332, 560],
    ['.rsvp__heading', 6243, 48, 305, null],
    ['.rsvp__body', 6300, 85, 231, null],
    ['.rsvp__label--name', 6429, 67, null, null],
    ['.rsvp__field--name', 6452, 68, 261.22, 36],
    ['.rsvp__label--phone', 6494, 67, null, null],
    ['.rsvp__field--phone', 6517, 67, 261.22, 36],
    ['.rsvp__label--attend', 6557, 69, null, null],
    ['.rsvp__field--attend', 6580, 68, 258, 36],
    ['.rsvp__send', 6648, 139, 115, 32],
  ]
  for (const [sel, top, left, w, h] of want) {
    const b = await at(sel)
    const bad = [
      Math.abs(b.top - top) > 0.6 ? `top ${b.top.toFixed(1)}!=${top}` : '',
      Math.abs(b.left - left) > 0.6 ? `left ${b.left.toFixed(1)}!=${left}` : '',
      w !== null && Math.abs(b.w - w) > 0.6 ? `w ${b.w.toFixed(1)}!=${w}` : '',
      h !== null && Math.abs(b.h - h) > 0.6 ? `h ${b.h.toFixed(1)}!=${h}` : '',
    ].filter(Boolean)
    check(bad.length === 0, `${sel} sits where Frame 242 draws it${bad.length ? ` (${bad})` : ''}`)
  }
  await ctx.close()
}

/*
 * reducedMotion: 'reduce' forces opacity 1, which hid a missing fade on the akad
 * heading for a whole session. This pass is the only one that sees the real thing.
 */
{
  const { ctx, page } = await open({ motion: 'no-preference' })
  check((await page.locator('.rsvp.is-in').count()) === 1, 'the reveal fires on scroll')
  // The cascade's last flower starts at 1500ms and fades for 1100 more.
  await page.waitForTimeout(2800)
  const dim = await page.evaluate(() =>
    ['.rsvp__arch', '.rsvp__heading', '.rsvp__body', '.rsvp__form', '.rsvp__fl--valley']
      .map((s) => [s, Number(getComputedStyle(document.querySelector(s)).opacity)])
      .filter(([, o]) => o < 0.99)
      .map(([s]) => s),
  )
  check(dim.length === 0, `every revealed element reaches full opacity (dim: ${dim})`)
  await ctx.close()
}

// --- the four flat plates are pictures of form controls and must never be fetched ---
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await ctx.newPage()
  const asked = []
  page.on('request', (r) => asked.push(r.url()))
  await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(3000)
  const leaked = ['2594-302', '2594-304', '2594-308', '2594-309'].filter((n) =>
    asked.some((u) => u.includes(n)),
  )
  check(leaked.length === 0, `the four flat form plates are never fetched (leaked: ${leaked})`)
  await ctx.close()
}

await browser.close()
if (fails.length) {
  console.log(`\n${fails.length} failed`)
  process.exitCode = 1
}
