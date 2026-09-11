<script setup lang="ts">
/*
 * Band 8 — "Our Wedding Memories". Frame 9 (2129:12) y 7242 - 8020.
 *
 * A framed video with four flower plates overlapping its corners, two of which bleed
 * off the left edge and two off the right. Both headings are Creattion Demo at 86.67 and
 * OVERLAP each other by design — "Our Wedding" sits at y 0 and "Memories" at y 63, inside
 * an 83px leading, which is what gives the pair its hand-lettered stagger.
 *
 * Foto 2140:973 digantikan oleh video pernikahan interaktif:
 * https://qinvi-worker.kesone01.workers.dev/video/5345a2c5-VID_20260911112948316.mp4
 */
import { ref, watch } from 'vue'
import BandArt from '../invite/BandArt.vue'
import { assets } from '../../lib/bandAssets'
import type { BandLayer } from '../../lib/bandLayer'
import { useReveal } from '../../composables/useReveal'

const { el, shown } = useReveal()

const VIDEO_URL = 'https://qinvi-worker.kesone01.workers.dev/video/5345a2c5-VID_20260911112948316.mp4'

/*
 * Layer bingkai emas (2140:971 di z: 135) dan ornamen bunga di sudut-sudut (z: 137 - 140).
 * Layer foto 2140:973 digantikan oleh elemen <video> di z: 136.
 */
const LAYERS: BandLayer[] = [
  { z: 135, id: '2140:971', src: assets['memories/parts/2140-971.webp'], x: 46, y: 166, w: 530.5, h: 480 },
  { z: 137, id: '2141:984', src: assets['memories/parts/2141-984.webp'], x: -88, y: 384, w: 183, h: 183 },
  { z: 138, id: '2141:988', src: assets['memories/parts/2141-988.webp'], x: 501, y: 384, w: 183, h: 183 },
  { z: 139, id: '2141:985', src: assets['memories/parts/2141-985.webp'], x: -115, y: 223, w: 239, h: 253.5 },
  { z: 140, id: '2141:986', src: assets['memories/parts/2141-986.webp'], x: 485, y: 223, w: 239, h: 253.5 },
]

const videoRef = ref<HTMLVideoElement | null>(null)
const isMuted = ref(true)
const isPlaying = ref(true)

function toggleMute() {
  if (!videoRef.value) return
  isMuted.value = !isMuted.value
  videoRef.value.muted = isMuted.value
}

function togglePlay() {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play()
    isPlaying.value = true
  } else {
    videoRef.value.pause()
    isPlaying.value = false
  }
}

watch(shown, (isInView) => {
  if (isInView && videoRef.value && videoRef.value.paused) {
    videoRef.value.play().catch(() => {
      // Browser autoplay policy catch
    })
    isPlaying.value = true
  }
})
</script>

<template>
  <section :ref="el" class="band memories" :class="{ 'is-in': shown }">
    <BandArt :layers="LAYERS" :shown="shown" />

    <!-- Video Pengganti Foto 2140:973 di dalam bingkai -->
    <div class="memories__video-wrap" :class="{ 'is-in': shown }">
      <video
        ref="videoRef"
        class="memories__video"
        :src="VIDEO_URL"
        autoplay
        loop
        muted
        playsinline
        preload="metadata"
        @click="togglePlay"
      ></video>

      <!-- Tombol Audio / Mute -->
      <button
        class="memories__sound-btn"
        type="button"
        :aria-label="isMuted ? 'Nyalakan suara video' : 'Bisukan suara video'"
        @click.stop="toggleMute"
      >
        <!-- Ikon Muted (Suara Mati) -->
        <svg
          v-if="isMuted"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          stroke="currentColor"
          stroke-width="2.2"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
        <!-- Ikon Unmuted (Suara Nyala) -->
        <svg
          v-else
          viewBox="0 0 24 24"
          width="16"
          height="16"
          stroke="currentColor"
          stroke-width="2.2"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      </button>

      <!-- Indikator Jeda jika video di-pause -->
      <button
        v-if="!isPlaying"
        class="memories__play-overlay"
        type="button"
        aria-label="Lanjutkan putar video"
        @click="togglePlay"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <polygon points="6 3 20 12 6 21 6 3"></polygon>
        </svg>
      </button>
    </div>

    <!-- 2141:980 / 2141:987 — two nodes, deliberately overlapping. -->
    <h2 class="memories__l1">Our Wedding</h2>
    <p class="memories__l2">Memories</p>
  </section>
</template>

<style scoped>
.memories {
  height: calc(778 * var(--px));
}

.memories__l1,
.memories__l2 {
  transform: translateX(-50%) translateY(calc(24 * var(--px)));
  font-family: var(--font-script);
  font-size: calc(86.67 * var(--px) * var(--script-k));
  line-height: calc(83 * var(--px));
  font-weight: 400;
  color: var(--ink);
}

.memories.is-in .memories__l1,
.memories.is-in .memories__l2 {
  transform: translateX(-50%);
}

/*
 * Each line is offset from dead centre by its own few px — derived from the node's own
 * box, not eyeballed: "Our Wedding" is 659 wide at x -32, so its centre is 297.5 against
 * the frame's 298; "Memories" is 658.96 at x -18, centre 311.48, so +13.48.
 */
.memories__l1 {
  top: 0;
  left: calc(50% - 0.5 * var(--px));
  width: calc(659 * var(--px));
  --delay: 0ms;
}

.memories__l2 {
  top: calc(63 * var(--px));
  left: calc(50% + 13.48 * var(--px));
  width: calc(658.96 * var(--px));
  --delay: 120ms;
}

/*
 * Video wrapper menggantikan posisi layer 2140:973 (x: 68.24, y: 191.41, w: 475.5, h: 429)
 * z-index 136: berada di atas frame emas (135) dan di bawah hiasan bunga sudut (137-140).
 */
.memories__video-wrap {
  position: absolute;
  z-index: 136 !important;
  left: calc(68.24 * var(--px));
  top: calc(191.41 * var(--px));
  width: calc(475.5 * var(--px));
  height: calc(429 * var(--px));
  border-radius: calc(6 * var(--px));
  overflow: hidden;
  background: #000;
  box-shadow: 0 calc(4 * var(--px)) calc(20 * var(--px)) rgba(0, 0, 0, 0.25);
  visibility: hidden;
  opacity: 0;
  will-change: transform, opacity;
}

.memories.is-in .memories__video-wrap {
  visibility: visible;
  animation: video-layer-in 2700ms cubic-bezier(0.16, 1, 0.28, 1) forwards;
  animation-delay: 240ms;
}

@keyframes video-layer-in {
  from {
    opacity: 0;
    transform: translate3d(0, calc(44 * var(--px)), 0) scale(0.86);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.memories__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: pointer;
}

/* Tombol audio suara video */
.memories__sound-btn {
  position: absolute;
  bottom: calc(14 * var(--px));
  right: calc(14 * var(--px));
  z-index: 10;
  width: calc(36 * var(--px));
  height: calc(36 * var(--px));
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(30, 15, 10, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: var(--gold, #fff2bc);
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 calc(2 * var(--px)) calc(8 * var(--px)) rgba(0, 0, 0, 0.3);
  transition: transform 200ms ease, background 200ms ease;
}

.memories__sound-btn:hover {
  transform: scale(1.1);
  background: rgba(115, 3, 3, 0.9);
}

.memories__sound-btn:focus-visible {
  outline: 2px solid var(--gold, #fff2bc);
  outline-offset: 2px;
}

/* Overlay tombol Play jika sedang dijeda */
.memories__play-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
  border: 0;
  color: var(--gold, #fff2bc);
  cursor: pointer;
}

.memories__play-overlay svg {
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6));
  transition: transform 200ms ease;
}

.memories__play-overlay:hover svg {
  transform: scale(1.15);
}

@media (prefers-reduced-motion: reduce) {
  .memories__video-wrap,
  .memories.is-in .memories__video-wrap {
    visibility: visible;
    animation: none;
    will-change: auto;
    opacity: 1;
    transform: none;
  }
}
</style>
