# Portfolio design system

White page, black ink, one monospace, lines only. The home page is a figlet
wordmark over a two-row sheet (About, CV); everything else lives
under Writing. References: projectzero.google (structure, boxed dates),
kostyafarber.com (mono chrome), figlet ASCII art (the wordmark).

## 1. Atmosphere & identity
Old-HTML plainness, kept pretty by strict alignment: one 760px column, 1px
rules, boxed mono labels, no backgrounds, no shadows, no radius, no motion.
The two figlet pieces (wordmark, footer mark) are the only ornament. Every
page is the same drawing:
a rule under the top line, rows separated by rules, a rule above the foot.
Nothing floats over anything. No shell, no input, no decorative text.

## 2. Colour
Six tokens in `_sass/_variables.scss`: `--bg`, `--fg`, `--mute`, `--line`,
`--link` (classic link blue), plus the two `--code-*` tokens `syntax.css`
reads. Dark mode flips them under `.theme-dark` on `<html>`, set by the head
FOUC guard and `theme-toggle.js`. No other colours exist.

## 3. Typography
- `--mono` is the site voice: chrome, labels, dates, the home sheet, list
  pages. 15px / 1.7. The shipped face is Server Mono (Internet Development
  Studio Company, OFL, one weight; bold is synthesised). Berkeley Mono
  (US Graphics Company, commercial, files kept out of the repo; see
  `assets/fonts/berkeley/`) takes over if its files are added. IBM Plex Mono
  remains the fallback and still serves article code blocks' glyph gaps.
- `--sans` (Pretendard subset) is for reading: article bodies at 17px / 1.8.
- Hierarchy comes from weight and boxes, not size. Row labels and page
  headings are one style: 13px bold uppercase, 0.1em tracking. Article titles
  are the one large size (32px sans bold).
- The figlet banner uses system monos (Cascadia, Consolas, Menlo) because the
  Plex Mono subset lacks block and box-drawing glyphs.

## 4. Spacing & layout
`.wrap` is the only container: max-width 760px, 20px side padding. One
breakpoint at 560px, where sheet rows stack label over value. The banner
sizes from the viewport so 51 columns always fit.

## 5. Components
- Top line: `seory0`, nav (writing, github, mail, `[dark]`/`[light]`), a
  rule beneath. Static, not sticky, no background.
- External links (new tab, mailto) in the top line, sheet and footer end in
  a small `↗` on the right, set as a CSS `::after` so the underline stops at
  the word. Article prose carries no arrows.
- `.box`: 1px bordered mono chip for dates, tags, the back link. `.soft` for
  secondary chips (tags).
- CV row, top-aligned with its label: `.cv-brief` on the left (Team, Edu
  for Soongsil University and KITRI WhiteHat School with school and cohort
  on a muted line, Work for the AI Safety Center with the role, then
  one entry per CTF result in `_data/ctfs.yml` marked `home: true`: its
  `short` name or else the full name with year, unlinked, then placement
  and team on a muted line under it; then
  `cv.pdf` opening in a new tab with its ISO date (2026-10-10) and size,
  then the full `sha256` on its own line as two 32-digit halves, also in
  the link's aria-label; recompute it when the PDF changes) and `.crt-cat` on the right: a tonal ASCII cat in left
  profile sitting on a CRT, kept in `assets/avatars/crt-cat.txt` and copied
  into the page by `docs/art/sync-home-ascii.py`, 8px. Static, no
  JavaScript. Server Mono has no `^`, so the art never uses it.
- `.sheet`: rows of `label | value` separated by rules. The home uses it
  as a `<dl>` (About, CV) with a 72px label column; the writing index uses
  it as an `<ol>` (date chip | title, summary, tags) with 120px for the
  chip. Same class, same rules.
- Article: `.post-head`, `.post-toc` (native details), `.post-content`,
  `.post-back-link` (a `.box`).
- Code: `.code-block-container` built by `code-copy.js`; 1px frame, line
  numbers column, mono label header. Inline code is a 1px outline.
- Footer: a rule on the column, the figlet "slant" KERNEL PAN!C mark (pure
  ASCII, renders everywhere), then `© year SEORY0` left and source · atom ·
  sitemap right.

## 6. Motion & interaction
None. Hover is a full inversion (`background: var(--fg); color: var(--bg)`)
on links and buttons. Focus is a 2px outline in `--fg`. No transitions.

## 7. Depth & surface
Lines only: `1px solid var(--line)`, everywhere, for everything. No dotted
rules, no fills, no shadows, no radius, no blur.

## 8. Accessibility & accepted debt
- The banner is `aria-hidden`; the h1 and the sheet carry the content.
- The chrome, home and 404 are English only (`lang="en"`); articles keep
  their own language on `<html lang>`.
- Link blue meets AA on white (#1a0dab, 10.6:1) and on the dark surface
  (#8ab4f8, 8.9:1). Mute grey is 5.7:1 light and 5.6:1 dark.
- Accepted debt: the home banner depends on a system mono having block
  glyphs; on a machine without one it degrades to a slightly gappy wordmark.
