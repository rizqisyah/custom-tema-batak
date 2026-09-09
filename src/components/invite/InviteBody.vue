<script setup lang="ts">
/*
 * The invitation sheet. One component per band of the body frame, in Figma order; each
 * band positions its own children relative to its own top, so inserting a band never
 * renumbers the others. Band map and asset inventory: ../../../SLICING.md
 *
 * PARTIALLY SLICED. Frame 9 (2129:12) is 596 x 16159 and carries ~16 bands; ALL SIXTEEN
 * below are cut and verified against the frame render. The sheet is therefore the frame's full 16159,
 * not --body-h (16159) — see the note on .sheet's height.
 */
import HeroBand from '../sections/HeroBand.vue'
import VerseBand from '../sections/VerseBand.vue'
import GroomBand from '../sections/GroomBand.vue'
import BrideBand from '../sections/BrideBand.vue'
import SaveDateBand from '../sections/SaveDateBand.vue'
import EventBand from '../sections/EventBand.vue'
import GalleryBand from '../sections/GalleryBand.vue'
import MemoriesBand from '../sections/MemoriesBand.vue'
import GiftBand from '../sections/GiftBand.vue'
import ReservationBand from '../sections/ReservationBand.vue'
import WishesBand from '../sections/WishesBand.vue'
import UndanganBand from '../sections/UndanganBand.vue'
import ThankYouBand from '../sections/ThankYouBand.vue'
import { UNDANGAN } from '../../lib/undanganData'
</script>

<template>
  <div class="sheet">
    <HeroBand />
    <VerseBand />
    <GroomBand />
    <BrideBand />
    <SaveDateBand />
    <EventBand />
    <GalleryBand />
    <MemoriesBand />
    <GiftBand />
    <ReservationBand />
    <WishesBand />
    <UndanganBand v-for="u in UNDANGAN" :key="u.key" :spec="u" />
    <ThankYouBand />
  </div>
</template>

<style scoped>
/*
 * One design pixel = 100cqw / --frame-w, the same unit CoverSection uses, declared once
 * here so every band inherits it and can place children in raw Figma coordinates.
 *
 * --frame-w is LOAD-BEARING and it is not the same across templates: 2-5 were 375 wide
 * and 6 and 7 are 596. Every coordinate in every band table is in the design's own
 * space, so a --px derived from the wrong width renders the whole sheet at the wrong
 * scale. It is set in tokens.css from this design's own frame.
 */
.sheet {
  container-type: inline-size;
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--sheet, var(--paper));
}

.sheet > * {
  --px: calc(100cqw / var(--frame-w));
}

/*
 * NOT --body-h yet. The sheet's height is the sum of the bands actually cut, so the
 * scroll length matches what exists instead of trailing 14650px of empty cream. When
 * the last band lands, this becomes calc(var(--body-h) * var(--px)) and
 * sheet-shot.mjs's printed height must equal 16159 exactly — rounding each band's top
 * and height independently is what leaves a 1px seam and a short sheet.
 */
</style>
