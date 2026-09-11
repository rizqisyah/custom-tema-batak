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
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useReveal } from '../../composables/useReveal'
import { fetchWishes, sendWishGAS, isGScriptConfigured } from '../../lib/gscript'
import type { WishItem } from '../../lib/gscript'
import { getGuestFromUrl } from '../../lib/guest'

const { el, shown } = useReveal()

// Default list ucapan KOSONG (tidak ada dummy atau komentar bawaan)
const liveWishes = ref<WishItem[]>([])
const scrollBox = ref<HTMLElement | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null

async function loadWishes() {
  const data = await fetchWishes()
  if (Array.isArray(data)) {
    liveWishes.value = data
  }
}

onMounted(() => {
  loadWishes()
  // Polling realtime setiap 6 detik jika Google Apps Script telah diset
  if (isGScriptConfigured()) {
    pollTimer = setInterval(loadWishes, 6000)
  }
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})

function formatTime(isoOrDate?: string): string {
  if (!isoOrDate) return ''
  try {
    const d = new Date(isoOrDate)
    if (isNaN(d.getTime())) return String(isoOrDate)
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(isoOrDate)
  }
}

const all = computed(() => {
  return liveWishes.value
    .map((w) => ({
      name: w.guest_name || w.nama || 'Tamu',
      at: formatTime(w.created_at),
      text: w.message || w.ucapan || '',
    }))
    .filter((w) => w.text)
})

const form = ref({ name: getGuestFromUrl(), text: '' })
const state = ref<'idle' | 'sending' | 'error' | 'done'>('idle')
const error = ref('')

async function send() {
  if (!form.value.name.trim() || !form.value.text.trim()) {
    state.value = 'error'
    error.value = 'Nama dan ucapan wajib diisi.'
    return
  }
  state.value = 'sending'
  try {
    const res = await sendWishGAS({
      guest_name: form.value.name.trim(),
      message: form.value.text.trim(),
    })
    
    // Realtime update: masukkan langsung ke urutan teratas
    const newRow: WishItem = res?.data || {
      id: `local-${Date.now()}`,
      guest_name: form.value.name.trim(),
      message: form.value.text.trim(),
      created_at: new Date().toISOString(),
    }
    liveWishes.value = [newRow, ...liveWishes.value]

    form.value = { name: '', text: '' }
    state.value = 'idle'
    error.value = ''

    // Otomatis scroll ke pesan terbaru di paling atas
    nextTick(() => {
      scrollBox.value?.scrollTo({ top: 0, behavior: 'smooth' })
    })
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

    <!-- State jika komentar masih kosong (Default Kosong) -->
    <div v-if="!all.length" class="wishes__empty">
      <p>Belum ada ucapan.</p>
      <span>Jadilah yang pertama memberikan doa & ucapan untuk kedua mempelai!</span>
    </div>

    <!-- Scrollable container untuk daftar ucapan -->
    <div v-else ref="scrollBox" class="wishes__scroll-box">
      <div class="wishes__badge">
        <span>{{ all.length }} Ucapan & Doa</span>
      </div>

      <ul class="wishes__list">
        <li v-for="(w, n) in all" :key="n" class="wishes__item">
          <div class="wishes__item-head">
            <p class="wishes__name">{{ w.name }}</p>
            <span class="wishes__at">{{ w.at }}</span>
          </div>
          <p class="wishes__text">{{ w.text }}</p>
        </li>
      </ul>
    </div>
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

/* Container scrollable ucapan */
.wishes__scroll-box {
  left: calc(42 * var(--px));
  top: calc(365 * var(--px));
  width: calc(514 * var(--px));
  max-height: calc(580 * var(--px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: calc(10 * var(--px));
  padding-right: calc(6 * var(--px));
  --delay: 200ms;
}

/* Custom Scrollbar */
.wishes__scroll-box::-webkit-scrollbar {
  width: calc(5 * var(--px));
}

.wishes__scroll-box::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: calc(4 * var(--px));
}

.wishes__scroll-box::-webkit-scrollbar-thumb {
  background: var(--olive);
  border-radius: calc(4 * var(--px));
}

.wishes__scroll-box {
  scrollbar-width: thin;
  scrollbar-color: var(--olive) rgba(0, 0, 0, 0.05);
}

.wishes__badge {
  font-family: "Abhaya Libre", serif;
  font-size: calc(18 * var(--px));
  font-weight: 700;
  color: var(--ink);
  text-align: left;
  padding: 0 calc(4 * var(--px));
}

.wishes__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: calc(12 * var(--px));
  text-align: left;
}

.wishes__item {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: calc(12 * var(--px));
  padding: calc(14 * var(--px)) calc(16 * var(--px));
  box-shadow: 0 calc(2 * var(--px)) calc(6 * var(--px)) rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: calc(6 * var(--px));
}

.wishes__item-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: calc(8 * var(--px));
}

.wishes__name {
  font-family: "Abhaya Libre", serif;
  font-weight: 800;
  font-size: calc(20 * var(--px));
  line-height: calc(26 * var(--px));
  color: #111;
}

.wishes__at {
  font-family: "Bellefair", serif;
  font-size: calc(14 * var(--px));
  line-height: calc(20 * var(--px));
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.wishes__text {
  font-family: "Bellefair", serif;
  font-size: calc(18 * var(--px));
  line-height: calc(26 * var(--px));
  color: #222;
  word-break: break-word;
  white-space: pre-wrap;
}

.wishes__empty {
  left: calc(42 * var(--px));
  top: calc(365 * var(--px));
  width: calc(514 * var(--px));
  text-align: center;
  padding: calc(36 * var(--px)) calc(20 * var(--px));
  font-family: "Bellefair", serif;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-radius: calc(12 * var(--px));
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.wishes__empty p {
  font-size: calc(22 * var(--px));
  font-weight: 600;
  margin-bottom: calc(6 * var(--px));
}

.wishes__empty span {
  font-size: calc(16 * var(--px));
  opacity: 0.85;
}
</style>
