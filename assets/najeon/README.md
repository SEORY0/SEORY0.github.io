# najeon — 나전칠기 자개 재질 (vendored)

Copied from `~/projects/najeon/dist/` (najeon 1.0.0, source commit cc7697f 2026-09-28). Generated files — do not edit by hand.

- `najeon.js`: verbatim copy of `dist/najeon.js` (WebGL shader runtime, falls back to the tile on its own).
- `tiles/najeon-512.webp`: lossless WebP of `dist/tiles/najeon-512.png`, pixel-identical (172 KB vs 224 KB).

To change colours or texture, edit `spec/najeon.spec.json` in the najeon project, rebuild
(`python3 derive/derive.py && python3 derive/tiles.py && node build/build.mjs`), verify
(`node verify/shoot.mjs && python3 verify/measure.py`), then copy `dist/` here again.
