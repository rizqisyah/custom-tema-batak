// Render one phrase in every font file in a directory and write each one's glyph ink,
// so scripts/font-pick.py can score them against the render's own ink.
//
// See "choose a substitute face by stroke weight" in SLICING.md.
//
//   node scripts/font-sweep.mjs <fontDir> <outDir> "Akad Nikah"
import { chromium } from 'playwright'
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const [dir, out, phrase] = process.argv.slice(2)
if (!dir || !out || !phrase) {
  console.error('usage: node scripts/font-sweep.mjs <fontDir> <outDir> "<phrase>"')
  process.exit(1)
}
mkdirSync(out, { recursive: true })
const files = readdirSync(dir).filter((f) => /\.(ttf|otf|woff2?)$/i.test(f))
const faces = files.map((f, i) => ({ f, name: `F${i}` }))

// The page is WRITTEN INTO the font directory and opened as a real file:// URL. A page
// built with setContent() has no base origin, so every @font-face src is refused and
// EVERY face renders as the same fallback -- which reads as "all the fonts scored
// identically" rather than as a failure.
const html = `<style>
  html,body{margin:0;background:#000}
  ${faces.map((x) => `@font-face{font-family:"${x.name}";src:url("${encodeURIComponent(x.f)}");font-display:block}`).join('\n')}
  #t{color:#fff;font-size:200px;line-height:1.6;white-space:nowrap;display:inline-block;padding:40px}
</style><div id="t">${phrase}</div>`
const pagePath = join(dir, '__sweep.html')
writeFileSync(pagePath, html)

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 4000, height: 700 } })
await p.goto(`file://${resolve(pagePath)}`)
await p.waitForTimeout(500)
const rows = []
for (const x of faces) {
  await p.evaluate((n) => { document.getElementById('t').style.fontFamily = `"${n}"` }, x.name)
  try { await p.evaluate((n) => document.fonts.load(`200px "${n}"`), x.name) } catch {}
  await p.waitForTimeout(60)
  const box = await p.locator('#t').boundingBox()
  if (!box || box.width < 40) { rows.push({ file: x.f, ok: false }); continue }
  await p.locator('#t').screenshot({ path: join(out, `${x.name}.png`) })
  rows.push({ file: x.f, ok: true, png: `${x.name}.png` })
}
writeFileSync(join(out, 'index.json'), JSON.stringify(rows, null, 1))
const sizes = new Set()
for (const r of rows) if (r.ok) sizes.add(r.png)
console.log(`rendered ${rows.filter((r) => r.ok).length}/${rows.length} faces into ${out}`)
console.log('if every face scores the same downstream, the @font-face srcs did not load')
await b.close()
