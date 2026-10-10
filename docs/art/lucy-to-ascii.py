#!/usr/bin/env python3
"""Lucy (Cyberpunk: Edgerunners key visual) as tonal ASCII, one drawing per theme.

    python -P docs/art/lucy-to-ascii.py <key-visual.jpg> [--preview dir]
    python docs/art/sync-home-ascii.py

The source is the series' Lucy key visual (Studio Trigger / CD PROJEKT RED /
Netflix), 768 x 1138, as published at
https://static.animecorner.me/2022/08/cyberpunk-edgerunners-768x1138.jpg;
it is not kept in the repository.

Crops her head and shoulders (no logo), then:
- dark page: the picture's own lightness, light glyphs on black, so her
  white hair glows and the neon city behind her dims to sparks;
- light page: the blue city keyed out (it would read as a solid block of
  dark glyphs) and her lightness inverted, with local contrast for the
  line work of the face and hair.
Writes assets/avatars/lucy-light.txt and lucy-dark.txt, 90 columns, cells
of 0.625em x 1.1em, using the same Server Mono ramp as the cat.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / 'assets/fonts/server-mono/ServerMono-Regular.woff2'
OUT = ROOT / 'assets/avatars'
COLS = 90
ASPECT = 1.1 / 0.625
RAMP = " .-:;=+*oa#%&$@"
import importlib.util as _iu
_spec = _iu.spec_from_file_location('photo_to_ascii', Path(__file__).with_name('photo-to-ascii.py'))
_pta = _iu.module_from_spec(_spec); _spec.loader.exec_module(_pta)
despeckle = _pta.despeckle                  # shared with the cat

CROP = (40, 10, 740, 982)                  # head to chest: 71 rows, as tall as the cat
LOGO = (0, 835, 768, 1015)                 # the CYBERPUNK / EDGERUNNERS lettering, painted out


def remove_logo(im):
    """Fill the logo's neon green, yellow and black strokes from their
    surroundings (repeated blurring into the gap), so the crop can run down
    past it and show her outfit instead of lettering."""
    rgb = np.asarray(im, np.float32) / 255
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    green = (g > r + 0.15) & (g > b + 0.05)
    yellow = (r > 0.55) & (g > 0.55) & (b < 0.35)
    ink = lum < 0.13
    hole = np.zeros(lum.shape, bool)
    x0, y0, x1, y1 = LOGO
    hole[y0:y1, x0:x1] = (green | yellow | ink)[y0:y1, x0:x1]
    hole = np.asarray(Image.fromarray(hole.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(7)), bool)
    known = (~hole).astype(np.float64)
    base = np.where(hole[..., None], 0.0, rgb)
    out = rgb.astype(np.float64).copy()
    done = ~hole
    for radius in (3, 6, 12, 24, 48, 96):             # nearest colour that is not lettering
        den = box_blur(known, radius)
        num = np.stack([box_blur(base[..., k] * known, radius) for k in range(3)], -1)
        take = ~done & (den > 0.08)
        out[take] = num[take] / den[take][:, None]
        done |= take
    soft = np.stack([box_blur(out[..., k], 4) for k in range(3)], -1)
    out[hole] = soft[hole]                              # no seams inside the fill
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))


def box_blur(a, r):
    """Mean over a (2r+1)^2 window, edges clamped; two passes look Gaussian enough."""
    for _ in range(2):
        p = np.pad(a, r, mode='edge')
        c = p.cumsum(0).cumsum(1)
        c = np.pad(c, ((1, 0), (1, 0)))
        n = 2 * r + 1
        a = (c[n:, n:] - c[:-n, n:] - c[n:, :-n] + c[:-n, :-n]) / (n * n)
    return a


def blurred(a, r):
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r)), np.float32) / 255


def maps(path):
    im = remove_logo(Image.open(path).convert('RGB')).crop(CROP)
    rgb = np.asarray(im, np.float32) / 255
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = np.asarray(ImageOps.grayscale(im), np.float32) / 255
    # the city: dark and blue-violet; her hair and skin are light, the
    # outlines inside them are short and get closed over
    city = (lum < 0.42) & (b > r * 0.9) & (b > g * 1.15)
    keep = Image.fromarray(((~city) * 255).astype(np.uint8))
    keep = keep.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))   # drop specks
    keep = keep.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))   # close outlines
    # background only where it reaches the frame: enclosed dark bits (eyes,
    # lashes, the line work) stay part of her
    keep = keep.point(lambda v: 255 if v > 127 else 0)
    w, h = keep.size
    for seed in [(x, 0) for x in range(0, w, 8)] + [(0, y) for y in range(0, h, 8)] + \
                [(w - 1, y) for y in range(0, h, 8)]:
        if keep.getpixel(seed) == 0:
            ImageDraw.floodfill(keep, seed, 128)
    keep = keep.point(lambda v: 0 if v == 128 else 255)
    keep = keep.filter(ImageFilter.GaussianBlur(2))
    alpha = np.asarray(keep, np.float32) / 255
    # light page: darkness straight, so outlines and eyes come out densest
    b3 = blurred(lum, 3)
    sharp = np.clip(lum + (lum - b3) * 1.2, 0, 1)
    light_ink = ((1 - sharp) ** 1.5) * alpha
    # dark page
    dark_ink = np.clip(lum, 0, 1) ** 1.35
    dark_ink = dark_ink * (0.35 + 0.65 * alpha)          # the city sits back
    return light_ink, dark_ink, alpha, im


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


def to_cells(ink):
    h, w = ink.shape
    rows = round(COLS * h / w / ASPECT)
    im = Image.fromarray((np.clip(ink, 0, 1) * 255).astype(np.uint8)).resize((COLS * 4, rows * 7), Image.LANCZOS)
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
    return '\n'.join(lines) + '\n'


def main():
    path = sys.argv[1]
    light_ink, dark_ink, alpha, im = maps(path)
    if '--preview' in sys.argv:
        d = Path(sys.argv[sys.argv.index('--preview') + 1])
        Image.fromarray(((1 - light_ink) * 255).astype(np.uint8)).save(d / 'lucy_light_src.png')
        Image.fromarray((dark_ink * 255).astype(np.uint8)).save(d / 'lucy_dark_src.png')
        Image.fromarray((alpha * 255).astype(np.uint8)).save(d / 'lucy_alpha.png')
    chars, levels = ramp_levels()
    # light: specks left by the keyed-out city go; dark: the city's sparks stay
    for name, ink, diffuse, speck in (('light', light_ink, 0.25, 10), ('dark', dark_ink, 0.3, 0)):
        art = quantise(to_cells(ink), chars, levels, diffuse)
        if speck:
            art = despeckle(art, speck)
        assert art.isascii() and '^' not in art
        (OUT / f'lucy-{name}.txt').write_text(art, encoding='ascii', newline='\n')
        print(f'lucy-{name}.txt: {COLS} x {art.count(chr(10))}')


if __name__ == '__main__':
    main()
