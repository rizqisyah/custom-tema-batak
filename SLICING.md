# Slicing notes — template 7

The cover is cut and the body is two bands in — see the state table below. This file
carries the **method** the earlier templates arrived at, plus this template's own
measurements as they are made. Keep the traps; every one of them cost real time to find.

Note that the sections BELOW the handoff still describe the `figma-mcp-go` dump pipeline
templates 2-6 used. That pipeline is not the one in use here — read "The route changed"
first, and treat the older sections as background on the traps rather than as
instructions. Where the two disagree, the handoff wins.

`../slicing-wedding-template-6` is the finished reference implementation. Read its
`SLICING.md`, its `src/components/sections/*.vue` and the worked exception tables in its
`scripts/gen_band.py` when a rule here needs an example.

## Picking this up in a new session — READ THIS FIRST

**State: the cover and ALL SIXTEEN body bands are cut and verified.**

The design is a Batak (Christian) wedding invitation, Waraney & Monika.

| | Figma node | size | state |
|---|---|---|---|
| cover | Frame 8 `2129:2` | 596 x 1183 | **done**, 3.91 mean abs vs render |
| body | Frame 9 `2129:12` | 596 x **16159** | **all 16 bands done**, sheet 7.05 mean abs |

`FRAME_W` is **596**. Dev server `npm run dev` on **5180**. `npm run build` passes.

Reference renders are already downloaded and are the verifier for everything:
`.figma-tmp/frame8-render.png` (cover, 1:1) and `.figma-tmp/frame9-render.png`
(body, 596 x 16159, 1:1). `.figma-tmp/strips/s00..s13.png` are readable slices of the
body render — read those to see the design rather than re-fetching it.

### The route changed: the official Figma MCP, not the figma-mcp-go plugin

`figma-mcp-go` is still **not connected** (`get_pages` -> "plugin not connected"). The
cover was cut with the **official** Figma MCP (`mcp__plugin_figma_figma__*`); the body is
cut with the **Figma REST API**, which is better again. Both beat the plugin pipeline
because they report what it never did:

- `get_metadata(nodeId)` — the whole leaf tree with `x/y/width/height`, one call.
- `get_design_context(nodeId)` — React+Tailwind for that node: **exact fills, opacity,
  blur, font family, size, leading, letter-spacing, colour**. Call it per node or per
  small group; the whole 16159px frame in one call is too large.
- `download_assets(nodeId, defaultFormat=png, defaultScale=2)` — `export` is the
  **rendered node**, and `rawImages` are the original uploads. Use `export`.

**The REST API is the one to use for the body**, and `scripts/rest_refs.py` wraps it:

    FIGMA_TOKEN=... python3 scripts/rest_refs.py fetch <fileKey> 2129:12 .figma-tmp/frame9-raw.json
    FRAME_W=596      python3 scripts/rest_refs.py table .figma-tmp/frame9-raw.json 2129:12 .figma-ref/frame9-nodes.json
    FIGMA_TOKEN=... python3 scripts/rest_refs.py images <fileKey> .figma-ref/frame9-nodes.json .figma-tmp/parts9
    python3 scripts/cut_band.py <band> <y0> <y1>     # converts plates, prints the tables

One `fetch` returns all 274 nodes with `rotation`, `opacity`, `blendMode`,
`relativeTransform` and `absoluteBoundingBox`; one `images` batch-exports all 81 plates.
Measured on this frame: **40 rotated nodes, 26 mirrored, 0 with opacity below 1, and 0
with a real blend mode** — which is why `solve_alpha.py` has nothing left to solve here.

`absoluteBoundingBox` is the whole trick: it is the AXIS-ALIGNED box after rotation and
flips, so `abs.x - frameOrigin.x` is simply where the plate goes. It gave x=277 for
"groom 1" and x=395 for `2138:823` — exactly the values that had to be derived by hand
from export widths under the MCP route — and x=130.40 for the rotated flower whose
plugin-reported x was 335.37 (its transform ORIGIN; SLICING.md trap 3, confirmed).

**REST exports are UNCLIPPED**, unlike the MCP's `download_assets`: a node that bleeds
past an edge comes back whole, is placed at its true (possibly negative) x, and
`.sheet { overflow: hidden }` does the clipping. This is the one place the two differ.

**This makes three of the old traps obsolete.** Opacity and blend no longer have to be
solved off the render (`solve_alpha.py`), rotation no longer has to be inferred (trap 3),
and positions no longer have to be template-matched (`locate.py`): a rotated node's
`export` comes back **already rotated and cropped**, sized to its own bounding box.
Verified: `2143:1416` declares 204.97 x 247.45 and exports 410 x 495 at scale 2 — exactly
2x the declared box, rotation baked in.

Keep from the old pipeline: `BandArt.vue`, the global-`z` rule, `BAND_OF`, and diffing
every band against `frame9-render.png`. Drop: the clip/expansion rules, `solve_alpha.py`,
`locate.py` searches.

### What the official MCP's export actually is

Two rules, both measured, both load-bearing:

1. **The export is authoritative about EXTENT; the metadata box is authoritative about
   ORIGIN.** The hero plate `2130:605` declares 596 x 998 and exports 596 x 1024. The
   extra 26px are real — the render paints them. Cropping the plate back to the declared
   height left a **190 mean-abs seam** straight across the sheet at y 998. Place layers at
   the metadata's `x, y` and the EXPORT's `w, h`.

2. **A mirrored node reports its RIGHT edge as `x`.** The design builds the groom scene as
   a horizontally flipped copy of the bride scene, and every flipped node reports an `x`
   that is its right edge, so it reads as sitting past the frame. `groom 1` (`2138:825`)
   declares `x=755 w=478` against a 596-wide frame; its true left is `755 - 478 = 277`, and
   the export is 319 wide — exactly `596 - 277`, clipped by the frame. Confirmed on
   `2138:823` (declares `x=797 w=402`, true left 395, exports 201 = 596 - 395), and the
   un-mirrored twin `2136:803` (declares `x=-174`, which IS a left edge, exports 228).

   **Do not apply the right-edge rule by eye — derive it.** For each node compute the
   export width both ways and keep the hypothesis that matches the actual export:

   ```text
   A (x is left):   place at max(0, x)      width = min(FRAME_W, x + w) - max(0, x)
   B (x is right):  place at max(0, x - w)  width = min(FRAME_W, x) - max(0, x - w)
   ```

   This is self-verifying, because the export is downloaded anyway.

### Then, in order

1. Read the band map below and pick the next band.
2. `get_metadata` is already captured for both frames — the node list in the band map came
   from it. For a band's nodes, call `get_design_context` for type/colour and
   `download_assets` for each raster.
3. Cut the band, `node scripts/sheet-shot.mjs 5180`, and diff it against
   `frame9-render.png`. A band of live text over cream will not go below ~12 mean abs
   while the script substitute is in place — that is the face, not the placement. Check
   the ink EXTENTS (x0/x1/width per node), which do match to within ~2px.

**Worth asking the owner for:** a fresh Figma personal access token. With one,
`GET /v1/files/:key/nodes?ids=2129:12` returns every node's `rotation`, `opacity`,
`blendMode` and `imageRef` in a single JSON, and `GET /v1/images/:key?ids=...&scale=2`
batch-exports every plate in one more — instead of ~2 MCP calls per node.

### A centred node loses its centring to the band entrance

`style.css`'s `.band > *:not(.band-art)` sets `transform: translateY(...)` on every
non-art child, and `transform` REPLACES the whole value — it does not merge. So any node
placed with `left: 50%` + `translateX(-50%)` silently loses its X and sits half a frame
to the right; the hero's couple line inked from x298 to the frame edge instead of
x69-528, and read as "the script substitute is too wide" rather than as a transform bug.

Every centred node needs the X restated in BOTH states:

```css
.band__node            { transform: translateX(-50%) translateY(calc(24 * var(--px))); }
.band.is-in .band__node { transform: translateX(-50%); }
```

This is not optional on this design: the frame centres most of its type, and several
nodes are authored WIDER than the 596 frame (658.963 is a recurring width) so they are
placed from the centre rather than from their declared x.

### Faces that are not substituted can still measure wide

fontsource's Instrument Serif inks the hero's `2129:590` 322px against the render's 299.
It is the design's own face, so this is a version/hinting difference, not a substitution
error. It was left alone: the node is two lines in a 345-wide box, and tightening the
tracking to close the gap pulls `ADAT` up onto the first line and inks 344 instead. **A
wrong wrap is a visible defect; 8% of tracking is not.** Check the LINE BANDS, not just
the ink width — ref wraps at rows 189-214 / 234-259 and so does the build.


### Three more this template paid for

**A filled container FRAME is a surface, not a wrapper.** Figma builds the event card, the
bank cards and every form field as frames that carry a fill AND hold live text. A walk
that recurses into anything with children drops all of them and leaves the copy sitting on
bare cream. `rest_refs.py` emits them as `SURFACE` rows and they are drawn as CSS —
19 of them on this sheet.

**Figma's list markers are not in `characters`.** The four "Turut Mengundang" nodes are
NUMBERED lists; the numbers are a paragraph style, so the REST `characters` string has
none of them and rendering it as one block silently drops every number. They are `<ol>`
with one `<li>` per authored line. Each of those nodes also OPENS with a blank line, which
is how the design clears its own heading — strip it and the whole list slides up onto the
maroon bar.

**A substitute's tracking has to be fitted per NODE once the node wraps.** The 0.202em
that matched Figma Hand on the cover's 14-character line adds ~2px a glyph, and on the
event band's 60-character paragraph that pushed a word onto the next line and broke the
design's own break. Short single lines can share a value; anything that wraps gets its own.

### Where the remaining error is

The sheet scores 7.69 mean abs against the frame render, and almost all of it is TYPE, not
placement:

- `verse` (11.79), `wishes` (10.84), `gallery` (10.06) and the three big `undangan` lists
  (15-22) are dense dark text on cream. A substituted face at a matched width still puts
  different ink on different pixels, and a text-heavy band punishes that hard. Their ink
  EXTENTS match to within a few px, which is the measure that matters.
- `gallery` also differs because its thumbnails are now live crops of the gallery list
  rather than the design's one baked strip — a deliberate trade for working with real data.
- Art-heavy bands land where they should: `groom` 1.46, `hero` 2.60, `bride` 2.74,
  `thankyou` 3.80.

### Band map (read off the frame render, tops in design px)

| # | band | top | state |
|---|---|---|---|
| 1 | hero — curtain, forest, couple, title | 0 | **done** (2.60) |
| 2 | verse — "The Wedding Of", couple, Matthew 19:6 | 998 | **done** (11.79, substitute face) |
| 3 | groom — Batak house, groom cut-out, flowers, name | 1509 | **done** (1.46) |
| 4 | bride — "And", bride cut-out, house, name | 2530 | **done** (2.74) |
| 5 | savedate — songket banner, LIVE countdown, Add to Calendar | 3803 | **done** (4.42) |
| 6 | event — mountains, WM medallion, CSS card, Maps link | 4927 | **done** (4.69) |
| 7 | gallery — "Gallery Photo", LIVE carousel + thumbs | 6367 | **done** (10.06) |
| 8 | memories — "Our Wedding Memories", framed photo | 7242 | **done** (5.25) |
| 9 | gift — 2 CSS bank cards w/ copy button, form | 8020 | **done** (7.12) |
| 10 | reservation — RSVP form, all CSS, submitRsvp | 9767 | **done** (6.55) |
| 11 | wishes — form + wish list + Show more | 10332 | **done** (10.84) |
| 12 | undangan-pria | 11333 | **done** (15.60) |
| 13 | undangan-peranak | 12222 | **done** (21.77) |
| 14 | undangan-parboru | 13291 | **done** (16.00) |
| 15 | undangan-wanita | 14106 | **done** (6.40) |
| 16 | thankyou — "Thank You", photo, couple, credit | 14551 | **done** (3.80) |

Bands 12-15 are long ruled name lists under maroon header bars — mostly live text, very
little art, and the cheapest remaining work. Bands 3 and 4 are the hardest (the mirrored
pair) and 9-11 carry real forms, which ship as CSS chrome, never as rasters.

### The design's own palette and faces (measured, in tokens.css)

`--sheet`/`--paper` `#fffce0`, `--ink` `#3f3f3f`, `--maroon` `#730303`,
`--cream` `#fff2bc`, `--olive` `#67764d`.

Fifteen families across both frames. Seven are on fontsource (Instrument Serif, Ibarra
Real Nova, Crimson Text, Crimson Pro, Bellefair, Abhaya Libre, Roboto), Times New Roman
is a system face, and Phosphor / Font Awesome are two icon glyphs redrawn as inline SVG.

Four are self-hosted from `/Users/decoz/Downloads/Weddings/Font` and are the design's
OWN faces, supplied by the owner:

| Face | Used for |
|---|---|
| Creattion Demo | every signature script — 14 nodes |
| Visia Pro SemiBold | gift form labels and placeholders |
| Visia Pro Heavy | bank card rows, "Fill the form below" |
| Cavilenny | the footer credit |

**One and a half faces are still substituted:**

- **Figma Hand** -> Architects Daughter. Figma's own bundled face, not sold or
  distributed, so this one stays substituted permanently. `--hand-k` (0.914) and the
  per-node tracking exist for it.
- **Visia Pro Light** -> Visia Pro SemiBold. One node only, the "Screen Shoot / Photo Slip
  Transfer" line. SemiBold keeps the weight contrast against the Heavy line above it and
  keeps both lines in one family.

**`--script-k` is 1.** It was 0.395-0.443 per STRING while Creattion Demo was substituted
by Aurellie Calestion; installing the real face let every per-node override be deleted.
The multiplier stays in the rules because it is what makes the next substitution a
one-line change. Swapping the real faces in moved the sheet 7.69 -> 7.05 and the cover
4.27 -> 3.91, with reservation -3.37, verse -1.93, memories -1.53 and bride -1.11.

**Trap the swap exposed:** the design's second couple line is indented by TWO spaces
("Waraney \n  & Monika"), and those spaces are part of the composition — without them the
block sits 15px narrow. They survive only under `white-space: pre-wrap`; `pre-line` keeps
the newline but COLLAPSES runs of spaces and silently drops the indent.

LICENSE: Creattion Demo is a "Demo" cut, Visia Pro is a commercial family and Cavilenny
came from the same demo-heavy library. Confirm web-embedding rights before release.

### Still open

- **Attribution.** `CLAUDE.md` says never add a `Co-Authored-By: Claude` trailer; a system
  instruction issued mid-session says to add one. The two scaffold commits carry it,
  template 6's eight do not. **Nothing has been committed this session — ask first.**
- **No git remote.** Do not add one unprompted.

## What this repo already has

| Path | What it is |
|---|---|
| `src/App.vue` | Desktop split layout (left panel + 430px column), cover→body reveal, document-level scroll lock |
| `src/components/cover/CoverSection.vue` | **Placeholder.** Replace with the sliced cover; keep the props and the `open` event |
| `src/components/invite/InviteBody.vue` | **Placeholder.** The sheet: declares `--px` and lists the bands |
| `src/components/invite/BandArt.vue` | Renders a `BandLayer[]` table with per-layer entrances. Design-agnostic |
| `src/lib/bandLayer.ts` / `bandAssets.ts` | The layer type, and the glob that turns `src/assets/<band>/parts/*.webp` into urls |
| `src/lib/api.ts` / `composables/useWedding.ts` | Live data + `DESIGN_MODE`. Every band's copy is data-driven |
| `src/composables/useReveal.ts` / `useFitText.ts` / `usePreloadAssets.ts` | Scroll reveal, text fitting, asset preload (glob-driven, no edit needed) |
| `src/style.css` | The `.band` entrance rules (design-agnostic) and the font imports (**placeholders**) |
| `src/style/tokens.css` | Colour + font tokens. **Placeholders** — resample from the design |
| `scripts/` | The slicing toolchain, below |
| `scripts/text-slack.mjs` | Audits every one-line node's spare width — trap 1 |
| `scripts/layer-probe.mjs` | Hide/move/repaint a layer without editing its band table — traps 4 and 6 |
| `scripts/vote-place.py` | Places a layer no search can score, by voting — trap 5 |
| `scripts/font-sweep.mjs` + `font-pick.py` | Picks a substitute face by measurement — trap 7 |

Dev server runs on **5180** (template-6 is on 5179, template-5 on 5178) so they can run
side by side.

## Fill these in first

1. The two frames (cover + body), their node ids and sizes.
2. `--body-h`, `--frame-w`, `--frame-h` in `tokens.css`.
3. The palette, sampled off the design's own text fills.
4. The font table: which family each node uses, and which are substituted.
5. `scripts/build_refs.py`'s `BANDS` y-range table, plus its `SHEET_PLATES` and `EMPTY`.
6. `.figma-ref/frame<N>-{zorder,assets}.json` — generate these once and work from them
   rather than re-querying Figma.
7. `solve_alpha.py`'s `GROUND` — the flat CSS plates `InviteBody.vue` paints under the
   bands. An empty `GROUND` composites every band over black and every alpha it solves
   comes back wrong. Sample the BODY frame's fill, not the cover's; see `--sheet`.
8. **`FRAME_W`.** Every script requires it in the environment and none defaults, because
   a wrong design-frame width does not fail — it renders and measures the whole sheet at
   the wrong scale. Templates 2-5 were 375 wide and template 6 was 596. Set `--frame-w`
   in `tokens.css` to the same number; `InviteBody` derives `--px` from it.
9. `style.css`'s one-line node list — empty, and filled as bands are cut. See the comment
   above it; leaving it empty is how the address-onto-country-line collision happens.

## The thing that will bite you: exported bounds are not node bounds

Figma's reported node bounds and the size it actually exports disagree in two directions:

- **Clipped.** Figma clips every export to the frame. A node that bleeds off an edge comes
  back narrower than it claims — its true x is 0, not the negative number it reports.
- **Expanded.** A rotated node, or one with a blur, exports a bbox *larger* than the node.
  Figma grows it around the node's centre, so re-centre it: `x = fx + fw/2 − exportW/2`.
- **Reported bounds can lie outright.** A rotated node can report an x past the right edge
  and still render visibly somewhere else entirely.
- **A rotated node's art exports UNROTATED**, and sometimes unscaled. No translation will
  ever match it; it needs a rotate (and possibly a scale) on the layer itself.

So placement tables are **generated, not hand-written**. Every position is either a
template match against the Figma render (`scripts/locate.py`, err < 40 = real match) or
derived from the clip/expansion rule. Regenerate rather than nudging numbers by hand.

## Toolchain

```sh
python3 scripts/flatten_frame.py <raw node json> <flat json>      # once per Figma re-dump
BODY_FRAME=<n> BODY_H=<h> python3 scripts/build_refs.py           # zorder + assets + webp
BODY_FRAME=<n> BODY_H=<h> python3 scripts/gen_band.py             # every band
BODY_FRAME=<n> BODY_H=<h> python3 scripts/gen_band.py hero        # just one
BODY_FRAME=<n> BODY_H=<h> python3 scripts/solve_alpha.py          # opacity/blend/position

npm run dev &                                                     # port 5179
node scripts/sheet-shot.mjs 5179                                  # 1:1 sheet shot
BODY_FRAME=<n> python3 scripts/sheet-score.py                     # every band, one pass
BAND_REF=<1x body render.png> python3 scripts/band-diff.py <y0> <y1>   # one band, 3-up
LOCATE_REF=<1x frame render.png> python3 scripts/locate.py <asset.webp>
BODY_FRAME=<n> BODY_H=<h> python3 scripts/place_plate.py <id> <x0> <y0> <x1> <y1>
node scripts/shot.mjs 5179                                        # eyeball at 3 viewports
```

The loop is: `gen_band` (raw geometry) → `solve_alpha` (refine) → `gen_band` (bake) →
`sheet-shot` → `sheet-score`. `solve_alpha` persists ABSOLUTE positions, so running it
again after a regenerate refines the previous pass instead of doubling it. Two passes
converge; a third moves nothing.

`gen_band.py`'s exception tables — `PAINTS_NOTHING`, `TRUST_CLIP`, `PIN_X`, `PIN_Y`,
`PIN_A`, `PIN_B`, `BAND_OF` — start **empty**. They are per-design, and every entry needs
a before/after delta for that node alone. Measure them one at a time: layers that share a
source asset look like a set and usually are not.

## Figma's MCP does not report opacity or blendMode

`get_node` and `get_design_context` return bounds, fills and type — and nothing else.
Every export therefore comes back at full strength and stacked normally, which is wrong
for two whole classes of layer these designs keep using:

- **Light-leak plates.** Near-black rasters with light streaks, authored to be SCREENED
  over the band. Stacked normally they are a grey slab across everything.
- **Faded texture.** Lace and glitter plates running at a fraction of full opacity.

`scripts/solve_alpha.py` recovers all three properties — opacity, blend mode and a
residual position — by compositing the band offline and scoring it against the render.
Two things make that composite match what the browser paints, and both were bugs first:

- **Bands overlap**, so the window is filled from EVERY band's table in global `z`
  order, not just this band's own layers.
- **The sheet's ground is CSS**, not a layer (`GROUND` in the script). Those plates live
  in `InviteBody.vue` and are in no band table, so the solver has to paint them itself.

**The gates are deliberately blunt.** A free search over ±40px, nine opacities and five
blend modes can almost always shave a hundredth off a busy band by moving a layer
somewhere visibly wrong. `MOVE_GAIN`, `MIN_GAIN` and `DROP_GAIN` make a change pay for
itself before it is kept, and `MIN_SOLVE` skips anything under 24px — a 9px dot matches
any patch of its own colour, so its Figma bounds are better evidence than any search.
Loosening these was measurably worse every time it was tried.

**Solve order is position → paint → position → paint.** Paint-first fades a
correctly-shaped layer out of a band because it is in the wrong place; position-first
chases the grey slab a screened plate makes. Both get a second look.

**A plate hundreds of px from home needs `place_plate.py`, not the solver.** Score it
against a FIXED box over the thing it is supposed to explain — the card it washes, the
panel it edges — so every candidate is measured on the same pixels. A box that moves with
the layer rewards a candidate for sliding off-frame or onto empty ground and fading out.
The "without the layer" number it prints first is the bar to beat.

## Bands overlap

A band's height is the distance to the **next** band's top, not the extent of its own
children — children that overrun simply paint past the boundary, which is what the design
does. `section` in the zorder dump is derived from the y-range table and is a **hint**,
not verified.

**The first band starts at 0, not at its first child.** The frame's first child usually
sits some way below the top edge; honouring that opens a gap the design does not have.
`band_tops()` clamps it.

**Round the tops, then derive the heights.** Rounding a top and its height independently
leaves a 1px seam wherever both round the same way, and the sheet ends up short of
`--body-h`. `sheet-shot.mjs` prints the built sheet height — it must equal the frame's
height exactly.

**`z` is the GLOBAL Figma child order.** Every band shares one stacking context, which is
what keeps cross-band layering correct after the split. Do not give a band `z-index` — it
becomes its own context and the global order stops working. Anything a band draws on top
of its art needs its own node's real global z; a z copied from another band puts the
control underneath the art, and it looks like an opacity bug, not a z bug.

**A layer paints in the band its own y lands in**, not the band Figma filed it under. Left
in the wrong band it renders fine and *reveals* wrong: `useReveal` gates a band's layers
on that band scrolling in. That is what `BAND_OF` is for.

## Off-frame nodes: occluded is not absent

Rotated nodes report boxes outside the frame, but Figma still exports pixels for them and
most land back inside as mirrored decorations. `gen_band.py` searches the full frame width
for those (`rescue()`).

When the search *fails*, the layer is either buried under later layers or genuinely
absent, and `locate.py` cannot tell the two apart — it scores over all of a layer's opaque
pixels, so a mostly-buried layer scores badly even where it belongs. **An err above
`GOOD_ERR` on a layer that overlaps its siblings is not evidence of anything.** A failed
search therefore falls back to the clip rule; only `PAINTS_NOTHING` is dropped, and only
for layers that paint an artifact the render does not have.

**A layer measured at its reported bounds, when those bounds are the fiction, has not been
measured at all.** Place it with `place_plate.py` first, then decide whether it paints
nothing. Template 5 dropped an ornament this way that turned out to be plainly visible
once it was scored where it actually belongs.

Settle the ambiguous ones by compositing the band offline and scoring it against the
render (`scripts/solve_band.py`, `scripts/worth.py`, `scripts/band-diff.py`), not by eye.

**A flat-colour layer defeats `locate.py`.** Cream matches cream anywhere, so a blurred
single-colour plate scores under `GOOD_ERR` a couple of hundred px from where it belongs.
Those go in `TRUST_CLIP`, which `gen_band.py` honours *before* the first `locate` hit.

**Both-edges-bleed breaks the clip rule.** The rule guesses which edge cut an export; a
node bleeding past both gets pinned to the wrong side and stacks on its own mirror. `PIN_X`.

## Live text, and what stays as art

Every text node stays **live** so `useWedding()` can drive it — never bake type into an
image to dodge a missing face. Each family is one token in `tokens.css`, so swapping a
substitute for a licensed file means changing one value.

**Retiring a substitute means re-measuring, not just swapping the family.** Substitutes set
a different number of characters per line and their line boxes sit differently, so both the
font-size compensations *and* the positions have to be re-measured by ink box against the
render (`scripts/ink-box.py`). Compensations that existed only for a substitute's metrics
must be reverted to the Figma spec at the same time.

Two traps that display faces keep repeating:

- **Do not `text-transform: uppercase` a display face without checking its case pairs.**
  Several of these faces put cap-height alternates on lowercase and swash or fraktur forms
  on the capitals, so uppercasing swaps the whole word onto the wrong set.
- **An authored newline in a Figma string cannot survive `useWedding()`** — and `&#10;` in
  a Vue template is folded to a space by the parser too. Put the break in a script
  constant and set `white-space: pre-line`, or force it with `text-wrap: balance` and a
  narrow box.

**`TEXT_PATH` is the one exception to live text.** Lettering outlined and bent along a
curve has no CSS equivalent; Figma exports the GLYPH INK and reports the TEXT BOX, so the
clip rule pins it to the box's left edge. Centre the ink in the box for x, and measure y
by ink box — an arched TEXT_PATH's reported top is its *unrotated* top.

**Chrome that has to work ships as CSS, not as a raster.** A picture of an input cannot be
typed into and a picture of three wish cards cannot grow with a longer message. Skip those
plates from the band's `LAYERS` and redraw them.

**Skipping is per-node and easy to half-do.** A raster left in the table under something
the component also draws is invisible when the two agree and wrong the moment they do not
— a baked bank logo prints over a different bank's account number, and a baked Send plate
sits off the real button while looking right because it landed on something the same
colour. Whatever a band redraws, skip.

**An icon the design exports is not one to redraw in CSS.** Put the exported asset inside
a real `<button>`: less code, and the glyph is Figma's rather than a guess at it.

A live list is a flow, not N plates — but where the art has a fixed number of apertures
(account cards, event cards), cap the list at what the art can hold rather than painting
past the last plate. And a `Show more` that reveals nothing is worse than no button: the
design fallback needs one more item than the design draws.

Record the license beside every self-hosted `@font-face` in `style.css`. Several of the
faces these templates use are demo cuts that are personal-use only.

## Design mode

`DESIGN_MODE` lives in `src/lib/api.ts` — **at the boundary, not in a composable**, because
sections import `submitRsvp` / `submitUcapan` directly and a guard that lived only in
`useWedding` let those POSTs through to production. It is on unless `VITE_LIVE_DATA=1`:
`getHome` is never called, so every band renders the design's own content; the submits
throw; and a wish posted in this state is answered locally so the form still works end to
end.

Design-mode wishes are held in a module ref, **not** in `state.data` — seeding `state.data`
would make `wedding` non-null and every band would abandon its design fallback mid-session.

Anything interactive needs a design-mode fallback of its own, or it is dead in the only
mode the slicing is ever looked at in: template 5's gallery had no photos to swipe until
its fallback list existed.

## Two more that cost real time

**A positioned wrapper eats the coordinate system.** Every band child is
`position: absolute` in design px against the band. Wrapping children in a plain `<div>`
makes that div the containing block, and with no offsets of its own everything inside
lands against a zero-size box — the band renders blank. Use `<template v-for>`.

**Scroll the window, not `.desktop-right-column`,** when screenshotting. That column only
scrolls at >=768px; below that the bands never reveal, which reads as a blank sheet rather
than a scroll bug.

## Cover-specific traps

**Export first, decide after — the frame's node list is not the layer list.** Flat
rectangles become CSS backgrounds, fully-buried nodes paint nothing, and some nodes export
1x1 transparent. Template 5's cover had four of eight non-text children survive.

**`pointer-events: none` on the cover's decorative layers is load-bearing.** A flower
authored across the "Click to open" box and above it in the global z order swallows the
click, and the cover cannot be opened at all.

**A Figma text box shorter than its own line is a `useFitText` trap.** 32px type in a 27px
box makes `scrollHeight` exceed `clientHeight` on a single line, and the name is silently
shrunk. Give the rule the full line-height and pay the difference back through `top`.

## Seven traps template 6 paid for

Every one of these cost hours on the last template. They are rules, not measurements —
none of template 6's numbers are here, only what they taught.

### 1. An auto-sized text box IS the ink, so pin one-line nodes to one line

A Figma node that auto-sizes to its own text reports a box the width of its glyphs, to
within a pixel. `--px` is viewport/`FRAME_W`, so at an arbitrary viewport the box and the
glyphs round independently and half a pixel of slack disappears. The line wraps, and
because a band's rows are absolutely positioned with a line-height roughly equal to their
spacing, the second line lands exactly on the row below.

Pin them with `white-space: nowrap` in `style.css`'s list — do NOT widen the boxes, which
moves the design's own geometry. Centred overspill goes half to each side, off the same
axis the design centred them on. Only nodes that are one line IN THE DESIGN belong there:
adding a wrapping paragraph or a `pre-line` node silently truncates its breaks.

It also fires while a webfont is still loading, since the fallback face sets wider.

### 2. A masked export carries the mask's BOX, not its SHAPE

Figma clips a masked child to the mask's bounding box and stops — the mask's own alpha is
never applied — so a child under a SHAPED mask comes back as a full opaque rectangle.

Invisible while the mask is a placeholder the size of its child (an oval behind a photo,
which is why those go in `CSS_SHAPES`). Very visible when the mask is a shaped plate that
also PAINTS: the child then paints straight through the plate's own edge and ends on a
hard cut. Use `build_refs.py`'s `MASKED` table.

**Do not derive the offset by differencing the two declared x values.** A masked node's
declared box is the UNCLIPPED node, and a flipped mask reports its RIGHT edge; both
numbers are wrong in the same subtraction, and it is the kind of wrong that looks
plausible on one pair and erases the layer outright on another. The export starts at the
mask's LEFT edge by construction, and the child's declared Y survives the clip.

### 3. A rotated node reports its transform ORIGIN

Neither the dump nor the MCP read carries a rotation field. The export arrives bigger than
the declared box on both axes, `reconcile()`'s "export grew, so re-centre" branch fires,
and it returns a plausible-looking wrong answer. Rotating the declared box about its origin
gives the real bbox left; Figma's own properties panel shows the rotation and the true X
side by side if the node can be selected.

### 4. A solved alpha near zero is evidence about the POSITION

`solve_alpha.py` fits each layer where it has been put, and from ~90px off home the only
way for a layer to score is to fade out. That fade then blinds every recovery: `locate.py`
has no ink left to match and returns the error it returns for an occluded layer. Two
wrongs holding each other up. Suspect every solved alpha below ~0.5 and re-measure the
position before accepting it.

### 5. When nothing scores, vote

Difference the render against a sheet built with the layer HIDDEN; what is left is exactly
the ink that layer owes. Then Hough-vote every (asset ink point → residual point) pair for
an offset and take the winning bin. This finds layers whose true position is outside
`locate.py`'s search radius, and layers `solve_alpha` has already faded to nothing.

### 6. A probe that does not walk the sheet scores nothing

Band art is `loading="lazy"` and every band below the fold is viewport-gated, which is why
`sheet-shot.mjs` steps the whole scroll height before shooting. A one-off probe that skips
the walk does not return a slightly worse number — it returns the SAME number for every
variant, because what it measures is an empty sheet. **Any probe that scores identically
for changes that cannot possibly be identical is measuring its own harness.**

### 7. Choose a substitute face by stroke weight, not by overlap

When a face is unavailable, isolate the render's own ink for that node (`text-ink.mjs`'s
method: shoot the sheet twice, once with the node hidden, and difference) and sweep every
font file you have against it.

Two obvious metrics both rank wrong, in opposite directions. Plain IoU on the glyph masks
puts every fat brush face on top, because a hairline stroke 2px out of place overlaps
nothing while a blob overlaps everything. Dilating both masks and scoring F1-within-2px
inverts the bias but not the outcome. **Score ink density (lit px over ink-box area) plus
aspect at a common width instead** — that is what the eye reads as "the same kind of line",
and it picks the right face out of a hundred.

Then width-match per WORD, not per face: one authored size becomes a different number for
each string, because per-glyph widths differ unevenly between faces. Record the height as
a deviation. And read the RENDER, not the string: a face whose lowercase are cap-height
forms draws a lowercase string as capitals, and reproducing the characters instead of the
render is the mistake to avoid.

Retiring a substitute later DELETES numbers rather than re-measuring them — the size
compensation, any tracking, any `top`/`left` nudge fitted to the stand-in's line box.

## Worth testing on this template

`figma-mcp-go` reports no `opacity` and no `blendMode`, which is why `solve_alpha.py`
exists at all. The official `plugin:figma:figma` server exposes a `use_figma` tool that
runs JavaScript against the file and may be able to read both directly; it needs an OAuth
round trip template 5 did not have. If it can, one call over every node id replaces the
whole inverse problem with ground truth and `solve_alpha.py` collapses to a position-only
refiner.

## Deployment

`VITE_DEFAULT_SLUG` must be set per deployment — without it `src/lib/api.ts` falls back to
`demo-envelop`, which is a *different* wedding and will render the wrong couple.

## Band fidelity

Track mean abs delta per band here once the sheet is up. It is a **relative** signal across
bands, not an absolute fidelity score: it carries every deliberate deviation from the render
— substitute fonts, the live countdown where the design bakes a static plate, the live wish
list and gallery where it bakes rasters of mock content.

| band | delta | band | delta |
|---|---|---|---|
| — | — | — | — |
