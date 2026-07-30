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
