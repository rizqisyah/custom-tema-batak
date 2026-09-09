<script setup lang="ts">
/*
 * Band 11 — wedding wishes. Frame 9 (2129:12) y 10332 - 11333.
 *
 * No art: a name field, a wish box, Send, and a list of wishes with a "Show more" under
 * it — all CSS surfaces at Figma's own fills.
 *
 * The list is a FLOW, not three fixed plates. The design draws three wishes 174px apart
 * and the band's height is fixed to the design's, but the rows are rendered from the data
 * so a fourth wish pushes the button down rather than painting past the last row.
 *
 * The design fallback carries FOUR wishes although the design draws three, because a
 * "Show more" that reveals nothing is worse than no button at all (SLICING.md).
 *
 * `sendWish` handles design mode itself — it answers locally and keeps the posted wish in
 * a module ref rather than in `state.data`, so the other bands do not lose their own
 * design fallbacks the moment someone submits here.
 */
import { computed, ref } from 'vue'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'
import { DESIGN_MODE } from '../../lib/api'

const { el, shown } = useReveal()
const { wishes, sendWish } = useWedding()

const DESIGN_WISHES = [
  { name: 'Satrio & Istri', at: '09 June 2025, 09:00' },
  { name: 'Satrio & Istri', at: '09 June 2025, 09:00' },
  { name: 'Satrio & Istri', at: '09 June 2025, 09:00' },
  { name: 'Keluarga Sianturi', at: '09 June 2025, 10:20' },
].map((w) => ({
  ...w,
  text:
    'Wishing you a lifetime filled with endless love, gentle laughter, and countless ' +
    'beautiful moments together. Happy Wedding!',
}))

const all = computed(() => {
  const live = (wishes.value as any[] | null) ?? []
  const mapped = live
    .map((w) => ({
      name: w?.guest_name || w?.nama || w?.name || 'Tamu',
      at: w?.created_at ? new Date(w.created_at).toLocaleString('en-GB') : '',
      text: w?.message || w?.ucapan || '',
    }))
    .filter((w) => w.text)
  if (!mapped.length) return DESIGN_WISHES
  /*
   * In DESIGN MODE a posted wish is answered locally and lands in `wishes`, which would
   * otherwise REPLACE the design's own list with the single wish just written — the band
   * would visibly lose its content the moment anyone tried the form. Design-mode wishes
   * are therefore prepended to the design's list rather than standing in for it. In live
   * mode the API returns the real list and nothing is appended to it.
   */
  return DESIGN_MODE ? [...mapped, ...DESIGN_WISHES] : mapped
})

/* The design draws three; the rest are behind the button. */
const PAGE = 3
const shownCount = ref(PAGE)
const visible = computed(() => all.value.slice(0, shownCount.value))
const hasMore = computed(() => shownCount.value < all.value.length)

const form = ref({ name: '', text: '' })
const state = ref<'idle' | 'sending' | 'error'>('idle')
const error = ref('')

async function send() {
  if (!form.value.name.trim() || !form.value.text.trim()) {
    state.value = 'error'
    error.value = 'Nama dan ucapan wajib diisi.'
    return
  }
  state.value = 'sending'
  try {
    await sendWish({ guest_name: form.value.name, message: form.value.text })
    form.value = { name: '', text: '' }
    state.value = 'idle'
    error.value = ''
  } catch (e) {
    state.value = 'error'
    error.value = e instanceof Error ? e.message : 'Gagal mengirim, coba lagi.'
  }
}
</script>

<template>
  <section :ref="el" class="band wishes" :class="{ 'is-in': shown }">
    <h2 class="wishes__title">Wedding Wishes</h2>

    <form class="wishes__form" @submit.prevent="send">
      <input v-model="form.name" class="wishes__in" type="text" placeholder="Name" />
      <textarea v-model="form.text" class="wishes__in wishes__area" placeholder="Give your wish" />
      <button class="wishes__btn" type="submit" :disabled="state === 'sending'">
        {{ state === 'sending' ? 'Mengirim…' : 'Send' }}
      </button>
      <p v-if="error" class="wishes__err" role="alert">{{ error }}</p>
    </form>

    <ul class="wishes__list">
      <li v-for="(w, n) in visible" :key="n" class="wishes__item">
        <p class="wishes__name">{{ w.name }}</p>
        <p class="wishes__at">{{ w.at }}</p>
        <p class="wishes__text">{{ w.text }}</p>
      </li>
    </ul>

    <button v-if="hasMore" class="wishes__btn wishes__more" type="button" @click="shownCount += PAGE">
      Show more
    </button>
  </section>
</template>

<style scoped>
.wishes {
  height: calc(1001 * var(--px));
}

.wishes__title {
  left: calc(44 * var(--px));
  top: 0;
  width: calc(507 * var(--px));
  font-family: var(--font-script);
  font-size: calc(86.67 * var(--px) * var(--script-k));
  line-height: calc(83 * var(--px));
  font-weight: 400;
  color: var(--ink);
  --delay: 0ms;
}

.wishes__form {
  left: calc(42 * var(--px));
  top: calc(122 * var(--px));
  width: calc(514 * var(--px));
  display: grid;
  gap: calc(14 * var(--px));
  --delay: 100ms;
}

/* 2141:1375 / 2141:1369 — white, radius 11. */
.wishes__in {
  width: 100%;
  height: calc(56 * var(--px));
  padding: calc(12.8 * var(--px));
  border: 0;
  border-radius: calc(11 * var(--px));
  background: #fff;
  font-family: "Bellefair", serif;
  font-size: calc(20 * var(--px));
  line-height: calc(22.92 * var(--px));
  color: #000;
  text-align: left;
}

.wishes__area {
  height: calc(90 * var(--px));
  resize: vertical;
  line-height: calc(30 * var(--px));
}

.wishes__in::placeholder { color: #000; opacity: 1; }
.wishes__in:focus-visible { outline: 2px solid var(--maroon); outline-offset: 2px; }

/* 2141:1371 / 2141:1373 — olive, radius 99, 42 tall. */
.wishes__btn {
  width: 100%;
  height: calc(42 * var(--px));
  border: 0;
  border-radius: calc(99 * var(--px));
  background: var(--olive);
  color: #fff;
  font-family: "Bellefair", serif;
  font-size: calc(20 * var(--px));
  cursor: pointer;
}

.wishes__btn:hover { filter: brightness(1.08); }
.wishes__btn:disabled { opacity: 0.7; cursor: default; }

.wishes__err {
  font-family: var(--font-sans);
  font-size: calc(14 * var(--px));
  color: var(--maroon);
  text-align: left;
}

/*
 * The rows are a flow at the design's own 174px rhythm, not three absolutely-placed
 * plates, so a fourth wish moves the button instead of landing on top of it.
 */
.wishes__list {
  left: calc(84 * var(--px));
  top: calc(377 * var(--px));
  width: calc(430 * var(--px));
  list-style: none;
  text-align: left;
  --delay: 200ms;
}

.wishes__item {
  height: calc(174 * var(--px));
  overflow: hidden;
}

.wishes__name {
  font-family: "Abhaya Libre", serif;
  font-weight: 800;
  font-size: calc(20 * var(--px));
  line-height: calc(30 * var(--px));
  color: #000;
}

.wishes__at {
  font-family: "Bellefair", serif;
  font-size: calc(18 * var(--px));
  line-height: calc(27 * var(--px));
  color: #000;
}

.wishes__text {
  width: calc(427 * var(--px));
  font-family: "Bellefair", serif;
  font-size: calc(18 * var(--px));
  line-height: calc(30 * var(--px));
  color: #000;
}

.wishes__more {
  left: calc(41 * var(--px));
  top: calc(911 * var(--px));
  width: calc(514 * var(--px));
  --delay: 280ms;
}
</style>
