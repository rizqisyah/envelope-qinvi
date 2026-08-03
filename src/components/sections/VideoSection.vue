<script setup lang="ts">
/*
 * An addition: Frame 242 draws no video band. It sits above the sheet rather than inside
 * it, because every band in the sheet is placed in raw Figma coordinates against
 * backdrops pinned to absolute y -- inserting a band at the top would slide all fourteen
 * of them out from under their own artwork.
 *
 * A full-height opening shot: it fills the invitation column, autoplays once, and then
 * hands over to the invitation by scrolling the hero into place -- it does not loop, so
 * a guest is never stuck watching it repeat to get past it.
 *
 * Autoplay only survives a browser if it is muted, so it starts muted and keeps its
 * controls -- that is the one affordance that lets a guest turn the sound on. Unmuting
 * is what pauses the background music, not playback itself, or the music would die the
 * moment the invitation opened.
 */
import { computed } from 'vue'
import { useWedding } from '../../composables/useWedding'

const { wedding } = useWedding()

const src = computed(() => (wedding.value?.video_url as string) || '')
const poster = computed(() => (wedding.value?.image_cover as string) || undefined)

/*
 * BottomNav owns the <audio> and mirrors its state off the element's own `pause` event,
 * so pausing the element here is enough to flip its control back -- no shared store for
 * one interaction between two components that never meet.
 */
function onVolume(e: Event) {
  const v = e.target as HTMLVideoElement
  if (!v.muted && v.volume > 0) document.querySelector('audio')?.pause()
}

/** Same move BottomNav's own nav makes, so arriving at the hero looks identical either way. */
function onEnded() {
  const hero = document.querySelector('.hero')
  if (!hero) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  hero.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <section v-if="src" class="video" aria-label="Video pernikahan">
    <video
      class="video__player"
      :src="src"
      :poster="poster"
      autoplay
      muted
      controls
      playsinline
      preload="auto"
      @volumechange="onVolume"
      @ended="onEnded"
    />
  </section>
</template>

<style scoped>
/*
 * svh, not vh: on mobile the toolbar makes vh taller than what is actually on screen, so
 * a 100vh band gets its bottom cropped for as long as the toolbar is showing. #1a1a1a
 * matches the desktop shell, so a portrait clip letterboxes into the same dark surround.
 */
.video {
  position: relative;
  height: 100vh;
  height: 100svh;
  background: #1a1a1a;
}

.video__player {
  display: block;
  width: 100%;
  height: 100%;
  /* cover, so the clip fills the column edge to edge like a title card. */
  object-fit: cover;
}
</style>
