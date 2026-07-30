<script setup lang="ts">
/*
 * Figma Frame 242, y 6760-7700 = Group 2594:400 plus six florals that are NOT its
 * children. Coordinates are frame-local x and band-local y (frame y minus 6760).
 *
 * This band has no artwork of its own beyond the florals. Group 2594:400's 666x1705
 * export was deleted because it wraps every TEXT node here, and the wishes panel
 * (Frame 237) is live data anyway -- a flat #a4be7b plate at radius 17 holding white
 * cards, all of it CSS. The two "Input"/"Textarea" frames are flat #ffffff plates,
 * pictures of form controls, and ship as a real <input> and <textarea>.
 *
 * The panel is a FIXED 428 tall and its four design cards total 432, so the design
 * clips the last one -- that clipped edge is the affordance that there is more. It
 * scrolls rather than grows: a band whose height depends on how many wishes the API
 * returns would move every band below it.
 *
 * Floral placement (worth probe, each confirmed against scripts/locate.py):
 *   2594:429  (278, 6674) x is the clip bound (export 97 unclipped => x <= 278) and y
 *             is as declared. Unsolvable until the RSVP arch was composited as context:
 *             it paints on top of the arch, and against bare paper the landscape was
 *             flat at +1.6 everywhere. With the arch there it peaks sharply at +3.03
 *   2594:434  (309, 6753) x clip-proven, y as declared
 *   2594:430  (0, 6704)   LEFT-clipped, so the export begins at frame x 0 -- NOT at the
 *             node's declared -71. locate.py returns (0, 6704) independently
 *   2594:431  (325, 6769) x clip-proven, y 18 above its declared 6787
 *   2594:432  (0, 6774)   123 left and 87 above its declared spot
 *   2594:433  (348, 6858) x clip-proven, y as declared
 */
import { computed, ref } from 'vue'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'
import { relativeTime } from '../../lib/format'

import lilyTop from '../../assets/wish/parts/00_2594-429.webp'
import lilyLeft from '../../assets/wish/parts/01_2594-430.webp'
import sprigTop from '../../assets/wish/parts/02_2594-434.webp'
import valleyRight from '../../assets/wish/parts/03_2594-431.webp'
import leavesLeft from '../../assets/wish/parts/06_2594-432.webp'
import daisyRight from '../../assets/wish/parts/05_2594-433.webp'

type Wish = {
  id?: string | number
  guest_name?: string
  message?: string
  created_at?: string | null
  /** Design-only: the reference cards print a relative time with no timestamp behind it. */
  time?: string
}

/*
 * Frame 242's own four cards, verbatim -- including "diberahi", which is the design's
 * typo, and its emoji spacing. An unconfigured render has to match the reference.
 */
const FALLBACK: Wish[] = [
  {
    id: 'd1',
    guest_name: 'Anggun',
    time: '2 hari lalu',
    message:
      'Happy wedding 💐 Semoga keluarga kecil kalian senantiasa diberahi kebahagiaan, kecukupan, dan kesehatan✨ Selamat beribadah bersama sampai jannah ya🙏🏻',
  },
  {
    id: 'd2',
    guest_name: 'Amri',
    time: '3 hari lalu',
    message: 'Happy wedding yaaa, semoga samawa, bahagia dunia akhirat ❤️',
  },
  {
    id: 'd3',
    guest_name: 'Amanda',
    time: '3 hari lalu',
    message: 'Alhamdulillah, terharu banget, samawa yak',
  },
  { id: 'd4', guest_name: 'Gilang', time: '3 hari lalu', message: 'Happy wedding broo...' },
]

const { el, shown } = useReveal()
const { wishes, sendWish, guest } = useWedding()

const list = computed<Wish[]>(() => {
  const live = (wishes.value as Wish[]).filter((w) => w.guest_name || w.message)
  return live.length ? live : FALLBACK
})

const stamp = (w: Wish) => w.time ?? relativeTime(w.created_at)

const name = ref(String((guest.value as any)?.name ?? ''))
const message = ref('')
const submitting = ref(false)
const error = ref('')
const sent = ref(false)

async function submit() {
  if (!name.value.trim()) {
    error.value = 'Nama wajib diisi.'
    return
  }
  if (!message.value.trim()) {
    error.value = 'Ucapan wajib diisi.'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    await sendWish({ guest_name: name.value.trim(), message: message.value.trim() })
    // The list is prepended by sendWish, so clearing the box is the whole reset.
    message.value = ''
    sent.value = true
  } catch (err: any) {
    error.value = err?.message || 'Gagal mengirim ucapan. Coba lagi.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section :ref="el" class="wish" :class="{ 'is-in': shown }" aria-labelledby="wish-heading">
    <h2 id="wish-heading" class="wish__heading">Wedding Wish</h2>
    <p class="wish__body">Silakan kirimkan doa dan ucapan yang tulus untuk kami:</p>

    <form class="wish__form" novalidate @submit.prevent="submit">
      <label class="wish__label wish__label--name" for="wish-name">Nama</label>
      <input
        id="wish-name"
        v-model="name"
        class="wish__field wish__field--name"
        type="text"
        autocomplete="name"
        required
      />

      <label class="wish__label wish__label--message" for="wish-message"
        >Sampaikan ucapan selamat untuk<br />pernikahan kami:</label
      >
      <textarea
        id="wish-message"
        v-model="message"
        class="wish__field wish__field--message"
        required
      ></textarea>

      <p v-if="error" class="wish__error" role="alert">{{ error }}</p>

      <!--
        The design draws no submit control at all -- the form it shows cannot be sent.
        This button is an addition, placed in the 60 empty rows between the textarea
        (ends 7170) and the panel (starts 7230). Recorded in the band record.
      -->
      <button class="wish__send" type="submit" :disabled="submitting">
        {{ submitting ? 'Mengirim...' : 'Kirim Ucapan' }}
      </button>
    </form>

    <p class="wish__sr" aria-live="polite">{{ sent ? 'Ucapan Anda sudah terkirim.' : '' }}</p>

    <!-- Frame 237: fixed 428 with radius 17, clipping its own cards. -->
    <div class="wish__panel">
      <ul class="wish__list">
        <li v-for="(w, i) in list" :key="w.id ?? i" class="wish__card">
          <p class="wish__name">{{ w.guest_name }}</p>
          <p class="wish__time">{{ stamp(w) }}</p>
          <p class="wish__message">{{ w.message }}</p>
        </li>
      </ul>
    </div>

    <!-- z 126-131: every floral paints over the group. -->
    <img :src="lilyTop" alt="" class="wish__fl wish__fl--lily-top" />
    <img :src="sprigTop" alt="" class="wish__fl wish__fl--sprig-top" />
    <img :src="lilyLeft" alt="" class="wish__fl wish__fl--lily-left" />
    <img :src="valleyRight" alt="" class="wish__fl wish__fl--valley" />
    <img :src="leavesLeft" alt="" class="wish__fl wish__fl--leaves" />
    <img :src="daisyRight" alt="" class="wish__fl wish__fl--daisy" />
  </section>
</template>

<style scoped>
/* 940 = 6760 to 7700, where the footer starts. */
.wish {
  position: relative;
  height: calc(940 * var(--px));
  overflow: visible;
}

.wish > * {
  position: absolute;
  margin: 0;
}

.wish img {
  pointer-events: none;
}

.wish__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/*
 * 2594:423 — Pinyon Script 40/41.6, #000000, centred on 197.25. `top` is 51, not the
 * node's own 55: a 41.6 line box in a 32-tall node means Figma centres the line inside
 * it, and 55 - (41.6-32)/2 = 50.2. The sweep agrees sharply (3.89 against 14.8 and 15.1
 * either side).
 */
.wish__heading {
  top: calc(51 * var(--px));
  left: calc(78 * var(--px));
  width: calc(238.5 * var(--px));
  font-family: var(--font-script);
  font-size: calc(40 * var(--px));
  line-height: calc(41.6 * var(--px));
  font-weight: 400;
  text-align: center;
  color: #000000;
}

/*
 * 2594:424 — EB Garamond SemiBold 16/22.4 with 0.1px tracking, #000000. Same centring,
 * much larger: two 22.4 lines in an 87-tall node, so 101 + (87-44.8)/2 = 122.1. The
 * sweep lands on 123 (3.21 against 10.5 and 9.53), which is 22 below the node's y --
 * quote the sweep, not the node.
 */
.wish__body {
  top: calc(123 * var(--px));
  left: calc(45 * var(--px));
  width: calc(302.71 * var(--px));
  font-family: var(--font-serif);
  font-size: calc(16 * var(--px));
  line-height: calc(22.4 * var(--px));
  font-weight: 600;
  letter-spacing: calc(0.1 * var(--px));
  text-align: center;
  color: #000000;
}

.wish__form {
  top: 0;
  left: 0;
  width: calc(375 * var(--px));
  height: calc(470 * var(--px));
}

.wish__form > * {
  position: absolute;
}

/* 2594:427/428 — Cormorant Garamond Bold 16/22.4, #000000. */
.wish__label {
  font-family: var(--font-serif-bold);
  font-size: calc(16 * var(--px));
  line-height: calc(22.4 * var(--px));
  font-weight: 700;
  color: #000000;
}

.wish__label--name {
  top: calc(188 * var(--px));
  left: calc(48 * var(--px));
}

/*
 * Two lines, and the gap between them is 23 rather than the node's 22.4: the browser's
 * Cormorant Garamond sets a marginally taller line box than the render's. Line 1 already
 * matched at 22.4; only line 2 was drifting. 6.18 at 23 against 8.82 and 13.3.
 */
.wish__label--message {
  top: calc(275 * var(--px));
  left: calc(47 * var(--px));
  line-height: calc(23 * var(--px));
}

/*
 * Both plates are flat #ffffff at radius 10. 16px, not smaller: --px is 1.0 at a 375
 * container and mobile Safari zooms the page on focus below 16, which would throw the
 * whole pixel-positioned band off screen. The design shows both boxes empty, so the
 * size costs no fidelity.
 */
.wish__field {
  padding: calc(7 * var(--px)) calc(12 * var(--px));
  border: 0;
  border-radius: calc(10 * var(--px));
  background: #ffffff;
  font-family: var(--font-serif);
  font-size: calc(16 * var(--px));
  line-height: calc(22 * var(--px));
  color: #4d4d2d;
}

.wish__field:focus-visible {
  outline: calc(2 * var(--px)) solid #4d4d2d;
  outline-offset: calc(2 * var(--px));
}

/* 2594:425 */
.wish__field--name {
  top: calc(219 * var(--px));
  left: calc(48.22 * var(--px));
  width: calc(285.31 * var(--px));
  height: calc(36 * var(--px));
  padding-block: 0;
}

/* 2594:426 — resize is off: a user-draggable box would move everything below it. */
.wish__field--message {
  top: calc(326 * var(--px));
  left: calc(47.18 * var(--px));
  width: calc(286.12 * var(--px));
  height: calc(84 * var(--px));
  resize: none;
}

/* An addition: see the template. Olive is the invitation's action colour. */
.wish__send {
  top: calc(418 * var(--px));
  left: calc(122 * var(--px));
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(150 * var(--px));
  height: calc(44 * var(--px));
  padding: 0;
  border: 0;
  border-radius: calc(10 * var(--px));
  background: #4d4d2d;
  font-family: var(--font-sans);
  font-size: calc(14 * var(--px));
  line-height: calc(18 * var(--px));
  color: #ffffff;
  cursor: pointer;
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.wish__send:hover:not(:disabled),
.wish__send:focus-visible {
  transform: scale(1.04);
}

.wish__send:active:not(:disabled) {
  transform: scale(0.97);
}

.wish__send:disabled {
  cursor: progress;
  opacity: 0.7;
}

.wish__error {
  top: calc(392 * var(--px));
  left: calc(47 * var(--px));
  width: calc(286 * var(--px));
  font-family: var(--font-serif);
  font-size: calc(12 * var(--px));
  line-height: calc(14 * var(--px));
  text-align: center;
  color: #7a2f2f;
}

/*
 * 2594:401 — #a4be7b at radius 17, 309.96 wide holding 306-wide cards, so 4px of green
 * shows down the right edge. Fixed height, scrolling: the design's own cards overflow
 * it by 4px and it clips them.
 */
.wish__panel {
  top: calc(470 * var(--px));
  left: calc(42 * var(--px));
  width: calc(309.96 * var(--px));
  height: calc(428 * var(--px));
  overflow-y: auto;
  border-radius: calc(17 * var(--px));
  background: #a4be7b;
  scrollbar-width: none;
}

/* A visible scrollbar would eat pixels the design spends on the cards. */
.wish__panel::-webkit-scrollbar {
  display: none;
}

.wish__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

/*
 * Card height is 12 + 20 + 4 + 20 + 4 + lines*18 + 12 = 72 + lines*18, which is exactly
 * the design's 144/108/90/90 at 4/2/1/1 lines. So the cards flow rather than being
 * positioned, and the separator is an inset shadow: a real border would add 1px per
 * card and walk the whole stack down.
 */
.wish__card {
  width: calc(306 * var(--px));
  /*
   * 24 left / 20 right, not a uniform 24. The design's per-card paddings (right 24, 45,
   * 24, 24) are Figma hug artifacts -- its TEXT nodes are 291/296/327 wide and overflow
   * their own content boxes. What is real is where the ink lands: measured off the
   * render, every card's text runs x 66-328, i.e. 24..286 inside the 306 card. That is
   * a 262 column, and it is what reproduces the reference's line breaks.
   */
  padding: calc(12 * var(--px)) calc(20 * var(--px)) calc(12 * var(--px)) calc(24 * var(--px));
  background: #ffffff;
  box-shadow: inset 0 calc(-1 * var(--px)) 0 #cdc2ae;
}

.wish__card > p {
  margin: 0;
  font-family: var(--font-arabic); /* Noto Sans — the wish list is the one sans block */
}

/* 2594:404 — Noto Sans SemiBold 14/20, #55391c. */
.wish__name {
  font-size: calc(14 * var(--px));
  line-height: calc(20 * var(--px));
  font-weight: 600;
  color: #55391c;
}

/* 2594:405 — Noto Sans 12/20, #ababab, on a 4px gap. */
.wish__card > p.wish__time {
  margin-top: calc(4 * var(--px));
  font-size: calc(12 * var(--px));
  line-height: calc(20 * var(--px));
  font-weight: 400;
  color: #ababab;
}

/* 2594:406 — Noto Sans Light 12/18, #55391c. */
.wish__card > p.wish__message {
  margin-top: calc(4 * var(--px));
  font-size: calc(12 * var(--px));
  line-height: calc(18 * var(--px));
  font-weight: 300;
  color: #55391c;
  overflow-wrap: break-word;
}

.wish__fl {
  position: absolute;
}

/* x is the clip bound: the export is 97 wide and unclipped, so x <= 375-97. */
.wish__fl--lily-top {
  top: calc(-86 * var(--px));
  left: calc(278 * var(--px));
  width: calc(97 * var(--px));
  height: calc(240 * var(--px));
}

/* Right-clipped: export 66 = 375-309, so x is proven. */
.wish__fl--sprig-top {
  top: calc(-7 * var(--px));
  left: calc(309 * var(--px));
  width: calc(66 * var(--px));
  height: calc(138 * var(--px));
}

/* LEFT-clipped: export 117 = 188-71, and a left clip starts the export at x 0. */
.wish__fl--lily-left {
  top: calc(-56 * var(--px));
  left: 0;
  width: calc(117 * var(--px));
  height: calc(236 * var(--px));
}

/* Right-clipped: export 50 = 375-325. Rotated, so y was solved (18 above declared). */
.wish__fl--valley {
  top: calc(9 * var(--px));
  left: calc(325 * var(--px));
  width: calc(50 * var(--px));
  height: calc(130 * var(--px));
}

/* Rotated, and 123 left / 87 above its declared spot. */
.wish__fl--leaves {
  top: calc(14 * var(--px));
  left: 0;
  width: calc(123 * var(--px));
  height: calc(201 * var(--px));
}

/* Right-clipped: export 27 = 375-348. */
.wish__fl--daisy {
  top: calc(98 * var(--px));
  left: calc(348 * var(--px));
  width: calc(27 * var(--px));
  height: calc(93 * var(--px));
}

/*
 * Reveal: the copy writes in, the form follows, the panel rises, then the cascade opens
 * from the top down.
 */
.wish__heading,
.wish__body,
.wish__form,
.wish__panel,
.wish__fl {
  opacity: 0;
  transition:
    opacity 1100ms ease-out var(--in, 0ms),
    transform 1500ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.wish.is-in .wish__heading,
.wish.is-in .wish__body,
.wish.is-in .wish__form,
.wish.is-in .wish__panel,
.wish.is-in .wish__fl {
  opacity: 1;
  transform: none;
}

.wish__heading {
  --in: 0ms;
  transform: translateY(calc(14 * var(--px)));
}

.wish__body {
  --in: 200ms;
  transform: translateY(calc(12 * var(--px)));
}

.wish__form {
  --in: 400ms;
  transform: translateY(calc(10 * var(--px)));
}

.wish__panel {
  --in: 600ms;
  transform: translateY(calc(20 * var(--px)));
}

.wish__fl--lily-top {
  --in: 800ms;
  transform: translate(calc(12 * var(--px)), calc(-14 * var(--px)));
}

.wish__fl--sprig-top {
  --in: 920ms;
  transform: translate(calc(14 * var(--px)), calc(-10 * var(--px)));
}

.wish__fl--lily-left {
  --in: 1040ms;
  transform: translate(calc(-14 * var(--px)), calc(-10 * var(--px)));
}

.wish__fl--valley {
  --in: 1160ms;
  transform: translate(calc(14 * var(--px)), calc(8 * var(--px)));
}

.wish__fl--leaves {
  --in: 1280ms;
  transform: translate(calc(-14 * var(--px)), calc(10 * var(--px)));
}

.wish__fl--daisy {
  --in: 1400ms;
  transform: translate(calc(12 * var(--px)), calc(10 * var(--px)));
}

@media (prefers-reduced-motion: reduce) {
  .wish__heading,
  .wish__body,
  .wish__form,
  .wish__panel,
  .wish__fl {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .wish__send {
    transition: none;
  }
}
</style>
