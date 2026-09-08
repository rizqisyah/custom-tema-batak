#!/usr/bin/env python3
"""Find where a layer belongs by VOTING, when no search scores it.

For layers whose true position is outside locate.py's radius, or that solve_alpha.py has
already faded to nothing so there is no ink left to match. See "when nothing scores, vote"
in SLICING.md.

    node scripts/layer-probe.mjs '{"<id>":{"hide":true}}'   # build the base
    cp .figma-tmp/web-sheet-1x.png .figma-tmp/base-hidden.png
    BAND_REF=<1x frame render.png> python3 scripts/vote-place.py \\
        src/assets/<band>/parts/<id>.webp <bandTop> <x0> <x1> <y0> <y1>

x0..x1 / y0..y1 bound the residual this layer is supposed to explain, in BAND-LOCAL design
px -- read them off the residual map this prints. Every (asset ink point -> residual point)
pair votes for one offset; the winning bin is the placement.

Confirm it with a 1px scan afterwards: a real position falls away on BOTH sides of both
axes. An ink crop gets within a pixel, not to it.
"""
import os
import sys
from collections import Counter

from PIL import Image, ImageChops

REF = os.environ.get('BAND_REF') or sys.exit('set BAND_REF=<1x frame render png>')
BASE = '.figma-tmp/base-hidden.png'
if len(sys.argv) < 8:
    sys.exit(__doc__)
asset, band_top = sys.argv[1], int(sys.argv[2])
cx0, cx1, cy0, cy1 = (int(v) for v in sys.argv[3:7])
frame_h = Image.open(REF).height

ref = Image.open(REF).convert('RGB')
base = Image.open(BASE).convert('RGB')
d = ImageChops.difference(ref.crop((0, band_top, ref.width, frame_h)),
                          base.crop((0, band_top, base.width, frame_h))).convert('L')
d.point(lambda v: 255 if v > 28 else 0).save('.figma-tmp/residual.png')
px = d.load()
target = [(x, y) for y in range(cy0, cy1) for x in range(cx0, cx1) if px[x, y] > 28]
if not target:
    sys.exit('no residual in that window -- widen it, or the layer is already drawn')

im = Image.open(asset).convert('RGBA')
al = im.split()[3].resize((im.width // 2, im.height // 2), Image.LANCZOS)
ap = al.load()
ink = [(x, y) for y in range(0, al.height, 3) for x in range(0, al.width, 3) if ap[x, y] > 40]

votes = Counter()
for ax, ay in ink:
    for tx, ty in target[::3]:
        votes[(tx - ax, ty - ay)] += 1
(ox, oy), v = votes.most_common(1)[0]
print(f'{asset}: {al.width}x{al.height}, ink {len(ink)}, residual {len(target)}')
print(f'  -> band-local ({ox}, {oy}), global y {oy + band_top}, {v} votes')
print('  wrote .figma-tmp/residual.png -- check the window covered the right cluster')
print('  now scan +/-3 and +/-6 on each axis: a real position is a minimum on both')
