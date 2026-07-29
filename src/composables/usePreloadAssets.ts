import { ref } from 'vue'

// Assets are discovered by glob so new slices need no edit here.
// Cover = the splash screen; body = the first screens behind it.
const coverImages = Object.values(
  import.meta.glob('../assets/cover/**/*.webp', { eager: true, import: 'default' }),
) as string[]

const bodyImages = Object.values(
  import.meta.glob(
    ['../assets/hero/**/*.webp', '../assets/page/**/*.webp', '../assets/quote/**/*.webp'],
    { eager: true, import: 'default' },
  ),
) as string[]

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
