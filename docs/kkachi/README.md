# KKACHI build-time sources (not published: Jekyll excludes `docs/`)

Everything here regenerates a committed KKACHI asset. Nothing runs on the site. Specs:
`docs/superpowers/specs/2026-10-02-kkachi-v4-symbol-system-design.md` (v4: symbols, lines, lights-out colour, nacre) on top of
`docs/superpowers/specs/2026-10-02-kkachi-v3-unified-design.md`.

| File | Makes | Command (repository root) |
|---|---|---|
| `build-fonts.py` | `assets/kkachi/fonts/kk-sans.woff2`, `kk-sans-ext.woff2`, `kk-mono.woff2`, `characters.txt`, and the `unicode-range` lines in `assets/kkachi/kk-system.css` | `python3 docs/kkachi/build-fonts.py` (`--check` lists missing characters) |
| `font-words.txt` | words the subset should hold before a page uses them | read by `build-fonts.py` |
| `build-wordmark.py` | `assets/kkachi/brand/kkachi-wordmark.svg` and `kkachi-mark.svg` | `python3 docs/kkachi/build-wordmark.py` (needs the cut font from `build-fonts.py`) |
| `build-marks.py` | the sibling marks `assets/kkachi/brand/kkachi-shield-foundry.svg` and `kkachi-talon.svg` | `python3 docs/kkachi/build-marks.py` (`--check` prints the gaps between pieces) |
| `template.html` | a new dark marketing page (v4: lead hero, session line, input → output, trust bar, matrix, gate ledger, funnel, evidence rows): copy it to `kkachi/<slug>/index.html` and replace every `[[…]]` (head order, bar, CTA, end tiles, footer, scripts; how a page adds its own CSS and JS). Working copy: `.scratch/v4/template-site.html` | — |
| `template-app.html` | a dashboard page (v4 shell: nav, two-row app bar with search, time control, agent capsule, sample chip, theme, autonomy strip; a table filled from `assets/kkachi/dash-data.js`): copy it to `kkachi/dashboard/<slug>/index.html` | — |
| `build-symbols.py` | `assets/kkachi/symbols.svg` (the v4 symbol sprite), the symbol registry block of `kkachi/system/index.html`, and the 16 / 32 px legibility sheet `.scratch/v4/system/legibility.html` | `python3 docs/kkachi/build-symbols.py` |
| `og.html`, `build-og.mjs` | `assets/kkachi/og/kkachi-og.png` (1200 × 630) | serve the root on :8765, then `PLAYWRIGHT=…/playwright/index.mjs node docs/kkachi/build-og.mjs` |

Details: `assets/kkachi/fonts/README.md` (fonts, fallbacks, loading) and the header of each script.

## The wordmark

The ㄲ mark is the C′1 master path, unmodified (`M15 3H45V33C42.5 …Z`, viewBox `3 3 42 42`); it only moves by
`translate(-3 -3)`. "ACHI" is outlined from Wanted Sans at weight 900. Cap height = the mark's ink box (42 units); the
mark's top and bottom sit on the cap line and the baseline. Mark → A: 0.12 cap height, ink to ink (the reference
image measures 0.144 and the spec asks about 0.1; A's foot is the nearest point, so 0.12 reads like the reference).
A → C, C → H, H → I: 0.045, 0.115, 0.145 cap height. The comparison with `.scratch/v3/ref-wordmark.png` is
`.scratch/v3/wordmark-compare.png`.

Note on weight: the reference's stems are about 0.226 of its cap height — Wanted Sans at about 780, and the ㄲ's own
bars are 0.214. The spec and the brief ask for 900 (stems 0.26), so the letters are a little heavier than the mark's
bars; `WEIGHT` in `build-wordmark.py` is the one number to change if that should match the reference more closely.

## Sibling marks

Shield Foundry, Talon and the marks that follow are built only from the ㄱ of the C′1 master path. Each piece keeps its
shape and size and only turns in 90° steps and moves; neighbouring pieces keep the ㄲ's gap of 3. The ㄲ is the pieces
`(0, 45, 3)` + `(0, 33, 15)`. Rebuilding it with this script gives the master path byte for byte, which checks the
construction. To add a mark, add an entry to `MARKS` in `build-marks.py` (each piece is `(turn, x, y)`, with the ㄱ's
outer corner at `(x, y)`).

- **Shield Foundry** (4 pieces): the cross (`kkachi/drafts/d-cross-spaced.svg`, corners in) reversed, with the corners
  out. Each ㄱ keeps its cross cell and turns 180° in it, so the 63 box and the gap of 3 (at the side midpoints) stay the
  cross's. The inside forms a four-pointed star.
- **Talon** (3 pieces): three ㄱ as written, hanging like claws. The ㄲ is two ㄱ, and Talon is three. The drop is
  the ㄲ's 12 and the stride is 16.5, so the ink is 63 wide and fills the same 63 square as the shield.
