<script setup lang="ts">
import { computed } from 'vue'
import coverBg from '../../assets/opening/bg.webp'

/*
 * Figma Frame 8 (2129:2), 596 x 1183. Every coordinate below is frame-local design px,
 * read straight off the frame's own geometry — see SLICING.md.
 *
 * The frame has seven children and only ONE of them is a raster: the forest photograph.
 * The two "Rectangle" nodes are not gradients and not art — they are flat fills at
 * rgba(165,151,120,.55) and .74 carrying a 100px Gaussian blur, which is what lifts the
 * type off the photo at the top and bottom. They are CSS here, not exported plates:
 * a blurred flat colour is one declaration and stays sharp at every viewport.
 *
 * `ready` gates the reveal on the photo being decoded — see App.vue.
 */
const props = defineProps<{ guestName: string; coupleName: string; ready: boolean }>()
defineEmits<{ open: [] }>()

/*
 * The design breaks the couple name across two lines, with the ampersand leading the
 * second: "Waraney" / "& Monika". That break cannot be authored as a newline in the
 * string — useWedding() drives this text and an escape in the template is folded to a
 * space by the Vue parser (SLICING.md, "An authored newline ... cannot survive").
 *
 * So it is derived instead: break before the ampersand, which is the shape every one of
 * these names takes. A name without one simply stays on a single line.
 */
const coupleLines = computed(() => props.coupleName.replace(/\s*&\s*/, '\n  & '))
</script>

<template>
  <section class="cover">
    <div class="cover__frame" :class="{ 'cover__frame--ready': ready }">
      <!--
        2130:654 — 919 x 1222 at (-161, -19), so it bleeds past both side edges and both
        top and bottom. Centred on the frame rather than positioned from its declared x:
        the design centres it, and centring survives the crop when the column is narrower
        than the frame. `object-fit: cover` reproduces Figma's own fill crop of the
        2731 x 4096 original.
      -->
      <img class="cover__photo" :src="coverBg" alt="" width="919" height="1222" />

      <!-- 2140:860 / 2140:862 — the two blurred fills, behind every piece of type. -->
      <div class="cover__glow cover__glow--top"></div>
      <div class="cover__glow cover__glow--bottom"></div>

      <!-- 2130:658 — one text node of three lines, each with its own size and leading. -->
      <div class="cover__title">
        <p class="cover__eyebrow">The Wedding Of</p>
        <h1 class="cover__couple">{{ coupleLines }}</h1>
      </div>

      <!-- 2140:863 / 2140:864 — box tops, not baselines; the 65px leading centres the ink. -->
      <p class="cover__dear">Kepada Yth.</p>
      <p class="cover__guest">{{ guestName }}</p>

      <!--
        2130:657 — the design's own button, redrawn as a real <button>. A raster of it
        could not be focused, hovered or pressed (SLICING.md, "Chrome that has to work
        ships as CSS"). The fill and radius are the design's: #730303, 48px.
      -->
      <button class="cover__open" type="button" @click="$emit('open')">Open Invitation</button>
    </div>
  </section>
</template>

<style scoped>
.cover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100dvh;
  overflow: hidden;
  background: var(--paper);
}

/*
 * One design pixel = 100cqw / 596, so the composition scales as a unit instead of
 * reflowing. Width is driven by the viewport height so the card fills the screen;
 * `max()` rather than the bare height-derived width because Safari's dvh excludes the
 * toolbars, which would leave a gutter down both sides. `.cover` crops the overflow.
 */
.cover__frame {
  container-type: inline-size;
  position: relative;
  flex: 0 0 auto; /* or the 430px desktop column squashes the width-driven frame back down */
  overflow: hidden;
  width: max(100%, calc(100dvh * 596 / 1183));
  aspect-ratio: 596 / 1183;
  background: var(--paper);
}

.cover__frame > * {
  --px: calc(100cqw / 596);
  position: absolute;
  margin: 0;
  text-align: center;
  /*
   * Held until the photo is decoded. `visibility` rather than `display` so the image is
   * still in the document and actually fetching while hidden.
   */
  visibility: hidden;
  animation-play-state: paused;
}

.cover__frame--ready > * {
  visibility: visible;
  animation-play-state: running;
}

/*
 * Everything except the button is decorative and must not take the pointer. The bottom
 * glow spans 893-1170 and the button sits at 1032 INSIDE it, so without this the glow
 * swallows every tap meant for the button and the cover cannot be opened at all
 * (SLICING.md, "pointer-events: none on the cover's decorative layers is load-bearing").
 */
.cover__photo,
.cover__glow,
.cover__title,
.cover__dear,
.cover__guest {
  pointer-events: none;
}

.cover__photo {
  z-index: 1;
  left: 50%;
  top: calc(-19 * var(--px));
  width: calc(919 * var(--px));
  height: calc(1222 * var(--px));
  max-width: none;
  object-fit: cover;
  transform: translateX(-50%);
  animation: cover-rise 2600ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.cover__glow {
  z-index: 2;
  /* Blurs in design px so the falloff scales with everything else. */
  filter: blur(calc(100 * var(--px)));
}

.cover__glow--top {
  left: calc(-39 * var(--px));
  top: calc(-60 * var(--px));
  width: calc(722 * var(--px));
  height: calc(451 * var(--px));
  background: rgba(165, 151, 120, 0.55);
}

.cover__glow--bottom {
  left: calc(71 * var(--px));
  top: calc(893 * var(--px));
  width: calc(455 * var(--px));
  height: calc(277 * var(--px));
  background: rgba(165, 151, 120, 0.74);
}

/*
 * 2130:658. The node is 658.963 wide against a 596 frame — it bleeds ~31px past each
 * side — and is centred on the frame, so it is placed from the centre rather than from
 * its declared x. The +5.48 is the design's own offset from dead centre.
 */
.cover__title {
  z-index: 3;
  left: calc(50% + 5.48 * var(--px));
  top: calc(67 * var(--px));
  width: calc(658.963 * var(--px));
  transform: translateX(-50%);
  color: #fff;
  animation: cover-rise 2200ms cubic-bezier(0.16, 1, 0.3, 1) 260ms backwards;
}

.cover__title > * {
  margin: 0;
}

.cover__eyebrow {
  font-family: var(--font-hand);
  font-size: calc(22.93 * var(--px) * var(--hand-k));
  /* The design's leading is nearly 3x the type size; it is what spaces this off the name. */
  line-height: calc(65.185 * var(--px));
  /*
   * Figma Hand sets 23% wider than the substitute at a matched ink height, because the
   * design letterspaces this node. Paid back as tracking rather than by inflating the
   * size, so the design's authored 22.93 stays the spec (SLICING.md trap 7).
   */
  letter-spacing: 0.202em;
  /*
   * CSS puts letter-spacing AFTER the last glyph too, so a centred line drifts left by
   * half of it. Paid back here rather than by nudging the node's own x.
   */
  margin-left: 0.202em;
}

.cover__couple {
  font-family: var(--font-script);
  /* The design's authored size. --script-k is 1 now that the real face is installed. */
  font-size: calc(136.67 * var(--px) * var(--script-k));
  /*
   * 83px of leading under 136.67px type: the two lines deliberately interleave, which is
   * how the design gets the signature to overlap itself. Not a mistake to "fix".
   */
  line-height: calc(83 * var(--px));
  font-weight: 400;
  white-space: pre-wrap; /* pre-LINE would collapse the design's two-space indent */
}

.cover__dear,
.cover__guest {
  z-index: 3;
  left: calc(50% + 0.48 * var(--px));
  width: calc(658.963 * var(--px));
  transform: translateX(-50%);
  font-family: var(--font-serif);
  font-size: calc(22.93 * var(--px));
  line-height: calc(65.185 * var(--px));
  color: #fff;
  animation: cover-rise 2200ms cubic-bezier(0.16, 1, 0.3, 1) 420ms backwards;
}

/* Box tops, not baselines — the tall line-height centres each line's ink inside it. */
.cover__dear {
  top: calc(923 * var(--px));
}

.cover__guest {
  top: calc(956 * var(--px));
}

.cover__open {
  z-index: 4;
  left: calc(139 * var(--px));
  top: calc(1032 * var(--px));
  width: calc(318 * var(--px));
  height: calc(74 * var(--px));
  border: 0;
  border-radius: calc(48 * var(--px));
  background: var(--maroon);
  color: var(--cream);
  font-family: var(--font-body);
  font-size: calc(31 * var(--px));
  line-height: calc(66.3 * var(--px));
  cursor: pointer;
  animation: cover-rise 2200ms cubic-bezier(0.16, 1, 0.3, 1) 560ms backwards;
  transition:
    transform 400ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.cover__open:hover,
.cover__open:focus-visible {
  transform: translateY(calc(-2 * var(--px)));
  box-shadow: 0 calc(10 * var(--px)) calc(26 * var(--px)) rgba(0, 0, 0, 0.34);
}

/*
 * `backwards`, not `forwards`: the end state is the element's normal state, so once the
 * animation finishes it stops applying and the hover transition gets its transform.
 */
@keyframes cover-rise {
  from {
    opacity: 0;
    transform: translateY(calc(20 * var(--px)));
  }
}

/* The two centred blocks carry a translateX, so their keyframe has to keep it. */
.cover__title,
.cover__dear,
.cover__guest {
  animation-name: cover-rise-centred;
}

@keyframes cover-rise-centred {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(calc(20 * var(--px)));
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover__frame > * {
    animation: none !important;
  }

  .cover__open:hover,
  .cover__open:focus-visible {
    transform: none;
  }
}
</style>
