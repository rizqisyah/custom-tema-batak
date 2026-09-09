<script setup lang="ts">
/*
 * Band 5 — save the date. Frame 9 (2129:12) y 3803 - 4927.
 *
 * Two things here are CHROME rather than art, and are redrawn instead of being printed
 * from the frame (SLICING.md, "Chrome that has to work ships as CSS"):
 *
 *  - The countdown. A picture of "0 Days 0 Hours" counts nothing. The four cells are
 *    live, positioned at the design's own coordinates, and the plates behind them (the
 *    songket banner and the ribbon) stay as art.
 *  - "Add to Calendar". A raster of a button cannot be clicked, focused or read out. The
 *    design's own plate (2130:700) is therefore SKIPPED from the art table and used as
 *    the anchor's background instead, so the pixels are still Figma's while the element
 *    is a real link.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BandArt from '../invite/BandArt.vue'
import { assets } from '../../lib/bandAssets'
import type { BandLayer } from '../../lib/bandLayer'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

const { el, shown } = useReveal()
const { acara } = useWedding()

const LAYERS: BandLayer[] = [
  { z: 1, id: '2144:1505', src: assets['savedate/parts/2144-1505.webp'], x: -4, y: 919, w: 620, h: 258 },
  { z: 23, id: '2140:962', src: assets['savedate/parts/2140-962.webp'], x: -55, y: 45, w: 109, h: 952 },
  { z: 36, id: '2134:792', src: assets['savedate/parts/2134-792.webp'], x: 87.47, y: 379.89, w: 426.5, h: 596 },
  { z: 77, id: '2130:673', src: assets['savedate/parts/2130-673.webp'], x: 26, y: 210, w: 544.5, h: 816.5 },
  { z: 94, id: '2140:961', src: assets['savedate/parts/2140-961.webp'], x: 550, y: 45, w: 109, h: 937 },
  { z: 95, id: '2140:963', src: assets['savedate/parts/2140-963.webp'], x: 218, y: 12, w: 161, h: 161 },
  { z: 96, id: '2140:964', src: assets['savedate/parts/2140-964.webp'], x: -16, y: 0, w: 138, h: 223 },
  { z: 97, id: '2140:965', src: assets['savedate/parts/2140-965.webp'], x: 490, y: 6, w: 121, h: 223 },
  // 2130:700 is deliberately absent — it is the Add to Calendar plate, see the anchor below.
]

/*
 * The design prints "SABTU 19 SEPTEMBER 2026" and "11.00 WITA". WITA is UTC+8, so the
 * offset is written explicitly rather than left to the viewer's clock — a guest in
 * Jakarta counting down to a Manado wedding must see the same number as one in Manado.
 */
const DESIGN_START = '2026-09-19T11:00:00+08:00'

const target = computed(() => {
  const raw = (acara.value as any[] | null)?.[0]
  const iso = raw?.start ?? raw?.date ?? ''
  const t = Date.parse(iso)
  return Number.isNaN(t) ? Date.parse(DESIGN_START) : t
})

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => clearInterval(timer))

/* Clamped at zero: after the wedding the design should read 0, not count upwards. */
const left = computed(() => Math.max(0, target.value - now.value))
const cells = computed(() => {
  const s = Math.floor(left.value / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
})

const calendarHref = computed(() => {
  const start = new Date(target.value)
  const end = new Date(target.value + 3 * 60 * 60 * 1000)
  const stamp = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '')
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Syukuran Pernikahan Adat Batak — Waraney & Monika',
    dates: `${stamp(start)}/${stamp(end)}`,
    location: 'Auditorium Universitas Sam Ratulangi Manado',
  })
  return `https://calendar.google.com/calendar/render?${p}`
})
</script>

<template>
  <section :ref="el" class="band savedate" :class="{ 'is-in': shown }">
    <BandArt :layers="LAYERS" :shown="shown" />

    <!-- 2130:674 — Creattion Demo at 86.67; the substitute carries its own width factor. -->
    <h2 class="savedate__title">Save the Date</h2>

    <!-- 2130:679 .. 2130:697 — four cells, each at the design's own x. -->
    <p class="savedate__n savedate__n--days">{{ cells.days }}</p>
    <p class="savedate__l savedate__l--days">Days</p>
    <p class="savedate__n savedate__n--hours">{{ cells.hours }}</p>
    <p class="savedate__l savedate__l--hours">Hours</p>
    <p class="savedate__n savedate__n--minutes">{{ cells.minutes }}</p>
    <p class="savedate__l savedate__l--minutes">Minutes</p>
    <p class="savedate__n savedate__n--seconds">{{ cells.seconds }}</p>
    <p class="savedate__l savedate__l--seconds">Seconds</p>

    <a class="savedate__cal" :href="calendarHref" target="_blank" rel="noopener noreferrer">
      Add to Calendar
    </a>
  </section>
</template>

<style scoped>
.savedate {
  height: calc(1124 * var(--px));
}

/*
 * 658.96 wide against a 596 frame, so it is placed from the centre. The X has to be
 * restated in both entrance states or style.css's `transform: translateY(...)` replaces
 * it outright and the title slides half a frame right — see SLICING.md.
 */
.savedate__title {
  left: 50%;
  top: calc(210 * var(--px));
  width: calc(658.96 * var(--px));
  transform: translateX(-50%) translateY(calc(24 * var(--px)));
  font-family: var(--font-script);
  font-size: calc(86.67 * var(--px) * var(--script-k));
  line-height: calc(83 * var(--px));
  font-weight: 400;
  color: var(--ink);
  --delay: 0ms;
}

.savedate.is-in .savedate__title {
  transform: translateX(-50%);
}

/* The countdown's own red, brighter than the sheet's --maroon. */
.savedate__n,
.savedate__l {
  color: #b40707;
  font-family: var(--font-serif);
}

.savedate__n {
  font-size: calc(61.95 * var(--px));
  line-height: calc(77.44 * var(--px));
  width: calc(37 * var(--px));
  --delay: 200ms;
}

.savedate__l {
  font-size: calc(24.2 * var(--px));
  line-height: calc(30.25 * var(--px));
  --delay: 280ms;
}

/*
 * The four numbers are NOT on a grid — the design nudges each one, and a tidy grid moves
 * them off the ornament they sit inside. Each keeps its own measured x.
 */
.savedate__n--days { left: calc(216.5 * var(--px)); top: calc(480.07 * var(--px)); }
.savedate__n--hours { left: calc(346.15 * var(--px)); top: calc(480.07 * var(--px)); }
.savedate__n--minutes { left: calc(211.66 * var(--px)); top: calc(608.68 * var(--px)); }
.savedate__n--seconds { left: calc(341.03 * var(--px)); top: calc(608.68 * var(--px)); }

.savedate__l--days { left: calc(210 * var(--px)); top: calc(556.55 * var(--px)); width: calc(50 * var(--px)); }
.savedate__l--hours { left: calc(333.35 * var(--px)); top: calc(556.55 * var(--px)); width: calc(63 * var(--px)); }
.savedate__l--minutes { left: calc(188.66 * var(--px)); top: calc(685.15 * var(--px)); width: calc(83 * var(--px)); }
.savedate__l--seconds { left: calc(310.36 * var(--px)); top: calc(685.15 * var(--px)); width: calc(113.26 * var(--px)); }

/*
 * 2130:700 as a background rather than a BandArt layer, so the design's own plate is the
 * button's face and the element is still a real, focusable link.
 */
.savedate__cal {
  left: calc(188.63 * var(--px));
  top: calc(756.93 * var(--px));
  width: calc(212 * var(--px));
  height: calc(52.5 * var(--px));
  display: grid;
  place-items: center;
  background: url('../../assets/savedate/parts/2130-700.webp') center / 100% 100% no-repeat;
  font-family: var(--font-body);
  font-size: calc(24.16 * var(--px));
  line-height: calc(51.67 * var(--px));
  color: var(--cream);
  text-decoration: none;
  --delay: 360ms;
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.savedate__cal:hover,
.savedate__cal:focus-visible {
  transform: translateY(calc(-2 * var(--px)));
}

@media (prefers-reduced-motion: reduce) {
  .savedate__cal:hover,
  .savedate__cal:focus-visible {
    transform: none;
  }
}
</style>
