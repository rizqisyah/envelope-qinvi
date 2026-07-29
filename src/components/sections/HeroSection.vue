<script setup lang="ts">
// Figma Frame 242, y 0–760. Coords are frame-local design px; z matches Figma child order.
import forest from '../../assets/hero/parts/01_2550-136_css-copy-1.webp' // z12
import couple from '../../assets/footer/parts/21_2594-208_img-8300.webp' // z13, deduped into footer/
import ornateFrame from '../../assets/hero/parts/00_2587-110_group-234.webp' // z14
</script>

<template>
  <section class="hero" aria-labelledby="hero-heading">
    <img :src="forest" alt="" width="274" height="457" class="hero__forest" />
    <img :src="couple" alt="" width="342" height="342" class="hero__couple" />
    <!--
      Group 234 is paper backdrop + ornate frame flattened into one layer with a
      transparent aperture, and it paints ABOVE the two photos — that hole is what
      crops them into the frame. Its export is clipped 38px off the top, so it sits
      at y 0 even though the node reports y -38.
    -->
    <img :src="ornateFrame" alt="" width="375" height="686" class="hero__frame" />
    <h2 id="hero-heading" class="hero__title">The Bride &amp;<br />The Groom</h2>
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

.hero__forest {
  top: calc(213 * var(--px));
  left: calc(51 * var(--px));
  width: calc(274 * var(--px));
  height: calc(457 * var(--px));
}

.hero__couple {
  top: calc(270 * var(--px));
  left: calc(17 * var(--px));
  width: calc(342 * var(--px));
  height: calc(342 * var(--px));
}

.hero__frame {
  top: 0;
  left: 0;
  width: calc(375 * var(--px));
  height: calc(686 * var(--px));
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
</style>
