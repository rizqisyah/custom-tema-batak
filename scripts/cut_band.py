#!/usr/bin/env python3
"""Cut one band out of the REST node table: convert its plates, print its tables.

    python3 scripts/cut_band.py <band> <y0> <y1>

Reads .figma-ref/frame9-nodes.json and .figma-tmp/parts9/*.png, writes
src/assets/<band>/parts/*.webp, and prints (a) the BandLayer[] literal to paste into the
band component and (b) every live text node in the range with the style REST reports.

Coordinates printed are BAND-LOCAL -- global y minus y0 -- so a band can be inserted
above another without renumbering it.

Two rules this encodes, both measured (see SLICING.md):

- Position is the node's TRUE left edge (`x` from absoluteBoundingBox minus the frame
  origin), NOT the frame-clipped `vx`. The REST /v1/images endpoint exports a node in
  ISOLATION and UNCLIPPED -- "groom 1" comes back the full 478 wide even though only 319
  of it is inside the frame -- so the plate is placed at its real x, may start negative
  or run past 596, and `.sheet { overflow: hidden }` does the clipping. (This is the one
  place REST differs from the MCP's download_assets, which returns the CLIPPED 319.)
- EXTENT comes from the exported PNG, not the declared box. The hero plate declares 998
  tall and exports 1024, and the extra rows are real art; trusting the declared height
  there left a 190-mean-abs seam across the sheet.
- A node marked `visible: false` in Figma is SKIPPED. `2139:839` ("groom 2") is a hidden
  duplicate sitting almost on top of the real groom; exporting it double-prints him.
"""
import json
import os
import sys

from PIL import Image

Image.MAX_IMAGE_PIXELS = None
SCALE = 2  # every plate is exported at scale 2

band, y0, y1 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
table = json.load(open(".figma-ref/frame9-nodes.json"))
rows = [r for r in table["nodes"] if y0 <= r["y"] < y1]

art = [r for r in rows if r["type"] not in ("TEXT", "SURFACE") and r["visible"] and r["vw"] > 0]
skipped = [r for r in rows if r["type"] not in ("TEXT", "SURFACE") and not r["visible"]]
surfaces = [r for r in rows if r["type"] == "SURFACE" and r["visible"]]
text = [r for r in rows if r["type"] == "TEXT"]

outdir = f"src/assets/{band}/parts"
os.makedirs(outdir, exist_ok=True)

layers = []
for r in art:
    src = f".figma-tmp/parts9/{r['id'].replace(':', '-')}.png"
    if not os.path.exists(src):
        print(f"  !! no export for {r['id']} {r['name']}", file=sys.stderr)
        continue
    im = Image.open(src)
    ew, eh = im.size[0] / SCALE, im.size[1] / SCALE
    # The export is authoritative about extent; the table about origin.
    im.convert("RGB" if im.mode == "RGB" else "RGBA").save(
        f"{outdir}/{r['id'].replace(':', '-')}.webp", "WEBP", quality=88, method=6
    )
    layers.append(
        dict(z=r["z"], id=r["id"], name=r["name"], x=r["x"], y=round(r["y"] - y0, 2),
             w=round(ew, 2), h=round(eh, 2), dw=r["vw"], dh=r["h"])
    )

print(f"\n// {band}: y {y0:.0f}-{y1:.0f}, {len(layers)} plates, {len(text)} text nodes")
if skipped:
    print(f"// SKIPPED (hidden in Figma): {', '.join(r['id'] for r in skipped)}")
print("const LAYERS: BandLayer[] = [")
for l in layers:
    note = ""
    if l["x"] < -0.5 or l["x"] + l["w"] > 596.5:
        note = "  // bleeds off-frame; .sheet clips it"
    print(
        f"  {{ z: {l['z']}, id: '{l['id']}', src: assets['{band}/parts/"
        f"{l['id'].replace(':', '-')}.webp'], x: {l['x']}, y: {l['y']}, "
        f"w: {l['w']}, h: {l['h']} }},{note}"
    )
print("]")

if surfaces:
    print("\n// CSS surfaces — filled container frames, drawn as CSS not raster:")
for r in surfaces:
    print(
        f"//  {r['id']} {r['name'][:26]!r} x={r['x']} y={round(r['y']-y0,2)} "
        f"w={r['w']} h={r['h']} radius={r.get('radius')} fill={r['fill']}"
    )

if text:
    print("\n// live text in this band (style as REST reports it):")
for r in text:
    s = r["text"]
    print(
        f"//  {r['id']}  x={r['x']} y={round(r['y']-y0,2)} w={r['w']} h={r['h']}\n"
        f"//    {s['font']} {s['size']}/{s['lh']} ls={s['ls']} {s['align']} "
        f"case={s['case']} {s['fill']}\n"
        f"//    {s['chars'][:90]!r}"
    )
