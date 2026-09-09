<script setup lang="ts">
/*
 * Bands 12-15 — the four "Turut Mengundang" name lists. Frame 9 y 11333 - 14551.
 *
 * All four are the same shape: a maroon header bar with a white Times heading, a panel
 * behind a long ruled list of names, and (on `peranak` only) a small black line above
 * the list. So they are ONE component driven by src/lib/undanganData.ts rather than four
 * near-identical files — the only things that differ are the plates, the copy and a few
 * offsets, and those are data.
 *
 * The lists are the design's own content and are not driven by useWedding(): the API has
 * no field for a Batak invitation list, and these are hundreds of names where an empty
 * fallback would print four blank maroon bars.
 */
import BandArt from '../invite/BandArt.vue'
import { assets } from '../../lib/bandAssets'
import type { BandLayer } from '../../lib/bandLayer'
import type { UndanganSpec } from '../../lib/undanganData'
import { computed } from 'vue'
import { useReveal } from '../../composables/useReveal'

const props = defineProps<{ spec: UndanganSpec }>()
const { el, shown } = useReveal()

/*
 * The design sets these as NUMBERED lists. Figma applies the markers as a paragraph list
 * style, so they are not part of the node's `characters` and rendering the string as one
 * block silently drops every number. Each authored line is one <li> instead.
 */
const items = computed(() =>
  props.spec.list.text.split('\n').map((l) => l.trim()).filter(Boolean),
)

const layers = (): BandLayer[] =>
  props.spec.layers.map((l) => ({
    z: l.z,
    id: l.id,
    src: assets[l.file],
    x: l.x,
    y: l.y,
    w: l.w,
    h: l.h,
  }))
</script>

<template>
  <section :ref="el" class="band undangan" :class="{ 'is-in': shown }" :style="{ '--bh': spec.h }">
    <BandArt :layers="layers()" :shown="shown" />

    <h2
      class="undangan__heading"
      :style="{
        left: `calc(${spec.heading.x} * var(--px))`,
        top: `calc(${spec.heading.y} * var(--px))`,
        width: `calc(${spec.heading.w} * var(--px))`,
        fontSize: `calc(${spec.heading.size} * var(--px))`,
      }"
    >
      {{ spec.heading.text }}
    </h2>

    <p
      v-if="spec.note"
      class="undangan__note"
      :style="{
        left: `calc(${spec.note.x} * var(--px))`,
        top: `calc(${spec.note.y} * var(--px))`,
        width: `calc(${spec.note.w} * var(--px))`,
        fontSize: `calc(${spec.note.size} * var(--px))`,
      }"
    >
      {{ spec.note.text }}
    </p>

    <ol
      class="undangan__list"
      :style="{
        left: `calc(${spec.list.x} * var(--px))`,
        top: `calc(${spec.list.y + spec.list.lh} * var(--px))`,
        width: `calc(${spec.list.w} * var(--px))`,
        fontSize: `calc(${spec.list.size} * var(--px))`,
        lineHeight: `calc(${spec.list.lh} * var(--px))`,
      }"
    >
      <li v-for="(line, n) in items" :key="n">{{ line }}</li>
    </ol>
  </section>
</template>

<style scoped>
.undangan {
  height: calc(var(--bh) * var(--px));
}

/*
 * Times New Roman is the design's own face here — the only band that uses it, and the
 * only one whose heading is white. It is a system face, so it is not imported; the
 * fallback chain is what a machine without it will show.
 *
 * The design's leading (18.64) is SMALLER than the type (28.87), which would clip the
 * caps in a box of that height. The line-height is therefore left to the font rather
 * than pinned to Figma's number — a heading of one line does not need the design's
 * leading to sit where the design puts it, and honouring 18.64 crops the descenders.
 */
.undangan__heading {
  font-family: "Times New Roman", Times, serif;
  line-height: 1.15;
  font-weight: 400;
  color: #fff;
  --delay: 0ms;
}

.undangan__note {
  font-family: "Times New Roman", Times, serif;
  line-height: 1.15;
  color: #000;
  --delay: 120ms;
}

/*
 * One guest per authored line, LEFT aligned — unlike every other block on this sheet.
 *
 * The `+ lh` on `top` is not a nudge: every one of these four nodes begins with an
 * authored blank line, which is how the design clears its own heading. Stripping the
 * newline and keeping the node's y slides the whole list up onto the heading.
 *
 * The hanging indent is the design's: a wrapped line aligns under the text, not under
 * its number.
 */
.undangan__list {
  font-family: var(--font-serif);
  text-align: left;
  color: #000;
  padding-left: calc(23 * var(--px));
  --delay: 200ms;
}

.undangan__list li {
  padding-left: calc(3 * var(--px));
}
</style>
