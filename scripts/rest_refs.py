#!/usr/bin/env python3
"""Turn a Figma REST node dump into the placement + type tables the bands are cut from.

This REPLACES flatten_frame.py + build_refs.py for template 7. Those read the
figma-mcp-go plugin's dump, which reports a rotated node's TRANSFORM ORIGIN rather than
its bounding box, carries no rotation/opacity/blend at all, and therefore needed
locate.py and solve_alpha.py to recover by search what the REST API simply states.

    FIGMA_TOKEN=... python3 scripts/rest_refs.py fetch <fileKey> <nodeId> <out.json>
    FRAME_W=596 python3 scripts/rest_refs.py table <raw.json> <nodeId> <out.json>
    FIGMA_TOKEN=... python3 scripts/rest_refs.py images <fileKey> <table.json> <outDir> [band]

Why absoluteBoundingBox is the whole trick
------------------------------------------
`absoluteBoundingBox` is the node's AXIS-ALIGNED bounding box after rotation and flips,
in canvas coordinates. Subtract the frame's own origin and it is exactly where the
exported PNG belongs -- no clip rule, no re-centring, no template match.

Verified against the three nodes that broke the old rules:

    2138:825 "groom 1"   relativeTransform tx=755 (a MIRROR: [[-1,0,755],[0,1,1576]])
                         absoluteBoundingBox local x = 277.00, and 596-277 = 319,
                         which is exactly the width Figma exports.
    2136:803 "Open(88)1" local x = -174 (a genuine left edge), exports 228 = -174+402.
    2143:1416 flower     rotated -2.78 rad; the plugin reported x=335.37 (its transform
                         origin), the true AABB starts at x=130.40, and the export is
                         410x495 at scale 2 = the AABB exactly.

So: position from absoluteBoundingBox, extent from the export, and the two agree.
"""
import json
import os
import sys
import urllib.parse
import urllib.request

FRAME_W = float(os.environ.get("FRAME_W", "596"))
TOKEN = os.environ.get("FIGMA_TOKEN", "")


def api(url: str) -> dict:
    if not TOKEN:
        sys.exit("set FIGMA_TOKEN=<a Figma personal access token>")
    req = urllib.request.Request(url, headers={"X-Figma-Token": TOKEN})
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def cmd_fetch(file_key: str, node_id: str, out: str) -> None:
    d = api(
        f"https://api.figma.com/v1/files/{file_key}/nodes"
        f"?ids={urllib.parse.quote(node_id)}&geometry=paths"
    )
    json.dump(d, open(out, "w"))
    print(f"wrote {out}")


def is_live_text(n: dict) -> bool:
    return n.get("type") == "TEXT"


def has_text(n: dict) -> bool:
    """Whether any TEXT node lives anywhere under this one.

    This is what decides whether a group is RECURSED INTO or exported whole. Recursing
    into everything with children shatters art that the design authored as a single unit
    -- the hero (Frame 14 / 2130:605) is one 596x1024 scene of curtain, forest and
    couple, and walking into it drops the scene from the table entirely and replaces it
    with an inner "Container" that carries no geometry of its own.

    Recursing into NOTHING is equally wrong: every text node would be baked into a
    raster and useWedding() could not drive it. So the split is exactly "does this
    subtree contain live copy" -- art-only groups export as one plate, anything holding
    type gets opened up.
    """
    if is_live_text(n):
        return True
    return any(has_text(c) for c in n.get("children", []) or [])


def rgba(c: dict, o: float = 1.0) -> str:
    a = c.get("a", 1) * o
    r, g, b = (round(c[k] * 255) for k in ("r", "g", "b"))
    return f"#{r:02x}{g:02x}{b:02x}" if a >= 0.999 else f"rgba({r}, {g}, {b}, {round(a, 3)})"


def paint(n: dict) -> str | None:
    """The node's fill as a CSS value, or None when it paints nothing.

    Container FRAMES in this design carry real fills -- the white event card, the maroon
    gradient date plate, every form input -- and they also contain live text, so the walk
    recurses THROUGH them. Without this they vanish: the copy lands on bare cream and the
    card it is printed on is simply missing. They are emitted as `surface` rows instead of
    being exported as rasters, because a rounded rectangle of flat colour is one CSS
    declaration that stays sharp at every viewport (SLICING.md, "Chrome that has to work
    ships as CSS").
    """
    for f in n.get("fills", []) or []:
        if not f.get("visible", True) or f.get("opacity", 1) == 0:
            continue
        t = f.get("type")
        if t == "SOLID":
            return rgba(f["color"], f.get("opacity", 1))
        if t == "GRADIENT_LINEAR":
            stops = ", ".join(
                f"{rgba(s['color'])} {round(s['position'] * 100)}%"
                for s in f.get("gradientStops", [])
            )
            # Figma gives the gradient's direction as handle positions; the common case
            # in this design is a left-to-right sweep, so that is the default written
            # here and the angle is checked against the render per use.
            return f"linear-gradient(90deg, {stops})"
    return None


def text_style(n: dict) -> dict:
    """The bits of a TEXT node's style a band actually needs.

    lineHeightPx is what Figma renders; lineHeightPercent is advisory and disagrees with
    it on nodes whose leading was set in px, which is most of this design's.
    """
    s = n.get("style", {}) or {}
    fill = ""
    for f in n.get("fills", []) or []:
        if f.get("type") == "SOLID" and f.get("visible", True):
            c = f["color"]
            fill = "#%02x%02x%02x" % tuple(round(c[k] * 255) for k in ("r", "g", "b"))
            break
    return {
        "font": s.get("fontFamily"),
        "size": s.get("fontSize"),
        "lh": s.get("lineHeightPx"),
        "ls": s.get("letterSpacing"),
        "align": s.get("textAlignHorizontal"),
        "case": s.get("textCase"),
        "fill": fill,
        "chars": n.get("characters", ""),
    }


def cmd_table(raw: str, node_id: str, out: str) -> None:
    doc = json.load(open(raw))["nodes"][node_id]["document"]
    fb = doc["absoluteBoundingBox"]
    fx, fy = fb["x"], fb["y"]
    rows: list[dict] = []

    def walk(n: dict) -> None:
        # REST children are BOTTOM-FIRST, so a depth-first walk is already paint order.
        for c in n.get("children", []):
            b = c.get("absoluteBoundingBox")
            if not b:
                continue
            x, y = b["x"] - fx, b["y"] - fy
            # Open a group ONLY when it holds live copy; art-only groups are one plate.
            if c.get("children") and has_text(c):
                # ...but if it PAINTS, record the surface first — recursing through a
                # filled card would otherwise drop the card and keep only its text.
                css = paint(c)
                if css:
                    rows.append({
                        "z": len(rows) + 1, "id": c["id"], "name": c["name"],
                        "type": "SURFACE", "x": round(x, 2), "y": round(y, 2),
                        "w": round(b["width"], 2), "h": round(b["height"], 2),
                        "vx": round(max(0.0, x), 2),
                        "vw": round(max(0.0, min(FRAME_W, x + b["width"]) - max(0.0, x)), 2),
                        "fill": css, "radius": c.get("cornerRadius"),
                        "rot": c.get("rotation"), "mirrored": False,
                        "opacity": c.get("opacity", 1), "blend": c.get("blendMode"),
                        "visible": c.get("visible", True),
                    })
                walk(c)
                continue
            # Visible box after the frame clips the node at both side edges. This is the
            # size Figma's export comes back at, and the position it belongs to.
            vx0 = max(0.0, x)
            vx1 = min(FRAME_W, x + b["width"])
            row = {
                "z": len(rows) + 1,
                "id": c["id"],
                "name": c["name"],
                "type": c["type"],
                "x": round(x, 2),
                "y": round(y, 2),
                "w": round(b["width"], 2),
                "h": round(b["height"], 2),
                "vx": round(vx0, 2),
                "vw": round(max(0.0, vx1 - vx0), 2),
                "rot": c.get("rotation"),
                "mirrored": bool(
                    (c.get("relativeTransform") or [[1, 0, 0]])[0][0] < 0
                ),
                "opacity": c.get("opacity", 1),
                "blend": c.get("blendMode"),
                "visible": c.get("visible", True),
            }
            if is_live_text(c):
                row["text"] = text_style(c)
            rows.append(row)

    walk(doc)
    json.dump(
        {"frame": node_id, "w": fb["width"], "h": fb["height"], "nodes": rows},
        open(out, "w"),
        indent=1,
    )
    art = [r for r in rows if r["type"] not in ("TEXT", "SURFACE")]
    surf = [r for r in rows if r["type"] == "SURFACE"]
    txt = [r for r in rows if r["type"] == "TEXT"]
    print(f"{len(rows)} leaves -> {out}  ({len(art)} art, {len(surf)} surfaces, {len(txt)} text)")
    off = [r for r in art if r["vw"] < r["w"] - 0.5]
    print(f"  {len(off)} art nodes are clipped by a frame edge")
    print(f"  {sum(1 for r in rows if r['mirrored'])} mirrored, "
          f"{sum(1 for r in rows if r.get('rot'))} rotated, "
          f"{sum(1 for r in rows if not r['visible'])} hidden")


def cmd_images(file_key: str, table: str, outdir: str, only: str = "") -> None:
    """Batch-export the art nodes at scale 2. Figma caps ids per request, so chunk it."""
    t = json.load(open(table))
    ids = [
        r["id"]
        for r in t["nodes"]
        if r["type"] not in ("TEXT", "SURFACE") and r["visible"] and r["vw"] > 0
        and (not only or only in r.get("band", ""))
    ]
    os.makedirs(outdir, exist_ok=True)
    got = 0
    for i in range(0, len(ids), 40):
        chunk = ids[i : i + 40]
        d = api(
            f"https://api.figma.com/v1/images/{file_key}"
            f"?ids={urllib.parse.quote(','.join(chunk))}&scale=2&format=png"
        )
        for nid, url in (d.get("images") or {}).items():
            if not url:
                print(f"  no image for {nid}")
                continue
            dst = os.path.join(outdir, nid.replace(":", "-") + ".png")
            urllib.request.urlretrieve(url, dst)
            got += 1
        print(f"  {got}/{len(ids)}")
    print(f"wrote {got} exports -> {outdir}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cmd, rest = sys.argv[1], sys.argv[2:]
    {"fetch": cmd_fetch, "table": cmd_table, "images": cmd_images}[cmd](*rest)
