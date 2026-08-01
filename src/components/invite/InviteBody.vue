<script setup lang="ts">
// The invitation sheet: Figma Frame 242, 375 x 8749.
// One component per band of the frame; each one positions its own children
// relative to its own top, so inserting a band never renumbers the others.
// Band map and asset inventory: ../../../SLICING.md
import HeroSection from '../sections/HeroSection.vue'
import EnvelopeSection from '../sections/EnvelopeSection.vue'
import GroomSection from '../sections/GroomSection.vue'
import DividerSection from '../sections/DividerSection.vue'
import BrideSection from '../sections/BrideSection.vue'
import GlimpseSection from '../sections/GlimpseSection.vue'
import GallerySection from '../sections/GallerySection.vue'
import AkadSection from '../sections/AkadSection.vue'
import ResepsiSection from '../sections/ResepsiSection.vue'
import CountdownSection from '../sections/CountdownSection.vue'
import GiftSection from '../sections/GiftSection.vue'
import RsvpSection from '../sections/RsvpSection.vue'
import WishSection from '../sections/WishSection.vue'
import FooterSection from '../sections/FooterSection.vue'

import paperBg from '../../assets/page/parts/00_2550-130_paper-bg.webp' // z0, y 13
import quoteBg from '../../assets/quote/parts/00_2588-125_bac-2.webp' // z1, (-16, 679)
import bgStrip from '../../assets/page/parts/01_2560-276_bg-strip.webp' // z3, y 2821

</script>

<template>
  <div class="sheet">
    <!--
      Figma z0/z1: page-wide backdrops that bleed across band boundaries, so they
      live on the sheet rather than in any one section.
    -->
    <div class="sheet__backdrop" aria-hidden="true">
      <img :src="paperBg" alt="" class="sheet__paper" />
      <img :src="quoteBg" alt="" width="375" height="704" class="sheet__quote-bg" />
      <img :src="bgStrip" alt="" width="375" height="5928" class="sheet__strip" />
    </div>

    <HeroSection />
    <EnvelopeSection />
    <GroomSection />
    <DividerSection />
    <BrideSection />
    <GlimpseSection />
    <GallerySection />
    <AkadSection />
    <ResepsiSection />
    <CountdownSection />
    <GiftSection />
    <RsvpSection />
    <WishSection />
    <FooterSection />

  </div>
</template>

<style scoped>
/*
 * One design pixel = 1cqw / 3.75, same unit CoverSection uses. Declared once here
 * so every band inherits it and can place children in raw Figma coordinates.
 */
.sheet {
  container-type: inline-size;
  position: relative;
  /*
   * Full-bleed: the sheet fills its column edge to edge. The cap lives on
   * `.desktop-right-column` instead — capping it here left cream gutters either
   * side of the art on any viewport between --card-max and the 768px breakpoint.
   */
  width: 100%;
  overflow: hidden;
  background: var(--paper, #efe7dc);
}

.sheet > * {
  --px: 0.26667cqw;
}

.sheet__backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Both backdrops are scale-1 exports — see SLICING.md before re-exporting. */
.sheet__paper {
  position: absolute;
  top: calc(13 * var(--px));
  left: 0;
  width: 100%;
  height: auto;
}

/* Node is 422 wide at x -16, but the export came back clipped to the frame. */
.sheet__quote-bg {
  position: absolute;
  top: calc(679 * var(--px));
  left: 0;
  width: calc(375 * var(--px));
  height: calc(704 * var(--px));
}

/*
 * Group 233: ten stacked panels flattened into one strip. Declared 405 x 6683 at
 * (-20, 2821), but 2821 + 6683 overshoots the frame, so the export is clipped on
 * both axes to 375 x 5928 at x 0 — another scale-1 export, like the paper above.
 */
.sheet__strip {
  position: absolute;
  top: calc(2821 * var(--px));
  left: 0;
  width: calc(375 * var(--px));
  height: calc(5928 * var(--px));
}

.sheet__placeholder {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(240 * var(--px));
  border-bottom: 1px dashed #cfc6b4;
  font-size: calc(12 * var(--px));
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #a89b83;
}
</style>
