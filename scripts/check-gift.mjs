// The gift band's pixel diff runs against the design's own three cards, so it cannot
// see whether the API's accounts reach them, whether the copy button copies, or
// whether a bank the design has no logo for renders at all. It also cannot see the
// one thing that makes this band worth building: the clipboard.
//
//   pnpm dev & node scripts/check-gift.mjs [port]
import { chromium } from 'playwright'

const PORT = process.argv[2] || 5177
const URL = `http://localhost:${PORT}/`

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch()

async function open(gift) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: 'reduce',
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  const page = await ctx.newPage()
  await page.route('**/getHome/**', (r) =>
    r.fulfill({
      json: { success: true, data: { wedding: {}, pengantin: [], acara: [], gallery: [], gift } },
    }),
  )
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(2200)
  await page.locator('.gift').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  return { ctx, page }
}

async function cards(page) {
  const sheet = await page.locator('.sheet').boundingBox()
  const out = []
  for (const c of await page.locator('.gift__card').all()) {
    const b = await c.boundingBox()
    out.push({
      lines: (await c.locator('.gift__lines').innerText()).split('\n').map((s) => s.trim()),
      hasLogo: (await c.locator('.gift__logo').count()) === 1,
      bank: (await c.locator('.gift__bank').count())
        ? (await c.locator('.gift__bank').innerText()).trim()
        : null,
      hasCopy: (await c.locator('.gift__copy').count()) === 1,
      top: b.y - sheet.y,
    })
  }
  return out
}

// --- with no gift configured, the card set Frame 242 was drawn with ---
{
  const { ctx, page } = await open([])
  const c = await cards(page)
  check(c.length === 3, `fallback renders the design's three cards (got ${c.length})`)
  check(c[0].hasLogo && c[1].hasLogo, 'the two BCA cards show the logo asset')
  check(
    c[0].lines[0] === 'No. Rekening : 8715154435' && c[0].lines[1] === 'A/n Muhammad Arif',
    `fallback card 1 copy (got ${JSON.stringify(c[0].lines)})`,
  )
  /*
   * Card 3 is an address, not an account -- a variant that exists only in the design.
   * It must not offer a copy button, because there is no account number to copy.
   */
  check(
    !c[2].hasLogo && c[2].lines[0] === 'Alamat' && c[2].lines[2].startsWith('A/n Putrianti'),
    `fallback card 3 is the address variant (got ${JSON.stringify(c[2].lines)})`,
  )
  check(!c[2].hasCopy, 'the address card offers no copy button')

  // The cards sit on a 153px pitch; nothing else here would notice that drifting.
  const pitch = [c[1].top - c[0].top, c[2].top - c[1].top]
  check(
    pitch.every((p) => Math.abs(p - 153) < 0.5),
    `cards keep the design's 153px pitch (got ${pitch.map((p) => p.toFixed(1))})`,
  )
  check(Math.abs(c[0].top - 5637) < 0.5, `card 1 at y 5637 (got ${c[0].top.toFixed(1)})`)
  await ctx.close()
}

// --- configured accounts replace them, and a non-BCA bank renders as its own name ---
{
  const { ctx, page } = await open([
    { bank_name: 'BCA', account_number: '1122334455', account_name: 'Ahmad Setiawan' },
    { bank_name: 'Mandiri', account_number: '9988776655', account_name: 'Salma Putri' },
  ])
  const c = await cards(page)
  check(c.length === 2, `one card per configured account (got ${c.length})`)
  check(
    c[0].lines[0] === 'No. Rekening : 1122334455' && c[0].lines[1] === 'A/n Ahmad Setiawan',
    `account 1 comes from the API (got ${JSON.stringify(c[0].lines)})`,
  )
  check(c[0].hasLogo && !c[1].hasLogo, 'only BCA gets the logo asset')
  check(c[1].bank === 'Mandiri', `a bank with no logo renders its name (got "${c[1].bank}")`)

  /*
   * The whole point of the tab. A picture of a copy icon and a working one are the
   * same pixels, so only actually reading the clipboard back can tell them apart.
   */
  await page.locator('.gift__card').nth(1).locator('.gift__copy').click()
  await page.waitForTimeout(300)
  const clip = await page.evaluate(() => navigator.clipboard.readText())
  check(clip === '9988776655', `the copy button copies that card's number (got "${clip}")`)

  const label = await page
    .locator('.gift__card')
    .nth(0)
    .locator('.gift__copy')
    .evaluate((n) => n.innerText.trim())
  check(
    label.includes('1122334455'),
    `each copy button names the account it copies (got "${label}")`,
  )

  // 44px is the touch-target floor, and the design's tab is exactly 44 wide.
  const box = await page.locator('.gift__copy').first().boundingBox()
  check(
    box.width >= 43.5 && box.height >= 43.5,
    `copy button is a 44px target (got ${box.width.toFixed(1)}x${box.height.toFixed(1)})`,
  )
  await ctx.close()
}

// --- an account with no number must not offer a dead copy button ---
{
  const { ctx, page } = await open([{ bank_name: 'BNI', account_name: 'Tanpa Nomor' }])
  const c = await cards(page)
  check(c.length === 1 && !c[0].hasCopy, 'an account with no number offers no copy button')
  await ctx.close()
}

// --- Frame 224 is a picture of a TEXT node; it must never be fetched ---
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await ctx.newPage()
  const asked = []
  page.on('request', (r) => asked.push(r.url()))
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(3000)
  check(
    !asked.some((u) => u.includes('2594-290')),
    'the baked Frame 224 text (2594:290) is never fetched',
  )
  await ctx.close()
}

await browser.close()
if (fails.length) {
  console.log(`\n${fails.length} failed`)
  process.exitCode = 1
}
