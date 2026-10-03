# KKACHI — "Black ICE" one-page site

Date: 2026-10-03 · Branch: `claude/kkachi-home` · Replaces every earlier KKACHI page concept (v1–v4).
The v4 state is kept in commit `171fe6d` for reference only.

## 1. Brief

- **Company:** Project KKACHI builds a **frontier agent harness** and the **autonomous vulnerability research agent**
  for enterprise security teams that runs on it.
- **Keep:** the logo (`assets/kkachi/brand/`, favicons in `assets/kkachi/icons/`) and najeon (`assets/najeon/`,
  `assets/kkachi/nacre-512.webp`). Nothing else from earlier pages carries over: no copy, layout, symbols, or tokens.
- **Reference:** https://ls.bot/ for structure, rhythm, and amount of copy. Neuromancer (the attached Josan Gonzalez
  cover) for line-art style, composition, and vocabulary.
- **Direction B, "Black ICE", with ls.bot's restraint:** every section is dark and neutral (black, charcoal, white,
  grey). **Nacre is the only colour on the page.** Neuromancer comes through the line-art style, the dead-channel static,
  the cyberdeck, and the cyberspace grid — not through the cover's pink and yellow, and not in the hero (§4.1).
- **Language:** English only. **Length:** at most ls.bot's visible copy. Target about 500 words, tooltips included.
- **One page:** `/kkachi/`. All other KKACHI pages are deleted.
- **Contact:** `mailto:seory0@outlook.kr` (already public in `_config.yml`).

## 2. Concept

Gibson's cyberspace is lines of light in black nonspace. Najeon is light set into black lacquer. On this page
**the matrix is najeon**: the hero's beam and logo, the one proven finding, the deck screen, the cyberspace grid, and the footer
mark are nacre.
Everything else is lacquer and ink.

No quotations from the novel are used.

## 3. Visual system

| Token | Value | Use |
|---|---|---|
| `--void` | `#050506` | hero, cyberspace section |
| `--char` | `#1C1C20` | Static and Signal sections (ls.bot's charcoal) |
| `--deep` | `#0C0E11` | products section (ls.bot's darker band) |
| `--black` | `#000000` | footer |
| `--rule` | `rgba(255,255,255,.14)` | hairlines, empty cells |
| `--line` | `#E6E6E9` | line art strokes |
| `--hatch` | `#6E6E76` | line art hatching, chip borders |
| `--text` | `#F2F2F3` | headings, body |
| `--dim` | `#A7A7AE` | secondary text (≥ 7:1 on `--char`) |
| nacre | `assets/najeon/` shader and tile | the one accent: hero beam (in the photograph) and logo, proven cell, deck screen, grid, footer mark |

No hue anywhere except nacre: no coloured text, rules, chips, or buttons. Focus ring: 2px `--text`.

**Type** (all OFL, Latin subsets, self-hosted in `assets/kkachi/fonts/`):

- **Newsreader** (display optical size): H1, H2, and body. ls.bot's literary serif, and Neuromancer is a novel.
- **Big Shoulders Display** 800: nav, card titles, panel labels. Tall and condensed like the cover title.
- **Fragment Mono**: chips, tooltips, HUD text, captions.

**Line art:** Moebius / Josan Gonzalez style. Even 1.25–2 px strokes, parallel-line hatching for shade, no gradients.
Light `--line` strokes and `--hatch` shading on dark; HUD marks on the nacre lens are dark lacquer, engraved. Drawn as SVG by
`docs/kkachi/build-art.py` and inlined into the page between `<!-- art:NAME:start/end -->` markers.

## 4. Page (top to bottom)

Nav (top right, condensed caps, like ls.bot): `Static · Signal · Products · Contact`.

### 4.1 Hero (`--void`) — final 2026-10-03: "One cinematic photograph"
The Neuromancer figure, the lacquer wordmark and the dithered nacre were all dropped; everything below the hero stays as
written. Taste test (`.scratch/neuro/sec/taste-board.png`): ls.bot, SpaceX, Anduril and Linear — dark, one real image,
minimal type; no generated graphics, nothing busy, nothing trendy. Reference: AISLE (aisle.com).
- Logo: a small KKACHI wordmark at the top left (the ㄲ inlaid with the nacre tile, ACHI in `--text`), linking to
  `#top`. The nav stays at the top right; under 560 px only "Contact" remains.
- Photograph (made by the owner with GPT image generation from the prompts in this session): a dark data hall, black
  racks at the right in perspective, one beam of iridescent mother-of-pearl light pouring from a gap between two racks
  toward the upper left; the beam is the only colour. `assets/kkachi/hero/hero-wide.webp` (1536 × 1024) and
  `hero-tall.webp` (1024 × 1536, under 820 px), `object-fit: cover`.
- A neutral scrim darkens the left and the bottom so the copy reads. Motion, all off under reduced motion: a 28 s
  push-in from 1.07×, the beam breathing (a blurred copy in `screen`, 8 s), and a few pixels of pointer parallax.
- Headline, bottom left (ls.bot position): **The one finding that holds. / Reproduced before it's reported.**
- Copy:
  > KKACHI builds a frontier agent harness and the autonomous vulnerability research agent that runs on it.
  >
  > The agent reads your code and binaries, follows every input to where it breaks, and reports only what it can reproduce.
- CTA line: Ask for `Early access ↗` or see `how it works ↓`.

### 4.2 The Static (`--char`)
> Scanners flag anything that looks wrong. Security teams then spend the week proving which alerts are real.
> Thousands of warnings, a handful of true bugs: a dead channel with the signal buried inside.

Chips with ⓘ tooltips: `Unverified alerts` (A warning is a guess until an input reaches it.) · `No exploit path`
(Most tools stop at the suspicious line.) · `Triage debt` (Review hours go to ruling things out.)

Diagram: two panels, as in ls.bot's Traditional vs Lightspeed.
- `SCANNERS: EVERY WARNING`: a grid of cells flickering like TV static. Caption: *Noise you verify by hand.*
- `KKACHI: ONE PROVEN PATH`: the same grid, dark, with one traced path ending in one nacre cell tagged
  `REPRODUCED 3/3`. Caption: *Signal, already reproduced.*

### 4.3 The Signal (`--char`)
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
| `assets/kkachi/site.js` | ES module: hero pointer parallax, nacre drift (proven cell, footer), static flicker, cyberspace grid |
| `assets/kkachi/hero/*.webp` | the hero photograph, wide and tall |
| `assets/kkachi/fonts/*.woff2` + OFL texts | Newsreader, Big Shoulders Display, Fragment Mono |
| `docs/kkachi/build-art.py` | writes the logo, interlude, diagram, and footer SVG into the page markers |
| `docs/kkachi/build-og.mjs` | rebuilds `assets/kkachi/og/kkachi-og.png` from the page's hero |

- Najeon: `assets/najeon/najeon.js` is imported unchanged (it falls back to its PNG tile without WebGL). The hero
  The logo, the proven cell, the deck screen, and the footer mark use the tile in SVG `<image>` under a `clipPath`.
- Motion: everything animated pauses off screen (IntersectionObserver) and stops under `prefers-reduced-motion`.
- Accessibility: art is `aria-hidden`. The wordmark has the accessible name "KKACHI". Chips are `<button>` elements with
  `aria-describedby` tooltips shown on hover and focus. Diagrams have text captions. Visible focus ring in `--text`.
- Responsive: one column under 820 px. The tall photograph sits above the copy. Cards stack.
- Head: title `KKACHI — The one finding that holds`, meta description, OG and Twitter tags, the existing favicons.

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
  with Neuromancer line art and motifs below the hero, and nacre is the only colour on screen.
- Visible copy, tooltips included, is at most 550 words.
- No console errors. Works with WebGL off (tile fallback) and with reduced motion (still frames).
- `bundle exec jekyll build` succeeds. `/kkachi/` is the only KKACHI page in `_site/`.
