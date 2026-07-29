<script setup lang="ts">
import { useWedding } from '../../composables/useWedding'

defineProps<{ guestName: string }>()
defineEmits<{ open: [] }>()

const { coupleNickname } = useWedding()
</script>

<template>
  <!-- Stub: real cover is Frame 242 y 760–1000 (white envelope + stamp + seal). -->
  <section class="cover">
    <p class="cover__eyebrow">The Wedding Of</p>
    <h1 class="cover__title">{{ coupleNickname }}</h1>
    <p class="cover__guest">Kepada Yth. {{ guestName }}</p>
    <button type="button" class="cover__open" @click="$emit('open')">Buka Undangan</button>
  </section>
</template>

<style scoped>
.cover {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 100vh;
  padding: 32px;
  text-align: center;
  background: #f2efe9;
}

.cover__eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #8a7f6d;
}

.cover__title {
  margin: 0;
  font-family: var(--font-script, cursive);
  font-size: 44px;
  font-weight: normal;
  color: #a8752f;
}

.cover__guest {
  margin: 0;
  font-size: 14px;
  color: #5c5344;
}

.cover__open {
  margin-top: 8px;
  padding: 10px 28px;
  border: 1px solid #a8752f;
  border-radius: 999px;
  background: transparent;
  font-size: 13px;
  letter-spacing: 0.08em;
  color: #a8752f;
  cursor: pointer;
  transition: background-color 200ms ease, color 200ms ease;
}

.cover__open:hover,
.cover__open:focus-visible {
  background: #a8752f;
  color: #f2efe9;
}
</style>
