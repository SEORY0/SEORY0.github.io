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
