# KKACHI web fonts

Self-hosted subsets for the KKACHI v3 pages (`/kkachi/{home,why,notes,waitlist,system,dashboard}/`). No runtime CDN.
Spec: `docs/superpowers/specs/2026-10-02-kkachi-v3-unified-design.md` §3. The `@font-face` rules live in
`assets/kkachi/kk-system.css` §0.

| File | Font | Contents |
|---|---|---|
| `kk-sans.woff2` | Wanted Sans Variable 1.0.3, weight axis cut to 400–900 | every character of the KKACHI pages, the KKACHI specs and `docs/kkachi/font-words.txt`, full printable ASCII, the typographic marks in use (`characters.txt`). Preloaded by every page. |
| `kk-sans-ext.woff2` | the same | the rest of the 2,350 KS X 1001 Hangul syllables. Never preloaded: its `unicode-range` (U+AC00–D7A3, declared before the primary face, so the primary wins wherever it has the glyph) makes the browser fetch it only for a syllable the primary lacks — a name typed into the waitlist form, or copy written before the subset was rebuilt. |
| `kk-mono.woff2` | Fragment Mono 1.011 Regular, unhinted | printable ASCII and the marks code lines use. Code, hex dumps and hashes only — never labels. |
| `characters.txt` | | the primary subset's characters (what `--check` compares against) |

Licences: SIL Open Font License 1.1 — `OFL-WantedSans.txt`, `OFL-FragmentMono.txt`. Neither font declares a Reserved
Font Name, so the subsets keep their family names; every name record (copyright, licence, designer) is kept.

Sources (pinned, verified by SHA256 at build time):
- `https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/variable/WantedSansVariable.ttf`
  — `9953a7cfc4a3cba4ef1242abaf89779b3cd15fd9729c2d67d9e9d37a0da967f5`
- `https://cdn.jsdelivr.net/gh/google/fonts@8db5a9256b34ffad61e53aafeecb4a612faa0080/ofl/fragmentmono/FragmentMono-Regular.ttf`
  — `0fe011f425873c2e0fc73a189e394e340ad48d2b9a99a576bdeec75cee000460`

## Regenerating

After a KKACHI page gains text, from the repository root (fontTools 4.57 with brotli; build time only):

    python3 docs/kkachi/build-fonts.py --check    # lists page characters the primary subset lacks (exit 1 if any)
    python3 docs/kkachi/build-fonts.py            # rebuilds the three files and characters.txt, and rewrites the
                                                  # unicode-range after each /* kk-range:… */ marker in kk-system.css

The script downloads the sources once into `.scratch/fonts-src/`, cuts the weight axis with
`fontTools.varLib.instancer.instantiateVariableFont(font, {"wght": (400, 900)})`, and subsets with

    pyftsubset <font> --text-file=<chars> --flavor=woff2 \
      --layout-features=kern,liga,calt,ccmp,locl,mark,mkmk,tnum,case,frac,numr,dnom,zero \
      --name-IDs='*' --name-languages='*' --name-legacy --notdef-outline [--no-hinting for the mono] --output-file=<out>

Words a page is about to use can go into `docs/kkachi/font-words.txt` first (it is read with the pages).

## Loading (per page head)

    <link rel="preload" href="../../assets/kkachi/fonts/kk-sans.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="../../assets/kkachi/kk-system.css">

Add a second preload for `kk-mono.woff2` only when code shows above the fold. Never preload `kk-sans-ext.woff2`.
`font-display: swap` with size-adjusted fallbacks (kk-system.css §0): Latin on Arial / Helvetica / Liberation Sans
(the same metrics; Wanted Sans advances match them at 400 and 700, so `size-adjust: 100%`), Hangul on Noto Sans CJK KR /
Source Han Sans K (`size-adjust: 93.9%`: Wanted Sans Hangul averages 0.864 em, Noto 0.920 em, measured over the
prototype's text), ascent / descent overrides set to Wanted Sans's own (0.952 / 0.241 em), so the swap re-wraps
nothing and moves nothing. Apple SD Gothic Neo and Malgun Gothic follow unadjusted (their metrics could not be measured
here). Fragment Mono (0.618 em advance) falls back to Menlo / DejaVu Sans Mono / Liberation Mono at 102.8% and to
Consolas at 112.4%.
