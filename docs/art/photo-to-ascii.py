#!/usr/bin/env python3
"""The home's cat-on-CRT, from a photograph to two tonal ASCII drawings.

    python docs/art/photo-to-ascii.py            # writes both variants
    python docs/art/sync-home-ascii.py           # copies them into the page

Source: docs/art/cat-crt-photo.png (320 x 427). Steps:

1. Cut out the cat and the monitor with a hand-traced polygon; the wall,
   desk and shelf go (the monitor's shaded side is the wall's colour, so a
   colour key cannot separate them).
2. Tone-map by region. For the light page the monitor is pushed towards
   white so only its edges and the darker glass remain, and the cat gets
   its own range plus strong local contrast so fur and face read. For the
   dark page the photo's own tones are kept and inverted: the bezel glows,
   the glass and the cat sit low.
3. Quantise to a tone ramp measured from Server Mono's own glyphs, with a
   little Floyd-Steinberg diffusion so gradients do not band.

Output: assets/avatars/crt-cat-photo-light.txt and -dark.txt, 90 columns,
cells of 0.625em x 1.1em. Server Mono has no caret, so none is used.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
PHOTO = ROOT / 'docs/art/cat-crt-photo.png'
FONT = ROOT / 'assets/fonts/server-mono/ServerMono-Regular.woff2'
OUT = ROOT / 'assets/avatars'
COLS = 90
ASPECT = 1.1 / 0.625                       # cell height / width
RAMP = " .-:;=+*oa#%&$@"                   # light to dark; densities measured below

SUBJECT = [(84, 205), (85, 190), (86, 170), (90, 152), (98, 140), (110, 130), (125, 124), (140, 123),
           (155, 126), (168, 129), (174, 128), (177, 115), (182, 118), (190, 124), (205, 120),
           (215, 117), (229, 110), (233, 116), (236, 130), (238, 145), (236, 160), (232, 172),
           (232, 190), (236, 200), (240, 207), (241, 212), (292, 217), (296, 220), (296, 312),
           (226, 388), (197, 404), (188, 407), (160, 410), (135, 404), (123, 393), (120, 368),
           (83, 349), (82, 210)]
CAT = SUBJECT[:26] + [(84, 212)]
GLASS = [(92, 222), (176, 236), (178, 357), (94, 330)]


def polygon_mask(size, poly, blur):
    w, h = size
    m = Image.new('L', (w * 4, h * 4), 0)
    ImageDraw.Draw(m).polygon([(x * 4, y * 4) for x, y in poly], fill=255)
    m = m.resize(size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(m, np.float32) / 255


def blurred(a, radius):
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(radius)), np.float32) / 255


def stretch(g, region):
    lo, hi = np.percentile(g[region], [2, 99.5])
    return np.clip((g - lo) / (hi - lo), 0, 1)


def tone_maps():
    photo = Image.open(PHOTO).convert('RGB')
    size = photo.size
    alpha = polygon_mask(size, SUBJECT, 0.6)
    cat = polygon_mask(size, CAT, 1.2)
    glass = polygon_mask(size, GLASS, 1.0)
    g = np.asarray(ImageOps.grayscale(photo), np.float32) / 255

    # light page: lightness of the drawing, 1 = paper
    gc = stretch(g, cat > 0.5)
    b = blurred(gc, 6)
    gc = np.clip(0.62 + (gc - b) * 2.6 + (b - 0.5) * 0.7, 0, 1)
    mon = (alpha > 0.5) & (cat < 0.5)
    gm = stretch(g, mon)
    b = blurred(gm, 3)
    gm = np.clip(0.86 + (gm - b) * 2.4 + (b - 0.5) * 0.18, 0, 1) - glass * 0.22
    light = np.clip(gc * cat + gm * (1 - cat), 0, 1)
    light_ink = (1 - light) ** 1.15 * alpha

    # dark page: light parts drawn densest; the monitor keeps the photo's
    # tones, the cat gets its own range so its fur glows like the bezel
    d = stretch(g, mon) ** 1.4
    dc = stretch(g, cat > 0.5)
    b = blurred(dc, 6)
    dc = np.clip(0.5 + (dc - b) * 2.0 + (b - 0.5) * 0.9, 0, 1) ** 1.1
    dark_ink = (dc * cat + d * (1 - cat)) * alpha
    return light_ink, dark_ink, alpha


def ramp_levels():
    font = ImageFont.truetype(str(FONT), 40)
    asc, desc = font.getmetrics()
    top = (44 - (asc + desc)) / 2
    dens = {}
    for c in RAMP.strip():
        im = Image.new('L', (25, 44), 255)
        ImageDraw.Draw(im).text((0, top), c, font=font, fill=0)
        dens[c] = float((1 - np.asarray(im, np.float32) / 255).mean())
    top_d = max(dens.values())
    return [' '] + list(RAMP.strip()), np.array([0.0] + [dens[c] / top_d for c in RAMP.strip()])


def to_cells(ink, alpha):
    ys, xs = np.nonzero(alpha > 0.03)
    ink = ink[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = ink.shape
    rows = round(COLS * h / w / ASPECT)
    im = Image.fromarray((ink * 255).astype(np.uint8)).resize((COLS * 4, rows * 7), Image.LANCZOS)
    a = np.asarray(im, np.float32) / 255
    return a.reshape(rows, 7, COLS, 4).mean(axis=(1, 3))


def quantise(cells, chars, levels, diffuse):
    v = cells.astype(np.float64).copy()
    rows, cols = v.shape
    lines = []
    for r in range(rows):
        line = []
        for c in range(cols):
            k = 0 if cells[r, c] < 0.01 else int(np.abs(levels - v[r, c]).argmin())
            line.append(chars[k])
            e = (v[r, c] - levels[k]) * diffuse
            if c + 1 < cols:
                v[r, c + 1] += e * 7 / 16
            if r + 1 < rows:
                if c:
                    v[r + 1, c - 1] += e * 3 / 16
                v[r + 1, c] += e * 5 / 16
                if c + 1 < cols:
                    v[r + 1, c + 1] += e / 16
        lines.append(''.join(line).rstrip())
    while lines and not lines[-1]:
        lines.pop()
    while lines and not lines[0]:
        lines.pop(0)
    return '\n'.join(lines) + '\n'


def despeckle(art, max_size):
    """Drop small clusters of glyphs that float free of the drawing (bits of
    the cut-out's edge), keeping the largest connected shape whole."""
    rows = art.rstrip('\n').split('\n')
    w = max(map(len, rows))
    g = [list(r.ljust(w)) for r in rows]
    seen = [[False] * w for _ in g]
    comps = []
    for r0 in range(len(g)):
        for c0 in range(w):
            if g[r0][c0] == ' ' or seen[r0][c0]:
                continue
            stack, cells = [(r0, c0)], []
            seen[r0][c0] = True
            while stack:
                y, x = stack.pop()
                cells.append((y, x))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < len(g) and 0 <= xx < w and not seen[yy][xx] and g[yy][xx] != ' ':
                            seen[yy][xx] = True
                            stack.append((yy, xx))
            comps.append(cells)
    comps.sort(key=len, reverse=True)
    for cells in comps[1:]:
        if len(cells) <= max_size:
            for y, x in cells:
                g[y][x] = ' '
    return '\n'.join(''.join(r).rstrip() for r in g) + '\n'


def main():
    light_ink, dark_ink, alpha = tone_maps()
    chars, levels = ramp_levels()
    for name, ink, diffuse in (('light', light_ink, 0.25), ('dark', dark_ink, 0.3)):
        art = despeckle(quantise(to_cells(ink, alpha), chars, levels, diffuse), 4)
        assert art.isascii() and '^' not in art
        path = OUT / f'crt-cat-photo-{name}.txt'
        path.write_text(art, encoding='ascii', newline='\n')
        print(f'{path.relative_to(ROOT)}: {COLS} x {art.count(chr(10))}')


if __name__ == '__main__':
    main()
