<script setup lang="ts">
/*
 * Band 4 — bride. Frame 9 (2129:12) y 2530 - 3803.
 *
 * The un-mirrored half of the pair: the groom band is this scene flipped. Nothing here
 * reports a negative transform, so the plates sit at their declared x — several of them
 * negative, because the design bleeds the flowers and the house past the left edge.
 *
 * The "And" between the two names is a Creattion Demo node, so it carries its own
 * substitute width factor; a three-letter word lands on a different factor than the
 * couple's full name (SLICING.md trap 7, width-match per WORD).
 */
import BandArt from '../invite/BandArt.vue'
import { assets } from '../../lib/bandAssets'
import type { BandLayer } from '../../lib/bandLayer'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

const { el, shown } = useReveal()
const { bride } = useWedding()

const LAYERS: BandLayer[] = [
  { z: 9, id: '2144:1498', src: assets['bride/parts/2144-1498.webp'], x: -39, y: 279, w: 197, h: 346 },
  { z: 25, id: '2137:813', src: assets['bride/parts/2137-813.webp'], x: -39, y: 595, w: 863, h: 293 },
  { z: 28, id: '2137:818', src: assets['bride/parts/2137-818.webp'], x: 275, y: 393, w: 412, h: 550 },
  { z: 30, id: '2136:803', src: assets['bride/parts/2136-803.webp'], x: -174, y: 438, w: 402, h: 402 },
  { z: 32, id: '2136:799', src: assets['bride/parts/2136-799.webp'], x: 275, y: 0, w: 618, h: 559 },
  { z: 33, id: '2137:804', src: assets['bride/parts/2137-804.webp'], x: -105, y: 405, w: 498, h: 551 },
  { z: 46, id: '2139:846', src: assets['bride/parts/2139-846.webp'], x: 464, y: 59, w: 239.5, h: 294 },
  { z: 59, id: '2137:810', src: assets['bride/parts/2137-810.webp'], x: 367, y: 857, w: 378, h: 172 },
  { z: 71, id: '2137:812', src: assets['bride/parts/2137-812.webp'], x: 60, y: 875, w: 323, h: 123 },
  { z: 73, id: '2137:814', src: assets['bride/parts/2137-814.webp'], x: -9, y: 832, w: 209, h: 209 },
  { z: 75, id: '2136:800', src: assets['bride/parts/2136-800.webp'], x: -69, y: 840, w: 177, h: 177 },
  { z: 79, id: '2137:817', src: assets['bride/parts/2137-817.webp'], x: 490, y: 821, w: 159, h: 159 },
  { z: 81, id: '2138:820', src: assets['bride/parts/2138-820.webp'], x: 71, y: 851, w: 129, h: 129 },
  { z: 98, id: '2140:969', src: assets['bride/parts/2140-969.webp'], x: -87, y: 26, w: 174.5, h: 203.5 },
  { z: 99, id: '2140:970', src: assets['bride/parts/2140-970.webp'], x: -144, y: 77, w: 253, h: 281 },
]

const NAME = 'Monika Kristi Maria Manurung'
/*
 * The design authors a real newline in this node, before "dan Ibu". It is carried in the
 * constant and printed with `white-space: pre-line`, because the break cannot survive
 * either useWedding() or the Vue template parser (SLICING.md).
 */
const PARENTS =
  'Anak pertama dari Bapak Redison Manurung, S.Pd., M.Si., CGCAE., CAPG., CIAPAL. \n' +
  'dan Ibu Dina Everdina Tangapo / Br Simamora'
</script>

<template>
  <section :ref="el" class="band bride" :class="{ 'is-in': shown }">
    <BandArt :layers="LAYERS" :shown="shown" />

    <!-- 2130:670 — the design's own "And", 567 wide against a 596 frame. -->
    <p class="bride__and">And</p>

    <!-- 2130:665 / 2130:666 — centred in a 516-wide box at x 40, mirroring the groom's. -->
    <h2 class="bride__name">{{ bride?.name || NAME }}</h2>
    <p class="bride__parents">{{ bride?.parents || PARENTS }}</p>
  </section>
</template>

<style scoped>
.bride {
  height: calc(1273 * var(--px));
}

.bride__and {
  left: calc(-39 * var(--px));
  top: calc(175 * var(--px));
  width: calc(567 * var(--px));
  font-family: var(--font-script);
  font-size: calc(136.67 * var(--px) * var(--script-k));
  line-height: calc(83 * var(--px));
  color: var(--ink);
  --delay: 0ms;
}

.bride__name {
  left: calc(40 * var(--px));
  top: calc(1017 * var(--px));
  width: calc(516 * var(--px));
  font-family: var(--font-display);
  font-size: calc(51 * var(--px));
  line-height: calc(66.3 * var(--px));
  font-weight: 400;
  color: var(--ink);
  --delay: 240ms;
}

.bride__parents {
  left: calc(40 * var(--px));
  top: calc(1183.15 * var(--px));
  width: calc(516 * var(--px));
  font-family: var(--font-body);
  font-size: calc(24 * var(--px));
  line-height: calc(30 * var(--px));
  white-space: pre-line; /* carries the design's authored break before "dan Ibu" */
  color: var(--ink);
  --delay: 380ms;
}
</style>
