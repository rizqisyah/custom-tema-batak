<script setup lang="ts">
/*
 * Floating Music Player — Vinyl Disc
 * Sesuai desain Qinvi (TemaEnvelopRed):
 * Menampilkan piringan hitam vinyl yang berputar saat musik aktif,
 * otomatis memutar musik saat undangan dibuka, serta bisa di-klik untuk pause/play.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWedding } from '../../composables/useWedding'
import vinylImg from '../../assets/vinyl.png'

const { wedding } = useWedding()

const DEFAULT_MUSIC = 'https://qinvi-worker.kesone01.workers.dev/Music/8c38ac0a-Tortor_Batak.mp3'
const musicUrl = computed(() => (import.meta.env.VITE_MUSIC_URL || wedding.value?.music_url || DEFAULT_MUSIC).trim())

const audioEl = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
let observer: IntersectionObserver | null = null

async function playMusic() {
  if (audioEl.value) {
    try {
      await audioEl.value.play()
      isPlaying.value = true
    } catch {
      isPlaying.value = false
    }
  }
}

function toggleMusic() {
  if (!audioEl.value) return
  if (isPlaying.value) {
    audioEl.value.pause()
    isPlaying.value = false
  } else {
    playMusic()
  }
}

onMounted(() => {
  playMusic()

  // Mengamati video kenangan di halaman: jika video diputar dengan suara, musik latar bisa disesuaikan
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Video section in view
        }
      })
    },
    { threshold: 0.1 }
  )

  let count = 0
  const timer = setInterval(() => {
    const videoNode = document.querySelector('.memories__video') || document.querySelector('video')
    if (videoNode && observer) {
      observer.observe(videoNode)
      clearInterval(timer)
    }
    if (++count > 25) clearInterval(timer)
  }, 120)
})

onUnmounted(() => {
  audioEl.value?.pause()
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <div
    v-if="musicUrl"
    class="floating-music"
    role="button"
    tabindex="0"
    :aria-label="isPlaying ? 'Jeda musik' : 'Putar musik'"
    @click="toggleMusic"
    @keydown.enter="toggleMusic"
    @keydown.space.prevent="toggleMusic"
  >
    <img
      :src="vinylImg"
      alt="Toggle Music"
      class="vinyl-disc"
      :class="{ 'is-spinning': isPlaying }"
      draggable="false"
    />
    <audio
      ref="audioEl"
      :src="musicUrl"
      loop
      preload="auto"
      @play="isPlaying = true"
      @pause="isPlaying = false"
    ></audio>
  </div>
</template>

<style scoped>
.floating-music {
  position: fixed;
  right: 20px;
  bottom: calc(25px + env(safe-area-inset-bottom, 0px));
  z-index: 9999;
  cursor: pointer;
  background-color: transparent;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.35);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.floating-music:active {
  transform: scale(0.9);
}

.floating-music:hover {
  transform: scale(1.06);
}

@media (min-width: 1025px) {
  .floating-music {
    width: 60px;
    height: 60px;
    bottom: 40px;
    left: 40px;
    right: auto;
  }
}

.vinyl-disc {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  pointer-events: none;
}

.vinyl-disc.is-spinning {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
