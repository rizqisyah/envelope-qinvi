<script setup lang="ts">
/*
 * Figma Frame 242, y 6173-6760 = Group 2594:298 plus six florals that are NOT its
 * children. Coordinates are frame-local x and band-local y (frame y minus 6173).
 *
 * The arch is FRAME 2594:299: an empty 332x560 frame flat-filled #4d4d2d with mixed
 * corner radii. Its export is 93% that one colour and carries no text ink, so it
 * ships whole rather than being rebuilt as four border-radius values.
 *
 * What does NOT ship: the three "Input" frames (2594:304/308/309) and the Send
 * rectangle (2594:302). All four are flat #ffffff plates -- pictures of form
 * controls. They exist in .figma-ref/bands/rsvp.json as solve-only layers, because
 * 2594:315 and 2594:316 reach those rows and masking them would blank the window
 * those two florals are scored in. Here they are real controls, so the form works.
 *
 * Five of the six florals sit somewhere other than their declared x/y, and the
 * cascade buries itself, so each was placed by worth probe and then confirmed by an
 * independent template match (scripts/locate.py):
 *   2594:312  (21, 6112) as declared -- reaches 61 rows above this band's own top
 *   2594:313  (31, 6249) as declared -- the ONE case where the worth probe was wrong
 *             (it liked x 44 at +40.4 worth, because at 44 the cluster still covers
 *             the daisy ink that 311 and 314 contribute above it). locate.py, the
 *             pixel diff and a 1-D sweep all put it at 31; see SLICING.md
 *   2594:311  (0, 6255)  declared (-4, 6262) -- x 0 is also the clip bound
 *   2594:314  (14, 6335) declared (61, 6335) -- 47 out, exactly its own width
 *   2594:315  (8, 6363) as declared
 *   2594:316  (0, 6359)  declared (-37, 6413)
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'
import { submitRsvp } from '../../lib/api'

import arch from '../../assets/rsvp/parts/rsvp_2594-299_arch.webp'
import stems from '../../assets/rsvp/parts/00_2594-312.webp'
import daisiesTop from '../../assets/rsvp/parts/02_2594-313.webp'
import calla from '../../assets/rsvp/parts/03_2594-311.webp'
import daisiesLow from '../../assets/rsvp/parts/04_2594-314.webp'
import callaBud from '../../assets/rsvp/parts/05_2594-315_vdf-6.webp'
import valley from '../../assets/rsvp/parts/06_2594-316.webp'

const { el, shown } = useReveal()
const { slug, guestCode, guest } = useWedding()

const name = ref('')
const phone = ref('')
const attendance = ref('')
const submitting = ref(false)
const sent = ref(false)
const error = ref('')

/*
 * Per invitation AND per guest link: the same phone opening two different links is two
 * different RSVPs, and `?to=` is what distinguishes them.
 */
const storageKey = computed(() => `rsvp_${slug.value}_${guestCode.value || 'general'}`)

function readStore(): boolean {
  try {
    return localStorage.getItem(storageKey.value) === 'true'
  } catch {
    // Private browsing and embedded webviews both throw here rather than return null.
    return false
  }
}

onMounted(() => {
  sent.value = readStore()
})

/*
 * `guest` arrives from the API after this component mounts, so both of these have to
 * watch rather than read once. A guest who already replied from another device has no
 * local receipt, and the API is the only thing that knows.
 */
watch(
  guest,
  (g: any) => {
    if (g?.has_rsvp) sent.value = true
    const known = g?.name ?? g?.guest_name
    if (known && !name.value) name.value = String(known)
  },
  { immediate: true },
)

async function submit() {
  if (!name.value.trim()) {
    error.value = 'Nama wajib diisi.'
    return
  }
  if (!attendance.value) {
    error.value = 'Pilih kehadiran terlebih dahulu.'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    await submitRsvp(slug.value, {
      guest_name: name.value.trim(),
      phone: phone.value.trim(),
      attendance_status: attendance.value,
      // The design draws no guest-count field, so one attending guest counts as one.
      guest_count: attendance.value === 'hadir' ? 1 : 0,
    })
    try {
      localStorage.setItem(storageKey.value, 'true')
    } catch {
      // Losing the receipt only means the form comes back on reload.
    }
    sent.value = true
  } catch (err: any) {
    error.value = err?.message || 'Gagal mengirim konfirmasi. Coba lagi.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section :ref="el" class="rsvp" :class="{ 'is-in': shown }" aria-labelledby="rsvp-heading">
    <img :src="arch" alt="" class="rsvp__arch" />

    <h2 id="rsvp-heading" class="rsvp__heading">Rsvp</h2>
    <p class="rsvp__body">
      Kehadiran Bapak/Ibu/Saudara/i akan menjadi kehormatan besar bagi kami dan keluarga. Mohon
      konfirmasi kehadiran Anda melalui formulir reservasi di bawah:
    </p>

    <p v-if="sent" class="rsvp__thanks">
      <span class="rsvp__thanks-title">Terima Kasih!</span>
      <span>Konfirmasi kehadiran Anda sudah kami terima.</span>
    </p>

    <form v-else class="rsvp__form" novalidate @submit.prevent="submit">
      <label class="rsvp__label rsvp__label--name" for="rsvp-name">Nama:</label>
      <input
        id="rsvp-name"
        v-model="name"
        class="rsvp__field rsvp__field--name"
        type="text"
        autocomplete="name"
        required
      />

      <label class="rsvp__label rsvp__label--phone" for="rsvp-phone">No Hp:</label>
      <input
        id="rsvp-phone"
        v-model="phone"
        class="rsvp__field rsvp__field--phone"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
      />

      <label class="rsvp__label rsvp__label--attend" for="rsvp-attend">Kehadiran</label>
      <!--
        The design draws an empty box here, so the placeholder option carries no label.
        A native select is the deviation: it shows a dropdown indicator the flat plate
        does not. Recorded in .figma-ref/bands/rsvp.json rather than hidden with
        appearance:none, which would leave the control with no affordance at all.
      -->
      <select
        id="rsvp-attend"
        v-model="attendance"
        class="rsvp__field rsvp__field--attend"
        required
      >
        <option value=""></option>
        <option value="hadir">Hadir</option>
        <option value="tidak_hadir">Tidak Hadir</option>
      </select>

      <p v-if="error" class="rsvp__error" role="alert">{{ error }}</p>

      <button class="rsvp__send" type="submit" :disabled="submitting">
        {{ submitting ? 'Mengirim...' : 'Send' }}
      </button>
    </form>

    <!-- z 117-122: every floral paints over the arch. -->
    <img :src="valley" alt="" class="rsvp__fl rsvp__fl--valley" />
    <img :src="stems" alt="" class="rsvp__fl rsvp__fl--stems" />
    <img :src="daisiesTop" alt="" class="rsvp__fl rsvp__fl--daisies-top" />
    <img :src="calla" alt="" class="rsvp__fl rsvp__fl--calla" />
    <img :src="daisiesLow" alt="" class="rsvp__fl rsvp__fl--daisies-low" />
    <img :src="callaBud" alt="" class="rsvp__fl rsvp__fl--bud" />
  </section>
</template>

<style scoped>
/* 587 = 6173 to 6760, where the Wedding Wish band starts. */
.rsvp {
  position: relative;
  height: calc(587 * var(--px));
  overflow: visible;
}

.rsvp > * {
  position: absolute;
  margin: 0;
}

.rsvp img {
  pointer-events: none;
}

/* 2594:299 — 332x560 exact, flat #4d4d2d with mixed corner radii. */
.rsvp__arch {
  top: 0;
  left: calc(35 * var(--px));
  width: calc(332 * var(--px));
  height: calc(560 * var(--px));
}

/* 2594:301 — Pinyon Script 48/38, #ffffff, centred on the arch's own 200.5. */
.rsvp__heading {
  top: calc(70 * var(--px));
  left: calc(48 * var(--px));
  width: calc(305 * var(--px));
  font-family: var(--font-script);
  font-size: calc(48 * var(--px));
  line-height: calc(38 * var(--px));
  font-weight: 400;
  text-align: center;
  color: #ffffff;
}

/*
 * 2594:300 — EB Garamond 16/20, #ffffff. `top` is 127, one px below the node's own
 * 126: a sharp diff minimum (3.13 against 13.0 and 10.5 either side). The five line
 * breaks fall exactly where the render's do at this width, so only the first
 * baseline differed.
 */
.rsvp__body {
  top: calc(127 * var(--px));
  left: calc(85 * var(--px));
  width: calc(231 * var(--px));
  font-family: var(--font-serif);
  font-size: calc(16 * var(--px));
  line-height: calc(20 * var(--px));
  text-align: center;
  color: #ffffff;
}

.rsvp__form,
.rsvp__thanks {
  top: 0;
  left: 0;
  width: calc(375 * var(--px));
  height: calc(560 * var(--px));
}

.rsvp__form > *,
.rsvp__thanks > * {
  position: absolute;
}

/* 2594:305/306/307 — Cormorant Garamond Bold 16/22.4, #ffffff. */
.rsvp__label {
  font-family: var(--font-serif-bold);
  font-size: calc(16 * var(--px));
  line-height: calc(22.4 * var(--px));
  font-weight: 700;
  color: #ffffff;
}

.rsvp__label--name {
  top: calc(256 * var(--px));
  left: calc(67 * var(--px));
}

.rsvp__label--phone {
  top: calc(321 * var(--px));
  left: calc(67 * var(--px));
}

.rsvp__label--attend {
  top: calc(384 * var(--px));
  left: calc(69 * var(--px));
}

/*
 * The three plates are flat #ffffff, square-cornered, 36 tall. Typed text is the one
 * thing the design never shows, so it takes the body serif at a size that clears the
 * plate's 36px box.
 */
.rsvp__field {
  height: calc(36 * var(--px));
  padding: 0 calc(9 * var(--px));
  border: 0;
  border-radius: 0;
  background: #ffffff;
  font-family: var(--font-serif);
  font-size: calc(15 * var(--px));
  line-height: calc(36 * var(--px));
  color: #4d4d2d;
}

.rsvp__field:focus-visible {
  outline: calc(2 * var(--px)) solid #ffffff;
  outline-offset: calc(2 * var(--px));
}

/* 2594:309 */
.rsvp__field--name {
  top: calc(279 * var(--px));
  left: calc(68 * var(--px));
  width: calc(261.22 * var(--px));
}

/* 2594:308 — one px left of the other two, as drawn. */
.rsvp__field--phone {
  top: calc(344 * var(--px));
  left: calc(67 * var(--px));
  width: calc(261.22 * var(--px));
}

/* 2594:304 — narrower than the other two, as drawn. */
.rsvp__field--attend {
  top: calc(407 * var(--px));
  left: calc(68 * var(--px));
  width: calc(258 * var(--px));
}

/* 2594:302 rectangle (115 wide), not the 127-wide text node inside it. */
.rsvp__send {
  top: calc(475 * var(--px));
  left: calc(139 * var(--px));
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(115 * var(--px));
  height: calc(32 * var(--px));
  padding: 0;
  border: 0;
  border-radius: calc(6 * var(--px));
  background: #ffffff;
  font-family: var(--font-sans);
  font-size: calc(13 * var(--px));
  line-height: calc(16.8 * var(--px));
  color: #55391c;
  cursor: pointer;
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.rsvp__send:hover:not(:disabled),
.rsvp__send:focus-visible {
  transform: scale(1.04);
}

.rsvp__send:active:not(:disabled) {
  transform: scale(0.97);
}

.rsvp__send:disabled {
  cursor: progress;
  opacity: 0.7;
}

/* The 32 rows between the last plate and the button are the only free space here. */
.rsvp__error {
  top: calc(447 * var(--px));
  left: calc(60 * var(--px));
  width: calc(255 * var(--px));
  font-family: var(--font-serif);
  font-size: calc(12 * var(--px));
  line-height: calc(14 * var(--px));
  text-align: center;
  color: #ffe2b8;
}

/* Replaces the form in place, so it starts where "Nama:" was. */
.rsvp__thanks > span {
  position: absolute;
  left: calc(67 * var(--px));
  width: calc(241 * var(--px));
  font-family: var(--font-serif);
  font-size: calc(16 * var(--px));
  line-height: calc(22 * var(--px));
  text-align: center;
  color: #ffffff;
}

.rsvp__thanks > span.rsvp__thanks-title {
  top: calc(256 * var(--px));
  font-family: var(--font-script);
  font-size: calc(34 * var(--px));
  line-height: calc(38 * var(--px));
}

.rsvp__thanks > span + span {
  top: calc(302 * var(--px));
}

.rsvp__fl {
  position: absolute;
}

.rsvp__fl--stems {
  top: calc(-61 * var(--px));
  left: calc(21 * var(--px));
  width: calc(133 * var(--px));
  height: calc(187 * var(--px));
}

.rsvp__fl--daisies-top {
  top: calc(76 * var(--px));
  left: calc(31 * var(--px));
  width: calc(60 * var(--px));
  height: calc(60 * var(--px));
}

/* Rotated: declared 67.69x101.53 at x -4, exported 74x108. */
.rsvp__fl--calla {
  top: calc(82 * var(--px));
  left: 0;
  width: calc(74 * var(--px));
  height: calc(108 * var(--px));
}

.rsvp__fl--daisies-low {
  top: calc(162 * var(--px));
  left: calc(14 * var(--px));
  width: calc(47 * var(--px));
  height: calc(47 * var(--px));
}

.rsvp__fl--bud {
  top: calc(190 * var(--px));
  left: calc(8 * var(--px));
  width: calc(48 * var(--px));
  height: calc(78 * var(--px));
}

/* Rotated: declared 100x98.98 at x -37, exported 101x137.5. */
.rsvp__fl--valley {
  top: calc(186 * var(--px));
  left: 0;
  width: calc(101 * var(--px));
  height: calc(137.5 * var(--px));
}

/*
 * Reveal: the arch rises first, then the copy writes in, then the fields, then the
 * cascade opens flower by flower from the top down.
 */
.rsvp__arch,
.rsvp__heading,
.rsvp__body,
.rsvp__form,
.rsvp__thanks,
.rsvp__fl {
  opacity: 0;
  transition:
    opacity 1100ms ease-out var(--in, 0ms),
    transform 1500ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.rsvp.is-in .rsvp__arch,
.rsvp.is-in .rsvp__heading,
.rsvp.is-in .rsvp__body,
.rsvp.is-in .rsvp__form,
.rsvp.is-in .rsvp__thanks,
.rsvp.is-in .rsvp__fl {
  opacity: 1;
  transform: none;
}

.rsvp__arch {
  --in: 0ms;
  transform: translateY(calc(24 * var(--px)));
}

.rsvp__heading {
  --in: 300ms;
  transform: translateY(calc(14 * var(--px)));
}

.rsvp__body {
  --in: 500ms;
  transform: translateY(calc(12 * var(--px)));
}

.rsvp__form,
.rsvp__thanks {
  --in: 700ms;
  transform: translateY(calc(10 * var(--px)));
}

/* Each flower drops in from where its own stem enters the frame. */
.rsvp__fl--stems {
  --in: 850ms;
  transform: translate(calc(-10 * var(--px)), calc(-14 * var(--px)));
}

.rsvp__fl--daisies-top {
  --in: 1000ms;
  transform: translate(calc(-12 * var(--px)), calc(-8 * var(--px)));
}

.rsvp__fl--calla {
  --in: 1120ms;
  transform: translate(calc(-14 * var(--px)), calc(-6 * var(--px)));
}

.rsvp__fl--daisies-low {
  --in: 1260ms;
  transform: translate(calc(-12 * var(--px)), calc(6 * var(--px)));
}

.rsvp__fl--bud {
  --in: 1380ms;
  transform: translate(calc(-10 * var(--px)), calc(10 * var(--px)));
}

.rsvp__fl--valley {
  --in: 1500ms;
  transform: translate(calc(-14 * var(--px)), calc(12 * var(--px)));
}

@media (prefers-reduced-motion: reduce) {
  .rsvp__arch,
  .rsvp__heading,
  .rsvp__body,
  .rsvp__form,
  .rsvp__thanks,
  .rsvp__fl {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .rsvp__send {
    transition: none;
  }
}
</style>
