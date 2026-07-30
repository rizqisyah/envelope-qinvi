<script setup lang="ts">
/*
 * An addition: Frame 242 draws no bottom nav. Its own final bar is part of the footer
 * band (IG/WA buttons), so nothing here is sliced -- the palette is taken from the
 * design's own fills (#f7f3dc the gift plate, #cdc2ae the wish card stroke, #55391c and
 * #4d4d2d the two text browns) so it reads as belonging to the invitation.
 *
 * Three things template-2's version got wrong and this does not:
 *   - its `active` ref was assigned once and never updated, so the is-active state was
 *     dead paint. This runs a real IntersectionObserver over the band elements.
 *   - it autoplayed on mount, which browsers block, and fell back to a hardcoded MP3 on
 *     someone else's worker. Here the control only exists when the API supplies
 *     `wedding.music_url`, and playback is attempted once -- opening the invitation is a
 *     user gesture, so it is allowed -- then left to the button if that fails.
 *   - it was `position: fixed` with a `right: 240px !important` desktop patch, because
 *     on desktop the scroller is the 480px right column, not the viewport. Here the two
 *     layouts get the position each one actually needs, by media query -- see the style
 *     block, which explains why neither one works for both.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useWedding } from '../../composables/useWedding'

const { wedding } = useWedding()

const musicUrl = computed(() => (wedding.value?.music_url as string) || '')

/** One entry per destination; the target is the band's own class, which it already sets. */
const ITEMS = [
  { key: 'hero', target: '.hero', label: 'Awal' },
  { key: 'groom', target: '.groom', label: 'Mempelai' },
  { key: 'akad', target: '.akad', label: 'Acara' },
  { key: 'gallery', target: '.gallery', label: 'Galeri' },
  { key: 'wish', target: '.wish', label: 'Ucapan' },
] as const

const active = ref<string>('hero')
const audioEl = ref<HTMLAudioElement | null>(null)
const playing = ref(false)

let obs: IntersectionObserver | null = null

function goTo(target: string) {
  const el = document.querySelector(target)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

async function play() {
  if (!audioEl.value) return
  try {
    await audioEl.value.play()
  } catch {
    // Autoplay refused. The button is the fallback, so there is nothing to report.
  }
}

function toggleMusic() {
  if (!audioEl.value) return
  if (playing.value) audioEl.value.pause()
  else play()
}

onMounted(() => {
  if (musicUrl.value) play()

  /*
   * The bands run 240-940 design px tall, so "which one is on screen" has to be decided
   * by a band crossing a line a third of the way down the viewport -- a band taller than
   * the viewport can never satisfy a percentage threshold.
   */
  obs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const hit = ITEMS.find((i) => e.target.matches(i.target))
        if (hit) active.value = hit.key
      }
    },
    { rootMargin: '-33% 0px -60% 0px' },
  )
  for (const i of ITEMS) {
    const el = document.querySelector(i.target)
    if (el) obs.observe(el)
  }
})

onBeforeUnmount(() => {
  obs?.disconnect()
  audioEl.value?.pause()
})
</script>

<template>
  <nav class="nav" aria-label="Navigasi undangan">
    <ul class="nav__list">
      <li v-for="item in ITEMS" :key="item.key" class="nav__item">
        <button
          class="nav__btn"
          :class="{ 'is-active': active === item.key }"
          type="button"
          :aria-current="active === item.key ? 'true' : undefined"
          @click="goTo(item.target)"
        >
          <svg class="nav__icon" viewBox="0 0 24 24" aria-hidden="true">
            <template v-if="item.key === 'hero'">
              <path d="M3 11.5 12 3.5l9 8" />
              <path d="M5.5 10.8V20h13V10.8" />
            </template>
            <template v-else-if="item.key === 'groom'">
              <circle cx="8" cy="7" r="3" />
              <circle cx="16" cy="7" r="3" />
              <path
                d="M3 20v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2M13 20v-2a4 4 0 0 1 4-4a4 4 0 0 1 4 4v2"
              />
            </template>
            <template v-else-if="item.key === 'akad'">
              <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
              <path d="M8 3v3M16 3v3M3.5 10h17" />
            </template>
            <template v-else-if="item.key === 'gallery'">
              <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="m4.5 17 4.2-4.2a1.8 1.8 0 0 1 2.5 0L19.5 21" />
            </template>
            <template v-else>
              <path d="M4 5.5h16v10.5H12l-4.5 4v-4H4z" />
            </template>
          </svg>
          <span class="nav__label">{{ item.label }}</span>
        </button>
      </li>

      <li v-if="musicUrl" class="nav__item">
        <button
          class="nav__btn nav__btn--music"
          type="button"
          :aria-pressed="playing ? 'true' : 'false'"
          @click="toggleMusic"
        >
          <svg class="nav__icon" viewBox="0 0 24 24" aria-hidden="true">
            <template v-if="playing">
              <rect x="7" y="4.5" width="3.4" height="15" rx="1" />
              <rect x="13.6" y="4.5" width="3.4" height="15" rx="1" />
            </template>
            <template v-else>
              <path d="M7 4.5 19 12 7 19.5z" />
            </template>
          </svg>
          <span class="nav__label">{{ playing ? 'Jeda' : 'Musik' }}</span>
        </button>
      </li>
    </ul>

    <audio
      v-if="musicUrl"
      ref="audioEl"
      :src="musicUrl"
      loop
      preload="none"
      @play="playing = true"
      @pause="playing = false"
    />
  </nav>
</template>

<style scoped>
/*
 * The two layouts scroll different elements, so they need different positioning -- but
 * by media query, not by the `right: 240px !important` patch template-2 used.
 *
 * Mobile: the page scrolls and the nav's parent is not the scroller, so `sticky` would
 * do nothing at all. A sticky element cannot leave its containing block, and this one is
 * the last child of that block -- zero range. `fixed` against the viewport is correct
 * here, and the invitation is full-width, so centring on the viewport centres on it.
 */
.nav {
  position: fixed;
  bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  z-index: 40;
  /* The invitation sheet is centred at the same max width, so the nav tracks it. */
  width: min(calc(100% - 28px), 402px);
  transform: translateX(-50%);
  border: 1px solid #cdc2ae;
  border-radius: 26px;
  background: #f7f3dcf2;
  backdrop-filter: blur(6px);
  box-shadow: 0 6px 22px rgba(60, 45, 20, 0.18);
}

/*
 * Desktop: `.desktop-right-column` IS the scroller, and it is also the nav's containing
 * block -- the one case where sticky spans the entire scroll. Fixed here would centre on
 * the 1440px viewport and land over the left-hand column instead.
 */
@media (min-width: 768px) {
  .nav {
    position: sticky;
    left: auto;
    margin: 0 auto calc(14px + env(safe-area-inset-bottom, 0px));
    transform: none;
  }
}

.nav__list {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nav__item {
  flex: 1;
  min-width: 0;
}

.nav__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  /* 52 puts the whole target above the 44px floor without a taller pill. */
  width: 100%;
  height: 52px;
  padding: 0;
  border: 0;
  border-radius: 26px;
  background: none;
  color: #8a5d30;
  cursor: pointer;
  transition:
    color 200ms ease-out,
    transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.nav__btn:hover,
.nav__btn:focus-visible {
  color: #55391c;
}

.nav__btn:active {
  transform: scale(0.94);
}

.nav__btn:focus-visible {
  outline: 2px solid #4d4d2d;
  outline-offset: -3px;
}

/* The active band takes the olive the arch and the gift tab use, plus a rule under it. */
.nav__btn.is-active {
  color: #4d4d2d;
}

.nav__btn.is-active .nav__label::after {
  transform: scaleX(1);
}

.nav__icon {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* The two music glyphs are solid shapes rather than strokes. */
.nav__btn--music .nav__icon rect,
.nav__btn--music .nav__icon path {
  fill: currentColor;
  stroke: none;
}

.nav__label {
  position: relative;
  font-family: var(--font-sans);
  font-size: 10px;
  line-height: 1.1;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.nav__label::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -3px;
  left: 0;
  height: 1.5px;
  border-radius: 1px;
  background: currentColor;
  transform: scaleX(0);
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  .nav__btn,
  .nav__label::after {
    transition: none;
  }
}
</style>
