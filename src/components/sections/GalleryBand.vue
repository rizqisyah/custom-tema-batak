<script setup lang="ts">
/*
 * Band 7 — gallery. Frame 9 (2129:12) y 6367 - 7242.
 *
 * The design draws a photo, two arrow buttons and a strip of four thumbnails. Printed as
 * art that is a picture of a carousel: the arrows do nothing and the strip cannot follow
 * live photos. So the photo and the strip are driven by `useWedding().gallery` and the
 * arrows are real buttons — but the ARROW GLYPHS stay Figma's exported assets rather than
 * being redrawn as CSS chevrons, which is the rule for an icon the design already exports
 * (SLICING.md, "An icon the design exports is not one to redraw in CSS").
 *
 * The design-mode fallback repeats the frame's own photograph four times, because that is
 * literally what the design does — the four thumbnails in the render are the same image.
 * Without a fallback list this band is dead in the only mode the slicing is looked at in.
 */
import { computed, ref } from 'vue'
import BandArt from '../invite/BandArt.vue'
import { assets } from '../../lib/bandAssets'
import type { BandLayer } from '../../lib/bandLayer'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

const { el, shown } = useReveal()
const { gallery } = useWedding()

const PHOTO = assets['gallery/parts/2140-878.webp']

/* Only the arrow plates stay as BandArt; the photo and strip are rendered from the list. */
const LAYERS: BandLayer[] = [
  { z: 93, id: '2140:935', src: assets['gallery/parts/2140-935.webp'], x: 5, y: 362, w: 63, h: 60 },
  { z: 94, id: '2140:938', src: assets['gallery/parts/2140-938.webp'], x: 528, y: 362, w: 63, h: 60 },
]

const photos = computed<string[]>(() => {
  const live = (gallery.value as any[] | null) ?? []
  const urls = live.map((g) => g?.image || g?.url).filter(Boolean)
  return urls.length ? urls : [PHOTO, PHOTO, PHOTO, PHOTO]
})

const i = ref(0)
const at = (n: number) => {
  const len = photos.value.length
  i.value = ((n % len) + len) % len
}
</script>

<template>
  <section :ref="el" class="band gallery" :class="{ 'is-in': shown }">
    <BandArt :layers="LAYERS" :shown="shown" />

    <h2 class="gallery__title">Gallery Photo</h2>

    <!-- 2140:878 — the design's photo box; the image inside it is live. -->
    <img class="gallery__main" :src="photos[i]" alt="" loading="lazy" decoding="async" />

    <!-- 2140:935 / 2140:937 and their mirrors — the exported glyph inside a real button. -->
    <button class="gallery__nav gallery__nav--prev" type="button" @click="at(i - 1)">
      <img :src="assets['gallery/parts/2140-937.webp']" alt="" />
      <span class="sr-only">Foto sebelumnya</span>
    </button>
    <button class="gallery__nav gallery__nav--next" type="button" @click="at(i + 1)">
      <img :src="assets['gallery/parts/2140-939.webp']" alt="" />
      <span class="sr-only">Foto berikutnya</span>
    </button>

    <!-- 2140:934 — the strip, one thumb per photo rather than one baked plate. -->
    <div class="gallery__strip">
      <button
        v-for="(p, n) in photos"
        :key="n"
        class="gallery__thumb"
        :class="{ 'is-current': n === i }"
        type="button"
        @click="at(n)"
      >
        <img :src="p" alt="" loading="lazy" decoding="async" />
        <span class="sr-only">Foto {{ n + 1 }}</span>
      </button>
    </div>
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
  /* Measured on this string: 380px of ink in Figma against 368 at 0.395. */
  --script-k: 0.408;
  font-size: calc(86.67 * var(--px) * var(--script-k));
  line-height: calc(83 * var(--px));
  font-weight: 400;
  color: var(--ink);
  --delay: 0ms;
}

.gallery.is-in .gallery__title {
  transform: translateX(-50%);
}

.gallery__main {
  z-index: 88 !important;
  left: calc(35 * var(--px));
  top: calc(124 * var(--px));
  width: calc(526.5 * var(--px));
  height: calc(515 * var(--px));
  object-fit: cover;
  border-radius: calc(12 * var(--px));
  --delay: 120ms;
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

/* 2140:934 — 523 wide at x 37.29, four thumbs across. */
.gallery__strip {
  z-index: 900 !important;
  left: calc(37.29 * var(--px));
  top: calc(669.72 * var(--px));
  width: calc(523 * var(--px));
  height: calc(129.5 * var(--px));
  display: flex;
  gap: calc(11 * var(--px));
  --delay: 280ms;
}

.gallery__thumb {
  flex: 1 1 0;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: calc(10 * var(--px));
  overflow: hidden;
  background: none;
  cursor: pointer;
  opacity: 0.62;
  transition: opacity 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.gallery__thumb.is-current,
.gallery__thumb:hover,
.gallery__thumb:focus-visible {
  opacity: 1;
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
</style>
