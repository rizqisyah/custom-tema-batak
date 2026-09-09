<script setup lang="ts">
/*
 * Band 16 — thank you. Frame 9 (2129:12) y 14551 - 16159, the last band on the sheet.
 *
 * Three big ulos plates stacked behind a framed portrait, then the sign-off and the
 * footer credit. 2150:3 is the maroon footer bar and stays art; the credit printed on it
 * is live text in the design's own Cavilenny.
 *
 * 2146:1525 repeats the cover's two-line couple block at a THIRD size (112.67), so it
 * takes its own substitute width factor rather than any of the others.
 */
import { computed } from 'vue'
import BandArt from '../invite/BandArt.vue'
import { assets } from '../../lib/bandAssets'
import type { BandLayer } from '../../lib/bandLayer'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

const { el, shown } = useReveal()
const { coupleNickname } = useWedding()

const LAYERS: BandLayer[] = [
  { z: 2, id: '2144:1504', src: assets['thankyou/parts/2144-1504.webp'], x: -36, y: 0, w: 669, h: 669 },
  { z: 3, id: '2144:1503', src: assets['thankyou/parts/2144-1503.webp'], x: -15, y: 245, w: 659, h: 659 },
  { z: 4, id: '2144:1502', src: assets['thankyou/parts/2144-1502.webp'], x: -36, y: 904, w: 659, h: 659 },
  { z: 5, id: '2146:1521', src: assets['thankyou/parts/2146-1521.webp'], x: 48, y: 44, w: 502, h: 468 },
  { z: 6, id: '2146:1527', src: assets['thankyou/parts/2146-1527.webp'], x: 48, y: 512, w: 502, h: 1051 },
  { z: 183, id: '2145:1508', src: assets['thankyou/parts/2145-1508.webp'], x: 70, y: 415, w: 458, h: 707 },
  { z: 187, id: '2150:3', src: assets['thankyou/parts/2150-3.webp'], x: -7, y: 1560, w: 630, h: 73 },
]

const THANKS =
  'Atas kehadiran dan doa restunya, kami mengucapkan terima kasih.\nTuhan Yesus memberkati.'

/* Same derived break as the cover's — see CoverSection. */
const coupleLines = computed(() => coupleNickname.value.replace(/\s*&\s*/, '\n& '))
</script>

<template>
  <section :ref="el" class="band ty" :class="{ 'is-in': shown }">
    <BandArt :layers="LAYERS" :shown="shown" />

    <h2 class="ty__title">Thank You</h2>
    <p class="ty__thanks">{{ THANKS }}</p>
    <p class="ty__with">With Love,</p>
    <p class="ty__couple">{{ coupleLines }}</p>
    <p class="ty__credit">Created by 25ribuaja x Qinvi</p>
  </section>
</template>

<style scoped>
.ty {
  height: calc(1608 * var(--px));
}

.ty__title {
  left: calc(159 * var(--px));
  top: calc(116 * var(--px));
  width: calc(278 * var(--px));
  font-family: var(--font-script);
  --script-k: 0.408;
  font-size: calc(86.67 * var(--px) * var(--script-k));
  line-height: calc(83 * var(--px));
  font-weight: 400;
  color: var(--ink);
  --delay: 0ms;
}

.ty__thanks {
  left: calc(135 * var(--px));
  top: calc(233 * var(--px));
  width: calc(326 * var(--px));
  font-family: var(--font-body);
  font-size: calc(24 * var(--px));
  line-height: calc(30 * var(--px));
  white-space: pre-line; /* the design breaks before "Tuhan Yesus" */
  color: var(--ink);
  --delay: 120ms;
}

.ty__with {
  left: calc(131 * var(--px));
  top: calc(1187 * var(--px));
  width: calc(326 * var(--px));
  font-family: var(--font-body);
  font-size: calc(24 * var(--px));
  line-height: calc(30 * var(--px));
  color: var(--ink);
  --delay: 200ms;
}

/* 2146:1525 — the two-line block again, at 112.67 rather than the cover's 136.67. */
.ty__couple {
  left: 50%;
  top: calc(1256 * var(--px));
  width: calc(658.96 * var(--px));
  transform: translateX(-50%) translateY(calc(24 * var(--px)));
  font-family: var(--font-script);
  --script-k: 0.443;
  font-size: calc(112.67 * var(--px) * var(--script-k));
  line-height: calc(83 * var(--px));
  white-space: pre-line;
  color: var(--ink);
  --delay: 260ms;
}

.ty.is-in .ty__couple {
  transform: translateX(-50%);
}

/*
 * 2150:4 — the leading Figma reports (101) is five times the type size; it is what centres
 * the credit inside the 73px footer bar, so it is kept rather than "corrected".
 */
.ty__credit {
  left: calc(102 * var(--px));
  top: calc(1533 * var(--px));
  width: calc(392 * var(--px));
  font-family: "Cavilenny", cursive;
  font-size: calc(19 * var(--px));
  line-height: calc(101 * var(--px));
  color: #fff4ec;
  --delay: 320ms;
}
</style>
