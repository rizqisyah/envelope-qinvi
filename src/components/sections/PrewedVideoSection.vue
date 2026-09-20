<script setup lang="ts">
import { computed } from 'vue'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'
import ornament from '../../assets/groom/parts/g213_2558-114_ornament.webp'

const { el, shown } = useReveal()
const { videoPrewed, wedding } = useWedding()

const videoSrc = computed(() => ((videoPrewed.value as string) || '').trim())
const hasVideo = computed(() => Boolean(videoSrc.value && videoSrc.value.length > 0))

const poster = computed(() => (wedding.value?.image_cover as string) || undefined)

const youtubeId = computed(() => {
  if (!videoSrc.value) return null
  const match = videoSrc.value.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?/\s]{11})/,
  )
  return match ? match[1] : null
})

const vimeoId = computed(() => {
  if (!videoSrc.value) return null
  const match = videoSrc.value.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match ? match[1] : null
})

function onVolumeChange(e: Event) {
  const v = e.target as HTMLVideoElement
  if (!v.muted && v.volume > 0) {
    document.querySelector('audio')?.pause()
  }
}

function onPlay() {
  document.querySelector('audio')?.pause()
}
</script>

<template>
  <section
    v-if="hasVideo"
    :ref="el"
    class="video-band"
    :class="{ 'is-in': shown }"
    aria-labelledby="prewed-video-heading"
  >
    <div class="video-band__header">
      <p class="video-band__eyebrow">OUR STORY</p>
      <h2 id="prewed-video-heading" class="video-band__title">Prewedding Video</h2>
      <img :src="ornament" alt="" class="video-band__ornament" />
    </div>

    <div class="video-band__card">
      <div class="video-band__player-wrap">
        <iframe
          v-if="youtubeId"
          class="video-band__frame"
          :src="`https://www.youtube.com/embed/${youtubeId}?rel=0&playsinline=1`"
          title="Prewedding Video"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        />
        <iframe
          v-else-if="vimeoId"
          class="video-band__frame"
          :src="`https://player.vimeo.com/video/${vimeoId}`"
          title="Prewedding Video"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        />
        <video
          v-else
          class="video-band__player"
          :src="videoSrc"
          :poster="poster"
          controls
          playsinline
          preload="metadata"
          @volumechange="onVolumeChange"
          @play="onPlay"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.video-band {
  position: relative;
  width: 100%;
  padding-top: calc(16 * var(--px));
  padding-bottom: calc(165 * var(--px));
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: visible;
}

.video-band__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: calc(16 * var(--px));
  opacity: 0;
  transform: translateY(calc(16 * var(--px)));
  transition:
    opacity 1200ms ease-out,
    transform 1400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.video-band.is-in .video-band__header {
  opacity: 1;
  transform: none;
}

.video-band__eyebrow {
  margin: 0;
  font-family: var(--font-eyebrow);
  font-size: calc(11 * var(--px));
  font-weight: 500;
  letter-spacing: 0.2em;
  color: var(--gold);
}

.video-band__title {
  margin: calc(4 * var(--px)) 0 0;
  font-family: var(--font-script);
  font-size: calc(38 * var(--px));
  font-weight: 400;
  line-height: calc(38 * var(--px));
  color: var(--brown-soft);
}

.video-band__ornament {
  width: calc(100 * var(--px));
  height: calc(24 * var(--px));
  margin-top: calc(8 * var(--px));
  object-fit: contain;
  pointer-events: none;
}

.video-band__card {
  position: relative;
  width: calc(325 * var(--px));
  padding: calc(6 * var(--px));
  border-radius: calc(22 * var(--px));
  background: linear-gradient(145deg, #f7f3eb, #ede6d8);
  border: calc(1.5 * var(--px)) solid rgba(172, 111, 40, 0.35);
  box-shadow:
    0 calc(8 * var(--px)) calc(24 * var(--px)) rgba(85, 57, 28, 0.12),
    inset 0 0 0 calc(1 * var(--px)) rgba(255, 255, 255, 0.6);
  opacity: 0;
  transform: translateY(calc(24 * var(--px))) scale(0.97);
  transition:
    opacity 1400ms ease-out 200ms,
    transform 1600ms cubic-bezier(0.16, 1, 0.3, 1) 200ms;
}

.video-band.is-in .video-band__card {
  opacity: 1;
  transform: none;
}

.video-band__player-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: calc(16 * var(--px));
  overflow: hidden;
  background: #18120e;
}

.video-band__frame,
.video-band__player {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  object-fit: cover;
}

@media (prefers-reduced-motion: reduce) {
  .video-band__header,
  .video-band__card {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
