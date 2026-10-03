# KKACHI build-time sources (not published: Jekyll excludes `docs/`)

Everything here regenerates or checks a committed KKACHI asset. Nothing runs on the site. Spec:
`docs/superpowers/specs/2026-10-03-kkachi-black-ice-design.md` (the one-page "Black ICE" site at `/kkachi/`).
Earlier concepts (v1–v4) were removed; their last state is commit `171fe6d`.

Serve the repository root first (`python3 -m http.server 8765 --bind 127.0.0.1`). Playwright scripts take
`PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs`.

| File | Makes / checks | Command (repository root) |
|---|---|---|
| `build-art.py` | the SVG inlined in `kkachi/index.html` between `<!-- art:NAME:start/end -->` (the hero wordmark's bevel, the two Static panels, the cyberdeck, the footer wordmark) | `python3 docs/kkachi/build-art.py` |
| `check-page.mjs` | `/kkachi/` against spec §7: sections present, ≤ 550 words with tooltips, no colour outside `.nacre`, fonts loaded, no console errors; run twice (default, and WebGL off with reduced motion) | `node docs/kkachi/check-page.mjs` |
| `build-og.mjs` | `assets/kkachi/og/kkachi-og.png` (1200 × 630) from the page's own hero | `node docs/kkachi/build-og.mjs` (`CHROME=` picks a browser) |
| `build-wordmark.py` | `assets/kkachi/brand/kkachi-wordmark.svg` and `kkachi-mark.svg` | `python3 docs/kkachi/build-wordmark.py` — needs the cut Wanted Sans `assets/kkachi/fonts/kk-sans.woff2`, removed in the rebuild: `git show 171fe6d:assets/kkachi/fonts/kk-sans.woff2 > assets/kkachi/fonts/kk-sans.woff2` |
| `build-marks.py` | the sibling marks `assets/kkachi/brand/kkachi-shield-foundry.svg` and `kkachi-talon.svg` | `python3 docs/kkachi/build-marks.py` (`--check` prints the gaps between pieces) |

The page's fonts and their licences: `assets/kkachi/fonts/README.md`.

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

- **Shield Foundry** (4 pieces): the cross (`kkachi/drafts/d-cross-spaced.svg` in `171fe6d`, corners in) reversed, with the corners
  out. Each ㄱ keeps its cross cell and turns 180° in it, so the 63 box and the gap of 3 (at the side midpoints) stay the
  cross's. The inside forms a four-pointed star.
- **Talon** (3 pieces): three ㄱ as written, hanging like claws. The ㄲ is two ㄱ, and Talon is three. The drop is
  the ㄲ's 12 and the stride is 16.5, so the ink is 63 wide and fills the same 63 square as the shield.
