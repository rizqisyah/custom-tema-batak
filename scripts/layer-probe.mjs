// Shoot the sheet with layers hidden, moved or re-painted, WITHOUT editing the band table.
// Two uses: see what a layer contributes, and try a placement before pinning it.
//
//   pnpm dev & FRAME_W=<w> node scripts/layer-probe.mjs '{"54-33":{"hide":true}}'
//   pnpm dev & FRAME_W=<w> node scripts/layer-probe.mjs '{"52-12":{"x":250,"y":482,"a":1,"b":"normal"}}'
//
// Keys match against the layer's src filename; x/y are BAND-LOCAL design px.
// Writes .figma-tmp/web-sheet-1x.png, so scripts/band-diff.py scores it directly.
//
// IT WALKS THE WHOLE SHEET FIRST, and that is not optional. Band art is loading="lazy"
// and every band below the fold is viewport-gated, so a probe that skips the walk shoots
// an empty sheet -- and does not return a worse number, it returns the SAME number for
// every variant. Any probe that scores identically for changes that cannot possibly be
// identical is measuring its own harness.
import { chromium } from 'playwright'

const FRAME_W = Number(process.env.FRAME_W || 0)
if (!FRAME_W) throw new Error('set FRAME_W=<design frame width in px> -- see tokens.css --frame-w')
const PORT = process.env.PORT || 5180
const spec = JSON.parse(process.argv[2] || '{}')

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: FRAME_W, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
if (await p.locator('.cover__hit').count()) await p.click('.cover__hit')
await p.waitForTimeout(2400)
const h = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < h; y += 400) {
  await p.evaluate((t) => scrollTo(0, t), y)
  await p.waitForTimeout(120)
}
await p.evaluate(() => scrollTo(0, 0))
await p.waitForTimeout(600)
await p.addStyleTag({ content: '.nav { display: none !important }' })

const hit = await p.evaluate((s) => {
  let n = 0
  for (const img of document.querySelectorAll('img.band-art'))
    for (const [k, v] of Object.entries(s))
      if (img.src.includes(k)) {
        n++
        if (v.hide) { img.style.display = 'none'; continue }
        if (v.x != null) img.style.left = `calc(${v.x} * var(--px))`
        if (v.y != null) img.style.top = `calc(${v.y} * var(--px))`
        if (v.a != null) img.style.setProperty('--a', String(v.a))
        if (v.b != null) img.style.mixBlendMode = v.b
      }
  return n
}, spec)
if (Object.keys(spec).length && !hit) throw new Error('no layer matched the spec -- check the src filenames')
await p.waitForTimeout(200)
await p.locator('.sheet').screenshot({ path: '.figma-tmp/web-sheet-1x.png' })
console.log(`applied to ${hit} layer(s) -> .figma-tmp/web-sheet-1x.png`)
await b.close()
