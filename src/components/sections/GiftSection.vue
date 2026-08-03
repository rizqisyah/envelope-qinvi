<script setup lang="ts">
/*
 * Figma Frame 242, y 5485-6173 = Group 236 (2594:148) plus florals that are not its
 * children. Coordinates are frame-local x and band-local y (frame y minus 5485).
 *
 * Three cards on a 153px pitch. Each is one flattened 327x110 export -- Rectangle
 * 135, a flat #f7f3dc plate at radius 12, plus Rectangle 136, the #4d4d2d tab the
 * copy icon sits on. The plate ships as art; the copy control does not, because it
 * has to actually copy. A real <button> is laid over the tab, padded out to a 44px
 * touch target that fits the tab exactly (312-356) without moving a pixel.
 *
 * Every line of copy is live. Cards 1 and 2 are bank accounts and card 3 is a postal
 * address -- a variant that only exists in the design, since the API's shape is
 * accounts only. The fallback keeps it so an unconfigured render matches the render.
 *
 * The florals repeat with the cards, and two are rotated:
 *   2594:200  declared x 351.2, actually 333 -- which is 375-42, the clip bound, so
 *             the clip rule and the worth probe agree.
 *   2594:202  x is as declared but y is 46 high of it.
 * Both were solved once on card 1 with the worth probe (see SLICING.md) and the
 * result reused on the 153 pitch -- then re-probed independently on card 2, which
 * landed on exactly the pitched coordinate.
 */
import { computed, onUnmounted, ref } from 'vue'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

import cardPlate from '../../assets/gift/parts/g236_2594-193_card.webp'
import bcaLogo from '../../assets/gift/parts/g236_2594-156_bca-logo.webp'
import copyIcon from '../../assets/gift/parts/03_2594-196_copy-icon.webp'
import floralBackA from '../../assets/gift/parts/01_2594-199.webp'
import floralBackB from '../../assets/gift/parts/02_2594-200.webp'
import floralFront from '../../assets/gift/parts/04_2594-202.webp'

type Account = {
  bank_name?: string
  account_number?: string
  account_name?: string
  /** Design-only: card 3 is a postal address rather than an account. */
  address?: string[]
}

const CARD_TOP = 152 // band-local y of card 1; the rest follow on a 153 pitch
const PITCH = 153

/*
 * Frame 242's own three cards, so an unconfigured render matches the reference.
 * The design repeats the same BCA account twice -- its mock data, not a mistake here.
 */
const FALLBACK: Account[] = [
  { bank_name: 'BCA', account_number: '8715154435', account_name: 'Muhammad Arif' },
  { bank_name: 'BCA', account_number: '8715154435', account_name: 'Muhammad Arif' },
  { address: ['Alamat', '65, Jalan Raya Tanjung Barat'], account_name: 'Putrianti Resti Rusyah' },
]

const { el, shown } = useReveal()
const { gift } = useWedding()

/*
 * The API's rekening rows are accounts only -- there is no address field. The CMS
 * convention, confirmed by the owner, is a row whose bank is `kado`: its
 * account_number holds the postal address, and it renders as the design's card 3.
 */
const isKado = (bank?: string) => (bank || '').trim().toLowerCase() === 'kado'

const accounts = computed<Account[]>(() => {
  const live = (gift.value as any[])
    .map((g) => {
      const number = (g.account_number || '').trim()
      const name = g.account_name
      // account_number is kept so the address stays copyable -- see `copyable` below.
      return isKado(g.bank_name)
        ? { address: ['Alamat', number], account_name: name, account_number: number }
        : { bank_name: g.bank_name, account_number: number, account_name: name }
    })
    .filter((a) => a.account_number || a.account_name)
  return live.length ? live : FALLBACK
})

// The real app ships a BCA logo and renders every other bank as its own name.
const isBca = (a: Account) => (a.bank_name || '').trim().toUpperCase() === 'BCA'

/** What a card prints, and where -- the address variant sets three lines, higher up. */
function lines(a: Account): { top: number; leading: number; rows: string[] } {
  if (a.address) {
    return { top: 22, leading: 18, rows: [...a.address, `A/n ${a.account_name ?? ''}`] }
  }
  return {
    top: 38,
    leading: 19,
    rows: [`No. Rekening : ${a.account_number ?? ''}`, `A/n ${a.account_name ?? ''}`],
  }
}

/*
 * Whatever sits in account_number is what gets copied -- an account for a bank card, the
 * address for a `kado` one. The design's own fallback address card carries neither, so it
 * renders without the control, exactly as Frame 242 draws it.
 */
const copyable = (a: Account) => !!a.account_number
const copyLabel = (a: Account) => (a.address ? 'alamat' : 'nomor rekening')

const copied = ref(-1)
let clear = 0

async function copy(a: Account, i: number) {
  const text = a.account_number ?? ''
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /*
     * The clipboard API needs a secure context, and these invitations get opened from
     * chat apps over plain http often enough that a silent failure would be the common
     * case rather than the edge one.
     */
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copied.value = i
  window.clearTimeout(clear)
  clear = window.setTimeout(() => (copied.value = -1), 1800)
}
onUnmounted(() => window.clearTimeout(clear))

const cardTop = (i: number) => CARD_TOP + i * PITCH
const px = (n: number) => `calc(${n} * var(--px))`
</script>

<template>
  <section :ref="el" class="gift" :class="{ 'is-in': shown }" aria-labelledby="gift-heading">
    <h2 id="gift-heading" class="gift__heading">Wedding Gift</h2>
    <p class="gift__body">
      Bagi Bapak/Ibu/Saudara/i yang berkenan memberikan tanda kasih sebagai bentuk perhatian dan
      dukungan, dapat menyampaikannya melalui fitur yang telah kami sediakan di bawah ini. Setiap
      tanda kasih yang diberikan akan kami terima dengan penuh rasa syukur dan penghargaan.
    </p>

    <div
      v-for="(a, i) in accounts"
      :key="i"
      class="gift__card"
      :style="{ top: px(cardTop(i)), '--in': `${600 + i * 200}ms` }"
    >
      <!-- z 77-82: these paint under the plate. -->
      <img :src="floralBackA" alt="" class="gift__fl gift__fl--a" />
      <img :src="floralBackB" alt="" class="gift__fl gift__fl--b" />

      <img :src="cardPlate" alt="" class="gift__plate" />

      <img v-if="isBca(a)" :src="bcaLogo" alt="BCA" class="gift__logo" />
      <p v-else-if="a.bank_name" class="gift__bank">{{ a.bank_name }}</p>

      <p
        class="gift__lines"
        :style="{ top: px(lines(a).top), lineHeight: px(lines(a).leading) }"
      >
        <span v-for="(row, r) in lines(a).rows" :key="r">{{ row }}</span>
      </p>

      <button
        v-if="copyable(a)"
        type="button"
        class="gift__copy"
        :style="{ top: px(a.address ? 42 : 44) }"
        @click="copy(a, i)"
      >
        <img :src="copyIcon" alt="" />
        <span class="gift__sr">{{
          copied === i
            ? `${copyLabel(a)} disalin`
            : `Salin ${copyLabel(a)} ${a.account_number}`
        }}</span>
      </button>

      <!-- z 97-99: this one paints over the plate. -->
      <img :src="floralFront" alt="" class="gift__fl gift__fl--c" />
    </div>

    <p class="gift__sr" aria-live="polite">
      {{ copied >= 0 ? `${copyLabel(accounts[copied])} disalin ke papan klip` : '' }}
    </p>
  </section>
</template>

<style scoped>
/* 688 = to the RSVP group's own top at y 6173; the last card ends at 6053. */
.gift {
  position: relative;
  height: calc(688 * var(--px));
  overflow: visible;
}

.gift > * {
  position: absolute;
  margin: 0;
}

.gift img {
  pointer-events: none;
}

.gift__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/*
 * 2594:150 — Pinyon Script 40/38, #675959, left-aligned. `top` is -4, not the node's
 * own y: at 0 the browser sets the ink 4px low. The ink measurement suggested about
 * -2, the diff says -4 and says it sharply (3.93 against 10.8 and 11.3 either side),
 * so the diff wins. Its width matches the design's to half a pixel either way -- what
 * differs is that Pinyon Script's ascender here reaches 4px higher than the render's,
 * which is a glyph difference, not a size one.
 */
.gift__heading {
  top: calc(-4 * var(--px));
  left: calc(25 * var(--px));
  width: calc(230 * var(--px));
  font-family: var(--font-script);
  font-size: calc(40 * var(--px));
  line-height: calc(46 * var(--px));
  font-weight: 400;
  color: #675959;
}

/* 2594:157 — EB Garamond 11/22, #675959. */
.gift__body {
  top: calc(43 * var(--px));
  left: calc(29 * var(--px));
  width: calc(324 * var(--px));
  font-family: var(--font-serif);
  font-size: calc(11 * var(--px));
  line-height: calc(22 * var(--px));
  color: #675959;
}

.gift__card {
  left: 0;
  width: calc(375 * var(--px));
  height: calc(110 * var(--px));
}

.gift__card > * {
  position: absolute;
}

.gift__plate {
  top: 0;
  left: calc(29 * var(--px));
  width: calc(327 * var(--px));
  height: calc(110 * var(--px));
}

.gift__logo {
  top: calc(15 * var(--px));
  left: calc(45 * var(--px));
  width: calc(60 * var(--px));
  height: calc(19.5 * var(--px));
}

/* Any bank the design has no logo for renders as its own name, at the logo's baseline. */
.gift__bank {
  top: calc(15 * var(--px));
  left: calc(45 * var(--px));
  margin: 0;
  font-family: var(--font-serif);
  font-size: calc(15 * var(--px));
  line-height: calc(19.5 * var(--px));
  font-weight: 600;
  color: #844711;
}

/* 2594:154/155 — EB Garamond 14, #844711. Leading and top come from the variant. */
.gift__lines {
  left: calc(45 * var(--px));
  width: calc(250 * var(--px));
  margin: 0;
  font-family: var(--font-serif);
  font-size: calc(14 * var(--px));
  color: #844711;
}

.gift__lines span {
  display: block;
}

/*
 * 2594:196 is a 21x21 icon on a 44-wide tab. The icon keeps its exact box; the button
 * is padded out to the tab's full 44x44 so it is a real touch target, which costs
 * nothing visually because the padding is transparent and sits inside the tab.
 */
.gift__copy {
  left: calc(311.5 * var(--px));
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(44 * var(--px));
  height: calc(44 * var(--px));
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  transform: translateY(calc(-11.5 * var(--px)));
}

.gift__copy img {
  width: calc(21 * var(--px));
  height: calc(21 * var(--px));
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.gift__copy:hover img,
.gift__copy:focus-visible img {
  transform: scale(1.12);
}

.gift__copy:active img {
  transform: scale(0.94);
}

.gift__copy:focus-visible {
  outline: calc(2 * var(--px)) solid #f7f3dc;
  outline-offset: calc(-4 * var(--px));
  border-radius: calc(6 * var(--px));
}

.gift__fl {
  position: absolute;
}

/* Declared 57 wide at x 324; exported 51 = 375-324, so the clip proves x. */
.gift__fl--a {
  top: calc(-33 * var(--px));
  left: calc(324 * var(--px));
  width: calc(51 * var(--px));
  height: calc(85 * var(--px));
}

.gift__fl--b {
  top: calc(10 * var(--px));
  left: calc(333 * var(--px));
  width: calc(42 * var(--px));
  height: calc(70.5 * var(--px));
}

.gift__fl--c {
  top: calc(65 * var(--px));
  left: calc(260 * var(--px));
  width: calc(110 * var(--px));
  height: calc(111 * var(--px));
}

/*
 * Reveal: the heading and copy write in, then each card rises with its florals as one
 * piece -- moving the plate alone would slide it out from under its own flowers.
 */
.gift__heading,
.gift__body,
.gift__card {
  opacity: 0;
  transition:
    opacity 1200ms ease-out var(--in, 0ms),
    transform 1600ms cubic-bezier(0.16, 1, 0.3, 1) var(--in, 0ms);
}

.gift.is-in .gift__heading,
.gift.is-in .gift__body,
.gift.is-in .gift__card {
  opacity: 1;
  transform: none;
}

.gift__heading {
  --in: 0ms;
  transform: translateY(calc(14 * var(--px)));
}

.gift__body {
  --in: 250ms;
  transform: translateY(calc(12 * var(--px)));
}

.gift__card {
  transform: translateY(calc(20 * var(--px)));
}

@media (prefers-reduced-motion: reduce) {
  .gift__heading,
  .gift__body,
  .gift__card {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .gift__copy img {
    transition: none;
  }
}
</style>
