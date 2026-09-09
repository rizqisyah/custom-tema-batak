<script setup lang="ts">
/*
 * Band 6 — the event card. Frame 9 (2129:12) y 4927 - 6367.
 *
 * The card itself is NOT art. Figma builds it from filled container frames — a white
 * rounded panel and a maroon gradient header — that also hold the live copy, so they are
 * drawn as CSS surfaces rather than exported (SLICING.md, "Chrome that has to work ships
 * as CSS"). Exporting them would bake the date into a picture and freeze the card's
 * height at whatever the design's venue string happened to be.
 *
 * "View Maps" is a real link, and the two outlined pills are the design's own strokes.
 */
import { computed } from 'vue'
import BandArt from '../invite/BandArt.vue'
import { assets } from '../../lib/bandAssets'
import type { BandLayer } from '../../lib/bandLayer'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

const { el, shown } = useReveal()
const { acara, coupleNickname } = useWedding()

const LAYERS: BandLayer[] = [
  { z: 24, id: '2130:705', src: assets['event/parts/2130-705.webp'], x: -1, y: 0, w: 614, h: 222 },
  { z: 26, id: '2140:851', src: assets['event/parts/2140-851.webp'], x: 535, y: 750, w: 139, h: 212 },
  { z: 66, id: '2130:738', src: assets['event/parts/2130-738.webp'], x: 57.96, y: 779.84, w: 480, h: 35.5 },
  { z: 82, id: '2140:853', src: assets['event/parts/2140-853.webp'], x: 487, y: 887, w: 236.5, h: 233 },
  { z: 84, id: '2140:848', src: assets['event/parts/2140-848.webp'], x: 502, y: 856, w: 236, h: 246 },
  { z: 162, id: '2144:1506', src: assets['event/parts/2144-1506.webp'], x: 246, y: 36, w: 105, h: 137 },
  { z: 163, id: '2144:1507', src: assets['event/parts/2144-1507.webp'], x: 240, y: 53, w: 129, h: 124 },
]

/* The design's own copy — see api.ts's DESIGN_MODE. */
const D = {
  headline: 'SABTU 19  SEPTEMBER 2026',
  invite: 'Surrounded by our beloved families, we invite you to join us',
  day: 'Sabtu',
  date: '19  September 2026',
  time: '11.00 WITA',
  venue: 'Auditorium Universitas Sam Ratulangi Manado',
}

const ev = computed(() => (acara.value as any[] | null)?.[0] ?? null)
const venue = computed(() => ev.value?.tempat || ev.value?.location || D.venue)
/* 2130:732 carries an authored break between the two lines; `pre-line` keeps it. */
const title = computed(() => `Syukuran Pernikahan Adat Batak \n${coupleNickname.value}`)
const mapsHref = computed(
  () => ev.value?.maps_url || `https://maps.google.com/?q=${encodeURIComponent(venue.value)}`,
)
</script>

<template>
  <section :ref="el" class="band event" :class="{ 'is-in': shown }">
    <BandArt :layers="LAYERS" :shown="shown" />

    <!-- 2130:718 / 2130:720 — the card and its gradient header, both CSS surfaces. -->
    <div class="event__card"></div>
    <div class="event__cardhead"></div>

    <p class="event__headline">{{ D.headline }}</p>
    <p class="event__invite">{{ D.invite }}</p>

    <p class="event__day">{{ D.day }}</p>
    <p class="event__date">{{ ev?.tanggal || D.date }}</p>
    <p class="event__title">{{ title }}</p>

    <p class="event__pukul">Pukul</p>
    <!-- 2130:744 — the design's own outlined pill around the time. -->
    <p class="event__time">{{ ev?.jam || D.time }}</p>

    <p class="event__at">Bertempat di</p>
    <p class="event__venue">{{ venue }}</p>

    <a class="event__maps" :href="mapsHref" target="_blank" rel="noopener noreferrer">
      View Maps
    </a>
  </section>
</template>

<style scoped>
.event {
  height: calc(1440 * var(--px));
}

/* 2130:718 — white panel, radius 12. Below every piece of the card's copy. */
.event__card {
  /* Figma's own order: above the flower at z 26, below the divider plate at z 66. */
  z-index: 61 !important;
  left: calc(47.96 * var(--px));
  top: calc(530.2 * var(--px));
  width: calc(500 * var(--px));
  height: calc(681 * var(--px));
  border-radius: calc(12 * var(--px));
  background: #fff;
  --delay: 0ms;
}

/*
 * 2130:720 — the header's gradient, exactly as Figma's stops report it. The sweep runs
 * left-to-right, maroon into the pale edge that the render shows on the right.
 */
.event__cardhead {
  z-index: 62 !important;
  left: calc(47.96 * var(--px));
  top: calc(530.5 * var(--px));
  width: calc(500 * var(--px));
  height: calc(128.25 * var(--px));
  border-radius: calc(10 * var(--px));
  background: linear-gradient(90deg, #870000 0%, #4f1010 55%, #eef3f1 100%);
  --delay: 60ms;
}

.event__headline {
  left: calc(90 * var(--px));
  top: calc(342 * var(--px));
  width: calc(416 * var(--px));
  font-family: var(--font-display);
  font-size: calc(43 * var(--px));
  line-height: calc(55.9 * var(--px));
  color: var(--ink);
  --delay: 80ms;
}

/*
 * Figma Hand substitute. The tracking is NOT the cover's 0.202em: that value was fitted
 * to a 14-character single line, and applied to this 60-character wrapping paragraph it
 * adds ~2px per glyph and pushes "families," onto the second line — the design breaks
 * after it. Tracking has to be fitted per NODE once a node wraps, because the error
 * accumulates with length. Fitted here from the render's own line 1: 35 characters in
 * 375px of ink (10.7px each) against 25 in 320px (12.8px each) at the cover's value.
 */
.event__invite {
  left: calc(99 * var(--px));
  top: calc(415 * var(--px));
  width: calc(399 * var(--px));
  font-family: var(--font-hand);
  font-size: calc(20 * var(--px) * var(--hand-k));
  line-height: calc(28 * var(--px));
  letter-spacing: 0.087em;
  color: var(--ink);
  --delay: 140ms;
}

/* 2130:722 — Creattion Demo at 55; its own measured width factor. */
.event__day {
  left: calc(249.96 * var(--px));
  top: calc(550.5 * var(--px));
  width: calc(96 * var(--px));
  font-family: var(--font-script);
  --script-k: 0.42;
  font-size: calc(55 * var(--px) * var(--script-k));
  line-height: calc(55 * var(--px));
  color: #fff;
  --delay: 200ms;
}

.event__date {
  left: calc(176.96 * var(--px));
  top: calc(613.75 * var(--px));
  width: calc(242 * var(--px));
  font-family: var(--font-serif);
  font-size: calc(19 * var(--px));
  line-height: calc(24.7 * var(--px));
  letter-spacing: calc(5 * var(--px)); /* the design's own 5px tracking */
  color: #fff;
  --delay: 240ms;
}

.event__title {
  left: calc(93.96 * var(--px));
  top: calc(719.84 * var(--px));
  width: calc(408 * var(--px));
  font-family: var(--font-display);
  font-size: calc(35 * var(--px));
  line-height: calc(45.5 * var(--px));
  white-space: pre-line;
  color: var(--ink);
  --delay: 300ms;
}

.event__pukul,
.event__at,
.event__venue {
  font-family: var(--font-serif);
  font-size: calc(17 * var(--px));
  line-height: calc(22.1 * var(--px));
  color: var(--ink);
}

.event__pukul { left: calc(276.5 * var(--px)); top: calc(855 * var(--px)); width: calc(43 * var(--px)); --delay: 340ms; }
.event__at { left: calc(251 * var(--px)); top: calc(989 * var(--px)); width: calc(93 * var(--px)); --delay: 420ms; }
.event__venue { left: calc(57.96 * var(--px)); top: calc(1015 * var(--px)); width: calc(480 * var(--px)); --delay: 460ms; }

/*
 * 2130:744 / 2130:760 — outlined pills. The stroke colour and radius are the design's;
 * the box is centred on the design's own x rather than on the frame.
 */
.event__time,
.event__maps {
  display: grid;
  place-items: center;
  border: 1px solid #53594a;
  color: #53594a;
  font-family: var(--font-serif);
  text-decoration: none;
}

.event__time {
  left: calc(226.97 * var(--px));
  top: calc(890.77 * var(--px));
  width: calc(141.5 * var(--px));
  height: calc(40.9 * var(--px));
  border-radius: calc(13.45 * var(--px));
  font-size: calc(17.55 * var(--px));
  --delay: 380ms;
}

.event__maps {
  left: calc(204.95 * var(--px));
  top: calc(1054 * var(--px));
  width: calc(185.9 * var(--px));
  height: calc(43 * var(--px));
  border-radius: calc(25.57 * var(--px));
  font-size: calc(17.43 * var(--px));
  --delay: 520ms;
  transition: background 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.event__maps:hover,
.event__maps:focus-visible {
  background: rgba(83, 89, 74, 0.1);
}
</style>
