#!/usr/bin/env python3
"""KKACHI "Black ICE" line art, written into kkachi/index.html between <!-- art:NAME:start --> / <!-- art:NAME:end -->.

Spec: docs/superpowers/specs/2026-10-03-kkachi-black-ice-design.md (§3 line art, §4 page). Run from anywhere:
    python3 docs/kkachi/build-art.py
Deterministic (seeded). Blocks:
    hero-wide / hero-tall  the wordmark, the cables, and the jacked-in figure with the nacre lens (wide: 1440×900, art
                           fills the hero; tall: 800×1000, art above the copy)
    panel-noise / -proof   The Static diagram: a grid of static, and the same grid with one traced path to one nacre cell
    deck                   the interlude: a cyberdeck in isometric view with trodes and cables
    foot                   the wordmark with the ㄲ inlaid in nacre
Colour: neutral only. Nacre is the tile (assets/kkachi/nacre-512.webp) clipped into shapes; those groups carry class
"nacre" (the page check skips them). The figure is symmetric: each feature is drawn as its right half and mirrored.
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


class Half:
    """An open path given as its right half; mirror with sx=-1."""

    def __init__(self, start):
        self.start, self.segs = start, []

    def L(self, *ps):
        for p in ps:
            self.segs.append(('L', p))
        return self

    def C(self, c1, c2, p):
        self.segs.append(('C', c1, c2, p))
        return self

    def d(self, sx=1, move=True):
        s = f'M{pt(self.start, sx)}' if move else ''
        for seg in self.segs:
            s += f'L{pt(seg[1], sx)}' if seg[0] == 'L' else 'C' + ' '.join(pt(q, sx) for q in seg[1:])
        return s

    def reversed(self):
        ends = [self.start] + [seg[-1] for seg in self.segs]
        r = Half(ends[-1])
        for k in range(len(self.segs) - 1, -1, -1):
            seg = self.segs[k]
            if seg[0] == 'L':
                r.L(ends[k])
            else:
                r.C(seg[2], seg[1], ends[k])
        return r


def both(h):
    """Right half and its mirror, as two subpaths."""
    return h.d(1) + h.d(-1)


def closed(h):
    """A closed symmetric outline from a right half running from (0, top) to (0, bottom)."""
    return h.d(1) + h.reversed().d(-1, move=False) + 'Z'


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


def hatch_along(p0, p1, p2, p3, count, gap, t0=0.15, t1=0.85, shrink=0.06, side=1, color=HATCH, w=1.0):
    """Engraving-style hatching: copies of a curve offset along its normal, each a little shorter."""
    out = []
    for k in range(1, count + 1):
        a, b = t0 + shrink * k, t1 - shrink * k
        if b - a < 0.05:
            break
        pts = []
        for i in range(13):
            t = a + (b - a) * i / 12
            x, y = bez(p0, p1, p2, p3, t)
            dx, dy = unit(bez_d(p0, p1, p2, p3, t))
            pts.append((x - dy * gap * k * side, y + dx * gap * k * side))
        out.append(stroke(poly(pts), color, w))
    return ''.join(out)


def mirrored(svg):
    return f'{svg}<g transform="scale(-1 1)">{svg}</g>'


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


# ── the figure (local coordinates: x = 0 is the centre line, skull top at y ≈ 0, collar crop at y ≈ 760) ─────────
SCALP = ((0, -6), (72, -6), (134, 30), (147, 104))
SCALP_T = (0.0, 0.3, 0.58, 0.84)     # where cables leave the scalp (and their mirrors)
PORTS = (42, 98)                     # visor top sockets, x (and mirrors); y = VISOR_TOP
VISOR_TOP = 136


def scalp_points():
    pts = []
    for t in SCALP_T:
        x, y = bez(*SCALP, t)
        dx, dy = unit(bez_d(*SCALP, t))
        nrm = (dy, -dx)                       # outward (up/right) normal of the right half
        if nrm[1] > 0:
            nrm = (-nrm[0], -nrm[1])
        pts.append(((x, y), nrm))
        if x > 1:
            pts.append(((-x, y), (-nrm[0], nrm[1])))
    for x in PORTS:
        for sx in (1, -1):
            pts.append(((x * sx, VISOR_TOP - 1), (0, -1)))
    return pts


def figure_back():
    head = Half(SCALP[0]).C(SCALP[1], SCALP[2], SCALP[3]).L((150, 150))
    out = [shape(closed(Half((0, -6)).C(SCALP[1], SCALP[2], SCALP[3]).L((150, 300)).L((0, 300))), FILL, 'none', 0)]
    out.append(stroke(both(head), LINE, 1.8))
    out.append(hatch_along(*SCALP, 5, 6, t0=.45, t1=1.0, shrink=.05, side=1))
    out.append('<g transform="scale(-1 1)">' + hatch_along(*SCALP, 3, 6, t0=.6, t1=1.0, shrink=.08, side=1, color='#4A4A51') + '</g>')
    for (x, y), nrm in scalp_points():
        if y < VISOR_TOP - 4:
            ang = math.degrees(math.atan2(nrm[1], nrm[0])) - 90
            out.append(f'<g transform="translate({n(x)} {n(y)}) rotate({n(ang)})">'
                       f'<path d="M-11 2C-11 -5 11 -5 11 2Z" fill="{FILL}" stroke="{LINE}" stroke-width="1.3"/></g>')
    return ''.join(out)


def face_outline():
    return Half((146, 278)).C((151, 322), (143, 374), (127, 416)).C((111, 454), (73, 484), (38, 494)).C((24, 498), (10, 499), (0, 499))


def figure_front(uid, rng):
    o = []
    # cable from each ear pod, down behind the collar
    for sx in (1, -1):
        o.append(f'<g transform="scale({sx} 1)">' + cable((300, 900), (232, 268), (0.15, 1), 11, rng, rib=True) + '</g>')
    # neck
    neck_side = Half((98, 446)).C((96, 500), (100, 548), (112, 596))
    o.append(shape(closed(Half((0, 440)).L((98, 446))
                          .C((96, 500), (100, 548), (112, 596)).L((0, 610))), FILL, 'none', 0))
    o.append(stroke(both(neck_side), LINE, 1.6))
    o.append(stroke(both(Half((86, 500)).C((66, 540), (42, 566), (24, 584))), SOFT, 1.1))
    o.append(stroke('M-10 544C-6 535 6 535 10 544', SOFT, 1.2))
    o.append(hatch_along((98, 446), (96, 500), (100, 548), (112, 596), 4, -5, t0=.05, t1=.9, shrink=.08))
    # turtleneck band
    top = Half((0, 588)).C((42, 588), (86, 580), (112, 566))
    bot = Half((0, 630)).C((50, 630), (98, 620), (126, 604))
    o.append(shape(closed(Half((0, 588)).C((42, 588), (86, 580), (112, 566)).L((126, 604))
                          .C((98, 620), (50, 630), (0, 630))), FILL, 'none', 0))
    o.append(stroke(both(top), LINE, 1.6) + stroke(both(bot), LINE, 1.6))
    for i in range(1, 12):
        t = i / 12
        a, b = bez((0, 588), (42, 588), (86, 580), (112, 566), t), bez((0, 630), (50, 630), (98, 620), (126, 604), t)
        o.append(mirrored(stroke(poly([(a[0], a[1] + 3), (b[0], b[1] - 3)]), HATCH, 1.0)))
    # coat: popped collar and lapels
    collar = Half((112, 566)).L((150, 472)).C((196, 474), (246, 504), (272, 534)).L((316, 700)).L((246, 742)).L((126, 604))
    o.append(mirrored(shape(collar.d() + 'Z', FILL, LINE, 1.7)))
    lapel = Half((126, 604)).L((246, 742)).L((214, 800)).L((96, 800)).L((60, 700))
    o.append(mirrored(shape(lapel.d() + 'Z', FILL, LINE, 1.7)))
    o.append(mirrored(stroke('M140 560L176 500M168 548L230 520M150 590L276 600', HATCH, 1.0)))
    o.append(mirrored(hatch_along((150, 472), (196, 474), (246, 504), (272, 534), 6, 6, t0=.1, t1=.95, shrink=.05)))
    o.append(mirrored(stroke('M316 700C360 716 400 742 440 800', LINE, 1.7) + stroke('M300 720C320 760 330 780 334 800', SOFT, 1.1)))
    o.append(mirrored(hatch_along((126, 604), (180, 668), (230, 720), (246, 742), 5, -6, t0=.1, t1=.95, shrink=.06)))
    o.append(stroke('M-60 700L0 760L60 700', LINE, 1.5) + stroke('M0 760V800', SOFT, 1.1))
    # face
    o.append(shape(closed(Half((0, 262)).L((146, 270)).L((146, 278)).C((151, 322), (143, 374), (127, 416))
                          .C((111, 454), (73, 484), (38, 494)).C((24, 498), (10, 499), (0, 499))), FILL, 'none', 0))
    o.append(stroke(both(face_outline()), LINE, 1.8))
    o.append(hatch_along((146, 278), (151, 322), (143, 374), (127, 416), 6, 5.5, t0=.05, t1=1.0, shrink=.07))
    o.append('<g transform="scale(-1 1)">' + hatch_along((146, 278), (151, 322), (143, 374), (127, 416), 3, 5.5, t0=.2, t1=1.0, shrink=.1, color='#4A4A51') + '</g>')
    o.append(hatch_along((127, 416), (111, 454), (73, 484), (38, 494), 4, 5, t0=.0, t1=.95, shrink=.08))
    # nose
    o.append(stroke(both(Half((15, 266)).C((16, 286), (20, 304), (26, 318))), SOFT, 1.3))
    o.append(stroke(both(Half((26, 315)).C((41, 317), (47, 340), (33, 347))), LINE, 1.6))
    o.append(stroke(both(Half((29, 350)).C((23, 353), (14, 353), (8, 349))), LINE, 1.6))
    o.append(stroke('M8 349C4 352 -4 352 -8 349', LINE, 1.6))
    o.append(stroke('M-6 333C-2 330 2 330 6 333', SOFT, 1.1))
    o.append(hatch_along((15, 266), (16, 286), (20, 304), (26, 318), 3, 4, t0=.1, t1=1.0, shrink=.1))
    o.append(stroke(both(Half((45, 344)).C((57, 358), (64, 376), (63, 396))), SOFT, 1.2))
    # mouth
    o.append(stroke(both(Half((6, 356)).L((8, 375))), HATCH, 1.1))
    o.append(stroke(both(Half((0, 379)).C((3, 377), (7, 373), (12, 375)).C((24, 380), (40, 386), (54, 392))), LINE, 1.5))
    o.append(stroke(both(Half((0, 392)).C((16, 391), (36, 392), (57, 393))), LINE, 2.2))
    o.append(stroke(both(Half((45, 397)).C((37, 408), (18, 413), (0, 413))), LINE, 1.5))
    for x in range(-24, 25, 4):
        o.append(stroke(f'M{x} 418L{x * 1.1:.1f} {426 - abs(x) / 6:.1f}', HATCH, 1.0))
    o.append(stroke(both(Half((30, 455)).C((24, 466), (12, 471), (0, 471))), SOFT, 1.2))
    # stubble: stipple on the jaw, chin and upper lip
    dots = []
    for _ in range(520):
        x, y = rng.uniform(-128, 128), rng.uniform(352, 496)
        inside = abs(x) < (146 - max(0, y - 380) * 0.95 if y > 380 else 140)
        lips = abs(x) < 58 and 372 < y < 416
        nose = abs(x) < 48 and y < 352
        if inside and not lips and not nose and (y > 418 or abs(x) < 44 or abs(x) > 70):
            dots.append(f'M{n(x)} {n(y)}h.1')
    o.append(f'<path d="{"".join(dots)}" stroke="{SOFT}" stroke-width="1.5" stroke-linecap="round"/>')
    # a plaster on the right cheek (the cover's)
    o.append('<g transform="translate(-98 330) rotate(-24)">'
             f'<rect x="-19" y="-8" width="38" height="16" rx="5" fill="{FILL}" stroke="{LINE}" stroke-width="1.4"/>'
             f'<rect x="-7" y="-5" width="14" height="10" rx="2" fill="none" stroke="{SOFT}" stroke-width="1"/>'
             f'<path d="M-15 -3h.1M-15 3h.1M15 -3h.1M15 3h.1" stroke="{SOFT}" stroke-width="1.6" stroke-linecap="round"/></g>')
    # visor
    body = Half((0, VISOR_TOP)).L((150, VISOR_TOP), (198, 154), (216, 176), (218, 252), (200, 276), (52, 280), (32, 266), (0, 266))
    o.append(shape(closed(body), FILL, LINE, 2.0))
    pod = 'M202 168L240 178L246 254L216 270L206 262Z'
    o.append(mirrored(shape(pod, FILL, LINE, 1.7)))
    o.append(mirrored(stroke('M216 196H238M216 203H239M216 210H240M216 217H240', SOFT, 1.1)))
    o.append(stroke('M232 184L242 252M226 186L236 256', HATCH, 1.0))
    o.append(stroke(both(Half((0, 150)).L((150, 150), (194, 166))), SOFT, 1.2))
    o.append(stroke(both(Half((60, 268)).L((196, 266))), SOFT, 1.1))
    o.append(mirrored(stroke('M118 150V171M186 164V184M128 266V279', SOFT, 1.1)))
    for (x, y) in ((70, 143), (128, 143), (96, 273), (170, 271), (226, 244)):
        o.append(mirrored(f'<circle cx="{x}" cy="{y}" r="3.2" fill="{FILL}" stroke="{LINE}" stroke-width="1.1"/>'
                          f'<path d="M{x - 2} {y}h4" stroke="{LINE}" stroke-width="1"/>'))
    for x in PORTS:
        o.append(mirrored(f'<rect x="{x - 10}" y="{VISOR_TOP - 4}" width="20" height="8" fill="{FILL}" stroke="{LINE}" stroke-width="1.2"/>'))
    for i in range(6):   # shade on the lower band, right side of the face only
        o.append(stroke(f'M{150 + i * 9} 278L{172 + i * 9} 258', HATCH, 1.0))
    # lens: nacre, clipped
    lens = Half((0, 176)).L((140, 176), (166, 190), (170, 238), (150, 256), (36, 258), (26, 250), (0, 250))
    bezel = Half((0, 169)).L((143, 169), (175, 186), (179, 242), (154, 264), (40, 265), (28, 257), (0, 257))
    o.append(shape(closed(bezel), FILL, LINE, 1.4))
    o.append(f'<clipPath id="lens-{uid}"><path d="{closed(lens)}"/></clipPath>')
    o.append(f'<g class="lens nacre" clip-path="url(#lens-{uid})">'
             f'<image class="lens-drift" href="{TILE}" x="-215" y="96" width="430" height="430" preserveAspectRatio="none"/>'
             f'<path d="M-170 176H170V196H-170Z" fill="{VOID}" opacity=".28"/>'
             f'<path d="M-120 250L-60 176M-96 250L-36 176M70 250L118 190" stroke="#fff" stroke-width="2" opacity=".35"/></g>')
    o.append(stroke(closed(lens), LINE, 1.5))
    # HUD, engraved into the nacre
    hud = [f'<path d="M-144 200V232M-135 200V232M-126 200V232M-117 200V232M-152 224L-108 206" stroke="{ENGRAVE}" stroke-width="3"/>',
           f'<path d="M-90 204L-70 216L-90 228Z" fill="none" stroke="{ENGRAVE}" stroke-width="3" stroke-linejoin="round"/>',
           f'<path d="M-156 186H-146M-156 186V194M156 186H146M156 186V194M-156 246H-146M-156 246V238M156 246H146M156 246V238" stroke="{ENGRAVE}" stroke-width="2"/>',
           f'<path d="M-52 236H40" stroke="{ENGRAVE}" stroke-width="1.6" stroke-dasharray="3 4"/>',
           f'<g transform="translate(96 194) scale(.86) translate(-3 -3)"><path d="{MARK}" fill="{ENGRAVE}"/></g>']
    o.append(f'<g class="hud nacre" opacity=".84">{"".join(hud)}</g>')
    return ''.join(o)


# ── the hero compositions ───────────────────────────────────────────────────────────────────────────────────────────
def hero(uid, W, H, wm_x, wm_y, wm_w, fx, fy, fs, starts, loose, aspect):
    rng = random.Random(7 + len(uid))
    s = wm_w / WM_W
    defs = (f'<mask id="cables-{uid}" maskUnits="userSpaceOnUse" x="0" y="-60" width="{W}" height="{H + 120}">'
            f'<rect class="cable-reveal" x="0" y="-60" width="{W}" height="{H + 120}" fill="#fff"/></mask>')
    tf = f'translate({n(fx)} {n(fy)}) scale({fs})'
    fade = ''
    if aspect == 'tall':   # the copy follows the art: let the art sink into the void
        defs += (f'<linearGradient id="sink-{uid}" x1="0" y1="0" x2="0" y2="1">'
                 f'<stop offset="0" stop-color="{VOID}" stop-opacity="0"/><stop offset="1" stop-color="{VOID}"/></linearGradient>')
        fade = f'<rect x="0" y="{H - 200}" width="{W}" height="200" fill="url(#sink-{uid})"/>'

    def g(p):
        return (fx + p[0] * fs, fy + p[1] * fs)

    # loose cables behind the figure: from the top edge to off the bottom
    back = []
    for (sx, ex, ey, w) in loose:
        back.append(cable((sx, -40), (ex, ey), (0, -1), w, rng, rib=rng.random() < .5, plug=False, sway=rng.uniform(-60, 60)))
    # cables into the scalp and the visor sockets
    ends = scalp_points()
    ends.sort(key=lambda e: -abs(e[0][0]))   # outer ones first: inner cables overlap them
    front = []
    for i, ((x, y), nrm) in enumerate(ends):
        E = g((x, y))
        S = (starts[i % len(starts)], -40)
        w = (9 + (i * 7) % 6) * fs * 1.15
        front.append(cable(S, E, nrm, w, rng, rib=(i % 3 == 0), sway=rng.uniform(-40, 40)))
    wm = (f'<g class="wm" transform="translate({n(wm_x)} {n(wm_y - WM_Y0 * s)}) scale({s:.4f})">'
          f'<g fill="{TEXT}" stroke="{VOID}" stroke-width="{round(8 / s, 2)}" paint-order="stroke" stroke-linejoin="round">'
          f'<path transform="translate(-3 -3)" d="{WM_K}"/><path d="{WM_ACHI}"/></g></g>')
    return (f'<svg class="art-{aspect}" viewBox="0 0 {W} {H}" preserveAspectRatio="{"xMidYMin slice" if aspect == "wide" else "xMidYMin meet"}" '
            f'focusable="false" stroke-linecap="round" stroke-linejoin="round">'
            f'<defs>{defs}</defs>'
            f'<g mask="url(#cables-{uid})">{"".join(back)}</g>'
            f'<g class="figure" transform="{tf}">{figure_back()}</g>'
            f'<g mask="url(#cables-{uid})">{"".join(front)}</g>'
            f'<g class="figure" transform="{tf}">{figure_front(uid, rng)}</g>'
            f'{wm}{fade}</svg>')


def hero_wide():
    return hero('w', 1440, 900, wm_x=290, wm_y=62, wm_w=860, fx=1112, fy=384, fs=0.84,
                starts=[1460, 1330, 1250, 1190, 1120, 1060, 990, 930, 880, 1400, 1020, 960, 1290, 1160],
                loose=[(1420, 1520, 940, 12), (1300, 1480, 960, 9), (1200, 1260, 980, 14), (1350, 1400, 990, 8), (900, 960, 1000, 10)],
                aspect='wide')


def hero_tall():
    return hero('t', 800, 1040, wm_x=60, wm_y=150, wm_w=680, fx=400, fy=468, fs=0.9,
                starts=[790, 20, 700, 110, 620, 190, 540, 260, 470, 330, 430, 370, 400, 600],
                loose=[(30, -40, 1060, 11), (770, 840, 1060, 11), (150, 120, 1080, 8), (660, 700, 1080, 9)],
                aspect='tall')


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
    'hero-wide': hero_wide,
    'hero-tall': hero_tall,
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
