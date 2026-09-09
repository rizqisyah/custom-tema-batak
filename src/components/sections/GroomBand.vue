<script setup lang="ts">
/*
 * Band 3 — groom. Frame 9 (2129:12) y 1509 - 2530.
 *
 * The design builds this scene as a horizontally MIRRORED copy of the bride's, so nearly
 * every plate here reports `rotation: π` and a `relativeTransform` with a negative x
 * scale. That is why the plugin dump put half of them past the right edge of a 596-wide
 * frame: it reports a mirrored node's transform origin, which is its RIGHT edge. The
 * positions below come from the REST `absoluteBoundingBox` instead, which is the true
 * axis-aligned box — see SLICING.md, "What the official MCP's export actually is".
 *
 * Seven of these bleed off one edge or the other and are placed at their real x
 * (negative, or running past 596); `.sheet { overflow: hidden }` does the clipping,
 * exactly as the frame does in Figma.
 *
 * `2139:839` ("groom 2") is SKIPPED: it is hidden in Figma, a near-duplicate sitting on
 * top of the real groom. Exporting it double-prints him.
 */
import BandArt from '../invite/BandArt.vue'
import { assets } from '../../lib/bandAssets'
import type { BandLayer } from '../../lib/bandLayer'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

const { el, shown } = useReveal()
const { groom } = useWedding()

/* `z` is the GLOBAL Figma child order — every band shares one stacking context. */
const LAYERS: BandLayer[] = [
  { z: 10, id: '2144:1499', src: assets['groom/parts/2144-1499.webp'], x: 445, y: 0, w: 197, h: 346 },
  { z: 27, id: '2138:821', src: assets['groom/parts/2138-821.webp'], x: -201, y: 330, w: 863, h: 293 },
  { z: 29, id: '2138:822', src: assets['groom/parts/2138-822.webp'], x: -64, y: 128, w: 412, h: 550 },
  { z: 31, id: '2138:823', src: assets['groom/parts/2138-823.webp'], x: 395, y: 173, w: 402, h: 402 },
  { z: 35, id: '2138:825', src: assets['groom/parts/2138-825.webp'], x: 277, y: 67, w: 478, h: 629 },
  { z: 60, id: '2138:826', src: assets['groom/parts/2138-826.webp'], x: -122, y: 592, w: 378, h: 172 },
  { z: 72, id: '2138:827', src: assets['groom/parts/2138-827.webp'], x: 240, y: 610, w: 323, h: 123 },
  { z: 74, id: '2138:828', src: assets['groom/parts/2138-828.webp'], x: 423, y: 567, w: 209, h: 209 },
  { z: 76, id: '2138:829', src: assets['groom/parts/2138-829.webp'], x: 515, y: 575, w: 177, h: 177 },
  { z: 80, id: '2138:830', src: assets['groom/parts/2138-830.webp'], x: -26, y: 556, w: 159, h: 159 },
  { z: 83, id: '2138:831', src: assets['groom/parts/2138-831.webp'], x: 423, y: 586, w: 129, h: 129 },
]

/*
 * The design's own copy, so an unconfigured render matches the frame rather than
 * whatever wedding the default slug points at (see api.ts's DESIGN_MODE).
 */
const NAME = 'Waraney Lasut Soleman Roeroe, ST., M.Eng.'
const PARENTS =
  'Anak pertama dari Bapak Kakaskasen Andreas Roeroe, S.Pi., M.Sc., Ph.D. ' +
  'dan Ibu dr. Windy Mariane Virenia Wariki, M.Sc., Ph.D.'
</script>

<template>
  <section :ref="el" class="band groom" :class="{ 'is-in': shown }">
    <BandArt :layers="LAYERS" :shown="shown" />

    <!-- 2138:833 / 2138:834 — both centred in a 516-wide box at x 40. -->
    <h2 class="groom__name">{{ groom?.name || NAME }}</h2>
    <p class="groom__parents">{{ groom?.parents || PARENTS }}</p>
  </section>
</template>

<style scoped>
.groom {
  height: calc(1021 * var(--px));
}

.groom__name {
  left: calc(40 * var(--px));
  top: calc(761 * var(--px));
  width: calc(516 * var(--px));
  font-family: var(--font-display);
  font-size: calc(51 * var(--px));
  line-height: calc(66.3 * var(--px));
  font-weight: 400;
  color: var(--ink);
  --delay: 240ms;
}

.groom__parents {
  left: calc(40 * var(--px));
  top: calc(927.15 * var(--px));
  width: calc(516 * var(--px));
  font-family: var(--font-body);
  font-size: calc(24 * var(--px));
  line-height: calc(30 * var(--px));
  color: var(--ink);
  --delay: 380ms;
}
</style>
