#!/usr/bin/env python3
"""KKACHI wordmark: the ㄲ mark (the C′1 master path, unmodified) + 'ACHI' outlined from Wanted Sans at weight 900.
v3 spec §2; reference .scratch/v3/ref-wordmark.png. Build time only.

    python3 docs/kkachi/build-wordmark.py     # writes assets/kkachi/brand/kkachi-wordmark.svg and kkachi-mark.svg

Geometry (all in the mark's own units, so the mark keeps its path data and only moves by translate(-3 -3)):
  cap height = the mark's ink box = 42      the mark's top and bottom sit on the cap line and the baseline
  mark → A   = 0.12 cap (ink to ink)        the reference measures 0.14, the spec asks about 0.1: A's foot is the
                                            nearest point, so the optical gap reads as the reference's
  A → C, C → H, H → I = 0.045, 0.115, 0.145 cap (ink to ink): tight, about 0.02 cap under the font's own spacing for
                                            C–H and H–I; A–C opened from the font's kerned 0.011 (A's foot met the C)
The viewBox is the ink box: x 0 … the I's right edge, y −0.81 … 42.81 (the C's overshoot), so a box of height h shows the
cap height at h × 42 / 43.62. Needs the cut font from build-fonts.py (.scratch/fonts-src/WantedSans-400-900.ttf).
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CUT = os.path.join(ROOT, '.scratch', 'fonts-src', 'WantedSans-400-900.ttf')
OUT = os.path.join(ROOT, 'assets', 'kkachi', 'brand')
MARK = ('M15 3H45V33C42.5 22.75 36 29.75 36 16.5V12H31.5C18.25 12 25.25 5.5 15 3Z'
        'M3 15H33V45C30.5 34.75 24 41.75 24 28.5V24H19.5C6.25 24 13.25 17.5 3 15Z')
CAP = 42.0
WEIGHT = 900
MARK_GAP = 0.12
GAPS = (0.045, 0.115, 0.145)


def num(v):
    s = '%.2f' % v
    s = s.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def letters():
    font = instancer.instantiateVariableFont(TTFont(CUT), {'wght': WEIGHT})
    cm, gs = font.getBestCmap(), font.getGlyphSet()
    k = CAP / font['OS/2'].sCapHeight
    x, d, top, bot = CAP + MARK_GAP * CAP, [], 0.0, CAP
    for i, ch in enumerate('ACHI'):
        g = gs[cm[ord(ch)]]
        bp = BoundsPen(gs)
        g.draw(bp)
        x0, y0, x1, y1 = bp.bounds
        if i:
            x += GAPS[i - 1] * CAP
        rec = DecomposingRecordingPen(gs)
        g.draw(rec)
        sp = SVGPathPen(gs, ntos=num)
        rec.replay(TransformPen(sp, (k, 0, 0, -k, x - x0 * k, CAP)))   # y up → y down, baseline at y = 42
        d.append(sp.getCommands())
        top, bot = min(top, CAP - y1 * k), max(bot, CAP - y0 * k)
        x += (x1 - x0) * k
    return ''.join(d), x, top, bot


def main():
    d, right, top, bot = letters()
    vb = f'0 {num(top)} {num(right)} {num(bot - top)}'
    note = ('<!-- KKACHI wordmark (v3 spec §2; built by docs/kkachi/build-wordmark.py). The ㄲ is the C′1 master path, '
            'unmodified; never rotate, tilt or badge it. Colour: currentColor (inline SVG or <use> inherits the text '
            'colour; as <img> it is black). Accessible name: "KKACHI" (an <img> needs alt="KKACHI"; inline in a link, '
            'name the link and hide the svg). Clear space: 0.5 cap height (21 units) on every side. Smallest size: '
            'cap height 12px (box height 12.5px). #kk-wm-k: the mark, #kk-wm-achi: the letters. -->')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" fill="currentColor" role="img" aria-label="KKACHI">'
           f'{note}<title>KKACHI</title><g id="kkachi-wordmark"><path id="kk-wm-k" transform="translate(-3 -3)" d="{MARK}"/>'
           f'<path id="kk-wm-achi" d="{d}"/></g></svg>\n')
    mark = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="3 3 42 42" fill="currentColor" role="img" aria-label="KKACHI">'
            '<!-- the ㄲ mark alone (C′1 master path, unmodified). Same rules as kkachi-wordmark.svg. -->'
            f'<title>KKACHI</title><path id="kkachi-mark" d="{MARK}"/></svg>\n')
    os.makedirs(OUT, exist_ok=True)
    open(os.path.join(OUT, 'kkachi-wordmark.svg'), 'w').write(svg)
    open(os.path.join(OUT, 'kkachi-mark.svg'), 'w').write(mark)
    print('viewBox', vb, 'aspect %.4f' % (right / (bot - top)), len(svg), 'bytes')
    print('letters d (for inline use):', len(d), 'chars')


if __name__ == '__main__':
    main()
