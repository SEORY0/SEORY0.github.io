#!/usr/bin/env python3
"""Shared parts of every KKACHI page, written between <!-- part:NAME:start --> / <!-- part:NAME:end -->.

Spec: docs/superpowers/specs/2026-10-03-kkachi-black-ice-design.md §8. Run from anywhere:
    python3 docs/kkachi/build-pages.py
Parts:
    head    colour scheme, share tags, icons, font preloads, the stylesheet and the module (after each page's own title,
            description, canonical and og:title/description/url)
    header  the icon sprite, the skip link, the logo, the menu (Products ▾ · About · Resources · Contact) with the
            current page marked
    footer  Products · Company · Contact, the nacre-inlaid wordmark, the copyright line
Paths are absolute (/assets/…, /kkachi/…), so a page's depth does not matter. The logo and the footer wordmark come
from build-art.py, which keeps only the home page's art blocks.
"""
import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
_spec = importlib.util.spec_from_file_location('build_art', ROOT / 'docs/kkachi/build-art.py')
art = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(art)

PAGES = {   # key → file
    'home': 'kkachi/index.html',
    'keel': 'kkachi/keel/index.html',
    'code': 'kkachi/code/index.html',
    'web': 'kkachi/web/index.html',
    'about': 'kkachi/about/index.html',
    'resources': 'kkachi/resources/index.html',
}
PRODUCTS = [   # key, href, name, descriptor
    ('keel', '/kkachi/keel/', 'Keel', 'Agent harness'),
    ('code', '/kkachi/code/', 'KKACHI Code', 'Source and binary research'),
    ('web', '/kkachi/web/', 'KKACHI Web', 'Live web application testing'),
]
MAIL = 'seory0@outlook.kr'
EARLY = f'mailto:{MAIL}?subject=KKACHI%20early%20access'
MARK = 'M15 3H45V33C42.5 22.75 36 29.75 36 16.5V12H31.5C18.25 12 25.25 5.5 15 3ZM3 15H33V45C30.5 34.75 24 41.75 24 28.5V24H19.5C6.25 24 13.25 17.5 3 15Z'


def favicon(fill):
    svg = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' fill='{fill}'><path d='{MARK}'/></svg>"
    return 'data:image/svg+xml,' + svg.replace('<', '%3C').replace('>', '%3E').replace('#', '%23')


def head():
    return '\n'.join([
        '<meta name="color-scheme" content="dark">',
        '<meta name="theme-color" content="#050506">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="KKACHI">',
        '<meta property="og:image" content="https://SEORY0.github.io/assets/kkachi/og/kkachi-og.png">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<link rel="icon" type="image/svg+xml" href="{favicon("#292623")}">',
        f'<link rel="icon" type="image/svg+xml" media="(prefers-color-scheme: dark)" href="{favicon("#EDF1F5")}">',
        '<link rel="icon" type="image/png" sizes="32x32" href="/assets/kkachi/icons/kk-32.png">',
        '<link rel="apple-touch-icon" href="/assets/kkachi/icons/kk-180.png">',
        '<link rel="preload" href="/assets/kkachi/fonts/newsreader.woff2" as="font" type="font/woff2" crossorigin>',
        '<link rel="preload" href="/assets/kkachi/fonts/big-shoulders.woff2" as="font" type="font/woff2" crossorigin>',
        '<link rel="stylesheet" href="/assets/kkachi/site.css">',
        "<script>document.documentElement.classList.add('js')</script>",
        '<script type="module" src="/assets/kkachi/site.js"></script>',
    ])


def header(page):
    def cur(key):
        return ' aria-current="page"' if key == page else ''

    items = ''.join(f'\n        <a href="{href}"{cur(key)}><span class="mi-name">{name}</span><span class="mi-desc">{desc}</span></a>'
                    for key, href, name, desc in PRODUCTS)
    on_product = ' is-current' if page in {k for k, *_ in PRODUCTS} else ''
    return f'''<svg class="sprite" aria-hidden="true">
  <symbol id="i-info" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 7.1v4.4M8 4.7v.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
  <symbol id="i-chev" viewBox="0 0 12 12"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>
</svg>
<a class="skip" href="#main">Skip to content</a>
<header class="nav">
  <a class="brand" href="/kkachi/" aria-label="KKACHI home"{cur('home')}>{art.logo()}</a>
  <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-main">Menu</button>
  <nav id="nav-main" aria-label="Main">
    <div class="menu">
      <button class="menu-btn{on_product}" type="button" aria-expanded="false" aria-controls="menu-products">Products <svg class="chev" aria-hidden="true"><use href="#i-chev"/></svg></button>
      <div class="menu-panel" id="menu-products">{items}
      </div>
    </div>
    <a href="/kkachi/about/"{cur('about')}>About</a>
    <a href="/kkachi/resources/"{cur('resources')}>Resources</a>
    <a href="#contact">Contact</a>
  </nav>
</header>'''


def footer():
    products = ''.join(f'<li><a href="{href}">{name}</a></li>' for _, href, name, _ in PRODUCTS)
    return f'''<footer id="contact" class="foot">
  <div class="foot-cols">
    <div>
      <h2 class="label">Products</h2>
      <ul>{products}</ul>
    </div>
    <div>
      <h2 class="label">Company</h2>
      <ul><li><a href="/kkachi/about/">About</a></li><li><a href="/kkachi/resources/">Resources</a></li></ul>
    </div>
    <div>
      <h2 class="label">Contact</h2>
      <ul><li><a href="mailto:{MAIL}">{MAIL}</a></li><li><a href="{EARLY}">Early access</a></li></ul>
    </div>
  </div>
  <div class="foot-mark">
{art.foot()}
  </div>
  <p class="fine">© 2026 Project KKACHI.</p>
</footer>'''


def main():
    for page, rel in PAGES.items():
        path = ROOT / rel
        html = path.read_text()
        for name, body in (('head', head()), ('header', header(page)), ('footer', footer())):
            pat = re.compile(rf'(<!-- part:{name}:start -->\n).*?(<!-- part:{name}:end -->)', re.S)
            if not pat.search(html):
                raise SystemExit(f'marker part:{name} not found in {rel}')
            html = pat.sub(lambda m: m.group(1) + body + '\n' + m.group(2), html)
        path.write_text(html)
        print(f'{rel}: parts written')


if __name__ == '__main__':
    main()
