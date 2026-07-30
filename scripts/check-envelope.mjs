// The quote card shipped with the Arabic verse overlapping the Indonesian translation and
// the translation clipped off the bottom of the card -- and the band still diffed at a
// number nobody questioned, because the whole thing was blamed on a known 11-vs-10 line
// wrap. Two reasons the diff could not catch it:
//
//   1. `--font-arabic` was Noto Sans, which has NO Arabic glyphs, so the verse fell through
//      to whatever Arabic face the OS shipped. The reference machine's fallback was small;
//      another machine's was large enough to collide. A diff on one machine proves nothing
//      about a font the page never asked for.
//   2. The band's own figure was inflated by BottomNav, which is `position: fixed` and was
//      being captured in the sheet screenshot.
//
//   pnpm dev & node scripts/check-envelope.mjs [port]
import { chromium, webkit } from 'playwright'

const PORT = process.argv[2] || 5177
const ORIGIN = `http://localhost:${PORT}`

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

// A long verse and a long translation, to prove the guard is not just true for the defaults.
const LONG = {
  theme_override: {
    quote: {
      arabic:
        'وَمِنْ اٰيٰتِهٖٓ اَنْ خَلَقَ لَكُمْ مِّنْ اَنْفُسِكُمْ اَزْوَاجًا لِّتَسْكُنُوْٓا اِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَّوَدَّةً وَّرَحْمَةًۗ اِنَّ فِيْ ذٰلِكَ لَاٰيٰتٍ لِّقَوْمٍ يَّتَفَكَّرُوْنَ وَمِنْ اٰيٰتِهٖٓ اَنْ خَلَقَ لَكُمْ',
      text:
        'Di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri agar kamu merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa cinta dan kasih sayang, dan sesungguhnya pada yang demikian itu benar-benar terdapat tanda-tanda kebesaran Allah bagi kaum yang berpikir tentangnya.',
    },
  },
}

for (const [engineName, engine] of [
  ['chromium', chromium],
  ['webkit', webkit],
]) {
  const browser = await engine.launch()

  // Every width the invitation is used at: the narrowest phone, the design frame, the
  // sheet's own max, and the desktop column.
  for (const width of [320, 375, 430, 480, 1440]) {
    for (const [label, wedding] of [
      ['default copy', {}],
      ['long copy', LONG],
    ]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
      const page = await ctx.newPage()
      await page.route('**/getHome/**', (r) =>
        r.fulfill({
          json: { success: true, data: { wedding, pengantin: [], acara: [], gallery: [] } },
        }),
      )
      await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' })
      await page.click('.opening__envelope')
      await page.waitForTimeout(2500)
      await page.locator('.envelope').scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)

      const ar = await page.locator('.envelope__arabic').boundingBox()
      const q = await page.locator('.envelope__quote-id').boundingBox()

      // The bug, stated directly: the verse must not reach into the translation's box.
      const gap = q.y - (ar.y + ar.height)
      check(gap > 0, `[${engineName}/${width}/${label}] the verse does not collide with the translation (gap ${gap.toFixed(1)}px)`)

      // And the translation must fit its box, which is what keeps it on the card.
      const over = await page.locator('.envelope__quote-id').evaluate((n) => n.scrollHeight - n.clientHeight)
      check(over <= 0, `[${engineName}/${width}/${label}] the translation fits inside the card (overflow ${over}px)`)

      await ctx.close()
    }
  }

  /*
   * The root cause. Noto Sans has no Arabic, so asking for it means asking the OS -- and
   * the OS answer differs per machine, which is how this shipped. --font-quran must
   * resolve to a face the page actually loads.
   */
  const ctx = await browser.newContext({ viewport: { width: 375, height: 900 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(2500)
  const font = await page.evaluate(async () => {
    await document.fonts.load('11px "Noto Naskh Arabic"', 'وَمِنْ')
    const el = document.querySelector('.envelope__arabic')
    return {
      loaded: document.fonts.check('11px "Noto Naskh Arabic"'),
      family: getComputedStyle(el).fontFamily,
      lines: Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)),
    }
  })
  check(font.loaded, `[${engineName}] the pinned Arabic face actually loads`)
  check(
    /Noto Naskh Arabic/.test(font.family),
    `[${engineName}] the verse asks for it first, not a system fallback (got ${font.family})`,
  )
  // Three is the design's own line count; four crowds the translation.
  check(font.lines === 3, `[${engineName}] the verse sets in the design's three lines (got ${font.lines})`)
  await ctx.close()

  await browser.close()
}

if (fails.length) {
  console.log(`\n${fails.length} failed`)
  process.exitCode = 1
}
