<script setup lang="ts">
// The invitation sheet. One component per band of the body frame, in Figma order;
// each band positions its own children relative to its own top, so inserting a band
// never renumbers the others. Band map and asset inventory: ../../../SLICING.md
//
// No bands sliced yet — import them from ../sections/ and list them in the template.
</script>

<template>
  <div class="sheet">
    <p class="sheet__empty">No bands sliced yet.</p>
  </div>
</template>

<style scoped>
/*
 * One design pixel = 100cqw / --frame-w, the same unit CoverSection uses, declared once
 * here so every band inherits it and can place children in raw Figma coordinates.
 *
 * --frame-w is LOAD-BEARING and it is not the same across templates: 2-5 were 375 wide
 * and 6 was 596. Every coordinate in every band table is in the design's own space, so a
 * --px derived from the wrong width renders the whole sheet at the wrong scale — 375
 * against a 596 frame is 63%. Set it in tokens.css from the design's own frame before
 * slicing anything, and divide rather than rounding a decimal: a rounded --px leaves the
 * sheet fractionally short of --body-h.
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

.sheet__empty {
  padding: 80px 24px;
  font-family: var(--font-sans);
  text-align: center;
  opacity: 0.5;
}
</style>
