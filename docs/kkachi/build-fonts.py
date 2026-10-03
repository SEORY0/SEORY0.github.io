#!/usr/bin/env python3
"""KKACHI web fonts: build the self-hosted subsets in assets/kkachi/fonts/ (build time only; nothing runs on the site).

    python3 docs/kkachi/build-fonts.py            # build kk-sans.woff2, kk-sans-ext.woff2, kk-mono.woff2 and update
                                                  # the unicode-range lines in assets/kkachi/kk-system.css
    python3 docs/kkachi/build-fonts.py --check    # build nothing: list page characters the primary subset lacks

Run it from the repository root after a KKACHI page gains text (the --check run says when). Needs fontTools 4.57
(pip install 'fonttools[woff]==4.57.0' brotli). Sources are downloaded once into .scratch/fonts-src/ and verified by
SHA256; a changed upstream file stops the build.

Outputs
  kk-sans.woff2      Wanted Sans Variable 1.0.3, weight axis cut to 400–900 (fontTools varLib.instancer), subset to every
                     character of the KKACHI pages (kkachi/**/*.html and *.svg), the shared modules that print text
                     (assets/kkachi/dash-data.js, kk-app.js, kk-system.js), the KKACHI specs, docs/kkachi/font-words.txt,
                     the full printable ASCII and the punctuation below. Preloaded by every page.
  kk-sans-ext.woff2  the same font, the rest of the 2,350 KS X 1001 Hangul syllables. Never preloaded: its unicode-range
                     makes the browser fetch it only when a page shows a syllable the primary lacks (a name typed into
                     the waitlist form, new copy before this script is run again).
  kk-mono.woff2      Fragment Mono 1.011 Regular, unhinted: printable ASCII and the marks code lines use (code, hex, hashes).
  characters.txt     the primary subset's characters (what --check compares against).
The fonts keep every name record (copyright, licence, designer; neither font has a Reserved Font Name, so no rename).
"""
import glob
import hashlib
import os
import re
import subprocess
import sys
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'kkachi', 'fonts')
CACHE = os.path.join(ROOT, '.scratch', 'fonts-src')
CSS = os.path.join(ROOT, 'assets', 'kkachi', 'kk-system.css')

SOURCES = {
    'WantedSansVariable.ttf': (
        'https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/variable/WantedSansVariable.ttf',
        '9953a7cfc4a3cba4ef1242abaf89779b3cd15fd9729c2d67d9e9d37a0da967f5'),
    'FragmentMono-Regular.ttf': (
        'https://cdn.jsdelivr.net/gh/google/fonts@8db5a9256b34ffad61e53aafeecb4a612faa0080/ofl/fragmentmono/FragmentMono-Regular.ttf',
        '0fe011f425873c2e0fc73a189e394e340ad48d2b9a99a576bdeec75cee000460'),
}

# typographic marks the pages use or may use (those the font lacks are dropped by the subsetter and fall through)
PUNCT = (' §©®°±·×÷¶–—‘’‚“”„…′″•‹›«»€₩£¥¢™※←↑→↓↔↕↗↘↙↖↩↪⇄−≈≠≤≥∞√%‰'
         '✓✔✗✕■□▪▫●○◆◇▲△▼▽▶▷◀◁「」『』〈〉《》【】ㄱㄲ①②③④⑤')
MONO_EXTRA = '–—‘’“”…·×−→←↑↓↔✓•≤≥≠≈°±§©'
FEATURES = 'kern,liga,calt,ccmp,locl,mark,mkmk,tnum,case,frac,numr,dnom,zero'


def fetch(name):
    url, sha = SOURCES[name]
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        print('download', url)
        urllib.request.urlretrieve(url, path)
    got = hashlib.sha256(open(path, 'rb').read()).hexdigest()
    if got != sha:
        sys.exit(f'{name}: SHA256 {got} is not the pinned {sha}; check the source before building')
    return path


def page_chars():
    files = sorted(set(
        glob.glob(os.path.join(ROOT, 'kkachi', '**', '*.html'), recursive=True)
        + glob.glob(os.path.join(ROOT, 'kkachi', '**', '*.svg'), recursive=True)
        + glob.glob(os.path.join(ROOT, 'docs', 'superpowers', 'specs', '*kkachi*.md'))
        + [os.path.join(ROOT, 'docs', 'kkachi', 'font-words.txt')]
        + [os.path.join(ROOT, 'assets', 'kkachi', f) for f in ('dash-data.js', 'kk-app.js', 'kk-system.js')]))
    chars = set()
    for f in files:
        chars |= set(open(f, encoding='utf-8').read())
    return chars, files


def ks_x_1001():
    out = set()
    for u in range(0xAC00, 0xD7A4):
        b = chr(u).encode('euc-kr', errors='ignore')
        if len(b) == 2 and 0xB0 <= b[0] <= 0xC8:
            out.add(chr(u))
    return out


def ranges(cps):
    cps = sorted(cps)
    out, i = [], 0
    while i < len(cps):
        j = i
        while j + 1 < len(cps) and cps[j + 1] == cps[j] + 1:
            j += 1
        out.append('U+%X' % cps[i] if i == j else 'U+%X-%X' % (cps[i], cps[j]))
        i = j + 1
    return ','.join(out)


def subset(src, text, out, *extra):
    tf = out + '.txt'
    open(tf, 'w', encoding='utf-8').write(text)
    subprocess.run(['pyftsubset', src, f'--text-file={tf}', '--flavor=woff2', f'--layout-features={FEATURES}',
                    "--name-IDs=*", "--name-languages=*", '--name-legacy', '--notdef-outline', *extra,
                    f'--output-file={out}'], check=True)
    os.remove(tf)


def cmap(path):
    from fontTools.ttLib import TTFont
    return set(TTFont(path).getBestCmap())


def main():
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer

    chars, files = page_chars()
    ascii_ = {chr(c) for c in range(0x20, 0x7F)}
    want = {c for c in chars if ord(c) >= 0x20} | ascii_ | set(PUNCT)

    if '--check' in sys.argv:
        have = set(open(os.path.join(OUT, 'characters.txt'), encoding='utf-8').read())
        ws = TTFont(fetch('WantedSansVariable.ttf')).getBestCmap()
        miss = sorted(c for c in want - have if ord(c) in ws and c not in '\n\r\t')
        print(f'{len(files)} files; {len(miss)} characters the primary subset lacks:', ''.join(miss))
        sys.exit(1 if miss else 0)

    ws_src = fetch('WantedSansVariable.ttf')
    fm_src = fetch('FragmentMono-Regular.ttf')
    cut = os.path.join(CACHE, 'WantedSans-400-900.ttf')
    if not os.path.exists(cut) or os.path.getmtime(cut) < os.path.getmtime(ws_src):
        print('instancer: wght 400–900')
        instancer.instantiateVariableFont(TTFont(ws_src), {'wght': (400, 900)}).save(cut)

    ws_cmap = set(TTFont(cut).getBestCmap())
    primary = sorted(c for c in want if ord(c) in ws_cmap)
    subset(cut, ''.join(primary), os.path.join(OUT, 'kk-sans.woff2'))
    prim_cps = cmap(os.path.join(OUT, 'kk-sans.woff2'))
    ext = sorted(c for c in ks_x_1001() if ord(c) not in prim_cps)
    subset(cut, ''.join(ext), os.path.join(OUT, 'kk-sans-ext.woff2'))
    mono = sorted(ascii_ | {'\u00a0'} | set(MONO_EXTRA))
    subset(fm_src, ''.join(mono), os.path.join(OUT, 'kk-mono.woff2'), '--no-hinting')   # (TrueType hints: half the file)
    open(os.path.join(OUT, 'characters.txt'), 'w', encoding='utf-8').write(
        ''.join(chr(c) for c in sorted(prim_cps)) + '\n')

    # the unicode-range of each face = its own cmap, written into kk-system.css between the markers
    mono_cps = cmap(os.path.join(OUT, 'kk-mono.woff2'))
    css = open(CSS, encoding='utf-8').read()
    # (the ext face: the whole Hangul block, declared before the primary; the later face wins where both cover a
    # character, so only syllables the primary lacks reach it — a short line instead of 1,600 code points)
    for key, rng in (('sans', ranges(prim_cps)), ('sans-ext', 'U+AC00-D7A3'), ('mono', ranges(mono_cps))):
        css, n = re.subn(r'(/\* kk-range:%s \*/)[^;]*;' % re.escape(key), r'\1unicode-range:%s;' % rng, css)
        if n != 1:
            sys.exit(f'kk-system.css: marker /* kk-range:{key} */ not found exactly once')
    open(CSS, 'w', encoding='utf-8').write(css)

    for n in ('kk-sans.woff2', 'kk-sans-ext.woff2', 'kk-mono.woff2'):
        p = os.path.join(OUT, n)
        print(f'{n}: {os.path.getsize(p)} bytes, {len(cmap(p))} characters, sha256 '
              + hashlib.sha256(open(p, 'rb').read()).hexdigest())


if __name__ == '__main__':
    main()
