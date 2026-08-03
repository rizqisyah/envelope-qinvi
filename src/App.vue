<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useWedding } from './composables/useWedding'
import { usePreloadAssets } from './composables/usePreloadAssets'
import CoverSection from './components/cover/CoverSection.vue'
import VideoSection from './components/sections/VideoSection.vue'
import InviteBody from './components/invite/InviteBody.vue'
import BottomNav from './components/sections/BottomNav.vue'

const isOpen = ref(false)
const isLocked = ref(true)
const contentVisible = ref(false)
const { wedding, coupleNickname, quoteText, quoteVerse } = useWedding()
const { preloadCover, preloadInviteBody } = usePreloadAssets()

onMounted(async () => {
  await preloadCover()
  preloadInviteBody()
})

const guestName = computed(() => {
  const urlParam = new URLSearchParams(location.search).get('to')
  return urlParam || 'Nama Tamu'
})

async function openInvitation() {
  isOpen.value = true
  await nextTick()
  requestAnimationFrame(() => {
    contentVisible.value = true
  })
}

function onSplashLeave() {
  isLocked.value = false
}

const leftBackgroundStyle = computed(() => {
  const img = wedding.value?.image_bg1 || wedding.value?.image_cover || ''
  return img ? { backgroundImage: `url(${img})` } : {}
})
</script>

<template>
  <main class="app-shell">
    <!-- Left Column (Desktop Only) -->
    <div class="desktop-left-column" :style="leftBackgroundStyle">
      <div class="left-overlay"></div>
      <div class="left-content">
        <div class="left-header">
          <p class="left-subtitle">THE WEDDING OF</p>
          <h1 class="left-title">{{ coupleNickname }}</h1>
        </div>
        <div class="left-quote-container">
          <p class="left-quote">“{{ quoteText }}”</p>
          <span class="left-quote-verse">{{ quoteVerse }}</span>
        </div>
      </div>
    </div>

    <!-- Right Column / Invitation Canvas -->
    <div class="desktop-right-column" :class="{ 'is-locked': isLocked }">
      <Transition name="splash" @after-leave="onSplashLeave">
        <CoverSection v-if="!isOpen" :guest-name="guestName" @open="openInvitation" />
      </Transition>

      <div
        v-show="isOpen"
        id="invite"
        class="invitation-content"
        :class="{ 'is-visible': contentVisible }"
      >
        <VideoSection />
        <InviteBody />
      </div>

      <BottomNav v-if="isOpen" />
    </div>
  </main>
</template>

<style>
/*
 * The cover pushes past the viewer rather than sliding away — it reads as moving
 * through the envelope into the invitation, which then rises out of the blur.
 */
.splash-leave-active {
  transition:
    opacity 1.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 1.4s cubic-bezier(0.16, 1, 0.3, 1),
    filter 1.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: opacity, transform, filter;
}

.splash-leave-to {
  opacity: 0 !important;
  transform: scale(1.16) !important;
  filter: blur(14px) !important;
}

/* Cinematic entrance for Invitation Content */
/* Held back 0.45s so the cover has visibly receded before this rises to meet it. */
.invitation-content {
  opacity: 0;
  transform: translateY(28px) scale(0.965);
  filter: blur(10px);
  transition:
    opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.45s,
    transform 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s,
    filter 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.45s;
  will-change: opacity, transform, filter;
}

.invitation-content.is-visible {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

@media (prefers-reduced-motion: reduce) {
  .splash-leave-active,
  .invitation-content {
    transition: opacity 0.2s linear !important;
  }

  .splash-leave-to {
    transform: none !important;
    filter: none !important;
  }

  .invitation-content {
    transform: none;
    filter: none;
  }
}

@media (min-width: 768px) {
  .app-shell {
    display: flex;
    flex-direction: row;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #1a1a1a;
  }

  .desktop-left-column {
    display: flex;
    flex: 1;
    height: 100vh;
    position: relative;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    background-color: #3b4030;
    color: #fff;
    overflow: hidden;
  }

  .left-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1;
  }

  .left-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    width: 100%;
    padding: 60px;
    box-sizing: border-box;
  }

  .left-subtitle {
    font-size: 14px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    opacity: 0.9;
    margin-bottom: 16px;
    font-family: var(--font-hand, serif);
  }

  .left-title {
    font-size: 56px;
    line-height: 1.2;
    margin: 0;
    font-family: var(--font-script, cursive);
    font-weight: normal;
    color: var(--gold, #d9bf9d);
  }

  .left-quote-container {
    max-width: 480px;
    margin-top: auto;
    margin-bottom: 40px;
  }

  .left-quote {
    font-size: 15px;
    font-style: italic;
    line-height: 1.6;
    margin-bottom: 12px;
    opacity: 0.9;
  }

  .left-quote-verse {
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 0.05em;
    opacity: 0.8;
    text-transform: uppercase;
  }

  /* Exactly --card-max: the sheet fills it, so the art has no gutter beside it. */
  .desktop-right-column {
    width: var(--card-max, 430px);
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    background: #f2efe9;
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.3);
  }

  .desktop-right-column.is-locked {
    overflow: hidden !important;
  }
}

@media (max-width: 767px) {
  .app-shell {
    width: 100%;
    overflow-x: hidden;
  }

  .desktop-left-column {
    display: none;
  }

  .desktop-right-column {
    width: 100%;
    overflow-x: hidden;
  }

  .desktop-right-column.is-locked {
    overflow: hidden !important;
    height: 100vh;
  }
}
</style>
