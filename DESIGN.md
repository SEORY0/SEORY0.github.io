# Portfolio design system

White page, black ink, one monospace, lines only. The home page is a man page
with a figlet wordmark and a single CV link; everything else lives under
Writing. References: projectzero.google (structure, boxed dates, "read more"
button), kostyafarber.com (man page About, mono chrome, build label), figlet
ASCII art (wordmark and footer mark).

## 1. Atmosphere & identity
Old-HTML plainness, kept pretty by strict alignment: one 760px column, 1px
rules, boxed mono labels, no backgrounds, no shadows, no radius, no motion.
The two ASCII pieces are the only ornament. Nothing floats over anything.

## 2. Colour
Six tokens in `_sass/_variables.scss`: `--bg`, `--fg`, `--mute`, `--line`,
`--link` (classic link blue), plus the two `--code-*` tokens `syntax.css`
reads. Dark mode flips them under `.theme-dark` on `<html>`, set by the head
FOUC guard and `theme-toggle.js`. No other colours exist.

## 3. Typography
- `--mono` (IBM Plex Mono) is the site voice: chrome, labels, dates, the home
  man page, list pages. 13.5px / 1.65.
- `--sans` (Pretendard subset) is for reading: article bodies at 16px / 1.8,
  and the home DESCRIPTION when `html[lang="ko"]`.
- Hierarchy comes from weight and boxes, not size. Section headings are 12px
  bold uppercase with 0.1em tracking; article titles are the one large size
  (28px sans bold).
- The figlet banners use system monos (Cascadia, Consolas, Menlo) because the
  Plex Mono subset lacks block and box-drawing glyphs. The footer mark is
  pure ASCII (figlet "slant") and renders identically everywhere.

## 4. Spacing & layout
`.wrap` is the only container: max-width 760px, 20px side padding. One
breakpoint at 560px, where the top line drops its rule and the man page
indent halves. Banners size from the viewport so 51 and 70 columns always fit.

## 5. Components
- Top line: `> seory0` prompt, nav (writing, github, email, `[EN]` on home,
  `[dark]`/`[light]`), a 1px rule that fills, and `[ build-rev ]`. Static,
  not sticky, no background.
- `.box`: 1px bordered mono chip for dates, tags, the CV link. `.soft` for
  secondary chips (pending, tags).
- Home: `.banner` (figlet), `.tagline` h1, `.man` with NAME / DESCRIPTION /
  FILES / SEE ALSO. `.cv` is the only call to action.
- Writing index: `.card` (title, `.by` chips, summary, `.more` button).
- Article: `.post-head`, `.post-toc` (native details), `.post-content`,
  `.post-footer-meta`, `.post-back-link`.
- Code: `.code-block-container` built by `code-copy.js`; 1px frame, line
  numbers column, mono label header. Inline code is a 1px outline.
- Footer: figlet mark in a `<pre>`, one line of links.

## 6. Motion & interaction
None. Hover is a full inversion (`background: var(--fg); color: var(--bg)`)
on links and buttons. Focus is a 2px outline in `--fg`. No transitions.

## 7. Depth & surface
Lines only: `1px solid var(--line)` for structure, `1px dotted var(--mute)`
between list rows. No fills, no shadows, no radius, no blur.

## 8. Accessibility & accepted debt
- Banners are `aria-hidden`; the h1 and the man page carry the content.
- Both languages ship in the DOM on the home page; `html[lang]` hides one.
  The toggle persists to localStorage and is applied before paint.
- Link blue meets AA on white (#1a0dab, 10.6:1) and on the dark surface
  (#8ab4f8, 8.9:1). Mute grey is 5.7:1 light and 5.6:1 dark.
- Accepted debt: the home banner depends on a system mono having block
  glyphs; on a machine without one it degrades to a slightly gappy wordmark.
