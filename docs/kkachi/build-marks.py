#!/usr/bin/env python3
"""KKACHI sibling marks: built only from the ㄱ (one half of the C′1 master path, unmodified), moved by 90° turns and
translations, every piece at size 1 (so every mark has the master's arm 9). Build time only.

    python3 docs/kkachi/build-marks.py            # writes assets/kkachi/brand/kkachi-<name>.svg for each mark in MARKS
    python3 docs/kkachi/build-marks.py --check    # prints the gap between every pair of pieces, writes nothing

The ㄱ in its own frame: its outer corner at (0, 0), one arm along −x to its tip at (−30, 0), the other along +y to its
tip at (0, 30); arm 9 thick; each arm tapers to a sharp tip on its outer (straight) edge. The ㄱ is symmetric about its
corner diagonal, so a mirror image is always one of four turns (degrees clockwise, SVG y-down):
    turn 0   corner top-right,    arms left and down   (the ㄱ as written in the master path)
    turn 90  corner bottom-right, arms up and left
    turn 180 corner bottom-left,  arms right and up
    turn 270 corner top-left,     arms down and right
A piece is (turn, x, y): the turn about its corner, then the corner at (x, y). Rhythm, from the ㄲ: neighbouring pieces
keep a gap of 3 (the ㄲ is (0, 45, 3) + (0, 33, 15)). The output is one path (a subpath per piece, transforms baked in,
coordinates exact), fill currentColor, like kkachi-mark.svg. The viewBox is a square on the ink's longer side with the
ink centred (the shield and the Talon both sit in a 63 square, so at one size they share one stroke weight).
"""
import math, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'kkachi', 'brand')
G = 'M15 3H45V33C42.5 22.75 36 29.75 36 16.5V12H31.5C18.25 12 25.25 5.5 15 3Z'   # one ㄱ of the master path
# G as points in the ㄱ's own frame (corner (45, 3) → origin): start, then ('L', p) / ('C', c1, c2, p)
START = (-30, 0)
SEGS = [('L', (0, 0)), ('L', (0, 30)), ('C', (-2.5, 19.75), (-9, 26.75), (-9, 13.5)), ('L', (-9, 9)),
        ('L', (-13.5, 9)), ('C', (-26.75, 9), (-19.75, 2.5), (-30, 0))]

H = 31.5   # the cross's and the shield's corner offset: 30 + half the gap of 3
MARKS = {
    # four ㄱ, corners out: the reverse of the cross (kkachi/drafts/d-cross-spaced.svg, corners in). Each piece keeps
    # its cross cell and turns 180° in it, so the box (63) and the gap (3, at the side midpoints) stay the cross's; the
    # counter is a four-pointed star. With H = 30 the tips touch and the square closes.
    'shield-foundry': {
        'label': 'KKACHI Shield Foundry',
        'pieces': [(0, H, -H), (90, H, H), (180, -H, H), (270, -H, -H)],
    },
    # three ㄱ as written, hanging like the three front claws of a foot: the ㄲ is two ㄱ, the Talon (the agent's core)
    # is three. Drop 12 = the ㄲ's own step (arm 9 + gap 3); stride 16.5 = (63 − 30) / 2, so the ink is 63 wide like
    # the cross and the shield and the three share one 63 frame and one stroke weight. Each claw tucks under the toe
    # above it at 3.13 (a corner meeting a curve, so it reads as the ㄲ's 3). Wider strides read as "777", narrower as
    # "ㄲ plus one"; the mirror (turn 270) reads as flags. Chosen from 19 candidates (.scratch/marks/talon/).
    'talon': {
        'label': 'KKACHI Talon',
        'pieces': [(0, 0, 0), (0, -16.5, 12), (0, -33, 24)],
    },
}


def num(v):
    s = ('%.3f' % v).rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def move(turn, x, y):
    c, s = round(math.cos(math.radians(turn))), round(math.sin(math.radians(turn)))   # 90° steps only
    assert turn % 90 == 0, 'turns are multiples of 90°'
    return lambda p: (p[0] * c - p[1] * s + x, p[0] * s + p[1] * c + y)


def subpath(piece):
    f = move(*piece)
    cur = f(START)
    d = ['M%s %s' % tuple(map(num, cur))]
    for seg in SEGS:
        pts = [f(p) for p in seg[1:]]
        if seg[0] == 'L':
            p = pts[0]
            d.append('H' + num(p[0]) if p[1] == cur[1] else 'V' + num(p[1]) if p[0] == cur[0] else 'L%s %s' % tuple(map(num, p)))
            cur = p
        else:
            d.append('C' + ' '.join('%s %s' % tuple(map(num, p)) for p in pts))
            cur = pts[-1]
    return ''.join(d) + 'Z'


def outline(piece, n=64):
    """the piece's outline as points (curves sampled), for the ink box and the gap check."""
    f = move(*piece)
    pts, cur = [START], START
    for seg in SEGS:
        if seg[0] == 'L':
            pts.append(seg[1])
        else:
            p0, p1, p2, p3 = cur, *seg[1:]
            for i in range(1, n + 1):
                t = i / n
                pts.append(tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * e
                                 for a, b, c, e in zip(p0, p1, p2, p3)))
        cur = seg[-1]
    return [f(p) for p in pts[:-1]]


def gap(a, b):
    """smallest distance between two outlines (0 = touching); 'overlap' when a vertex of one lies inside the other."""
    def inside(pt, pg):
        x, y, n, j = pt[0], pt[1], False, len(pg) - 1
        for i in range(len(pg)):
            (xi, yi), (xj, yj) = pg[i], pg[j]
            if (yi > y) != (yj > y) and x < xi + (y - yi) * (xj - xi) / (yj - yi):
                n = not n
            j = i
        return n
    def seg_d(p, q, r):
        vx, vy, wx, wy = r[0] - q[0], r[1] - q[1], p[0] - q[0], p[1] - q[1]
        t = max(0, min(1, (wx * vx + wy * vy) / ((vx * vx + vy * vy) or 1e-12)))
        return math.hypot(wx - t * vx, wy - t * vy)
    if any(inside(p, b) for p in a[::4]) or any(inside(p, a) for p in b[::4]):
        return 'overlap'
    return round(min(min(seg_d(p, pg[i - 1], pg[i]) for i in range(len(pg))) for pa, pg in ((a, b), (b, a)) for p in pa), 3)


def build(name, mark):
    pts = [p for pc in mark['pieces'] for p in outline(pc)]
    x0, y0 = min(p[0] for p in pts), min(p[1] for p in pts)
    x1, y1 = max(p[0] for p in pts), max(p[1] for p in pts)
    s = max(x1 - x0, y1 - y0)                     # a square frame on the longer side, the ink centred in it
    vb = ' '.join(num(v) for v in (x0 - (s - (x1 - x0)) / 2, y0 - (s - (y1 - y0)) / 2, s, s))
    d = ''.join(subpath(pc) for pc in mark['pieces'])
    note = (f'<!-- {mark["label"]}: a KKACHI sibling mark, built by docs/kkachi/build-marks.py from the ㄱ of the C′1 '
            f'master path ({len(mark["pieces"])} pieces, 90° turns only, the ㄱ unmodified). Colour: currentColor. '
            f'Accessible name: "{mark["label"]}". -->')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" fill="currentColor" role="img" '
            f'aria-label="{mark["label"]}">{note}<title>{mark["label"]}</title>'
            f'<path id="kkachi-{name}" d="{d}"/></svg>\n')


def main():
    for name, mark in MARKS.items():
        ol = [outline(pc) for pc in mark['pieces']]
        gaps = [(i, j, gap(ol[i], ol[j])) for i in range(len(ol)) for j in range(i + 1, len(ol))]
        assert all(g != 'overlap' for *_, g in gaps), f'{name}: pieces overlap {gaps}'
        print(name, 'gaps', ' '.join(f'{i}-{j}:{g}' for i, j, g in gaps))
        if '--check' in sys.argv:
            continue
        svg = build(name, mark)
        os.makedirs(OUT, exist_ok=True)
        with open(os.path.join(OUT, f'kkachi-{name}.svg'), 'w') as fh:
            fh.write(svg)
        print('  ->', f'assets/kkachi/brand/kkachi-{name}.svg', len(svg), 'bytes')


if __name__ == '__main__':
    main()
