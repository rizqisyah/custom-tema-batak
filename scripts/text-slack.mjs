// Audit every single-line band text node for how much spare WIDTH its box has, in design
// px. See "an auto-sized text box IS the ink" in SLICING.md: a Figma node that auto-sizes
// to its own text reports a box the width of its glyphs, so a node with half a pixel to
// spare loses it to rounding at some viewport and wraps onto the row below.
//
// Anything under ~2 belongs in style.css's one-line list. Negative means it is already
// overflowing and is one webfont hiccup away from collapsing a card.
//
//   pnpm dev & FRAME_W=<w> node scripts/text-slack.mjs [viewport]
import { chromium } from 'playwright'

const FRAME_W = Number(process.env.FRAME_W || 0)
if (!FRAME_W) throw new Error('set FRAME_W=<design frame width in px> -- see tokens.css --frame-w')
const PORT = process.env.PORT || 5180
const VIEW = Number(process.argv[2] || 375)

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: VIEW, height: 900 }, reducedMotion: 'reduce' })
await p.goto(`http://localhost:${PORT}/?to=A`, { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
if (await p.locator('.cover__hit').count()) await p.click('.cover__hit')
await p.waitForTimeout(1500)
await p.evaluate(() => document.querySelectorAll('.band').forEach((x) => x.classList.add('is-in')))
await p.waitForTimeout(400)

const rows = await p.evaluate((frameW) => {
  const px = document.querySelector('.sheet').getBoundingClientRect().width / frameW
  const out = []
  for (const el of document.querySelectorAll('.band > *:not(.band-art)')) {
    if (!el.textContent.trim() || el.children.length) continue
    const r = document.createRange()
    r.selectNodeContents(el)
    const rects = [...r.getClientRects()]
    if (!rects.length) continue
    // Only single-line nodes: a wrapping paragraph's "slack" is meaningless.
    if (new Set(rects.map((x) => Math.round(x.top))).size !== 1) continue
    const ink = Math.max(...rects.map((x) => x.width))
    out.push({ cls: [...el.classList][0], text: el.textContent.trim().slice(0, 34),
               slack: +((el.clientWidth - ink) / px).toFixed(1) })
  }
  return out.sort((a, b) => a.slack - b.slack)
}, FRAME_W)

console.log(rows.map((r) => `${String(r.slack).padStart(7)}  ${r.cls.padEnd(24)} ${r.text}`).join('\n'))
console.log(`\n${rows.filter((r) => r.slack < 2).length} of ${rows.length} nodes have under 2 design px of spare width.`)
await b.close()
