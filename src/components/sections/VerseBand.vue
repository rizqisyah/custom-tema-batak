<script setup lang="ts">
/*
 * Band 2 — verse. Frame 9 (2129:12) y 998 - 1509.
 *
 * No art at all: three text nodes on the sheet's own cream. Coordinates below are
 * BAND-LOCAL (global y minus this band's top of 998), which is what lets a band be
 * inserted above without renumbering the ones below it.
 *
 *   2134:788  y 1070 -> 72    "The Wedding Of"      Figma Hand 22.93 / 65.185
 *   2130:612  y 1175 -> 177   couple, two lines     Creattion Demo 136.67 / 83
 *   2130:615  y 1341 -> 343   the verse             Crimson Text 24 / 30
 */
import { computed } from 'vue'
import { useReveal } from '../../composables/useReveal'
import { useWedding } from '../../composables/useWedding'

const { el, shown } = useReveal()
const { coupleNickname, quoteText, quoteVerse } = useWedding()

/*
 * The design breaks the couple name before the ampersand, exactly as the cover does.
 * Derived rather than authored — a newline in the string cannot survive useWedding()
 * (SLICING.md, "An authored newline ... cannot survive").
 */
const coupleLines = computed(() => coupleNickname.value.replace(/\s*&\s*/, '\n  & '))

/*
 * 2130:615 is one node of three lines: the verse, a blank line, then the reference.
 * The blank line is the design's own spacing, so it is carried in the string and
 * rendered with `pre-line` rather than being faked with a margin.
 */
const verse = computed(() => `${quoteText.value}\n\n${quoteVerse.value}`)
</script>

<template>
  <section :ref="el" class="band verse" :class="{ 'is-in': shown }">
    <p class="verse__eyebrow">The Wedding Of</p>
    <p class="verse__couple">{{ coupleLines }}</p>
    <p class="verse__quote">{{ verse }}</p>
  </section>
</template>

<style scoped>
.verse {
  height: calc(511 * var(--px));
}

/* 2134:788 — 658.963 wide against a 596 frame, so it bleeds and is placed from centre. */
.verse__eyebrow {
  left: 50%;
  top: calc(72 * var(--px));
  width: calc(658.963 * var(--px));
  transform: translateX(-50%);
  font-family: var(--font-hand);
  font-size: calc(22.93 * var(--px) * var(--hand-k));
  line-height: calc(65.185 * var(--px));
  /* The design letterspaces this node; the substitute sets narrower. See tokens.css. */
  letter-spacing: 0.202em;
  margin-left: 0.202em; /* CSS trails the spacing after the last glyph, un-centring it */
  color: var(--ink);
  --delay: 0ms;
}

/*
 * 2130:612 — the same two-line block as the cover's, so it takes the cover's measured
 * two-line factor rather than the global single-line default.
 */
.verse__couple {
  left: 50%;
  top: calc(177 * var(--px));
  width: calc(658.963 * var(--px));
  transform: translateX(-50%);
  font-family: var(--font-script);
  font-size: calc(136.67 * var(--px) * var(--script-k));
  line-height: calc(83 * var(--px));
  white-space: pre-wrap; /* pre-LINE would collapse the design's two-space indent */
  color: var(--ink);
  --delay: 160ms;
}

/* 2130:615 — declared at x 53 w 491, so this one sits inside the frame and is placed from x. */
.verse__quote {
  left: calc(53 * var(--px));
  top: calc(343 * var(--px));
  width: calc(491 * var(--px));
  font-family: var(--font-body);
  font-size: calc(24 * var(--px));
  line-height: calc(30 * var(--px));
  white-space: pre-line; /* carries the design's own blank line before the reference */
  color: var(--ink);
  --delay: 320ms;
}

/* The centred blocks carry a translateX, so the band's entrance must not drop it. */
.verse__eyebrow,
.verse__couple {
  transform: translateX(-50%) translateY(calc(24 * var(--px)));
}

.verse.is-in .verse__eyebrow,
.verse.is-in .verse__couple {
  transform: translateX(-50%);
}
</style>
