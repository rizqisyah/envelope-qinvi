// The footer's pixel diff is a good check on 33 layers of artwork and says nothing about
// the four things in it that are live: the couple's photograph, the couple's names, and
// two credit links. It also cannot see the one number that validates every band above it
// -- the sheet's total height against the frame's own 8749, less the cut sentence.
//
//   pnpm dev & node scripts/check-footer.mjs [port]
import { chromium, webkit } from 'playwright'

const PORT = process.argv[2] || 5177
const ORIGIN = `http://localhost:${PORT}`

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch()

async function open({ data = {}, motion = 'reduce', engine } = {}) {
  const ctx = await (engine || browser).newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: motion,
  })
  const page = await ctx.newPage()
  await page.route('**/getHome/**', (r) =>
    r.fulfill({
      json: { success: true, data: { wedding: {}, pengantin: [], acara: [], gallery: [], ...data } },
    }),
  )
  await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(2300)
  await page.locator('.footer').scrollIntoViewIfNeeded()
  await page.waitForTimeout(700)
  return { ctx, page }
}

/*
 * The strongest single check in the file: the sheet only reaches its total if every one of
 * the twelve bands' heights is right -- one band off by a pixel and this fails, even
 * though that band's own diff would still look clean.
 *
 * Frame 242's own height is 8749. We are 48 under it on purpose: the client asked for the
 * repeated thank-you sentence above the vendor credit to go, and the footer band lost that
 * sentence's 48px rather than keeping a hole where it used to be.
 */
const SHEET_HEIGHT = 8749 - 48
{
  const { ctx, page } = await open()
  const sheet = await page.locator('.sheet').boundingBox()
  check(
    Math.abs(sheet.height - SHEET_HEIGHT) < 1,
    `the sheet is exactly ${SHEET_HEIGHT} tall (got ${sheet.height.toFixed(0)})`,
  )
  check((await page.locator('.sheet__placeholder').count()) === 0, 'no placeholder bands are left')
  await ctx.close()
}

// --- the couple's names come from pengantin, not from the design's literal ---
{
  const { ctx, page } = await open()
  const fallback = (await page.locator('.footer__couple').innerText()).trim()
  check(
    fallback === 'Antonio + Aliyah',
    `unconfigured, it prints the design's own line (got "${fallback}")`,
  )
  await ctx.close()
}
{
  const { ctx, page } = await open({
    data: {
      pengantin: [
        { type: 'groom', name: 'Bagas Prasetyo' },
        { type: 'bride', name: 'Sekar Ayu Wulandari' },
      ],
    },
  })
  const live = (await page.locator('.footer__couple').innerText()).trim()
  check(live === 'Bagas + Sekar', `configured, it uses the first names from pengantin (got "${live}")`)
  await ctx.close()
}

/*
 * 2594:208 is a photograph, and it is deduped -- the same file the hero band imports. A
 * shipped template must not put a stranger's face in front of a real couple.
 */
{
  const { ctx, page } = await open()
  const src = await page.locator('.footer__photo').getAttribute('src')
  check(
    /img-8300/.test(src),
    `with no image configured it falls back to the sliced plate (got ${src})`,
  )
  await ctx.close()
}
{
  const url = 'https://example.test/couple.jpg'
  const { ctx, page } = await open({ data: { wedding: { image_cover: url } } })
  const src = await page.locator('.footer__photo').getAttribute('src')
  check(src === url, `a configured image_cover replaces the plate (got ${src})`)
  // The box is fixed, so any aspect ratio has to be cropped rather than stretched.
  const fit = await page.locator('.footer__photo').evaluate((n) => getComputedStyle(n).objectFit)
  check(fit === 'cover', `and it is cropped to the 342x342 box, not stretched (got ${fit})`)
  await ctx.close()
}

// --- the two credit buttons: a real link, and no dead one ---
{
  const { ctx, page } = await open()
  const ig = page.locator('.footer__btn--ig')
  check((await ig.getAttribute('href')) === 'https://instagram.com/25ribuaja', 'the IG button links to the vendor handle')
  check((await ig.getAttribute('rel')) === 'noopener', 'and carries rel=noopener with target=_blank')
  check((await ig.getAttribute('target')) === '_blank', 'and opens in a new tab')
  check(
    (await ig.locator('.footer__sr').innerText()).trim().length > 0,
    'and names itself for a screen reader, since its label is a bitmap',
  )
  /*
   * The design draws a WhatsApp button but no number exists for it. A `wa.me/` with no
   * number is a link that goes nowhere, so the art ships without one -- the same call the
   * akad band's Maps button makes.
   */
  const wa = page.locator('.footer__btn--wa')
  check((await wa.evaluate((n) => n.tagName.toLowerCase())) === 'span', 'the WA button is inert with no number configured')
  check((await wa.getAttribute('href')) === null, 'and has no dead href')
  await ctx.close()
}
{
  const { ctx, page } = await open({ data: { wedding: { vendor_whatsapp: '628123456789' } } })
  const wa = page.locator('.footer__btn--wa')
  check(
    (await wa.getAttribute('href')) === 'https://wa.me/628123456789',
    `a configured number makes it a real link (got ${await wa.getAttribute('href')})`,
  )
  await ctx.close()
}

/*
 * Pochaevsk is a fresh install and the only band that uses it. A silent fallback would
 * show up in the diff, but only if someone looked -- this says so directly.
 */
{
  const { ctx, page } = await open()
  const fonts = await page.evaluate(async () => {
    const want = ['40px "Pinyon Script"', '15px Pochaevsk', '12px Pochaevsk', '24px "Pinyon Script"']
    await Promise.all(want.map((f) => document.fonts.load(f, 'Thank You Qinvi')))
    return want.filter((f) => !document.fonts.check(f))
  })
  check(fonts.length === 0, `every footer face actually arrives (missing: ${fonts})`)
  await ctx.close()
}

/*
 * Geometry, both engines. Only two of these sit at their node y: the two Pinyon Script
 * blocks report no lineHeight and live in boxes taller than one line, so Figma centres the
 * line inside the box and the node y is 2 px off in both cases.
 */
const GEOMETRY = [
  ['.footer__thanks', 7829, 104, 181, null],
  ['.footer__body', 7878, 74, 249, null],
  ['.footer__couple', 7968, 77, 230, null],
  ['.footer__photo', 8054, 17, 342, 342],
  ['.footer__by', 8494, 90, 224, null],
  ['.footer__vendor--a', 8526, 18, 172.9, null],
  ['.footer__vendor--x', 8526, 117.2, 172.9, null],
  ['.footer__vendor--b', 8526, 202.1, 172.9, null],
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
  // Both credit buttons are 45 wide art padded to a 44-tall target.
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('.footer__btn')]
      .map((b) => b.getBoundingClientRect())
      .filter((r) => r.height < 43.5).length,
  )
  check(small === 0, `[${engineName}] both credit buttons clear the touch floor (${small} too small)`)
  await ctx.close()
  if (engineName === 'webkit') await engine.close()
}

// --- reduced motion forces opacity 1 and would hide a layer left out of the fade ---
{
  const { ctx, page } = await open({ motion: 'no-preference' })
  check((await page.locator('.footer.is-in').count()) === 1, 'the reveal fires on scroll')
  await page.waitForTimeout(3600) // the last delay is 2350ms + an 1100ms fade
  const dim = await page.evaluate(() => {
    const sels = ['.footer__thanks', '.footer__body', '.footer__couple', '.footer__photo', '.footer__by', '.footer__btn--ig']
    const out = sels.filter((s) => Number(getComputedStyle(document.querySelector(s)).opacity) < 0.99)
    /*
     * Every artwork layer has to be in the fade too, not just the copy. 31 is the count
     * the band ships: 33 layers in the band record minus the photograph (its own element)
     * and the two credit buttons (which are links, not .footer__lyr).
     */
    const layers = [...document.querySelectorAll('.footer__lyr')].filter(
      (n) => Number(getComputedStyle(n).opacity) < 0.99,
    ).length
    return { out, layers, total: document.querySelectorAll('.footer__lyr').length }
  })
  check(dim.out.length === 0, `every revealed block reaches full opacity (dim: ${dim.out})`)
  check(
    dim.layers === 0 && dim.total === 31,
    `all 31 artwork layers reach full opacity (${dim.layers} dim of ${dim.total})`,
  )
  await ctx.close()
}

await browser.close()
if (fails.length) {
  console.log(`\n${fails.length} failed`)
  process.exitCode = 1
}
