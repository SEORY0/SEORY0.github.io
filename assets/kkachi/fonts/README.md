# KKACHI page fonts

Self-hosted Latin subsets for `/kkachi/` (declared in `assets/kkachi/site.css`). All three are under the SIL Open Font
License 1.1; the licence texts sit next to the files.

| File | Family (CSS name) | Source | Kept |
|---|---|---|---|
| `newsreader.woff2` | Newsreader (`KK Serif`) | google/fonts `ofl/newsreader/Newsreader[opsz,wght].ttf` | `wght` 400–600, `opsz` 6–72 |
| `newsreader-italic.woff2` | Newsreader Italic (`KK Serif`, italic) | `ofl/newsreader/Newsreader-Italic[opsz,wght].ttf` | `wght` 400–500, `opsz` 6–72 |
| `big-shoulders.woff2` | Big Shoulders Display (`KK Cond`) | `ofl/bigshouldersdisplay/BigShouldersDisplay[wght].ttf` | `wght` 700–900 |
| `fragment-mono.woff2` | Fragment Mono (`KK Mono`) | `ofl/fragmentmono/FragmentMono-Regular.ttf` | regular |

Characters: U+0020–007E, U+00A0–00FF, U+2010–2015, U+2018–201F, U+2022, U+2026, U+2032–2033, U+2190–2199,
U+25B6–25B7, U+2212. Newsreader has no arrows, so the page sets ↗ and ↓ in `KK Mono` (`.arw`).

Rebuild (fontTools with brotli): limit the axes with `fontTools.varLib.instancer`, then

    pyftsubset IN.ttf --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2015,U+2018-201F,U+2022,U+2026,U+2032-2033,U+2190-2199,U+25B6-25B7,U+2212" \
      --layout-features='kern,liga,calt' --flavor=woff2 --output-file=OUT.woff2
