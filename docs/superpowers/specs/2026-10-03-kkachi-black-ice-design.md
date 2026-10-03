# KKACHI — "Black ICE" one-page site

Date: 2026-10-03 · Branch: `claude/kkachi-home` · Replaces every earlier KKACHI page concept (v1–v4).
The v4 state is kept in commit `171fe6d` for reference only.

## 1. Brief

- **Company:** Project KKACHI builds a **frontier agent harness** and the **autonomous vulnerability research agent**
  for enterprise security teams that runs on it.
- **Keep:** the logo (`assets/kkachi/brand/`, favicons in `assets/kkachi/icons/`) and najeon (`assets/najeon/`,
  `assets/kkachi/nacre-512.webp`). Nothing else from earlier pages carries over: no copy, layout, symbols, or tokens.
- **Reference:** https://ls.bot/ for structure, rhythm, and amount of copy. Neuromancer (the attached Josan Gonzalez
  cover) for palette, line-art style, and vocabulary.
- **Direction B, "Black ICE":** every section is dark. Neuromancer appears as accent colour (cover pink and acid yellow)
  and as line art. Najeon is the only light source.
- **Language:** English only. **Length:** at most ls.bot's visible copy. Target about 500 words, tooltips included.
- **One page:** `/kkachi/`. All other KKACHI pages are deleted.
- **Contact:** `mailto:seory0@outlook.kr` (already public in `_config.yml`).

## 2. Concept

Gibson's cyberspace is lines of light in black nonspace. Najeon is light set into black lacquer. On this page
**the matrix is najeon**: the visor lens, the one proven finding, the cyberspace grid, and the footer mark are nacre.
Everything else is lacquer and ink.

The copy uses Neuromancer's word for defensive software, **ICE**: KKACHI breaks your own ICE before someone else does.
No quotations from the novel are used.

## 3. Visual system

| Token | Hex | Use |
|---|---|---|
| `--void` | `#07050D` | hero, cyberspace section |
| `--ink` | `#120A24` | Static and Signal sections (ls.bot's charcoal) |
| `--deep` | `#0B1020` | products section (ls.bot's dark teal) |
| `--black` | `#000000` | footer |
| `--line` | `#35325B` | hairlines, empty cells |
| `--violet` | `#594771` | hatching, card fills |
| `--peri` | `#727CA9` | secondary line art, chip borders |
| `--pink` | `#EE5D7E` | primary line art, rules, focus ring |
| `--volt` | `#F2E600` | wordmark, labels, the one highlighted word |
| `--text` | `#ECE8F4` | body |
| `--dim` | `#A9A3C4` | secondary text (≥ 7:1 on `--ink`) |

Colours are sampled from the cover (pink `#EE5D7E`, yellow `#ECEA09`–`#FDE700`, ink `#120A24`, periwinkle `#727CA9`,
violet `#594771`). Yellow and pink never carry body text; body text is `--text` or `--dim` on a dark ground.

**Type** (all OFL, Latin subsets, self-hosted in `assets/kkachi/fonts/`):

- **Newsreader** (display optical size): H1, H2, and body. ls.bot's literary serif, and Neuromancer is a novel.
- **Big Shoulders Display** 800: nav, card titles, panel labels. Tall and condensed like the cover title.
- **Fragment Mono**: chips, tooltips, HUD text, captions.

**Line art:** Moebius / Josan Gonzalez style. Even 1.25–2 px strokes, parallel-line hatching for shade, no gradients.
Pink and periwinkle lines on dark, violet hatching, yellow only for HUD marks. Drawn as SVG by
`docs/kkachi/build-art.py` and inlined into the page between `<!-- art:NAME:start/end -->` markers.

## 4. Page (top to bottom)

Nav (top right, condensed caps, like ls.bot): `Static · Signal · Products · Contact`.

### 4.1 Hero (`--void`)
- Art: the KKACHI wordmark in `--volt`, wide across the top like the cover title. Cables hang from the letters down to a
  frontal figure (symmetric: visor, nose, mouth, jaw, coat collar) in pink and periwinkle line art. The visor lens is
  nacre (the tile, clipped, drifting slowly and following the pointer) with yellow HUD marks: tally lines, ▷, and the ㄲ.
  Faint scanlines over the void.
- Headline, bottom left (ls.bot position): **Break your own ICE. / Before someone else does.**
- Copy:
  > KKACHI builds a frontier agent harness and the autonomous vulnerability research agent that runs on it.
  >
  > The agent reads your code and binaries, follows every input to where it breaks, and reports only what it can reproduce.
- CTA line: Ask for `Early access ↗` or see `how it works ↓`.

### 4.2 The Static (`--ink`)
> Scanners flag anything that looks wrong. Security teams then spend the week proving which alerts are real.
> Thousands of warnings, a handful of true bugs: a dead channel with the signal buried inside.

Chips with ⓘ tooltips: `Unverified alerts` (A warning is a guess until an input reaches it.) · `No exploit path`
(Most tools stop at the suspicious line.) · `Triage debt` (Review hours go to ruling things out.)

Diagram: two panels, as in ls.bot's Traditional vs Lightspeed.
- `SCANNERS: EVERY WARNING`: a grid of cells flickering like TV static. Caption: *Noise you verify by hand.*
- `KKACHI: ONE PROVEN PATH`: the same grid, dark, with one traced path ending in one nacre cell tagged
  `REPRODUCED 3/3`. Caption: *Signal, already reproduced.*

### 4.3 The Signal (`--ink`)
> KKACHI separates guessing from knowing.
>
> Every suspicion becomes a hypothesis. The agent traces it from entry point to sink, then replays the crash three times
> in a fresh sandbox. If it fails once, it is dropped, and the reason is kept.

Chips: `Source and binaries` (No source is not a blocker.) · `Path-traced` (Each finding shows the call path from input
to crash.) · `Reproduced 3/3` (Three clean replays in a new VM, or it is not a finding.) · `Human sign-off` (Nothing is
disclosed until a person approves it.)

Then the interlude art (ls.bot's arm-and-computers slot): a cyberdeck in three-quarter view with trodes and cables.

### 4.4 Built at KKACHI (`--deep`)
Subtitle: *Two products. One stack.* Two cards with ls.bot's card anatomy: condensed title above a rule, body, chips,
and a rule below.

- **FRONTIER AGENT HARNESS**: The loop, memory, tools, and sandboxes our agents live in. Sessions run for days, borrow
  real machines only when a task needs one, and every step can be replayed.
  Chips: `Durable sessions` · `Borrowed compute` · `Full replay` · `Model-agnostic`
- **AUTONOMOUS VULNERABILITY RESEARCH**: Point it at a repository or a binary. It hunts memory-safety and logic bugs
  across the call graph and returns each finding with a working reproduction and a fix direction.
  Chips: `Source and binary` · `Reproduced 3/3` · `Rejection log` · `Runs in your environment`

Three short use cases below:
- **PRE-RELEASE AUDITS**: Run it on every release branch. Ship knowing which paths were traced and which were ruled out.
- **LEGACY BINARIES**: No source, no docs, no owner. The agent maps the binary and proves what it finds.
- **THIRD-PARTY CODE**: Vendor SDKs and open-source dependencies, tested before they reach production.

### 4.5 Light, inlaid (`--void`, ls.bot's warp-field slot)
Full-bleed cyberspace: a perspective grid whose lines are cut out of a lacquer layer over the najeon WebGL shader, so
only the lines are nacre. The grid drifts toward the viewer.
> Najeon sets mother-of-pearl into black lacquer, one piece at a time. KKACHI holds its findings to the same standard:
> each claim set firmly in its evidence — the path, the input, the replay.

CTA: Write to `seory0@outlook.kr ↗` or ask for `Early access ↗`.

### 4.6 Footer (`--black`)
Anchor links, a large ㄲ mark inlaid with nacre over the wordmark, and `© 2026 Project KKACHI.`

## 5. Build

| File | Role |
|---|---|
| `kkachi/index.html` | the page: head, inline art, content |
| `assets/kkachi/site.css` | tokens, layout, components, motion |
| `assets/kkachi/site.js` | ES module: nacre (hero lens, footer), static flicker, cyberspace grid, pointer parallax |
| `assets/kkachi/fonts/*.woff2` + OFL texts | Newsreader, Big Shoulders Display, Fragment Mono |
| `docs/kkachi/build-art.py` | writes the hero, interlude, and diagram SVG into the page markers |
| `docs/kkachi/og.html`, `build-og.mjs` | rebuilt `assets/kkachi/og/kkachi-og.png` from the new hero |

- Najeon: `assets/najeon/najeon.js` is imported unchanged (it falls back to its PNG tile without WebGL). The hero lens
  and footer mark use the tile in SVG `<image>` under a `clipPath`, so they render without WebGL or JS.
- Motion: everything animated pauses off screen (IntersectionObserver) and stops under `prefers-reduced-motion`.
- Accessibility: art is `aria-hidden`. The wordmark has the accessible name "KKACHI". Chips are `<button>` elements with
  `aria-describedby` tooltips shown on hover and focus. Diagrams have text captions. Visible focus ring in `--pink`.
- Responsive: one column under 820 px. The figure moves under the wordmark and the headline follows it. Cards stack.
- Head: title `KKACHI — Break your own ICE`, meta description, OG and Twitter tags, the existing favicons.

## 6. Removal

- Pages: `kkachi/home/`, `why/`, `notes/`, `waitlist/`, `dashboard/` (with `finding/`, `session/`), `system/`, `drafts/`.
- Assets: `assets/kkachi/kk.css`, `kk-system.css`, `kk-system.js`, `kk-app.js`, `dash-data.js`, `inlay.js`,
  `transition.js`, `symbols.svg`, and the old fonts (`kk-*.woff2`, `characters.txt`, the old fonts README and OFL texts).
- Build sources for removed assets: `docs/kkachi/build-fonts.py`, `font-words.txt`, `build-symbols.py`,
  `template.html`, `template-app.html`. Keep `build-wordmark.py` and `build-marks.py` (how the logo is made);
  the README says to restore the cut font from `171fe6d` to rerun them.
- `_config.yml`: drop the three `sitemap: false` defaults for paths that no longer exist.
- Older specs in `docs/superpowers/specs/` stay as history.

## 7. Done when

- Desktop (1440 × 900) and mobile (390 × 844) screenshots read as the same family as ls.bot (dark, cinematic, sparse)
  with an unmistakable Neuromancer palette and line art, and nacre is the brightest thing on screen.
- Visible copy, tooltips included, is at most 550 words.
- No console errors. Works with WebGL off (tile fallback) and with reduced motion (still frames).
- `bundle exec jekyll build` succeeds. `/kkachi/` is the only KKACHI page in `_site/`.
