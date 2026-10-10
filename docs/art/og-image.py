#!/usr/bin/env python3
"""The site's share preview (Open Graph / Twitter card), 1200 x 630.

    python docs/art/og-image.py      # writes assets/images/og-crt-cat.png

Black, with two things on it: the SEORY0 banner from the home page and the
cat on the CRT in its dark-theme drawing (assets/avatars/
crt-cat-photo-dark.txt), both in Server Mono. Each is drawn at a size where
the glyph advance is a whole number of pixels, so the banner's blocks join
without seams, then scaled into place.
"""
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / 'assets/fonts/server-mono/ServerMono-Regular.woff2'
CAT = ROOT / 'assets/avatars/crt-cat-photo-dark.txt'
HOME = ROOT / '_layouts/home.html'
OUT = ROOT / 'assets/images/og-crt-cat.png'

W, H = 1200, 630
PAPER, INK = 12, 232                     # the site's dark theme


def render(lines, px, line_height):
    """Light text on black at an integer advance; returns an L image."""
    f = ImageFont.truetype(str(FONT), px)
    adv = round(f.getlength('M'))
    asc, desc = f.getmetrics()
    step = round(px * line_height)
    top = (step - (asc + desc)) // 2
    cols = max(map(len, lines))
    im = Image.new('L', (cols * adv, len(lines) * step), PAPER)
    d = ImageDraw.Draw(im)
    for r, ln in enumerate(lines):
        for c, ch in enumerate(ln):
            if ch != ' ':
                d.text((c * adv, r * step + top), ch, font=f, fill=INK)
    return im


def main():
    banner = re.search(r'<pre class="banner"[^>]*>(.*?)</pre>', HOME.read_text(encoding='utf-8'), re.S)
    banner = [l.rstrip() for l in banner.group(1).replace('\r', '').split('\n') if l.strip()]
    cat = CAT.read_text(encoding='ascii').rstrip('\n').split('\n')

    big_banner = render(banner, 80, 1.0)       # advance 50px, rows 80px
    big_cat = render(cat, 32, 1.1)             # advance 20px, rows 35px

    card = Image.new('L', (W, H), PAPER)
    margin = 64
    cat_h = H - 2 * 48
    cat_w = round(big_cat.width * cat_h / big_cat.height)
    cat_img = big_cat.resize((cat_w, cat_h), Image.LANCZOS)
    cat_x = W - margin - cat_w
    card.paste(cat_img, (cat_x, (H - cat_h) // 2))

    gap = 56
    ban_w = cat_x - gap - margin
    ban_h = round(big_banner.height * ban_w / big_banner.width)
    ban_img = big_banner.resize((ban_w, ban_h), Image.LANCZOS)
    card.paste(ban_img, (margin, (H - ban_h) // 2))

    card.save(OUT, optimize=True)
    print(f'{OUT.relative_to(ROOT)}: {W} x {H}, {OUT.stat().st_size // 1024} kB')


if __name__ == '__main__':
    main()
