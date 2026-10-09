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
- `--mono` (IBM Plex Mono) is the site voice: chrome, labels, dates, the home
  sheet, list pages. 15px / 1.7.
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
  secondary chips (tags). `.cv` is the same frame at button size (17px bold
  name, 13px meta, 10px × 18px padding): the one call to action.
- `.sheet`: rows of `label | value` (120px + 1fr) separated by rules. The home
  uses it as a `<dl>` (About, CV); the writing index uses it as an
  `<ol>` (date chip | title, summary, tags). Same class, same rules.
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
