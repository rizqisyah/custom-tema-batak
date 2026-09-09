<script setup lang="ts">
/*
 * Band 8 — "Our Wedding Memories". Frame 9 (2129:12) y 7242 - 8020.
 *
 * A framed photograph with four flower plates overlapping its corners, two of which bleed
 * off the left edge and two off the right. Both headings are Creattion Demo at 86.67 and
 * OVERLAP each other by design — "Our Wedding" sits at y 0 and "Memories" at y 63, inside
 * an 83px leading, which is what gives the pair its hand-lettered stagger.
 *
 * 2140:973 is the photo itself, inside 2140:971's frame. It is left as art rather than
 * driven by useWedding(): the design's gold frame is drawn INTO the plate around it, so a
 * live image swapped in behind would not line up with the mount.
 */
import BandArt from '../invite/BandArt.vue'
import { assets } from '../../lib/bandAssets'
import type { BandLayer } from '../../lib/bandLayer'
import { useReveal } from '../../composables/useReveal'

const { el, shown } = useReveal()

const LAYERS: BandLayer[] = [
  { z: 135, id: '2140:971', src: assets['memories/parts/2140-971.webp'], x: 46, y: 166, w: 530.5, h: 480 },
  { z: 136, id: '2140:973', src: assets['memories/parts/2140-973.webp'], x: 68.24, y: 191.41, w: 475.5, h: 429 },
  { z: 137, id: '2141:984', src: assets['memories/parts/2141-984.webp'], x: -88, y: 384, w: 183, h: 183 },
  { z: 138, id: '2141:988', src: assets['memories/parts/2141-988.webp'], x: 501, y: 384, w: 183, h: 183 },
  { z: 139, id: '2141:985', src: assets['memories/parts/2141-985.webp'], x: -115, y: 223, w: 239, h: 253.5 },
  { z: 140, id: '2141:986', src: assets['memories/parts/2141-986.webp'], x: 485, y: 223, w: 239, h: 253.5 },
]
</script>

<template>
  <section :ref="el" class="band memories" :class="{ 'is-in': shown }">
    <BandArt :layers="LAYERS" :shown="shown" />

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
</style>
