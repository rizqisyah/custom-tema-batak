<script setup lang="ts">
/*
 * Band 1 — hero. Frame 9 (2129:12) y 0 - 998.
 *
 * The whole scene (songket curtain, forest photograph, the couple) is ONE Figma node:
 * Frame 14 / Container (2130:605), 596 x 998, the full width of the frame. So this band
 * is a single plate with two live text nodes over it, rather than the usual stack of
 * overlapping cut-outs.
 *
 * The plate's export came back 596 x 1024 rather than the 596 x 998 the node DECLARES,
 * and the extra 26 design px are real: the render paints them, and cropping the plate to
 * the declared height left a 190-mean-abs seam across the whole width at y 998. So the
 * layer is placed at the EXPORT's size, not the metadata's. The export is authoritative
 * about extent; the metadata box is authoritative about origin. The band itself stays
 * 998 tall — this plate simply overruns it, which is what the design does and what
 * SLICING.md's "Bands overlap" describes.
 */
import BandArt from '../invite/BandArt.vue'
import { assets } from '../../lib/bandAssets'
import type { BandLayer } from '../../lib/bandLayer'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

const { el, shown } = useReveal()
const { coupleNickname } = useWedding()

/*
 * `z` is the GLOBAL Figma child order, not this band's own — every band shares one
 * stacking context so cross-band layering survives the split. This plate is the frame's
 * 32nd child.
 */
const LAYERS: BandLayer[] = [
  { z: 32, id: '2130:605', src: assets['hero/parts/2130-605.webp'], x: 0, y: 0, w: 596, h: 1024 },
]
</script>

<template>
  <section :ref="el" class="band hero" :class="{ 'is-in': shown }">
    <BandArt :layers="LAYERS" :shown="shown" />

    <!--
      2129:590 — TWO lines in the design ("UNDANGAN SYUKURAN" / "PERNIKAHAN ADAT BATAK"),
      which is why its declared box is 91px tall against a 45.5px leading.
      The break is authored as a <br> rather than left to the box's 345px width: the
      second line inks ~344 of those 345 in fontsource's Instrument Serif, so a fraction
      of a rounded pixel at an arbitrary viewport tips it to three lines and the couple
      name below it gets a caps line dropped on top of it. `nowrap` pins each half.
    -->
    <p class="hero__kind">Undangan Syukuran<br />Pernikahan Adat Batak</p>

    <!--
      2129:593 — the document's real <h1> once the cover has unmounted (see App.vue).
      One line in the design, and live, so it is pinned with `nowrap`.
    -->
    <h1 class="hero__couple">{{ coupleNickname }}</h1>
  </section>
</template>

<style scoped>
.hero {
  height: calc(998 * var(--px));
}

/*
 * 2129:590 — declared at x 139 w 345, centred on the frame with the design's own +13.5
 * offset from dead centre.
 */
.hero__kind {
  left: calc(50% + 13.5 * var(--px));
  top: calc(179 * var(--px));
  width: calc(345 * var(--px));
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-size: calc(35 * var(--px));
  line-height: calc(45.5 * var(--px));
  text-transform: uppercase;
  /*
   * Left at the design's own tracking. fontsource's Instrument Serif inks ~8% wide of the
   * render, which used to risk pulling a word onto the wrong line; now that the break is
   * authored the overspill just centres itself either side of the node's axis, which is
   * where text-align: center puts it and what the rest of the sheet does too.
   */
  white-space: nowrap;
  color: #fff;
}

/*
 * 2129:593 — centred at 298.5. The design authors this at 75px in Creattion Demo; the
 * substitute takes the global single-line factor, which was measured on exactly this
 * node's ink (461px wide). See tokens.css.
 */
.hero__couple {
  left: calc(298.5 * var(--px));
  top: calc(259 * var(--px));
  transform: translateX(-50%);
  font-family: var(--font-script);
  font-size: calc(75 * var(--px) * var(--script-k));
  line-height: calc(82.5 * var(--px));
  font-weight: 400;
  white-space: nowrap;
  color: #fff;
}

/* The band's own copy fades up behind the art's entrance rather than with it. */
.hero__kind {
  --delay: 300ms;
}

.hero__couple {
  --delay: 460ms;
}

/*
 * Both of these are centred with translateX(-50%), and style.css's band entrance sets
 * `transform: translateY(...)` on every non-art child — which REPLACES the whole
 * transform, not just its Y. Without restating the X here the two nodes lose their
 * centring, sit at left:50% and run off the right edge; measured, the couple line inked
 * from x298 to the frame edge instead of x69-528. Any centred node in any band needs
 * this pair of rules.
 */
.hero__kind,
.hero__couple {
  transform: translateX(-50%) translateY(calc(24 * var(--px)));
}

.hero.is-in .hero__kind,
.hero.is-in .hero__couple {
  transform: translateX(-50%);
}
</style>
