<script setup lang="ts">
// Figma Frame 242, y 0–760. Coords are frame-local design px; z matches Figma child order.
import { computed } from 'vue'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

import forest from '../../assets/hero/parts/01_2550-136_css-copy-1.webp' // z12
import couplePlate from '../../assets/footer/parts/21_2594-208_img-8300.webp' // z13, deduped into footer/
import ornateFrame from '../../assets/hero/parts/00_2587-110_group-234.webp' // z14

const { el, shown } = useReveal(0.15)
const { wedding } = useWedding()

/*
 * z13 is the couple's PHOTOGRAPH, not artwork -- the same node the footer band draws
 * (2594:208, deduped into footer/). It has to come from the API, or a real couple's
 * invitation opens on the design's stock portrait. The sliced plate stays as the
 * unconfigured fallback so the render still matches; `object-fit: cover` is what lets a
 * photo of any aspect fill the frame's 342x342 aperture without stretching.
 */
const couple = computed(
  () => (wedding.value?.image_cover as string) || (wedding.value?.image_bg1 as string) || couplePlate,
)
</script>

<template>
  <section :ref="el" class="hero" :class="{ 'is-in': shown }" aria-labelledby="hero-heading">
    <img :src="forest" alt="" width="274" height="457" class="hero__forest" />
    <img :src="couple" alt="Foto mempelai" width="342" height="342" class="hero__couple" />
    <!--
      Group 234 is paper backdrop + ornate frame flattened into one layer with a
      transparent aperture, and it paints ABOVE the two photos — that hole is what
      crops them into the frame. Its export is clipped 38px off the top, so it sits
      at y 0 even though the node reports y -38.
    -->
    <img :src="ornateFrame" alt="" width="375" height="686" class="hero__frame" />
    <h2 id="hero-heading" class="hero__title">
      <span class="hero__line">The Bride &amp;</span>
      <span class="hero__line hero__line--2">The Groom</span>
    </h2>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  height: calc(760 * var(--px));
}

.hero > * {
  position: absolute;
  margin: 0;
}

/*
 * Reveal choreography. Everything below is a transition gated on .is-in, so the
 * resting state is the plain Figma layout — no animation is left applying.
 * The order is deliberate: the moulding settles first, the photograph inside it
 * drifts out of a slow zoom, the couple rises into place, then the title wipes on.
 */
/*
 * The frame layer never fades: outside its aperture it IS the band's opaque
 * paper, so any opacity below 1 ghosts the forest photo's rectangle through it.
 * It only settles out of a slight scale; everything dramatic happens in the hole.
 */
.hero__forest,
.hero__couple,
.hero__line {
  opacity: 0;
}

.hero.is-in .hero__forest,
.hero.is-in .hero__couple,
.hero.is-in .hero__line {
  opacity: 1;
}

.hero.is-in .hero__forest,
.hero.is-in .hero__couple,
.hero.is-in .hero__frame,
.hero.is-in .hero__line {
  transform: none;
}

.hero.is-in .hero__line {
  clip-path: inset(0 0 0 0);
}

.hero__frame {
  top: 0;
  left: 0;
  width: calc(375 * var(--px));
  height: calc(686 * var(--px));
  transform: scale(1.03);
  transition: transform 2000ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hero__forest {
  top: calc(213 * var(--px));
  left: calc(51 * var(--px));
  width: calc(274 * var(--px));
  height: calc(457 * var(--px));
  transform: scale(1.22);
  transition:
    opacity 1600ms ease-out 300ms,
    transform 2600ms cubic-bezier(0.16, 1, 0.3, 1) 300ms;
}

.hero__couple {
  top: calc(270 * var(--px));
  left: calc(17 * var(--px));
  width: calc(342 * var(--px));
  height: calc(342 * var(--px));
  object-fit: cover;
  transform: translateY(calc(34 * var(--px))) scale(1.04);
  transition:
    opacity 1500ms ease-out 900ms,
    transform 1900ms cubic-bezier(0.16, 1, 0.3, 1) 900ms;
}

.hero__title {
  top: calc(95 * var(--px));
  left: calc(58 * var(--px));
  width: calc(269 * var(--px));
  font-family: var(--font-script);
  font-size: calc(40 * var(--px));
  font-weight: 400;
  line-height: calc(40 * var(--px));
  text-align: center;
  color: var(--gold);
}

/* Each line wipes up from its own baseline rather than the block fading in. */
.hero__line {
  display: block;
  clip-path: inset(0 0 110% 0);
  transform: translateY(calc(18 * var(--px)));
  transition:
    opacity 1200ms ease-out 1500ms,
    transform 1400ms cubic-bezier(0.16, 1, 0.3, 1) 1500ms,
    clip-path 1400ms cubic-bezier(0.16, 1, 0.3, 1) 1500ms;
}

.hero__line--2 {
  transition-delay: 1800ms;
}

@media (prefers-reduced-motion: reduce) {
  .hero__forest,
  .hero__couple,
  .hero__frame,
  .hero__line {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .hero__line {
    clip-path: none;
  }
}
</style>
