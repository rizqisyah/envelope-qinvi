// The video band is not in Frame 242, so no band diff covers it. What is worth checking
// is the three things that are not visible in a screenshot: that it only exists when the
// API supplies a `video_url`, that it sits above the sheet rather than inside it (a band
// inserted into the sheet would slide all fourteen off their pinned backdrops), and that
// playing it stops the background music instead of talking over it.
//
//   pnpm dev & node scripts/check-video.mjs [port]
import { chromium } from 'playwright'

const PORT = process.argv[2] || 5175
const URL = `http://localhost:${PORT}/`

const fails = []
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch()

async function open(wedding) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.route('**/getHome/**', (r) =>
    r.fulfill({ json: { success: true, data: { wedding, pengantin: [], acara: [], gallery: [] } } }),
  )
  // The mp4 and the mp3 are never fetched -- readyState is irrelevant to what is checked.
  await page.route('**/*.mp4', (r) => r.abort())
  await page.route('**/*.mp3', (r) => r.abort())
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.click('.opening__envelope')
  await page.waitForTimeout(2200)
  return { ctx, page }
}

// --- no video_url, no band ---
{
  const { ctx, page } = await open({})
  check((await page.locator('.video').count()) === 0, 'no video band without a video_url')
  await ctx.close()
}

// --- configured: present, above the sheet, sourced from the API ---
{
  const { ctx, page } = await open({
    video_url: 'https://example.test/prewed.mp4',
    image_cover: 'https://example.test/cover.jpg',
  })
  check((await page.locator('.video').count()) === 1, 'video_url renders the band')

  const player = page.locator('.video__player')
  check(
    (await player.getAttribute('src')) === 'https://example.test/prewed.mp4',
    'the player plays the API url',
  )
  check(
    (await player.getAttribute('poster')) === 'https://example.test/cover.jpg',
    'the poster is the cover image, so it is not a black slab before play',
  )
  check((await player.getAttribute('playsinline')) !== null, 'it plays inline on iOS')
  // It must NOT loop: the band is full-height, so a repeating clip is a wall to scroll past.
  check((await player.getAttribute('loop')) === null, 'it plays once rather than looping')

  /*
   * Autoplay is only allowed muted, so the two attributes have to travel together --
   * `autoplay` without `muted` is a band that silently never starts.
   */
  check((await player.getAttribute('autoplay')) !== null, 'it autoplays')
  check(await player.evaluate((n) => n.muted), 'it starts muted, or autoplay is refused')

  // Above the hero, and outside the sheet -- inside it would offset every pinned band.
  const v = await page.locator('.video').boundingBox()
  const hero = await page.locator('.hero').boundingBox()
  check(v.y + v.height <= hero.y + 1, `the band sits above the hero (${v.y + v.height} vs ${hero.y})`)
  check(Math.abs(v.height - 812) < 1, `the band fills the screen height (got ${v.height})`)
  check(
    (await page.locator('.sheet .video').count()) === 0,
    'the band is outside the sheet, not a fifteenth Figma band',
  )

  // When it runs out it hands over to the invitation instead of stranding the guest on it.
  const before = await page.evaluate(() => window.scrollY)
  await page.evaluate(() => document.querySelector('.video__player').dispatchEvent(new Event('ended')))
  await page.waitForTimeout(1200)
  const heroTop = await page.evaluate(() => document.querySelector('.hero').getBoundingClientRect().top)
  check(before === 0, `the page starts on the video (scrollY ${before})`)
  check(Math.abs(heroTop) < 4, `the ended clip scrolls the hero into place (hero top ${heroTop})`)
  await ctx.close()
}

// --- unmuting the video hushes the music, and the nav control follows ---
{
  const { ctx, page } = await open({
    video_url: 'https://example.test/prewed.mp4',
    music_url: 'https://example.test/song.mp3',
  })
  // The real elements never load, so drive the pair through the same events they emit.
  await page.evaluate(() => {
    const audio = document.querySelector('audio')
    audio.dispatchEvent(new Event('play'))
    Object.defineProperty(audio, 'paused', { value: false, configurable: true })
  })
  await page.waitForTimeout(100)
  const before = await page.locator('.nav__btn--music .nav__label, .nav__label').last().innerText()
  check(before.trim() === 'Jeda', `music reads as playing first (got "${before.trim()}")`)

  // Muted autoplay must NOT touch the music, or it would die the moment the invitation opens.
  const hushedWhileMuted = await page.evaluate(() => {
    let hushed = false
    document.querySelector('audio').pause = () => (hushed = true)
    document.querySelector('.video__player').dispatchEvent(new Event('play'))
    return hushed
  })
  check(!hushedWhileMuted, 'muted autoplay leaves the music alone')

  const paused = await page.evaluate(() => {
    let hushed = false
    const audio = document.querySelector('audio')
    audio.pause = () => {
      hushed = true
      audio.dispatchEvent(new Event('pause'))
    }
    const video = document.querySelector('.video__player')
    video.muted = false
    video.dispatchEvent(new Event('volumechange'))
    return hushed
  })
  check(paused, 'unmuting the video pauses the background music')

  await page.waitForTimeout(100)
  const after = await page.locator('.nav__label').last().innerText()
  check(after.trim() === 'Musik', `the nav control follows it back (got "${after.trim()}")`)
  await ctx.close()
}

await browser.close()
if (fails.length) {
  console.log(`\n${fails.length} failed`)
  process.exitCode = 1
}
