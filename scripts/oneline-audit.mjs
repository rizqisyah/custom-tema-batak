// Find every node that is ONE LINE in the design but renders as two or more in the build.
//
// This is SLICING.md trap 1. A Figma text box that auto-sizes is the width of its own
// glyphs, so a substitute that sets even slightly wider wraps -- and because a band's rows
// are absolutely positioned with a line-height near their spacing, the second line lands
// exactly on the row below. "Thank You" landed on its own paragraph this way.
//
//   FRAME_W=596 node scripts/oneline-audit.mjs [port]
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const PORT = process.argv[2] || 5180

/*
 * Build the expected set straight from the Figma dumps, so this stays true if the design
 * is re-fetched. A node is "one line" when its declared box is exactly one line-height
 * tall and its string carries no authored newline.
 *
 * Strings that appear as BOTH a one-line node and a multi-line one are DROPPED: the audit
 * matches by text, so it cannot tell the bride heading ("Monika Kristi Maria Manurung",
 * two lines in a 516-wide box) from the bank-card row with the same name in a 232-wide
 * box. Keeping them produced a permanent false positive.
 */
const norm0 = (s) => s.replace(/\s+/g, ' ').trim()
const one = new Set()
const many = new Set()
for (const [file, nid] of [['.figma-tmp/frame8-raw.json', '2129:2'], ['.figma-tmp/frame9-raw.json', '2129:12']]) {
  const walk = (n) => {
    if (n.type === 'TEXT') {
      const lh = n.style?.lineHeightPx || 0
      const chars = n.characters || ''
      if (lh && chars.trim()) {
        const lines = Math.round(n.absoluteBoundingBox.height / lh)
        const t = norm0(chars)
        if (lines === 1 && !chars.includes('\n')) one.add(t)
        else many.add(t)
      }
    }
    for (const c of n.children || []) walk(c)
  }
  walk(JSON.parse(readFileSync(file, 'utf8')).nodes[nid].document)
}
for (const t of many) one.delete(t)
const expected = [...one]

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
await p.click('.cover__open')
await p.waitForTimeout(2200)
// Walk the whole sheet so every band is mounted and revealed.
const h = await p.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < h; y += 600) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(60) }
await p.waitForTimeout(500)

const bad = await p.evaluate((expectedTexts) => {
  const norm = (s) => s.replace(/\s+/g, ' ').trim()
  const want = new Set(expectedTexts.map(norm))
  const out = []
  for (const el of document.querySelectorAll('.sheet p, .sheet h1, .sheet h2, .sheet a, .sheet button, .sheet li')) {
    const txt = norm(el.textContent || '')
    if (!txt || !want.has(txt)) continue
    // An element with element children (a button wrapping an <svg>) yields one rect per
    // child, which is not a wrap. Measure the TEXT nodes only.
    const cs = getComputedStyle(el)
    let lines = 0
    for (const n of el.childNodes) {
      if (n.nodeType !== Node.TEXT_NODE || !n.textContent.trim()) continue
      const r = document.createRange()
      r.selectNodeContents(n)
      lines += r.getClientRects().length
    }
    // `pre-line` nodes carry an authored break on purpose; they are two lines by design.
    if (lines > 1 && cs.whiteSpace !== 'pre-line') {
      const cls = (el.className || '').toString().split(' ').filter(Boolean)[0] || el.tagName
      out.push({ txt: txt.slice(0, 40), lines, cls, font: cs.fontFamily.split(',')[0] })
    }
  }
  return out
}, expected)

await b.close()
if (!bad.length) console.log('one-line audit: all clear')
else {
  console.log(`one-line audit: ${bad.length} node(s) WRAP that must not\n`)
  for (const x of bad) console.log(`  ${x.lines} lines  ${x.cls.padEnd(20)} ${x.font.padEnd(18)} ${JSON.stringify(x.txt)}`)
  process.exitCode = 1
}
