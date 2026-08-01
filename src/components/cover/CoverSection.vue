<script setup lang="ts">
import { useWedding } from '../../composables/useWedding'

import paperBg from '../../assets/opening/parts/00_2548-133_paper-bg.webp'
import envelope from '../../assets/opening/parts/01_2588-122_envelope.webp'
import seal from '../../assets/opening/parts/02_2588-126_seal.webp'
import lily from '../../assets/opening/parts/03_2588-124_lily.webp'

defineProps<{ guestName: string }>()
defineEmits<{ open: [] }>()

const { coupleNickname } = useWedding()
</script>

<template>
  <!-- Figma Frame 241 (2548:110), 375 x 725. Coords below are frame-local design px. -->
  <section class="opening" :style="{ backgroundImage: `url(${paperBg})` }">
    <div class="opening__frame">
      <p class="opening__eyebrow">THE WEDDING OF</p>
      <h1 class="opening__couple">{{ coupleNickname }}</h1>

      <button type="button" class="opening__envelope" @click="$emit('open')">
        <span class="sr-only">Buka undangan</span>
        <img :src="envelope" alt="" width="361" height="361" class="opening__envelope-img" />
        <img :src="seal" alt="" width="65" height="82" class="opening__seal" />
      </button>

      <img :src="lily" alt="" width="264" height="166" class="opening__lily" />

      <span class="opening__hint">Click to open&hellip;</span>

      <p class="opening__dear">Dear Mr/ Mrs/ Ms</p>
      <p class="opening__guest">{{ guestName }}</p>
    </div>
  </section>
</template>

<style scoped>
.opening {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100dvh;
  background-color: var(--paper, #efe7dc);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

/*
 * One design pixel = 1cqw / 3.75. Every child is placed in those units so the
 * whole composition scales as a unit instead of reflowing.
 * Width is capped so 725 design px never exceeds the viewport height.
 */
.opening__frame {
  container-type: inline-size;
  position: relative;
  /* --card-max is enforced by the column, not here — see InviteBody's `.sheet`. */
  width: min(100%, calc(100dvh * 375 / 725));
  aspect-ratio: 375 / 725;
}

.opening__frame > * {
  --px: 0.26667cqw; /* 100cqw / 375 */
  --delay: 0ms;
  position: absolute;
  margin: 0;
  text-align: center;
  animation: rise 1400ms cubic-bezier(0.16, 1, 0.3, 1) var(--delay) backwards;
}

/*
 * `backwards`, not `forwards`: the end state is the element's normal state, so
 * once the animation finishes it stops applying and the envelope's hover
 * transition gets its transform back.
 */
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(calc(26 * var(--px)));
  }
}

@keyframes seal-drop {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
}

.opening__eyebrow {
  --delay: 200ms;
  top: calc(154 * var(--px));
  left: calc(53 * var(--px));
  width: calc(269 * var(--px));
  font-family: var(--font-eyebrow);
  font-size: calc(15 * var(--px));
  line-height: calc(30 * var(--px));
  letter-spacing: 0.1em;
  color: var(--gold);
}

.opening__couple {
  --delay: 430ms;
  top: calc(195 * var(--px));
  left: calc(53 * var(--px));
  width: calc(269 * var(--px));
  font-family: var(--font-script);
  font-size: calc(40 * var(--px));
  font-weight: 400;
  line-height: calc(27 * var(--px));
  color: var(--gold);
}

.opening__envelope {
  --delay: 640ms;
  top: calc(173 * var(--px));
  left: calc(10 * var(--px));
  width: calc(361 * var(--px));
  height: calc(361 * var(--px));
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.opening__envelope:hover,
.opening__envelope:focus-visible {
  transform: translateY(calc(-4 * var(--px)));
}

.opening__envelope:active {
  transform: translateY(0) scale(0.985);
}

.opening__envelope:focus-visible {
  outline: calc(2 * var(--px)) solid var(--gold);
  outline-offset: calc(4 * var(--px));
  border-radius: calc(4 * var(--px));
}

.opening__envelope-img {
  width: 100%;
  height: 100%;
}

/* Seal sits at frame (162, 346); the button starts at (10, 173). */
.opening__seal {
  position: absolute;
  top: calc(173 * var(--px));
  left: calc(152 * var(--px));
  width: calc(65 * var(--px));
  height: calc(82 * var(--px));
  animation: seal-drop 1100ms cubic-bezier(0.34, 1.5, 0.5, 1) 1240ms backwards;
}

.opening__lily {
  --delay: 1020ms;
  top: calc(386 * var(--px));
  left: calc(56 * var(--px));
  width: calc(264 * var(--px));
  height: calc(165.5 * var(--px));
  pointer-events: none;
}

.opening__hint {
  --delay: 1460ms;
  top: calc(463 * var(--px));
  left: calc(25 * var(--px));
  width: calc(133 * var(--px));
  font-family: var(--font-sans);
  font-size: calc(15 * var(--px));
  line-height: calc(30 * var(--px));
  letter-spacing: 0.02em;
  color: var(--gold);
  pointer-events: none;
  /* Breathes after it lands — the only affordance cue on the screen. */
  animation:
    rise 1400ms cubic-bezier(0.16, 1, 0.3, 1) var(--delay) backwards,
    hint-breathe 3000ms ease-in-out 3000ms infinite;
}

@keyframes hint-breathe {
  50% {
    opacity: 0.45;
  }
}

/* -2px against the Figma box: Platypi/Poltawski sit 2px lower than Figma's auto line box. */
.opening__dear {
  --delay: 1620ms;
  top: calc(532 * var(--px));
  left: calc(91 * var(--px));
  width: calc(193 * var(--px));
  font-family: var(--font-serif-soft);
  font-size: calc(14 * var(--px));
  line-height: calc(25 * var(--px));
  color: var(--rose-muted);
}

.opening__guest {
  --delay: 1800ms;
  top: calc(553 * var(--px));
  left: calc(106 * var(--px));
  width: calc(163 * var(--px));
  font-family: var(--font-guest);
  font-size: calc(16 * var(--px));
  line-height: calc(25 * var(--px));
  color: var(--rose-muted);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .opening__frame > *,
  .opening__seal,
  .opening__hint {
    animation: none;
  }

  .opening__envelope {
    transition: none;
  }

  .opening__envelope:hover,
  .opening__envelope:focus-visible,
  .opening__envelope:active {
    transform: none;
  }
}
</style>
