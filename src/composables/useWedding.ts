import { ref, computed, onMounted } from 'vue'
import { resolveSlug, getHome, submitUcapan } from '../lib/api'

const state = ref<{
  loading: boolean
  error: string | null
  data: any | null
}>({
  loading: true,
  error: null,
  data: null,
})

function applyTheme(themeData: any, weddingData: any) {
  const cfg = themeData?.theme_config
  let override = weddingData?.theme_override
  if (typeof override === 'string') {
    try {
      override = JSON.parse(override)
    } catch {
      override = {}
    }
  }
  override = override || {}

  const root = document.documentElement
  const colors = { ...(cfg?.colors || {}), ...(override?.colors || {}) }
  const fonts = { ...(cfg?.fonts || {}), ...(override?.fonts || {}) }

  // Map Colors
  if (colors.primary) root.style.setProperty('--maroon-title', colors.primary)
  if (colors.secondary) root.style.setProperty('--maroon-text', colors.secondary)
  if (colors.accent) root.style.setProperty('--gold', colors.accent)
  if (colors.bg_body) root.style.setProperty('--bg-body', colors.bg_body)
  if (colors.brown_deep) root.style.setProperty('--brown-deep', colors.brown_deep)
  if (colors.brown_title) root.style.setProperty('--brown-title', colors.brown_title)
  if (colors.brown_mid) root.style.setProperty('--brown-mid', colors.brown_mid)
  if (colors.brown_soft) root.style.setProperty('--brown-soft', colors.brown_soft)
  if (colors.olive) root.style.setProperty('--olive', colors.olive)
  if (colors.paper) root.style.setProperty('--paper', colors.paper)

  // Map Fonts
  if (fonts.script) root.style.setProperty('--font-script', fonts.script)
  if (fonts.serif) root.style.setProperty('--font-serif', fonts.serif)
  if (fonts.serif_alt) root.style.setProperty('--font-serif-alt', fonts.serif_alt)
  if (fonts.serif_bold) root.style.setProperty('--font-serif-bold', fonts.serif_bold)
  if (fonts.caps || fonts.headline) root.style.setProperty('--font-caps', fonts.caps || fonts.headline)
  if (fonts.hand) root.style.setProperty('--font-hand', fonts.hand)
  if (fonts.sans || fonts.body) root.style.setProperty('--font-sans', fonts.sans || fonts.body)
  if (fonts.arabic) root.style.setProperty('--font-arabic', fonts.arabic)
  if (fonts.quran) root.style.setProperty('--font-quran', fonts.quran)
  if (fonts.eyebrow) root.style.setProperty('--font-eyebrow', fonts.eyebrow)
  if (fonts.serif_soft) root.style.setProperty('--font-serif-soft', fonts.serif_soft)
  if (fonts.guest) root.style.setProperty('--font-guest', fonts.guest)
  if (fonts.quote) root.style.setProperty('--font-quote', fonts.quote)
  if (fonts.thanks) root.style.setProperty('--font-thanks', fonts.thanks)

  // Dynamic Google Font loader if custom font URL is provided
  if (override?.google_fonts_url) {
    const linkId = 'custom-theme-google-font'
    let link = document.getElementById(linkId) as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = override.google_fonts_url
  }
}

/*
 * 18 components call useWedding(), and they all mount in the same tick. The old guard
 * checked `state.loading`, which is still true at that point for every one of them, so
 * all 18 fired the same getHome request. Hold the first promise instead: the other 17
 * mounts see it and skip. Only the explicit `refetch` bypasses this.
 */
let inflight: Promise<void> | null = null

export function useWedding() {
  const slug = ref(resolveSlug())
  const guestCode = ref(new URLSearchParams(window.location.search).get('to') || '')

  async function fetchWeddingData() {
    state.value.loading = true
    state.value.error = null
    try {
      const data = await getHome(slug.value, guestCode.value)
      state.value.data = data
      if (data?.theme || data?.wedding) {
        applyTheme(data.theme, data.wedding)
      }
      if (data?.wedding?.title) {
        document.title = `${data.wedding.title} - Undangan Pernikahan`
      }
    } catch (err: any) {
      console.error('Failed to load wedding data:', err)
      state.value.error = err.message
    } finally {
      state.value.loading = false
    }
  }

  onMounted(() => {
    if (state.value.data) return
    inflight ??= fetchWeddingData().finally(() => {
      inflight = null
    })
  })

  const wedding = computed(() => state.value.data?.wedding ?? null)
  const theme = computed(() => state.value.data?.theme ?? null)
  const guest = computed(() => state.value.data?.guest ?? null)
  /*
   * getHome nests every list under `data.content` -- these were read straight off `data`,
   * so all five were permanently empty. No pixel diff could catch it: an empty list falls
   * back to the design's own copy and scores perfectly. Same class of bug as the `ucapan`
   * / `wishes` guess below. Read `content` first, then the flat key, so a payload of
   * either shape works.
   */
  const content = computed(() => state.value.data?.content ?? state.value.data ?? null)
  const pengantin = computed(() => content.value?.pengantin ?? [])
  const acara = computed(() => content.value?.acara ?? [])
  const gallery = computed(() => content.value?.gallery ?? [])
  // The API calls the account list `rekening`.
  const gift = computed(() => content.value?.rekening ?? content.value?.gift ?? [])
  const wishes = computed(() => content.value?.ucapan ?? content.value?.wishes ?? [])

  /**
   * Post a wish and get it into the list without a refetch. The API may answer with the
   * refreshed list, with just the created row, or with neither, so all three are handled
   * — otherwise a guest submits and sees nothing happen.
   */
  // Writes `ucapan` back where `content` reads it from, or the new row is invisible.
  function putWishes(list: any[]) {
    const data = state.value.data
    state.value.data = data.content
      ? { ...data, content: { ...data.content, ucapan: list } }
      : { ...data, ucapan: list }
  }

  async function sendWish(body: { guest_name: string; message: string }): Promise<any> {
    const res = await submitUcapan(slug.value, body)
    if (!state.value.data) return res

    const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : null
    if (list) {
      putWishes(list)
      return res
    }

    const row =
      res?.data && typeof res.data === 'object' && !Array.isArray(res.data)
        ? res.data
        : { id: `local-${Date.now()}`, ...body, created_at: new Date().toISOString() }
    putWishes([row, ...(Array.isArray(wishes.value) ? wishes.value : [])])
    return res
  }

  const groom = computed(() => pengantin.value.find((p: any) => p.type === 'groom') || null)
  const bride = computed(() => pengantin.value.find((p: any) => p.type === 'bride') || null)

  const coupleNickname = computed(() => {
    if (wedding.value?.title) return wedding.value.title
    if (groom.value?.name && bride.value?.name) {
      return `${groom.value.name.split(' ')[0]} & ${bride.value.name.split(' ')[0]}`
    }
    return 'Pengantin'
  })

  const quoteText = computed(
    () =>
      wedding.value?.theme_override?.words?.quote_text ||
      wedding.value?.theme_override?.quote?.text ||
      wedding.value?.theme_override?.quote_text ||
      'Di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri agar kamu merasa tenteram kepadanya. Dia menjadikan di antaramu rasa cinta dan kasih sayang. Sesungguhnya pada yang demikian itu benar-benar terdapat tanda-tanda kebesaran Allah bagi kaum yang berpikir.',
  )
  const quoteVerse = computed(
    () =>
      wedding.value?.theme_override?.words?.quote_verse ||
      wedding.value?.theme_override?.quote?.verse ||
      wedding.value?.theme_override?.quote_verse ||
      'QS Ar-Rum 21',
  )
  const quoteArabic = computed(
    () =>
      wedding.value?.theme_override?.words?.quote_arabic ||
      wedding.value?.theme_override?.quote?.arabic ||
      wedding.value?.theme_override?.quote_arabic ||
      'وَمِنْ اٰيٰتِهٖٓ اَنْ خَلَقَ لَكُمْ مِّنْ اَنْفُسِكُمْ اَزْوَاجًا لِّتَسْكُنُوْٓا اِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَّوَدَّةً وَّرَحْمَةًۗ اِنَّ فِيْ ذٰلِكَ لَاٰيٰتٍ لِّقَوْمٍ يَّتَفَكَّرُوْنَ',
  )

  const invitePhoto = computed(
    () =>
      (wedding.value?.theme_override?.images?.foto_mempelai_setelah_buka as string) ||
      (wedding.value?.theme_override?.backgrounds?.cover as string) ||
      (wedding.value?.image_cover as string) ||
      (wedding.value?.image_bg1 as string) ||
      null,
  )

  const spousePhoto = computed(
    () =>
      (wedding.value?.image_spouse as string) ||
      (wedding.value?.theme_override?.images?.foto_mempelai_setelah_buka as string) ||
      invitePhoto.value,
  )

  return {
    slug,
    guestCode,
    loading: computed(() => state.value.loading),
    error: computed(() => state.value.error),
    wedding,
    theme,
    guest,
    pengantin,
    acara,
    gallery,
    gift,
    wishes,
    sendWish,
    groom,
    bride,
    invitePhoto,
    spousePhoto,
    coupleNickname,
    quoteText,
    quoteVerse,
    quoteArabic,
    refetch: fetchWeddingData,
  }
}
