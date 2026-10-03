#!/usr/bin/env python3
"""KKACHI "Black ICE" line art, written into kkachi/index.html between <!-- art:NAME:start --> / <!-- art:NAME:end -->.

Spec: docs/superpowers/specs/2026-10-03-kkachi-black-ice-design.md (§3 line art, §4 page). Run from anywhere:
    python3 docs/kkachi/build-art.py
Deterministic (seeded). Blocks:
    logo                   the header wordmark (the ㄲ inlaid with nacre); the hero's dithered nacre is drawn by site.js
    panel-noise / -proof   The Static diagram: a grid of static, and the same grid with one traced path to one nacre cell
    deck                   the interlude: a cyberdeck in isometric view with trodes and cables
    foot                   the wordmark with the ㄲ inlaid in nacre
Colour: neutral only. Nacre is the tile (assets/kkachi/nacre-512.webp) clipped into shapes; those groups carry class
"nacre" (the page check skips them).
"""
import math
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / 'kkachi/index.html'
BRAND = ROOT / 'assets/kkachi/brand'
TILE = '../assets/kkachi/nacre-512.webp'   # relative to kkachi/index.html

LINE = '#E6E6E9'    # strokes
SOFT = '#9C9CA4'    # secondary strokes
HATCH = '#6E6E76'   # hatching
FILL = '#0A0A0C'    # inside of shapes (occludes what is behind)
VOID = '#050506'    # background; halos that separate crossing lines
TEXT = '#F2F2F3'
ENGRAVE = '#08080A'

WM = (BRAND / 'kkachi-wordmark.svg').read_text()
WM_K = re.search(r'id="kk-wm-k"[^>]*\sd="([^"]+)"', WM).group(1)       # the ㄲ, drawn with translate(-3 -3)
WM_ACHI = re.search(r'id="kk-wm-achi"\s+d="([^"]+)"', WM).group(1)
WM_W, WM_H, WM_Y0 = 193.25, 43.62, -0.81                                 # wordmark viewBox: 0 -0.81 193.25 43.62
MARK = re.search(r'\sd="([^"]+)"', (BRAND / 'kkachi-mark.svg').read_text()).group(1)   # viewBox 3 3 42 42


# ── numbers and paths ───────────────────────────────────────────────────────────────────────────────────────────────
def n(v):
    s = f'{v:.1f}'
    s = s[:-2] if s.endswith('.0') else s
    return '0' if s in ('-0', '-0.0') else s


def pt(p, sx=1):
    return f'{n(p[0] * sx)} {n(p[1])}'


def poly(points, close=False):
    return 'M' + 'L'.join(pt(p) for p in points) + ('Z' if close else '')


def bez(p0, p1, p2, p3, t):
    u = 1 - t
    return (u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1])


def bez_d(p0, p1, p2, p3, t):
    u = 1 - t
    return (3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
            3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]))


def unit(v):
    m = math.hypot(*v) or 1
    return (v[0] / m, v[1] / m)


def stroke(d, color=LINE, w=1.6, extra=''):
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{n(w)}"{extra}/>'


def shape(d, fill=FILL, color=LINE, w=1.6, extra=''):
    return f'<path d="{d}" fill="{fill}" stroke="{color}" stroke-width="{n(w)}"{extra}/>'


# ── cables ──────────────────────────────────────────────────────────────────────────────────────────────────────────
def cable(S, E, away, w, rng, rib=False, plug=True, sway=0.0):
    """A tube from S to E. `away` is the unit direction leaving E along the cable (toward S's side)."""
    L = math.dist(S, E)
    c1 = (S[0] + sway, S[1] + 0.40 * L)
    c2 = (E[0] + away[0] * 0.42 * L, E[1] + away[1] * 0.42 * L)
    d = f'M{pt(S)}C{pt(c1)} {pt(c2)} {pt(E)}'
    g = [stroke(d, VOID, w + 5), stroke(d, LINE, w), stroke(d, FILL, w - 2.6)]
    if rib:
        g.append(stroke(d, SOFT, w - 2.6, ' stroke-dasharray="1.2 4.4"'))
    else:   # a shading line along one side of the tube
        off = (w - 2.6) * 0.28
        pts = []
        for i in range(25):
            t = i / 24
            x, y = bez(S, c1, c2, E, t)
            dx, dy = unit(bez_d(S, c1, c2, E, t))
            pts.append((x - dy * off, y + dx * off))
        g.append(stroke(poly(pts), HATCH, 1.0, ' stroke-dasharray="7 5"' if rng.random() < .5 else ''))
    if plug:
        ang = math.degrees(math.atan2(away[1], away[0])) - 90   # local +y runs up the cable
        hw = w / 2 + 2.6
        body = (f'<path d="M{n(-hw)} 0H{n(hw)}V15H{n(-hw)}Z" fill="{FILL}" stroke="{LINE}" stroke-width="1.3"/>'
                f'<path d="M{n(-hw)} 5H{n(hw)}M{n(-hw + 2.5)} 9.5H{n(hw - 2.5)}" stroke="{SOFT}" stroke-width="1"/>'
                f'<path d="M{n(-hw + 1)} 15L{n(-w / 2)} 24H{n(w / 2)}L{n(hw - 1)} 15" fill="{FILL}" stroke="{LINE}" stroke-width="1.2"/>')
        g.append(f'<g transform="translate({n(E[0])} {n(E[1])}) rotate({n(ang)})">{body}</g>')
    return ''.join(g)


# ── the header logo ────────────────────────────────────────────────────────────────────────────────────────────────
def logo():
    """The small wordmark at the top left: the ㄲ inlaid with the nacre tile, ACHI in TEXT (the footer's treatment)."""
    return (f'<svg viewBox="0 {WM_Y0} {WM_W} {WM_H}" focusable="false" aria-hidden="true">'
            f'<clipPath id="logo-k"><path transform="translate(-3 -3)" d="{WM_K}"/></clipPath>'
            f'<g class="nacre" clip-path="url(#logo-k)"><image href="{TILE}" x="-20" y="-24" width="90" height="90"/></g>'
            f'<path d="{WM_ACHI}" fill="{TEXT}"/></svg>')


# ── The Static: two panels ──────────────────────────────────────────────────────────────────────────────────────────
COLS, ROWS, CELL, GAP = 8, 6, 44, 7
PW, PH = COLS * CELL + (COLS - 1) * GAP, ROWS * CELL + (ROWS - 1) * GAP


def cell_xy(c, r):
    return c * (CELL + GAP), r * (CELL + GAP)


def panel_noise():
    rng = random.Random(11)
    o = []
    for r in range(ROWS):
        for c in range(COLS):
            x, y = cell_xy(c, r)
            v = rng.randint(46, 128)
            col = f'#{v:02X}{v:02X}{v + 4:02X}'
            o.append(f'<g class="cell" transform="translate({x} {y})">'
                     f'<rect width="{CELL}" height="{CELL}" rx="3" fill="{col}"/>')
            for _ in range(rng.randint(1, 4)):
                yy = rng.uniform(4, CELL - 4)
                x0 = rng.uniform(2, CELL / 2)
                o.append(f'<path d="M{n(x0)} {n(yy)}H{n(rng.uniform(x0 + 6, CELL - 2))}" stroke="#D8D8DC" stroke-width="{n(rng.uniform(.8, 2.2))}" opacity="{n(rng.uniform(.25, .7))}"/>')
            if rng.random() < .42:
                o.append(f'<path d="M22 12L33 31H11Z" fill="none" stroke="{TEXT}" stroke-width="2" stroke-linejoin="round"/>'
                         f'<path d="M22 19V24M22 27.5V28" stroke="{TEXT}" stroke-width="2" stroke-linecap="round"/>')
            o.append('</g>')
    return (f'<svg viewBox="-2 -2 {PW + 4} {PH + 4}" focusable="false" aria-hidden="true">'
            f'{"".join(o)}</svg>')


def panel_proof():
    o = []
    target = (6, 3)
    route = [(0, 2), (1, 2), (2, 2), (2, 3), (3, 3), (4, 3), (5, 3), (6, 3)]
    dead = [((2, 2), [(2, 1), (3, 1), (4, 1)]), ((4, 3), [(4, 4), (4, 5)]), ((5, 3), [(5, 2), (6, 2)])]
    for r in range(ROWS):
        for c in range(COLS):
            x, y = cell_xy(c, r)
            o.append(f'<rect x="{x}" y="{y}" width="{CELL}" height="{CELL}" rx="3" fill="#1D1D21" stroke="#3B3B42" stroke-width="1"/>')

    def ctr(cr):
        x, y = cell_xy(*cr)
        return (x + CELL / 2, y + CELL / 2)

    for start, branch in dead:
        pts = [ctr(start)] + [ctr(b) for b in branch]
        o.append(stroke(poly(pts), '#77777F', 1.4, ' stroke-dasharray="4 4"'))
        ex, ey = pts[-1]
        o.append(f'<path d="M{n(ex - 5)} {n(ey - 5)}L{n(ex + 5)} {n(ey + 5)}M{n(ex + 5)} {n(ey - 5)}L{n(ex - 5)} {n(ey + 5)}" stroke="#9C9CA4" stroke-width="1.6"/>')
    pts = [(-2, ctr(route[0])[1])] + [ctr(cr) for cr in route]
    o.append(stroke(poly(pts), TEXT, 2.2))
    for cr in route[:-1]:
        cx, cy = ctr(cr)
        o.append(f'<circle cx="{n(cx)}" cy="{n(cy)}" r="3.4" fill="{TEXT}"/>')
    tx, ty = cell_xy(*target)
    o.append(f'<clipPath id="proof-cell"><rect x="{tx}" y="{ty}" width="{CELL}" height="{CELL}" rx="3"/></clipPath>'
             f'<g class="nacre" clip-path="url(#proof-cell)"><image class="cell-drift" href="{TILE}" x="{tx - 40}" y="{ty - 40}" width="140" height="140"/></g>'
             f'<rect x="{tx - 4}" y="{ty - 4}" width="{CELL + 8}" height="{CELL + 8}" rx="5" fill="none" stroke="{TEXT}" stroke-width="1.6"/>')
    lx, ly = tx + CELL / 2, ty + CELL + 22
    o.append(f'<text x="{n(lx)}" y="{n(ly)}" text-anchor="middle" fill="{TEXT}" font-family="KK Mono, monospace" font-size="12.5">3/3</text>')
    return (f'<svg viewBox="-2 -2 {PW + 4} {PH + 4}" focusable="false" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">'
            f'{"".join(o)}</svg>')


# ── the cyberdeck (isometric) ───────────────────────────────────────────────────────────────────────────────────────
DECK_VIEW = (-300, -280, 760, 694)   # fitted to the drawing's getBBox (x -277…435, y -330…410; the cables fade out at the top)
C30, S30 = math.cos(math.radians(30)), math.sin(math.radians(30))


def iso(x, y, z):
    """x to the right-down, z to the left-down, y up."""
    return ((x - z) * C30, (x + z) * S30 - y)


def face(points3, fill=FILL, color=LINE, w=1.5, extra=''):
    return shape(poly([iso(*p) for p in points3], True), fill, color, w, extra)


def box(x0, y0, z0, dx, dy, dz, fill=FILL, w=1.5):
    """A box seen from above-front: top, front (z = z0 + dz) and right (x = x0 + dx) faces."""
    x1, y1, z1 = x0 + dx, y0 + dy, z0 + dz
    return (face([(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], fill, LINE, w)
            + face([(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], fill, LINE, w)
            + face([(x1, y0, z0), (x1, y0, z1), (x1, y1, z1), (x1, y1, z0)], fill, LINE, w))


def deck():
    """The interlude: a monitor behind a keyboard deck, cables rising out of frame (faded by a mask), trodes on the
    right. The screen's cyberspace grid is cut into the nacre tile. DECK_VIEW was fitted to the drawing's getBBox."""
    VX, VY, VW, VH = DECK_VIEW
    rng = random.Random(5)
    o = []
    # the monitor, back left: a stand, then the screen block (front z = MZ, depth 30)
    o.append(box(60, 0, 30, 160, 22, 50))
    o.append(box(110, 22, 46, 60, 26, 18))
    mx0, my0, mz, mw, mh, md = 16, 48, 70, 250, 178, 32
    front = [(mx0, my0, mz), (mx0 + mw, my0, mz), (mx0 + mw, my0 + mh, mz), (mx0, my0 + mh, mz)]
    o.append(face([(mx0, my0 + mh, mz - md), (mx0 + mw, my0 + mh, mz - md), (mx0 + mw, my0 + mh, mz), (mx0, my0 + mh, mz)]))
    # cables plug into the top of the monitor and rise out of frame
    for (x, rise, w) in ((60, -190, 12), (112, -40, 9), (170, 120, 14), (222, 280, 10)):
        E = iso(x, my0 + mh, mz - md / 2)
        o.append(cable((E[0] + rise, -330), E, (0, -1), w, rng, rib=w > 10, sway=rise * .25))
    o.append(face([(mx0 + mw, my0, mz - md), (mx0 + mw, my0, mz), (mx0 + mw, my0 + mh, mz), (mx0 + mw, my0 + mh, mz - md)]))
    for i in range(8):
        o.append(stroke(poly([iso(mx0 + mw, my0 + 24 + i * 9, mz - md + 6), iso(mx0 + mw, my0 + 24 + i * 9, mz - 8)]), HATCH, 1.0))
    o.append(face(front))
    glass = [(mx0 + 14, my0 + 16, mz), (mx0 + mw - 14, my0 + 16, mz), (mx0 + mw - 14, my0 + mh - 16, mz), (mx0 + 14, my0 + mh - 16, mz)]
    o.append(face(glass, '#0E0E11', LINE, 1.3))
    gx0, gx1, gy0, gy1 = glass[0][0], glass[1][0], glass[0][1], glass[2][1]
    hz, vp = gy0 + (gy1 - gy0) * 0.58, (gx0 + gx1) / 2
    grid = []
    for k in range(-9, 10):
        grid.append(poly([iso(vp + k * 5, hz, mz), iso(vp + k * 30, gy0, mz)]))
    for f in (0.0, 0.12, 0.26, 0.42, 0.6, 0.8):
        y = hz - (hz - gy0) * f ** 1.6
        grid.append(poly([iso(gx0, y, mz), iso(gx1, y, mz)]))
    gp = poly([iso(*q) for q in glass], True)
    o.append(f'<clipPath id="deck-glass"><path d="{gp}"/></clipPath>'
             f'<mask id="deck-grid" maskUnits="userSpaceOnUse" x="{VX}" y="{VY}" width="{VW}" height="{VH}">{stroke("".join(grid), "#fff", 1.6)}</mask>'
             f'<g class="nacre" clip-path="url(#deck-glass)"><image href="{TILE}" x="-90" y="-200" width="320" height="320" mask="url(#deck-grid)"/></g>')
    o.append(stroke('M' + 'L'.join(pt(iso(mx0 + 30 + i * 9, my0 + 8, mz)) for i in range(2)), SOFT, 2))
    # the keyboard deck
    D = (0, 0, 130, 440, 30, 190)
    x0, y0, z0, dx, dy, dz = D
    top = y0 + dy
    o.append(box(*D))
    for i in range(1, 9):
        o.append(stroke(poly([iso(x0 + i * 48, y0 + 4, z0 + dz), iso(x0 + i * 48 + 10, y0 + dy - 4, z0 + dz)]), HATCH, 1.0))
    for i in range(1, 6):
        o.append(stroke(poly([iso(x0 + dx, y0 + 5, z0 + i * 30), iso(x0 + dx, y0 + dy - 5, z0 + i * 30 + 8)]), HATCH, 1.0))
    kw, kd, kh, g = 25, 22, 6, 5
    for r in range(5):
        for c in range(13):
            if r == 4 and 3 < c < 10:
                continue
            o.append(box(x0 + 16 + c * (kw + g), top, z0 + 26 + r * (kd + g), kw, kh, kd, FILL, 1.1))
    o.append(box(x0 + 16 + 4 * (kw + g), top, z0 + 26 + 4 * (kd + g), 6 * (kw + g) - g, kh, kd, FILL, 1.1))
    o.append(face([(x0 + 18, top, z0 + 8), (x0 + 210, top, z0 + 8), (x0 + 210, top, z0 + 17), (x0 + 18, top, z0 + 17)], FILL, SOFT, 1.1))
    for (xx, zz) in ((x0 + dx - 12, z0 + 12), (x0 + dx - 12, z0 + dz - 12), (x0 + 12, z0 + dz - 12)):
        cx, cy = iso(xx, top, zz)
        o.append(f'<ellipse cx="{n(cx)}" cy="{n(cy)}" rx="4" ry="2.4" fill="{FILL}" stroke="{LINE}" stroke-width="1"/>')
    # trodes: a headband on the table to the right, electrodes up, a lead into the deck's side
    cx, cz, R = x0 + dx + 110, z0 + 40, 70
    ring = lambda r: [iso(cx + r * math.cos(i * math.pi / 30), 0, cz + r * math.sin(i * math.pi / 30)) for i in range(61)]
    lead = (iso(cx - R + 6, 3, cz + 10), iso(x0 + dx, y0 + 15, z0 + 70))
    ld = f'M{pt(lead[0])}C{pt((lead[0][0] - 10, lead[0][1] + 60))} {pt((lead[1][0] + 40, lead[1][1] + 30))} {pt(lead[1])}'
    o.append(stroke(ld, VOID, 9) + stroke(ld, LINE, 5) + stroke(ld, FILL, 2.4))
    o.append(f'<path d="{poly(ring(R), True)}{poly(ring(R - 12)[::-1], True)}" fill="{FILL}" fill-rule="evenodd" stroke="{LINE}" stroke-width="1.5"/>')
    for k in range(7):
        a = math.pi * (0.1 + k * 0.3)
        ex, ey = iso(cx + (R - 6) * math.cos(a), 6, cz + (R - 6) * math.sin(a))
        o.append(f'<ellipse cx="{n(ex)}" cy="{n(ey)}" rx="9" ry="5.2" fill="{FILL}" stroke="{LINE}" stroke-width="1.3"/>'
                 f'<ellipse cx="{n(ex)}" cy="{n(ey)}" rx="3.4" ry="1.9" fill="{SOFT}"/>')
    inner = ''.join(o)
    return (f'<svg viewBox="{VX} {VY} {VW} {VH}" focusable="false" stroke-linecap="round" stroke-linejoin="round">'
            f'<defs><linearGradient id="deck-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".3" stop-color="#fff"/></linearGradient>'
            f'<mask id="deck-mask" maskUnits="userSpaceOnUse" x="{VX}" y="{VY}" width="{VW}" height="{VH}"><rect x="{VX}" y="{VY}" width="{VW}" height="{VH}" fill="url(#deck-fade)"/></mask></defs>'
            f'<g class="deck-g" mask="url(#deck-mask)">{inner}</g></svg>')


# ── footer: the wordmark with the ㄲ inlaid ────────────────────────────────────────────────────────────────────────
def foot():
    return (f'<svg viewBox="-6 {n(WM_Y0 - 6)} {n(WM_W + 12)} {n(WM_H + 12)}" focusable="false" role="img" aria-label="KKACHI">'
            f'<clipPath id="foot-k"><path transform="translate(-3 -3)" d="{WM_K}"/></clipPath>'
            f'<g class="nacre" clip-path="url(#foot-k)"><image class="mark-drift" href="{TILE}" x="-30" y="-30" width="110" height="110"/></g>'
            f'<path d="{WM_ACHI}" fill="{TEXT}"/></svg>')


BLOCKS = {
    'logo': logo,
    'panel-noise': panel_noise,
    'panel-proof': panel_proof,
    'deck': deck,
    'foot': foot,
}


def main():
    html = PAGE.read_text()
    for name, make in BLOCKS.items():
        pat = re.compile(rf'(<!-- art:{name}:start -->\n).*?(\n?<!-- art:{name}:end -->)', re.S)
        if not pat.search(html):
            raise SystemExit(f'marker art:{name} not found in {PAGE}')
        svg = make()
        html = pat.sub(lambda m: m.group(1) + svg + '\n' + m.group(2).lstrip('\n'), html)
        print(f'{name}: {len(svg) / 1024:.1f} KB')
    PAGE.write_text(html)


if __name__ == '__main__':
    main()
