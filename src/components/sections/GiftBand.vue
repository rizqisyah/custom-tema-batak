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
 * The form is TWO steps. Frame 17 (2141:1329) is the second one — a dropzone for the
 * transfer slip, a back arrow and Confirm — and it is a separate 520-wide artboard in
 * Figma, which is why it was missed on the first pass over frame 9.
 *
 * Step 2 is laid out on the FORM's own box (x 40, w 515.91) rather than on Frame 17's
 * 23px insets: the artboard is standalone, but in the page the two steps have to align
 * with each other. Its internal proportions are the design's — dropzone 361 tall at
 * radius 11, white on an olive stroke; Confirm 60.3 tall at radius 23.
 *
 * The form has NO endpoint: api.ts exposes only submitRsvp and submitUcapan, and there is
 * no gift route. It validates and confirms locally rather than pretending to send. The
 * file never leaves the browser. Wire both to a real endpoint when one exists — and
 * VALIDATE THE UPLOAD SERVER-SIDE TOO; the checks here are a UX convenience, not a
 * security boundary, since anything client-side can be bypassed.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
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
const step = ref<1 | 2>(1)
const sent = ref(false)
const errors = ref<Record<string, string>>({})

/*
 * Amount holds DIGITS ONLY and is sanitised as it is typed, not merely rejected on
 * submit: `type="text"` accepts anything, and letting a guest type "seratus ribu" and
 * only telling them at the end is a worse form than one that never took the letters.
 *
 * `type="number"` is not the fix — it still accepts "e", "+" and "-", it cannot carry a
 * thousands separator, and it puts a spinner on a field nobody wants to nudge by 1.
 *
 * The visible value is grouped in id-ID (250000 -> "250.000") while `form.amount` stays
 * the raw digit string, so validation and any future POST never have to un-format it.
 */
const MAX_DIGITS = 12 // ~Rp 999 miliar; past this the input is a fat-finger, not a gift

function onAmount(ev: Event) {
  const el = ev.target as HTMLInputElement
  const atEnd = el.selectionStart === el.value.length
  const digits = el.value.replace(/\D/g, '').slice(0, MAX_DIGITS)
  form.value.amount = digits
  const shown = digits ? Number(digits).toLocaleString('id-ID') : ''
  el.value = shown
  // Typing at the end is the normal case; keep the caret there so grouping does not
  // throw it back to the start on every keystroke.
  if (atEnd) el.setSelectionRange(shown.length, shown.length)
}

const amountShown = computed(() =>
  form.value.amount ? Number(form.value.amount).toLocaleString('id-ID') : '',
)

/*
 * Per FIELD rather than one line for the whole form: "Nama dan nominal wajib diisi" makes
 * the guest hunt for which box is wrong.
 */
function validate() {
  const e: Record<string, string> = {}
  const f = form.value
  if (!f.name.trim()) e.name = 'Nama wajib diisi.'
  if (!f.owner.trim()) e.owner = 'Nama pemilik rekening wajib diisi.'
  if (!f.amount) e.amount = 'Nominal wajib diisi.'
  else if (Number(f.amount) <= 0) e.amount = 'Nominal harus lebih dari nol.'
  errors.value = e
  return Object.keys(e).length === 0
}

function next() {
  if (!validate()) return
  step.value = 2
}

/* Trust boundary: only images, and a cap so a 40MB photo does not wedge the page. */
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']

const proof = ref<File | null>(null)
const preview = ref('')
const dragging = ref(false)
const fileError = ref('')

function takeFile(f: File | null | undefined) {
  fileError.value = ''
  if (!f) return
  if (!ACCEPT.includes(f.type)) {
    fileError.value = 'Formatnya harus gambar (PNG, JPG, atau WEBP).'
    return
  }
  if (f.size > MAX_BYTES) {
    fileError.value = 'Ukuran maksimal 5MB.'
    return
  }
  // Revoke the previous object URL or every re-pick leaks one.
  if (preview.value) URL.revokeObjectURL(preview.value)
  proof.value = f
  preview.value = URL.createObjectURL(f)
}

function onDrop(e: DragEvent) {
  dragging.value = false
  takeFile(e.dataTransfer?.files?.[0])
}

function clearProof() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  proof.value = null
  preview.value = ''
  fileError.value = ''
}

onBeforeUnmount(() => {
  if (preview.value) URL.revokeObjectURL(preview.value)
})

function confirm() {
  if (!proof.value) {
    fileError.value = 'Unggah bukti transfer dulu.'
    return
  }
  sent.value = true
}

function back() {
  step.value = 1
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

    <p v-if="step === 1" class="gift__formhint">Fill the form below, please</p>

    <!-- STEP 1 — the four fields and Next. -->
    <form v-if="step === 1" class="gift__form" @submit.prevent="next">
      <div class="gift__field">
        <input
          v-model="form.name"
          class="gift__in"
          :class="{ 'is-bad': errors.name }"
          type="text"
          placeholder="Name"
          :aria-invalid="!!errors.name"
        />
        <span v-if="errors.name" class="gift__ferr">{{ errors.name }}</span>
      </div>
      <div class="gift__field">
        <input
          v-model="form.owner"
          class="gift__in"
          :class="{ 'is-bad': errors.owner }"
          type="text"
          placeholder="Account Owner Name"
          :aria-invalid="!!errors.owner"
        />
        <span v-if="errors.owner" class="gift__ferr">{{ errors.owner }}</span>
      </div>
      <div class="gift__field">
        <input v-model="form.message" class="gift__in" type="text" placeholder="Message" />
      </div>
      <div class="gift__field">
        <input
          class="gift__in"
          :class="{ 'is-bad': errors.amount }"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="Amount"
          :value="amountShown"
          :aria-invalid="!!errors.amount"
          @input="onAmount"
        />
        <span v-if="errors.amount" class="gift__ferr">{{ errors.amount }}</span>
      </div>
      <button class="gift__next" type="submit">
        Next
        <svg viewBox="0 0 12 18" aria-hidden="true">
          <path d="M2 2l8 7-8 7" fill="none" stroke="currentColor" stroke-width="2.2" />
        </svg>
      </button>
    </form>

    <!-- STEP 2 — Frame 17 (2141:1329): the transfer slip. -->
    <div v-else class="gift__step2">
      <!-- 2141:1308 — the design's back chevron, as a real button. -->
      <button class="gift__back" type="button" @click="back">
        <svg viewBox="0 0 12 18" aria-hidden="true">
          <path d="M10 2L2 9l8 7" fill="none" stroke="currentColor" stroke-width="2.2" />
        </svg>
        <span class="sr-only">Kembali ke formulir</span>
      </button>

      <!-- 2141:1316 — white, radius 11, olive stroke. A label so the whole box is the target. -->
      <label
        class="gift__drop"
        :class="{ 'is-dragging': dragging, 'is-bad': fileError }"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <input
          class="gift__file"
          type="file"
          :accept="ACCEPT.join(',')"
          @change="takeFile(($event.target as HTMLInputElement).files?.[0])"
        />
        <template v-if="preview">
          <img class="gift__preview" :src="preview" alt="Pratinjau bukti transfer" />
        </template>
        <template v-else>
          <img class="gift__cloud" :src="assets['gift/parts/2141-1318.webp']" alt="" />
          <span class="gift__uptitle">Upload proof of transfer</span>
          <span class="gift__upsub">Screen Shoot / Photo Slip Transfer</span>
        </template>
      </label>

      <p v-if="proof" class="gift__filename">
        {{ proof.name }} · {{ Math.round(proof.size / 1024) }} KB
        <button class="gift__clear" type="button" @click="clearProof">ganti</button>
      </p>
      <p v-if="fileError" class="gift__msg gift__msg--err" role="alert">{{ fileError }}</p>

      <!-- 2141:1313 — olive, radius 23. -->
      <button class="gift__confirm" type="button" @click="confirm">Confirm</button>

      <p v-if="sent" class="gift__msg" role="status">
        Terima kasih — bukti transfer sudah kami terima.
      </p>
    </div>
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

/*
 * Each field owns its own error line, so the message sits under the box it belongs to.
 * The row keeps the design's 75.4px pitch whether or not an error is showing — an error
 * that pushed the next field down would move the whole form off the design's geometry.
 */
.gift__field {
  position: relative;
  height: calc(55.4 * var(--px));
}

.gift__ferr {
  position: absolute;
  left: calc(12.8 * var(--px));
  top: calc(57 * var(--px));
  font-family: var(--font-sans);
  font-size: calc(12 * var(--px));
  line-height: calc(16 * var(--px));
  color: var(--maroon);
  white-space: nowrap;
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
.gift__in.is-bad { box-shadow: inset 0 0 0 calc(1.5 * var(--px)) var(--maroon); }

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

/*
 * STEP 2 — Frame 17. Anchored on the form's own box so the two steps line up with each
 * other in the page, rather than on the standalone artboard's 23px insets.
 */
.gift__step2 {
  left: calc(40 * var(--px));
  top: calc(1190 * var(--px));
  width: calc(515.91 * var(--px));
  /*
   * An explicit height, because every child inside is absolutely positioned and the
   * wrapper would otherwise collapse to zero — it still PAINTS (the children are placed
   * against it) but it is not a box, so it cannot be hit-tested, screenshotted or
   * measured, and any check that asks whether the step is visible gets "no".
   * back 34 + gap + dropzone 361.2 + filename + Confirm 60.3, to the design's own bottom.
   */
  height: calc(560 * var(--px));
  text-align: left;
  --delay: 240ms;
}

.gift__step2 > * {
  position: absolute;
  left: 0;
}

/* 2141:1308 — 16.1 x 30.9, the design's own 50% black. */
.gift__back {
  top: 0;
  display: grid;
  place-items: center;
  width: calc(34 * var(--px));
  height: calc(34 * var(--px));
  border: 0;
  background: none;
  color: rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.gift__back svg { width: calc(13 * var(--px)); height: calc(20 * var(--px)); }
.gift__back:hover { color: rgba(0, 0, 0, 0.8); }

/* 2141:1316 — the dropzone. A <label> so the whole panel is the file target. */
.gift__drop {
  top: calc(49 * var(--px));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(8 * var(--px));
  width: 100%;
  height: calc(361.2 * var(--px));
  border: calc(1.2 * var(--px)) solid var(--olive);
  border-radius: calc(11 * var(--px));
  background: #fff;
  cursor: pointer;
  overflow: hidden;
  transition: background 200ms ease, border-color 200ms ease;
}

.gift__drop.is-dragging { background: #f4f7ef; border-color: #4d5c39; }
.gift__drop.is-bad { border-color: var(--maroon); }
.gift__drop:focus-within { outline: 2px solid var(--maroon); outline-offset: 2px; }

/* The input stays in the DOM (and focusable) rather than display:none. */
.gift__file {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

/* 2141:1318 — the design's own cloud, not a redrawn one. */
.gift__cloud {
  width: calc(110.2 * var(--px));
  height: calc(80.1 * var(--px));
}

.gift__preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.gift__uptitle,
.gift__upsub {
  font-family: var(--font-visia);
  font-size: calc(15.6 * var(--px));
  line-height: calc(20.3 * var(--px));
  color: var(--ink);
  text-align: center;
}

.gift__uptitle { font-weight: 500; margin-top: calc(10 * var(--px)); }
.gift__upsub { font-weight: 300; }

.gift__filename {
  top: calc(418 * var(--px));
  font-family: var(--font-sans);
  font-size: calc(13 * var(--px));
  color: var(--ink);
}

.gift__clear {
  border: 0;
  background: none;
  color: var(--maroon);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

/* 2141:1313 — olive, radius 23, 60.3 tall. */
.gift__confirm {
  top: calc(464 * var(--px));
  width: 100%;
  height: calc(60.3 * var(--px));
  border: 0;
  border-radius: calc(23 * var(--px));
  background: var(--olive);
  color: #fff;
  font-family: "Bellefair", serif;
  font-size: calc(20 * var(--px));
  cursor: pointer;
}

.gift__confirm:hover { filter: brightness(1.08); }

.gift__step2 .gift__msg { top: calc(534 * var(--px)); }
</style>
