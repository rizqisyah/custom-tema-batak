#!/usr/bin/env python3
"""Rank the faces scripts/font-sweep.mjs rendered against the render's own glyph ink.

Isolate the reference ink first, with text-ink.mjs's method: shoot the sheet twice, once
with the node hidden, difference the two, threshold. Pass that mask as <refInk>.

    python3 scripts/font-pick.py <refInk.png> <sweepDir>

**Do not rank by mask overlap.** Plain IoU puts every fat brush face on top, because a
hairline stroke 2px out of place overlaps nothing while a blob overlaps everything;
dilating both masks and scoring F1-within-2px inverts the bias but not the outcome. Both
measure stroke weight and call it letterform.

What the eye actually reads is ink DENSITY (lit px over the ink box) and ASPECT, compared
at a common width. That is what this ranks on, and on template 6 it picked the right face
out of 126 while both overlap metrics ranked it 45th and last.
"""
import json
import sys

from PIL import Image

W = 240  # common width every face is scaled to before comparing


def ink(im, thr=90):
    g = im.convert('L')
    px = g.load()
    pts = [(x, y) for y in range(g.height) for x in range(g.width) if px[x, y] > thr]
    if not pts:
        return None
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return g.crop((min(xs), min(ys), max(xs) + 1, max(ys) + 1))


def profile(m):
    """(density, aspect) of one ink crop, scaled to the common width."""
    w, h = m.size
    n = m.resize((W, max(1, round(W * h / w))), Image.LANCZOS)
    q = n.load()
    on = sum(1 for y in range(n.height) for x in range(W) if q[x, y] > 90)
    return on / (W * n.height), w / h


if len(sys.argv) < 3:
    sys.exit(__doc__)
ref = ink(Image.open(sys.argv[1]))
if ref is None:
    sys.exit(f'{sys.argv[1]} has no ink above threshold')
rd, ra = profile(ref)
print(f'reference: ink density {rd:.3f}, aspect {ra:.2f}\n')

rows = []
for r in json.load(open(f'{sys.argv[2]}/index.json')):
    if not r['ok']:
        continue
    m = ink(Image.open(f"{sys.argv[2]}/{r['png']}"))
    if m is None:
        continue
    d, a = profile(m)
    rows.append((abs(d - rd) / rd + abs(a - ra) / ra, d, a, r['file']))
rows.sort()
print(f"{'score':>6}  {'density':>7}  {'aspect':>6}  file   (lower score is closer)")
for s, d, a, f in rows[:15]:
    print(f'{s:6.3f}  {d:7.3f}  {a:6.2f}  {f}')
print('\nEyeball the top few before choosing -- this ranks the KIND of line, not the '
      'letterforms. Then width-match per WORD, not per face.')
