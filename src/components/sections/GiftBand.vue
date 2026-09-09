<script setup lang="ts">
/*
 * Band 9 — wedding gift. Frame 9 (2129:12) y 8020 - 9767.
 *
 * Everything below the flowers is CHROME: two maroon account cards and a four-field form.
 * Printed as art none of it works — an account number you cannot copy is worse than no
 * number, and a baked card prints one bank's logo over another bank's digits the moment
 * the data changes (SLICING.md).
 *
 * The account cards are CSS surfaces at Figma's own fill (#861c1e, radius 12) and are
 * driven by `useWedding().gift`, CAPPED AT TWO — the design draws two apertures and a
 * third would paint past the last plate.
 *
 * The form has NO endpoint: api.ts exposes only submitRsvp and submitUcapan, and there is
 * no gift route. It therefore validates and confirms locally rather than pretending to
 * send. Wire it to a real endpoint when one exists; the shape is already here.
 */
import { computed, ref } from 'vue'
import BandArt from '../invite/BandArt.vue'
import { assets } from '../../lib/bandAssets'
import type { BandLayer } from '../../lib/bandLayer'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

const { el, shown } = useReveal()
const { gift } = useWedding()

const LAYERS: BandLayer[] = [
  { z: 19, id: '2143:1416', src: assets['gift/parts/2143-1416.webp'], x: 130.4, y: 0, w: 205, h: 247.5 },
  { z: 20, id: '2143:1417', src: assets['gift/parts/2143-1417.webp'], x: 86.2, y: 185.16, w: 191, h: 153.5 },
  { z: 21, id: '2143:1418', src: assets['gift/parts/2143-1418.webp'], x: 102, y: 97, w: 196, h: 234.5 },
  { z: 22, id: '2141:989', src: assets['gift/parts/2141-989.webp'], x: 142, y: 123.46, w: 321, h: 329 },
  { z: 103, id: '2143:1420', src: assets['gift/parts/2143-1420.webp'], x: 386, y: 234, w: 285, h: 285 },
  { z: 104, id: '2143:1453', src: assets['gift/parts/2143-1453.webp'], x: -76, y: 235, w: 285, h: 285 },
  // 2141:1232 / 2141:1233 are absent on purpose — they are the copy buttons' own glyphs,
  // rendered inside real <button>s below so the number can actually be copied.
]

const COPY_ICON = [assets['gift/parts/2141-1232.webp'], assets['gift/parts/2141-1233.webp']]

const BLURB =
  'Your blessing and coming to our wedding are enough for us. However, if you want to ' +
  'give a gift we provide a Digital Envelope to make it easier for you. Thank you'

/* The design's own two accounts. The art has exactly two apertures, so the list is capped. */
const DESIGN_ACCOUNTS = [
  { bank: 'BANK BCA (014)', number: '7771565429', name: 'Waraney Lasut Soleman Roeroe' },
  { bank: 'BANK BCA (014)', number: '7955201175', name: 'Monika Kristi Maria Manurung' },
]

const accounts = computed(() => {
  const live = (gift.value as any[] | null) ?? []
  const mapped = live
    .map((g) => ({
      bank: g?.bank_name || g?.bank || '',
      number: g?.account_number || g?.number || '',
      name: g?.account_name || g?.name || '',
    }))
    .filter((a) => a.number)
  return (mapped.length ? mapped : DESIGN_ACCOUNTS).slice(0, 2)
})

const copied = ref<number | null>(null)
async function copy(n: number, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = n
    setTimeout(() => (copied.value === n ? (copied.value = null) : null), 1800)
  } catch {
    /* Clipboard is blocked in some embedded webviews; the number is still selectable. */
    copied.value = null
  }
}

const form = ref({ name: '', owner: '', message: '', amount: '' })
const sent = ref(false)
const error = ref('')
function submit() {
  if (!form.value.name.trim() || !form.value.amount.trim()) {
    error.value = 'Nama dan nominal wajib diisi.'
    return
  }
  error.value = ''
  sent.value = true
}
</script>

<template>
  <section :ref="el" class="band gift" :class="{ 'is-in': shown }">
    <BandArt :layers="LAYERS" :shown="shown" />

    <h2 class="gift__title">Wedding Gift</h2>
    <p class="gift__blurb">{{ BLURB }}</p>

    <!-- 2141:1157 / 2141:1214 — the two account cards. -->
    <div
      v-for="(a, n) in accounts"
      :key="n"
      class="gift__card"
      :style="{ top: `calc(${773 + n * 204} * var(--px))` }"
    >
      <p class="gift__bank">{{ a.bank }}</p>
      <p class="gift__lbl">Account Number</p>
      <p class="gift__num">{{ a.number }}</p>
      <button class="gift__copy" type="button" @click="copy(n, a.number)">
        <img :src="COPY_ICON[n] || COPY_ICON[0]" alt="" />
        <span class="sr-only">Salin nomor rekening {{ a.number }}</span>
      </button>
      <span v-if="copied === n" class="gift__copied" role="status">disalin</span>
      <p class="gift__lbl gift__lbl--name">Account Name</p>
      <p class="gift__name">{{ a.name }}</p>
    </div>

    <p class="gift__formhint">Fill the form below, please</p>

    <form class="gift__form" @submit.prevent="submit">
      <input v-model="form.name" class="gift__in" type="text" placeholder="Name" />
      <input v-model="form.owner" class="gift__in" type="text" placeholder="Account Owner Name" />
      <input v-model="form.message" class="gift__in" type="text" placeholder="Message" />
      <input v-model="form.amount" class="gift__in" type="text" inputmode="numeric" placeholder="Amount" />
      <button class="gift__next" type="submit">
        Next
        <svg viewBox="0 0 12 18" aria-hidden="true">
          <path d="M2 2l8 7-8 7" fill="none" stroke="currentColor" stroke-width="2.2" />
        </svg>
      </button>
      <p v-if="error" class="gift__msg gift__msg--err" role="alert">{{ error }}</p>
      <p v-else-if="sent" class="gift__msg" role="status">
        Terima kasih — catatan amplop digital tersimpan.
      </p>
    </form>
  </section>
</template>

<style scoped>
.gift {
  height: calc(1747 * var(--px));
}

.gift__title {
  left: calc(96 * var(--px));
  top: calc(538 * var(--px));
  width: calc(404 * var(--px));
  font-family: var(--font-script);
  --script-k: 0.408;
  font-size: calc(86.67 * var(--px) * var(--script-k));
  line-height: calc(83 * var(--px));
  font-weight: 400;
  color: var(--ink);
  --delay: 0ms;
}

.gift__blurb {
  left: calc(95.96 * var(--px));
  top: calc(633.5 * var(--px));
  width: calc(404 * var(--px));
  font-family: var(--font-prose);
  font-size: calc(17 * var(--px));
  line-height: calc(22.1 * var(--px));
  color: var(--ink);
  --delay: 100ms;
}

/* 2141:1157 — Figma's own fill and radius; the second card is +204 below the first. */
.gift__card {
  left: calc(40 * var(--px));
  width: calc(515.91 * var(--px));
  height: calc(186.1 * var(--px));
  border-radius: calc(12 * var(--px));
  background: #861c1e;
  text-align: left;
  --delay: 180ms;
}

.gift__card > * {
  position: absolute;
  left: calc(20 * var(--px));
  color: #fff;
}

.gift__bank { top: calc(30 * var(--px)); font-family: var(--font-visia); font-weight: 500; font-size: calc(17 * var(--px)); line-height: calc(22.1 * var(--px)); }
.gift__lbl { top: calc(65 * var(--px)); font-family: var(--font-serif); font-size: calc(12 * var(--px)); line-height: calc(15 * var(--px)); }
.gift__lbl--name { top: calc(116.1 * var(--px)); font-family: var(--font-mono-label); line-height: calc(14.06 * var(--px)); }
.gift__num { top: calc(83.4 * var(--px)); display: flex; align-items: center; gap: calc(6 * var(--px)); font-family: var(--font-visia); font-weight: 500; font-size: calc(17 * var(--px)); line-height: calc(22.1 * var(--px)); }
.gift__name { top: calc(133.1 * var(--px)); font-family: var(--font-visia); font-weight: 500; font-size: calc(17 * var(--px)); line-height: calc(22.1 * var(--px)); }

/*
 * 2141:1232 / 2141:1233 — the design's own copy glyph, placed inside a real button rather
 * than redrawn as CSS, which is the rule for an icon the design already exports. It sits
 * at the card's right edge (x 494 in frame space, 454 inside the card).
 */
.gift__copy {
  left: auto;
  right: calc(16 * var(--px));
  top: calc(30 * var(--px));
  display: grid;
  place-items: center;
  width: calc(46 * var(--px));
  height: calc(46 * var(--px));
  border: 0;
  background: none;
  cursor: pointer;
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.gift__copy:hover, .gift__copy:focus-visible { transform: scale(1.08); }
.gift__copy img { width: 100%; height: 100%; }

.gift__copied {
  left: auto;
  right: calc(16 * var(--px));
  top: calc(78 * var(--px));
  font-family: var(--font-sans);
  font-size: calc(11 * var(--px));
  opacity: 0.85;
}

.gift__formhint {
  left: calc(60 * var(--px));
  top: calc(1190 * var(--px));
  width: calc(197 * var(--px));
  text-align: left;
  /*
   * One line in the design. The substitute sets wider than Visia Pro, so without this it
   * wraps onto the row below — exactly the collision style.css's one-line list exists to
   * stop. Pinned rather than widening the box, which would move the design's geometry.
   */
  white-space: nowrap;
  font-family: var(--font-visia);
  font-weight: 600;
  font-size: calc(17 * var(--px));
  line-height: calc(19.92 * var(--px));
  color: var(--ink);
  --delay: 240ms;
}

.gift__form {
  left: calc(40 * var(--px));
  top: calc(1230 * var(--px));
  width: calc(515.91 * var(--px));
  display: grid;
  gap: calc(20 * var(--px));
  --delay: 300ms;
}

/* 2141:1177 and its three siblings — white, radius 11, 55.4 tall. */
.gift__in {
  width: 100%;
  height: calc(55.4 * var(--px));
  padding: 0 calc(12.8 * var(--px));
  border: 0;
  border-radius: calc(11 * var(--px));
  background: #fff;
  font-family: var(--font-visia);
  font-weight: 600;
  font-size: calc(17 * var(--px));
  color: var(--ink);
}

.gift__in::placeholder { color: #757575; }
.gift__in:focus-visible { outline: 2px solid var(--maroon); outline-offset: 2px; }

/* 2141:1189 — olive, radius 25, with the design's Bellefair label. */
.gift__next {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(10 * var(--px));
  height: calc(50.6 * var(--px));
  margin-top: calc(20 * var(--px));
  border: 0;
  border-radius: calc(25 * var(--px));
  background: var(--olive);
  color: #fff;
  font-family: "Bellefair", serif;
  font-size: calc(20 * var(--px));
  cursor: pointer;
}

.gift__next svg { width: calc(11 * var(--px)); height: calc(17 * var(--px)); }
.gift__next:hover { filter: brightness(1.08); }

.gift__msg {
  font-family: var(--font-sans);
  font-size: calc(14 * var(--px));
  color: var(--ink);
}

.gift__msg--err { color: var(--maroon); }
</style>
