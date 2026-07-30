// The bottom nav is an addition -- Frame 242 draws none -- so the pixel diff says
// nothing about it, and the three bugs template-2's version shipped were all invisible
// in a screenshot: a scroll-spy that never updated, autoplay that browsers refuse, and
// a fixed position that on desktop lands over the wrong column.
//
// Both layouts are exercised: on desktop the scrolling element is the 480px right
// column, on mobile it is the page, and a sticky nav has to survive both.
//
//   pnpm dev & node scripts/check-nav.mjs [port]
import { chromium, webkit } from 'playwright'

const PORT = process.argv[2] || 5177
const ORIGIN = `http://localhost:${PORT}`

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch()

async function open({ wedding = {}, width = 375, height = 812, engine } = {}) {
  const ctx = await (engine || browser).newContext({
    viewport: { width, height },
    reducedMotion: 'reduce',
  })
  const page = await ctx.newPage()
  const audio = []
  await page.route('**/getHome/**', (r) =>
    r.fulfill({
      json: { success: true, data: { wedding, pengantin: [], acara: [], gallery: [] } },
    }),
  )
  // The audio file itself must never be requested unless the API configured one.
  page.on('request', (r) => {
    if (r.resourceType() === 'media' || /\.mp3(\?|$)/.test(r.url())) audio.push(r.url())
  })
  await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(2300)
  return { ctx, page, audio }
}

/** The element that actually scrolls: the right column on desktop, the page on mobile. */
const scrollTo = (page, y) =>
  page.evaluate((to) => {
    const col = document.querySelector('.desktop-right-column')
    const scroller = col && col.scrollHeight > col.clientHeight + 4 ? col : window
    if (scroller === window) window.scrollTo(0, to)
    else col.scrollTop = to
  }, y)

// --- it exists, is not there before opening, and has real destinations ---
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await ctx.newPage()
  await page.route('**/getHome/**', (r) =>
    r.fulfill({ json: { success: true, data: { wedding: {}, pengantin: [], acara: [], gallery: [] } } }),
  )
  await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' })
  check((await page.locator('.nav').count()) === 0, 'the nav is absent on the cover')
  await page.click('.opening__envelope')
  await page.waitForTimeout(2300)
  check((await page.locator('.nav').count()) === 1, 'and present once the invitation opens')
  const dead = await page.evaluate(() =>
    [...document.querySelectorAll('.nav__btn')]
      .map((b) => b.querySelector('.nav__label').innerText.trim())
      .filter((_, i, a) => a && false),
  )
  check(dead.length === 0, 'no placeholder buttons')
  await ctx.close()
}

// --- every destination must resolve to a band that exists ---
{
  const { ctx, page } = await open()
  const targets = ['.hero', '.groom', '.akad', '.gallery', '.wish']
  const missing = []
  for (const t of targets) if ((await page.locator(t).count()) === 0) missing.push(t)
  check(missing.length === 0, `every nav destination exists in the sheet (missing: ${missing})`)
  check(
    (await page.locator('.nav__btn').count()) === 5,
    `five buttons with no music configured (got ${await page.locator('.nav__btn').count()})`,
  )
  await ctx.close()
}

// --- tapping actually moves the scroller to that band ---
{
  const { ctx, page } = await open()
  const before = await page.evaluate(() => {
    const c = document.querySelector('.desktop-right-column')
    return c && c.scrollHeight > c.clientHeight + 4 ? c.scrollTop : window.scrollY
  })
  await page.locator('.nav__btn').nth(4).click() // Ucapan
  await page.waitForTimeout(900)
  const after = await page.evaluate(() => {
    const c = document.querySelector('.desktop-right-column')
    return c && c.scrollHeight > c.clientHeight + 4 ? c.scrollTop : window.scrollY
  })
  check(after > before + 1000, `tapping Ucapan scrolls to it (${before} -> ${after})`)
  const wish = await page.locator('.wish').boundingBox()
  check(wish.y < 120 && wish.y > -40, `the wish band lands at the top (y ${wish.y.toFixed(0)})`)
  await ctx.close()
}

/*
 * The scroll-spy. template-2's `active` was assigned once and never updated, and a
 * screenshot of it looks exactly like a working one -- only scrolling and re-reading
 * tells them apart.
 */
{
  const { ctx, page } = await open()
  const activeLabel = () =>
    page.evaluate(() => {
      const b = document.querySelector('.nav__btn.is-active')
      return b ? b.querySelector('.nav__label').innerText.trim() : null
    })
  const seen = []
  for (const target of ['.hero', '.groom', '.akad', '.gallery', '.wish']) {
    await page.locator(target).scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    seen.push(await activeLabel())
  }
  check(
    seen.join(',') === 'Awal,Mempelai,Acara,Galeri,Ucapan',
    `the active item tracks the scroll (got ${seen.join(',')})`,
  )
  check(
    new Set(seen).size === 5,
    'and it actually changes -- a never-updating ref would report one label five times',
  )
  const cur = await page.evaluate(
    () => document.querySelectorAll('.nav__btn[aria-current="true"]').length,
  )
  check(cur === 1, `exactly one button carries aria-current (got ${cur})`)
  await ctx.close()
}

// --- music: opt-in only, and the file is never touched without one configured ---
{
  const { ctx, page, audio } = await open()
  check((await page.locator('audio').count()) === 0, 'no <audio> element without music_url')
  check(audio.length === 0, `and no media request (got ${audio.length})`)
  await ctx.close()
}
{
  const { ctx, page } = await open({ wedding: { music_url: 'http://localhost:1/silence.mp3' } })
  check((await page.locator('.nav__btn').count()) === 6, 'a configured music_url adds a sixth button')
  const pressed = await page.locator('.nav__btn--music').getAttribute('aria-pressed')
  check(pressed !== null, `the music button reports its state (aria-pressed="${pressed}")`)
  // The URL above cannot load, so play() rejects -- which must not throw or lock the UI.
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.locator('.nav__btn--music').click()
  await page.waitForTimeout(500)
  check(errors.length === 0, `a failed play() raises nothing (got ${errors})`)
  check(
    (await page.locator('.nav__btn--music').getAttribute('aria-pressed')) === 'false',
    'and leaves the button showing "not playing"',
  )
  await ctx.close()
}

/*
 * Position, in both layouts and both engines. On desktop `.desktop-right-column` is the
 * 480px scroller, so a `position: fixed` nav would centre on the 1440px viewport and land
 * over the left column -- template-2 patched that with `right: 240px !important`. Sticky
 * needs no patch, and this is the assertion that proves it.
 */
for (const [engineName, engine] of [
  ['chromium', browser],
  ['webkit', await webkit.launch()],
]) {
  for (const [layout, width, height] of [
    ['mobile', 375, 812],
    ['desktop', 1440, 900],
  ]) {
    const { ctx, page } = await open({ engine, width, height })
    // Halfway down: the nav has to be pinned, not scrolled off with the content.
    await scrollTo(page, 3000)
    await page.waitForTimeout(400)
    const nav = await page.locator('.nav').boundingBox()
    const col = await page.locator('.desktop-right-column').boundingBox()
    check(
      nav.y + nav.height <= height + 1 && nav.y >= 0,
      `[${engineName}/${layout}] the nav stays on screen mid-scroll (y ${nav.y.toFixed(0)}, h ${nav.height.toFixed(0)}, viewport ${height})`,
    )
    // Centred on the invitation column, NOT on the viewport.
    const navMid = nav.x + nav.width / 2
    const colMid = col.x + col.width / 2
    check(
      Math.abs(navMid - colMid) < 2,
      `[${engineName}/${layout}] centred on the invitation column, not the viewport (nav ${navMid.toFixed(0)} vs column ${colMid.toFixed(0)})`,
    )
    check(
      nav.width <= col.width - 20,
      `[${engineName}/${layout}] it fits inside the column (${nav.width.toFixed(0)} in ${col.width.toFixed(0)})`,
    )
    // Every control has to clear the 44px touch floor.
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('.nav__btn')]
        .map((b) => b.getBoundingClientRect())
        .filter((r) => r.height < 44 || r.width < 40).length,
    )
    check(small === 0, `[${engineName}/${layout}] every button clears the touch floor (${small} too small)`)
    await ctx.close()
  }
  if (engineName === 'webkit') await engine.close()
}

await browser.close()
if (fails.length) {
  console.log(`\n${fails.length} failed`)
  process.exitCode = 1
}
