import { ref } from 'vue'

// The hero's couple portrait deduped into footer/, so the body glob misses it.
import heroCouple from '../assets/footer/parts/21_2594-208_img-8300.webp'

// Assets are discovered by glob so new slices need no edit here.
// Cover = the splash screen (Frame 241 = opening/); body = the first screens behind it.
// assets/cover/ is Frame 242's cover *section*, so it belongs to the body, not the splash.
const coverImages = Object.values(
  import.meta.glob('../assets/opening/**/*.webp', { eager: true, import: 'default' }),
) as string[]

const bodyImages = Object.values(
  import.meta.glob(
    [
      '../assets/hero/**/*.webp',
      '../assets/page/**/*.webp',
      '../assets/cover/**/*.webp',
      '../assets/quote/**/*.webp',
      '../assets/groom/**/*.webp',
      '../assets/bride/**/*.webp',
      '../assets/divider/**/*.webp',
      '../assets/glimpse/**/*.webp',
      // Both files here are in use: the carousel plate, and the glimpse band's
      // date plate, which is filed under gallery/ -- see GlimpseSection.vue.
      '../assets/gallery/**/*.webp',
      '../assets/akad/**/*.webp',
      '../assets/resepsi/**/*.webp',
      '../assets/countdown/**/*.webp',
      /*
       * 2610:113 is the countdown's baked "0 Days 0 Hours ..." bitmap. It is kept in
       * the repo because its ink is where the band's typography was measured from,
       * but it must never reach a browser -- the copy is live DOM. No component
       * imports it; without this the directory glob would still preload it.
       */
      '!../assets/countdown/parts/07_2610-113.webp',
      '../assets/gift/**/*.webp',
      /*
       * Frame 224 is a FRAME wrapping the third card's "A/n ..." TEXT node, so it was
       * exported as a picture of copy. Same rule as the countdown bitmap above: kept
       * for reference, never shipped -- GiftSection draws that line live.
       */
      '!../assets/gift/parts/12_2594-290_frame-224.webp',
      '../assets/rsvp/**/*.webp',
      /*
       * The RSVP band's three Input frames and its Send rectangle are flat #ffffff
       * plates -- pictures of form controls. They stay in the repo because the band's
       * florals are scored over those rows, but the shipped band renders real
       * <input>/<select>/<button> elements, so none of the four may be fetched.
       */
      '!../assets/rsvp/parts/rsvp_2594-302_send-btn.webp',
      '!../assets/rsvp/parts/rsvp_2594-304_input.webp',
      '!../assets/rsvp/parts/rsvp_2594-308_input.webp',
      '!../assets/rsvp/parts/rsvp_2594-309_input.webp',
    ],
    { eager: true, import: 'default' },
  ),
) as string[]

bodyImages.push(heroCouple)

const coverLoaded = ref(false)
const bodyLoaded = ref(false)

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = url
    if (img.complete) {
      resolve()
    } else {
      img.onload = () => resolve()
      img.onerror = () => resolve() // resolve even on error so app won't stall
    }
  })
}

export function usePreloadAssets() {
  async function preloadCover() {
    if (coverLoaded.value) return
    await Promise.all(coverImages.map(preloadImage))
    coverLoaded.value = true
  }

  function preloadInviteBody() {
    if (bodyLoaded.value) return
    const loadBody = () => {
      Promise.all(bodyImages.map(preloadImage)).then(() => {
        bodyLoaded.value = true
      })
    }
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadBody, { timeout: 2000 })
    } else {
      setTimeout(loadBody, 200)
    }
  }

  return {
    coverLoaded,
    bodyLoaded,
    preloadCover,
    preloadInviteBody,
  }
}
