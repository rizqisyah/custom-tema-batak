<script setup lang="ts">
/*
 * Band 7 — gallery. Frame 9 (2129:12) y 6367 - 7242.
 *
 * Mendukung foto galeri live & default 13 foto resolusi tinggi,
 * fitur klik untuk membuka Lightbox Fullscreen,
 * serta navigasi geser (swipe / drag) baik di layar utama maupun di Lightbox.
 */
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import BandArt from '../invite/BandArt.vue'
import { assets } from '../../lib/bandAssets'
import type { BandLayer } from '../../lib/bandLayer'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

const { el, shown } = useReveal()
const { gallery } = useWedding()

const DEFAULT_GALLERY: string[] = [
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/6R4A2360.webp',
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/6R4A2448.webp',
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/P1228096.webp',
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/P1227704.webp',
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/6R4A2483.webp',
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/P1228159.webp',
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/P1227829.webp',
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/P12283351.webp',
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/P1227644.webp',
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/P1227833.webp',
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/P1227980.webp',
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/P1228113.webp',
  'https://ik.imagekit.io/qinvi/3d/waraneymonika/6R4A25721.webp',
]

/**
 * Optimasi URL ImageKit untuk menghindari batas 25 MP dan mempercepat loading
 */
function getOptimizedUrl(url: string, width?: number): string {
  if (!url) return ''
  if (url.includes('ik.imagekit.io')) {
    const base = url.split('?')[0]
    return width ? `${base}?tr=w-${width},q-85` : `${base}?tr=orig-true`
  }
  return url
}

/* Arrow plates stay as BandArt */
const LAYERS: BandLayer[] = [
  { z: 93, id: '2140:935', src: assets['gallery/parts/2140-935.webp'], x: 5, y: 362, w: 63, h: 60 },
  { z: 94, id: '2140:938', src: assets['gallery/parts/2140-938.webp'], x: 528, y: 362, w: 63, h: 60 },
]

const photos = computed<string[]>(() => {
  const live = (gallery.value as any[] | null) ?? []
  const urls = live.map((g) => g?.image || g?.url).filter(Boolean)
  return urls.length ? urls : DEFAULT_GALLERY
})

const i = ref(0)
const stripEl = ref<HTMLElement | null>(null)
const thumbRefs = ref<HTMLElement[]>([])

const at = (n: number) => {
  const len = photos.value.length
  if (!len) return
  i.value = ((n % len) + len) % len
  scrollToThumb(i.value)
}

function scrollToThumb(index: number) {
  const target = thumbRefs.value[index]
  if (target && stripEl.value) {
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }
}

watch(i, (newVal) => {
  scrollToThumb(newVal)
})

/* =========================================================
 * Swipe / Drag Gesture pada Main Photo di Band
 * ========================================================= */
const dragOffset = ref(0)
const isSwiping = ref(false)
let touchStartX = 0
let touchStartY = 0
let isHorizontalSwipe = false

function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  dragOffset.value = 0
  isSwiping.value = true
  isHorizontalSwipe = false
}

function onTouchMove(e: TouchEvent) {
  if (!isSwiping.value || e.touches.length !== 1) return
  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY
  const dx = currentX - touchStartX
  const dy = currentY - touchStartY

  if (!isHorizontalSwipe) {
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isHorizontalSwipe = true
    } else if (Math.abs(dy) > 10) {
      isSwiping.value = false
      return
    }
  }

  if (isHorizontalSwipe) {
    dragOffset.value = dx
  }
}

function onTouchEnd() {
  if (!isSwiping.value) return
  isSwiping.value = false
  const threshold = 45
  if (dragOffset.value < -threshold) {
    at(i.value + 1)
  } else if (dragOffset.value > threshold) {
    at(i.value - 1)
  }
  dragOffset.value = 0
}

/* Mouse Drag untuk Desktop */
let isMouseDown = false
let mouseStartX = 0
let mouseDistance = 0

function onMouseDown(e: MouseEvent) {
  isMouseDown = true
  mouseStartX = e.clientX
  mouseDistance = 0
  dragOffset.value = 0
}

function onMouseMove(e: MouseEvent) {
  if (!isMouseDown) return
  const dx = e.clientX - mouseStartX
  mouseDistance = dx
  dragOffset.value = dx
}

function onMouseUp() {
  if (!isMouseDown) return
  isMouseDown = false
  const threshold = 45
  if (dragOffset.value < -threshold) {
    at(i.value + 1)
  } else if (dragOffset.value > threshold) {
    at(i.value - 1)
  }
  dragOffset.value = 0
}

function handleMainClick() {
  if (Math.abs(mouseDistance) > 8 || Math.abs(dragOffset.value) > 8) return
  openLightbox(i.value)
}

/* =========================================================
 * Lightbox Fullscreen Popup
 * ========================================================= */
const lightboxOpen = ref(false)
const lbDragOffset = ref(0)
const lbIsSwiping = ref(false)
let lbTouchStartX = 0
let lbTouchStartY = 0
let lbIsHorizontal = false

function openLightbox(index: number) {
  i.value = index
  lightboxOpen.value = true
}

function closeLightbox() {
  lightboxOpen.value = false
  lbDragOffset.value = 0
}

function prevPhoto() {
  at(i.value - 1)
}

function nextPhoto() {
  at(i.value + 1)
}

function onLbTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  lbTouchStartX = e.touches[0].clientX
  lbTouchStartY = e.touches[0].clientY
  lbDragOffset.value = 0
  lbIsSwiping.value = true
  lbIsHorizontal = false
}

function onLbTouchMove(e: TouchEvent) {
  if (!lbIsSwiping.value || e.touches.length !== 1) return
  const dx = e.touches[0].clientX - lbTouchStartX
  const dy = e.touches[0].clientY - lbTouchStartY

  if (!lbIsHorizontal) {
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      lbIsHorizontal = true
    } else if (Math.abs(dy) > 10) {
      lbIsSwiping.value = false
      return
    }
  }

  if (lbIsHorizontal) {
    lbDragOffset.value = dx
  }
}

function onLbTouchEnd() {
  if (!lbIsSwiping.value) return
  lbIsSwiping.value = false
  const threshold = 45
  if (lbDragOffset.value < -threshold) {
    nextPhoto()
  } else if (lbDragOffset.value > threshold) {
    prevPhoto()
  }
  lbDragOffset.value = 0
}

function onKeyDown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') prevPhoto()
  if (e.key === 'ArrowRight') nextPhoto()
}

watch(lightboxOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  document.body.style.overflow = ''
})
</script>

<template>
  <section :ref="el" class="band gallery" :class="{ 'is-in': shown }">
    <BandArt :layers="LAYERS" :shown="shown" />

    <h2 class="gallery__title">Gallery Photo</h2>

    <!-- Foto Utama dengan gesture geser & klik perbesar -->
    <div
      class="gallery__main-wrap"
      role="button"
      tabindex="0"
      aria-label="Klik untuk memperbesar foto atau geser untuk melihat foto lain"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @click="handleMainClick"
      @keydown.enter="openLightbox(i)"
      @keydown.space.prevent="openLightbox(i)"
    >
      <img
        class="gallery__main"
        :src="getOptimizedUrl(photos[i], 1200)"
        alt="Gallery Photo"
        loading="lazy"
        decoding="async"
        draggable="false"
        :style="{
          transform: `translateX(${dragOffset}px)`,
          transition: isSwiping || isMouseDown ? 'none' : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)'
        }"
      />

      <!-- Badge Indikator & Tombol Perbesar -->
      <div class="gallery__badge">
        <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 3 21 3 21 9"></polyline>
          <polyline points="9 21 3 21 3 15"></polyline>
          <line x1="21" y1="3" x2="14" y2="10"></line>
          <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
        <span>{{ i + 1 }} / {{ photos.length }}</span>
      </div>
    </div>

    <!-- Tombol navigasi panah bawaan desain Figma -->
    <button class="gallery__nav gallery__nav--prev" type="button" @click="at(i - 1)">
      <img :src="assets['gallery/parts/2140-937.webp']" alt="" />
      <span class="sr-only">Foto sebelumnya</span>
    </button>
    <button class="gallery__nav gallery__nav--next" type="button" @click="at(i + 1)">
      <img :src="assets['gallery/parts/2140-939.webp']" alt="" />
      <span class="sr-only">Foto berikutnya</span>
    </button>

    <!-- Strip Thumbnail geser horizontal untuk 13 foto -->
    <div ref="stripEl" class="gallery__strip">
      <button
        v-for="(p, n) in photos"
        :key="n"
        :ref="(el) => { if (el) thumbRefs[n] = el as HTMLElement }"
        class="gallery__thumb"
        :class="{ 'is-current': n === i }"
        type="button"
        @click="at(n)"
      >
        <img :src="getOptimizedUrl(p, 400)" alt="" loading="lazy" decoding="async" draggable="false" />
        <span class="sr-only">Foto {{ n + 1 }}</span>
      </button>
    </div>

    <!-- Lightbox Fullscreen Modal -->
    <Teleport to="body">
      <Transition name="lb-fade">
        <div
          v-if="lightboxOpen"
          class="lb-modal"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          @click.self="closeLightbox"
        >
          <!-- Header Bar: Counter & Close -->
          <div class="lb-header">
            <span class="lb-counter">{{ i + 1 }} / {{ photos.length }}</span>
            <button class="lb-close" type="button" aria-label="Tutup foto" @click="closeLightbox">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Main Viewport with Gesture Swipe -->
          <div
            class="lb-viewport"
            @touchstart="onLbTouchStart"
            @touchmove="onLbTouchMove"
            @touchend="onLbTouchEnd"
            @click.self="closeLightbox"
          >
            <!-- Panah Kiri -->
            <button class="lb-arrow lb-arrow--prev" type="button" aria-label="Foto sebelumnya" @click.stop="prevPhoto">
              <svg viewBox="0 0 24 24" width="30" height="30" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <!-- Foto Utama Lightbox -->
            <div
              class="lb-img-container"
              :style="{
                transform: `translateX(${lbDragOffset}px)`,
                transition: lbIsSwiping ? 'none' : 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)'
              }"
            >
              <img
                :src="getOptimizedUrl(photos[i], 1600)"
                class="lb-img"
                alt="Foto Pernikahan"
                draggable="false"
              />
            </div>

            <!-- Panah Kanan -->
            <button class="lb-arrow lb-arrow--next" type="button" aria-label="Foto berikutnya" @click.stop="nextPhoto">
              <svg viewBox="0 0 24 24" width="30" height="30" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <!-- Footer hint -->
          <div class="lb-footer">
            <span>Geser kiri/kanan atau klik panah untuk melihat foto lain</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.gallery {
  height: calc(875 * var(--px));
}

/* 2140:928 — Creattion Demo at 86.67, the same size as "Save the Date". */
.gallery__title {
  left: 50%;
  top: 0;
  width: calc(658.96 * var(--px));
  transform: translateX(-50%) translateY(calc(24 * var(--px)));
  font-family: var(--font-script);
  font-size: calc(86.67 * var(--px) * var(--script-k));
  line-height: calc(83 * var(--px));
  font-weight: 400;
  color: var(--ink);
  --delay: 0ms;
}

.gallery.is-in .gallery__title {
  transform: translateX(-50%);
}

/* Container pembungkus foto utama untuk gesture geser & klik perbesar */
.gallery__main-wrap {
  position: absolute;
  z-index: 88 !important;
  left: calc(35 * var(--px));
  top: calc(124 * var(--px));
  width: calc(526.5 * var(--px));
  height: calc(515 * var(--px));
  border-radius: calc(12 * var(--px));
  overflow: hidden;
  cursor: grab;
  user-select: none;
  touch-action: pan-y;
  background: rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  --delay: 120ms;
}

.gallery__main-wrap:active {
  cursor: grabbing;
}

.gallery__main {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

/* Badge indikator di pojok foto utama */
.gallery__badge {
  position: absolute;
  right: calc(14 * var(--px));
  bottom: calc(14 * var(--px));
  display: inline-flex;
  align-items: center;
  gap: calc(5 * var(--px));
  padding: calc(5 * var(--px)) calc(12 * var(--px));
  background: rgba(40, 20, 15, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #fff;
  border-radius: calc(100 * var(--px));
  font-family: 'Jost', sans-serif;
  font-size: calc(12 * var(--px));
  font-weight: 500;
  letter-spacing: 0.5px;
  pointer-events: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.gallery__badge svg {
  color: var(--gold, #fff2bc);
}

/*
 * The arrow buttons sit ON the design's own ellipse plates, so the button itself is
 * transparent and only carries the hit area, the focus ring and the glyph.
 */
.gallery__nav {
  z-index: 950 !important;
  display: grid;
  place-items: center;
  width: calc(63 * var(--px));
  height: calc(60 * var(--px));
  top: calc(362 * var(--px));
  border: 0;
  background: none;
  cursor: pointer;
  --delay: 200ms;
}

.gallery__nav--prev { left: calc(5 * var(--px)); }
.gallery__nav--next { left: calc(528 * var(--px)); }

.gallery__nav img {
  width: calc(19 * var(--px));
  height: calc(29.5 * var(--px));
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.gallery__nav:hover img { transform: scale(1.16); }
.gallery__nav:focus-visible { outline: 2px solid var(--maroon); outline-offset: 2px; }

/* 2140:934 — Strip Thumbnail geser horizontal untuk 13 foto */
.gallery__strip {
  position: absolute;
  z-index: 900 !important;
  left: calc(37.29 * var(--px));
  top: calc(669.72 * var(--px));
  width: calc(523 * var(--px));
  height: calc(129.5 * var(--px));
  display: flex;
  gap: calc(11 * var(--px));
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: calc(2 * var(--px)) 0;
  --delay: 280ms;
}

.gallery__strip::-webkit-scrollbar {
  display: none;
}

.gallery__thumb {
  flex: 0 0 calc(122.5 * var(--px));
  width: calc(122.5 * var(--px));
  height: calc(125.5 * var(--px));
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: calc(10 * var(--px));
  overflow: hidden;
  background: none;
  cursor: pointer;
  opacity: 0.52;
  scroll-snap-align: start;
  transition: opacity 280ms ease, transform 240ms ease, box-shadow 240ms ease;
}

.gallery__thumb.is-current {
  opacity: 1;
  box-shadow: 0 0 0 calc(2.5 * var(--px)) var(--maroon, #730303);
  transform: scale(1.02);
}

.gallery__thumb:hover,
.gallery__thumb:focus-visible {
  opacity: 0.92;
}

.gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .gallery__nav:hover img { transform: none; }
}

/* =========================================================
 * Gaya Lightbox Fullscreen Modal
 * ========================================================= */
.lb-modal {
  position: fixed;
  inset: 0;
  z-index: 999999;
  background: rgba(12, 8, 7, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 16px) 16px;
  box-sizing: border-box;
}

.lb-header {
  width: 100%;
  max-width: 1100px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  box-sizing: border-box;
}

.lb-counter {
  color: #fff2bc;
  font-family: 'Jost', sans-serif;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 1px;
  background: rgba(255, 255, 255, 0.1);
  padding: 5px 14px;
  border-radius: 20px;
}

.lb-close {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 50%;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 200ms, transform 200ms;
}

.lb-close:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.08);
}

.lb-viewport {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  user-select: none;
  touch-action: pan-y;
}

.lb-img-container {
  max-width: 90vw;
  max-height: 75vh;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
}

.lb-img {
  max-width: 100%;
  max-height: 75vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.lb-arrow {
  background: rgba(40, 20, 15, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff2bc;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 10;
  transition: transform 200ms, background 200ms;
}

.lb-arrow:hover {
  background: rgba(115, 3, 3, 0.9);
  transform: scale(1.1);
}

.lb-footer {
  padding: 12px 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Jost', sans-serif;
  font-size: 13px;
  letter-spacing: 0.5px;
}

/* Lightbox fade transitions */
.lb-fade-enter-active,
.lb-fade-leave-active {
  transition: opacity 280ms ease, transform 280ms ease;
}

.lb-fade-enter-from,
.lb-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

@media (max-width: 600px) {
  .lb-arrow {
    width: 40px;
    height: 40px;
  }
  .lb-img {
    max-height: 68vh;
  }
}
</style>
