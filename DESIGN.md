# Portfolio design system

## 1. Atmosphere & identity
Preserve the existing monochrome CV layout: compact entries, fine rules, and a
single Pretendard typeface. Readers should distinguish institutions, projects,
personal responsibilities, and supporting evidence at a glance.

## 2. Color
Use the existing tokens in `_sass/_variables.scss`: `--bg`, `--text`,
`--text-muted`, `--text-meta`, `--accent`, and `--border`. Their existing light
and dark theme values remain the source of truth. No new palette is needed.

## 3. Typography
Use `--font-body`. Institution headings retain the existing 0.98rem/700 scale;
project headings use the existing 1rem/700 scale and 1.5 line height. Body copy
uses 0.88rem/1.55, metadata and links 0.8rem, and role tags 0.72rem/700.
Keep English and Korean content paired through the existing `lang` spans.

## 4. Spacing & layout
Reuse `--indent` (16px desktop, 20px mobile), the 700px content width, and the
existing 750px/1024px breakpoints. Experience projects sit inside their parent
institution, offset by `--indent` with a one-pixel connecting rule. Existing
6px/8px list gaps and 16px entry padding continue the CV rhythm. Dates wrap
below long project titles on mobile. The document owns vertical scrolling.

## 5. Components
- CV row: existing `.note` institution, description, and right-aligned period.
- Experience group: semantic section labelled by its institution heading;
  nested project list with a shared vertical rule, not separate employer rows.
- Project entry: article with h4 title, optional project duration and sponsor,
  role tag, and responsibility bullets. Both projects share this primitive.
- Evidence links: existing `.role-link` behavior; project resources precede
  press coverage, which occupies the final line.
- States: text is static; links retain native navigation, existing hover
  accent/underline, and visible keyboard focus. No loading or disabled states.

## 6. Motion & interaction
Reuse existing link color/underline transitions (0.15s ease). Add no animation.
Keep existing language/theme controls and reduced-motion behavior.

## 7. Depth & surface
Borders only for experience hierarchy. Use `1px solid var(--border)` without
new cards, shadows, or background fills.

## 8. Accessibility constraints & accepted debt
Project headings are below the institution heading. Links have descriptive
bilingual labels. Preserve readable wrapping at 375px, dark/light contrast,
keyboard focus, and the existing language visibility rules. Research-project
dates must be explicitly distinguished from the author's employment dates.
No new accessibility debt is accepted for this change.

## Minimal navigation refinement
- Keep the monochrome CV system; no new dependency, card grid, illustration, or animation.
- Add only a wrapping, underlined section-link cluster after the introduction.
  Do not add a selected-highlights summary. Use existing 0.88rem body
  and 0.8rem metadata scales with 8/16/24/32px spacing.
- Section labels become h2 elements retaining the small `.date` style and get stable IDs.
  Anchor destinations use `scroll-margin-top: calc(var(--nav-height) + 24px)`.
- Mobile CV rows use one column: title, description, then date/placement. Desktop
  retains the date column. Keep links text-only without arrows, with hover and keyboard focus feedback.
- Top-bar controls use a 44px touch target with compact gaps; icons keep their current size.
  Ordinary navigation uses native links, not application menu roles.
- Articles use one native details/summary table of contents above the body. Derive
  h2/h3 links from rendered headings; hide the control when there are too few headings.
  Preserve keyboard operation, heading IDs, and a visible Back to Writing link at the end.
- Error recovery uses the shared plain surface and type, visible home/Writing links,
  natural content height, no clipped frame or flashing interaction.
- Keep the halftone backdrop fully opaque and reduce its brightness to 85% in both themes; keep solid text surfaces.
- Preserve the original oversized Kernel Panic footer mark, 2px frame, rounded upper corners and generous padding.

## Audit remediation
- Preserve layout, original Kernel Panic footer, monochrome chrome and 85% background brightness at full opacity.
- Retain Pretendard outlines and variable weights through a 651-character local web subset (renamed PortfolioSans for the Reserved Font Name), with the original complete Unicode subsets as fallback. Load IBM Plex Mono 400/700 only for posts.
- Article image previews use responsive WebP sources, reserved intrinsic dimensions, an eager first image and lazy lower images. Preserve full-resolution originals.
- Code palettes must meet 4.5:1 text contrast in both themes; decorative line numbers remain visible but are hidden from assistive technology.
- Language controls expose the visible EN/KO label and current/action language. Theme controls expose pressed state. Code-copy success and failure have a visible polite status.
- Skip-link hover, focus and visited states keep the inverse contrast pair.

Code syntax palette (light / dark): comment `#537343` / `#8eaf7d`, keyword `#0000cc` / `#75b9ef`, function `#795e26` / `#dcdcaa`, string `#a31515` / `#ce9178`, number `#08774e` / `#b5cea8`, type `#1f7087` / `#4ec9b0`, name `#001080` / `#9cdcfe`, error `#ad2424` / `#ff8080`. Line numbers: `#626b75` / `#a0a0a0`.

## Hover preview — home
The single documented exception to §6 "Add no animation". It applies to the
linked sections of the home page — EXPERIENCE, HACKING TEAMS, DISCLOSURES, CTF,
SPEAKER, PROJECTS, WRITING — and nowhere else.

- A row with `data-hover-image` shows that thumbnail following the pointer.
  Rows without one keep the plain CV hover and dismiss the preview rather than
  leaving the previous row's image under the pointer, so a row never needs an
  image. The whole feature is an enhancement: no-JS, touch, and coarse pointers
  get the existing row untouched.
- A section opts in with `data-hover-image-group` on a `.note-group` wrapper.
  EXPERIENCE marks its `<section class="experience">` directly instead — a
  wrapper there would break the `.experience > .note` child combinator.
- One preview element serves the whole page, and all thumbnails share one
  stacked track, so moving between rows slides the stack rather than swapping
  the `src` — the change reads as one surface travelling, and no row waits on a
  fresh decode. Each section's images are fetched on the first hover into that
  section, so a visitor pays only for what they explore.
- No animation library. The pointer follow is an exponential ease on one
  translate driven by rAF; the fade, scale, and stack slide are CSS
  transitions, so `prefers-reduced-motion` switches the motion off in the
  stylesheet. Under reduced motion the frame still tracks the pointer — that
  movement is the user's own input, not autonomous animation — but stops
  lagging, and the timed transitions are removed.
- Thumbnails are 560×350 WebP in `assets/images/previews/`, rendered at
  280×175 (2× for retina, 16:10). Sources are the repo's own artwork where it
  exists, and otherwise a 1280×800 capture of the linked page. Keep the
  full-size originals; the WebP is a derived preview. Posts opt in with
  `preview:` in their front matter and CTF entries with `preview:` in
  `_data/ctfs.yml` — deliberately never falling back to a post's `image:`,
  which is a full-size OG asset measured in megabytes.
- Surface: `1px solid var(--border)`, 10px radius, `var(--bg)` behind. This is
  the one place §7's "no shadows" is relaxed — a cursor follower is a genuinely
  floating layer, and a hairline alone does not separate a photo from the
  halftone backdrop. Neutral and low-contrast, so it reads as depth, not a card.
- Layering: `z-index: 900`, below the sticky top bar, so the preview passes
  beneath the nav instead of covering it.
- Accessibility: the preview is `aria-hidden` and carries `alt=""` — every row
  already states its title and description as text, so nothing is lost to
  keyboard or screen-reader users, who never see it. Accepted debt: the images
  are reachable by pointer only.
