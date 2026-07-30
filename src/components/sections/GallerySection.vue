<script setup lang="ts">
/*
 * Figma Frame 242, y 3501-4052. Coordinates are frame-local minus 3501.
 *
 * This band is a different animal from the ones above it. `2560:183` (Group 219)
 * contains nothing but rounded-rect photo masks and two white circles, so there is
 * no floral z-order to recover -- the whole group ships as ONE plate and the live
 * carousel is overlaid on the slot rects, which are exact (no rotation anywhere in
 * the group). Slot geometry is recorded in .figma-ref/bands/gallery.json.
 *
 * The plate is offset (5, -4) rather than the group box's (12, 0): the rounded rects
 * carry a drop shadow, so the export is 370.5 x 384.5 against a 356.78 x 367 box.
 * Origin read off the main photo's own edges in the export, then confirmed as a
 * clean bowl minimum against the Figma render.
 *
 * With no photos configured the slots fall back to the design's own two shots, cut
 * back out of the plate by scripts/crop-gallery-fallback.py -- so an unconfigured
 * render is still clickable, and still matches Figma in the main slot and in thumbs
 * 1 and 3 exactly. Rows 3868-4052 are bare paper; the design puts no heading here.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

import plate from '../../assets/gallery/parts/01_2560-183_group-219.webp' // z65
import stockCloseup from '../../assets/gallery/fallback/photo-1.webp'
import stockFull from '../../assets/gallery/fallback/photo-2.webp'

// Thumbnail slots, band-local. Every rect in the group has cornerRadius 29.
const THUMB_XS = [43.49, 116.78, 190.07, 263.36]
const THUMB = { y: 296.14, w: 68.82, h: 70.86 }

/*
 * The design alternates two shots across its four thumbnail slots and shows the
 * full-length one in the main slot, so a two-photo fallback with `active` starting
 * at 1 reproduces the composition it was drawn with.
 */
const STOCK = [
  { src: stockCloseup, caption: '' },
  { src: stockFull, caption: '' },
]
const STOCK_ACTIVE = 1

const { el, shown } = useReveal()
const { gallery } = useWedding()

const photos = computed(() => {
  const configured = (gallery.value as any[])
    .map((g) => ({ src: g.image_url as string, caption: (g.caption as string) || '' }))
    .filter((p) => !!p.src)
  return configured.length ? configured : STOCK
})

const active = ref(STOCK_ACTIVE)
watch(photos, (list, was) => {
  // Configured photos arriving replaces the stock pair, so the index restarts.
  active.value = list === STOCK ? STOCK_ACTIVE : was === STOCK ? 0 : Math.min(active.value, list.length - 1)
})

const current = computed(() => photos.value[active.value] ?? photos.value[0])

// Fewer photos than slots repeats the set, which is what the design does.
const thumbs = computed(() =>
  THUMB_XS.map((x, i) => ({ x, index: i % photos.value.length, in: 900 + i * 150 })),
)

function step(delta: number) {
  const n = photos.value.length
  if (n) active.value = (active.value + delta + n) % n
}

function thumbBox(t: { x: number; in: number }) {
  return {
    top: `calc(${THUMB.y} * var(--px))`,
    left: `calc(${t.x} * var(--px))`,
    width: `calc(${THUMB.w} * var(--px))`,
    height: `calc(${THUMB.h} * var(--px))`,
    '--in': `${t.in}ms`,
  }
}

/*
 * The in-band photo is a 307px preview, so tapping it opens a full-size viewer.
 * Teleported: `.sheet` sets `container-type: inline-size`, which makes it the
 * containing block for fixed descendants, and its `overflow: hidden` would then
 * clip the overlay to the card.
 */
const zoomed = ref(false)
const closeButton = ref<HTMLButtonElement | null>(null)
// Whichever slot opened the viewer is where focus goes back to on close.
let opener: HTMLElement | null = null

function preview(e: MouseEvent, index?: number) {
  opener = e.currentTarget as HTMLElement
  if (index !== undefined) active.value = index
  zoomed.value = true
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') zoomed.value = false
  else if (e.key === 'ArrowLeft') step(-1)
  else if (e.key === 'ArrowRight') step(1)
}

watch(zoomed, async (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
  // aria-modal is a promise the markup has to keep: without this, tabbing out of
  // the open viewer walks straight into the sheet behind it.
  await nextTick()
  ;(open ? closeButton.value : opener)?.focus()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <section :ref="el" class="gallery" :class="{ 'is-in': shown }" aria-label="Galeri foto">
    <div class="gallery__stage">
      <img :src="plate" alt="" class="gallery__plate" />

      <template v-if="current">
        <button class="gallery__main" type="button" aria-label="Perbesar foto" @click="preview($event)">
          <img :src="current.src" :alt="current.caption || 'Foto mempelai'" />
        </button>

        <button
          class="gallery__nav gallery__nav--prev"
          type="button"
          aria-label="Foto sebelumnya"
          @click="step(-1)"
        />
        <button
          class="gallery__nav gallery__nav--next"
          type="button"
          aria-label="Foto berikutnya"
          @click="step(1)"
        />

        <button
          v-for="(t, i) in thumbs"
          :key="i"
          class="gallery__thumb"
          type="button"
          :style="thumbBox(t)"
          :aria-label="`Lihat foto ${t.index + 1}`"
          :aria-current="t.index === active"
          @click="preview($event, t.index)"
        >
          <img :src="photos[t.index].src" alt="" />
        </button>
      </template>
    </div>

    <Teleport to="body">
      <div v-if="zoomed && current" class="gl-lightbox" role="dialog" aria-modal="true">
        <button
          ref="closeButton"
          class="gl-lightbox__close"
          type="button"
          aria-label="Tutup"
          @click="zoomed = false"
        >
          &times;
        </button>
        <button class="gl-lightbox__step gl-lightbox__step--prev" type="button" aria-label="Foto sebelumnya" @click="step(-1)">
          &#8249;
        </button>
        <img class="gl-lightbox__photo" :src="current.src" :alt="current.caption || 'Foto mempelai'" />
        <button class="gl-lightbox__step gl-lightbox__step--next" type="button" aria-label="Foto berikutnya" @click="step(1)">
          &#8250;
        </button>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.gallery {
  position: relative;
  height: calc(551 * var(--px));
  overflow: visible;
}

/*
 * Reveal: the stage rises and settles as one piece -- the overlays are glued to
 * the plate's slots, so anything that moves them alone uncovers the baked art
 * underneath. The photos themselves push in from a zoom, which is safe because
 * each slot clips.
 */
.gallery__stage {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translateY(calc(34 * var(--px))) scale(0.94);
  transition:
    opacity 1200ms ease-out,
    transform 1400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.gallery.is-in .gallery__stage {
  opacity: 1;
  transform: none;
}

.gallery__plate {
  position: absolute;
  top: calc(-4 * var(--px));
  left: calc(5 * var(--px));
  width: calc(370.5 * var(--px));
  height: calc(384.5 * var(--px));
  pointer-events: none;
}

.gallery__main,
.gallery__thumb {
  position: absolute;
  padding: 0;
  border: 0;
  overflow: hidden;
  border-radius: calc(29 * var(--px));
  /*
   * Rectangle 118's own fill, so a slow or broken photo degrades to the design's
   * placeholder instead of showing the plate's baked stock couple through the gap.
   */
  background: #d9d9d9;
  cursor: pointer;
}

/* 2560:189, the main mask rect. */
.gallery__main {
  top: 0;
  left: calc(34.05 * var(--px));
  width: calc(307.59 * var(--px));
  height: calc(288.73 * var(--px));
}

.gallery__main img,
.gallery__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  /* The design's masks sit the photo near the top of its slack, not centred. */
  object-fit: cover;
  object-position: 50% 10%;
}

/*
 * Rectangle 118, drawn rather than left to the plate: the main photo overlay
 * covers 20px of the left circle and 15px of the right one, and in Figma both
 * circles paint above the photo. Pure #fff, sampled off the render.
 */
.gallery__nav {
  position: absolute;
  top: calc(122.63 * var(--px));
  width: calc(40.39 * var(--px));
  height: calc(41.28 * var(--px));
  padding: 0;
  border: 0;
  border-radius: calc(29 * var(--px));
  background: #fff;
  cursor: pointer;
}

.gallery__nav--prev {
  left: calc(13.39 * var(--px));
}

.gallery__nav--next {
  left: calc(327.12 * var(--px));
}

.gallery__main:focus-visible,
.gallery__thumb:focus-visible,
.gallery__nav:focus-visible {
  outline: 2px solid var(--brown-soft, #6b5545);
  outline-offset: 2px;
}

/* Per-thumb `--in` comes from thumbBox(); the main slot sets its own. */
.gallery__main img,
.gallery__thumb img {
  transform: scale(1.14);
  transition: transform 2600ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.gallery.is-in .gallery__main img,
.gallery.is-in .gallery__thumb img {
  transform: none;
}

.gallery__main {
  --in: 400ms;
}

.gl-lightbox {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.25rem;
  background: rgb(24 18 14 / 0.92);
}

.gl-lightbox__photo {
  max-width: min(100%, 560px);
  max-height: 86vh;
  object-fit: contain;
  border-radius: 12px;
}

.gl-lightbox__close,
.gl-lightbox__step {
  flex: none;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.14);
  color: #fff;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.gl-lightbox__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

@media (prefers-reduced-motion: reduce) {
  .gallery__stage,
  .gallery__main img,
  .gallery__thumb img {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
