/* KKACHI paper — the behaviour every white page shares (paper-pages spec §3 "스크롤 인터랙션"):
   line art draws itself when it scrolls into view, and in-page jump links move the reader smoothly.
   Usage: <script type="module" src="../../assets/kkachi/paper.js"></script>, once per white page.

   1. Draw on scroll. Targets: .pp-draw (hairline drawings, kk-paper.css §6) and [data-pp-in] (a page's own entrance:
   style [data-pp-in].is-armed as the "before" state and [data-pp-in].is-armed.is-in as the "after" one).
   Anything already on screen, or above it, when the page opens stays as it is: it is never hidden, so nothing flashes.
   The rest is armed (.is-armed: undrawn) and gets .is-in once its top passes 85% of the viewport height (then it is let
   go). data-pp-in="half" waits instead until half of it is in view (or, for one taller than the screen, 60% of the
   screen): for a choreographed drawing of several seconds that should not start while mostly off screen. A page that
   replays an entrance does it with its own class (remove .is-armed / .is-in, force a reflow, add its play class).
   Without JS, without IntersectionObserver or under prefers-reduced-motion nothing is armed: all drawn, static.
   .pp-draw--load (the hero motif) is CSS-only and not handled here.
   Note: Chromium intersects an element through its own clip-path, so an element clipped shut (inset(0 0 100% 0)) that
   is scrolled past in one jump never intersects. Observe an unclipped ancestor instead.

   2. Jump links. <a href="#id" data-pp-jump> (a table of contents, a figure's labels): a plain click or Enter scrolls
   the target into view (smooth; instant under reduced motion; scroll-padding / scroll-margin apply), puts the hash in
   the address bar and moves focus to the target (given tabindex="-1" if it has none), so the next Tab continues from
   there. Modified clicks are left to the browser. (Never html { scroll-behavior: smooth }: see kk-paper.css.)

   3. The bar's real height. The fixed top bar is one row, 56 / 50 px as drawn (--bar-min); large text makes it taller.
   Its measured height is written to --bar-h on <html> (and again whenever it changes), so the page's scroll-padding,
   the sticky figures and strips and the hero all start below the real bar. Its link list scrolls sideways when the
   labels do not fit (kk-paper.css §3); the current page's link is then kept in view, a link that takes the focus is
   scrolled fully into view (its focus ring included, clear of the edge fades), and each edge with more links behind it
   fades (.is-l / .is-r). Without JS --bar-h stays --bar-min.

   4. Unbreakable runs. A .nw run (kept on one line: a file:line, a code expression) that no longer fits its line — large
   text on a narrow screen — would run past the page's edge, where it is clipped; it is then let wrap (.nw.is-free, in a
   context that wraps at all), and kept whole again as soon as it fits. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const items = document.querySelectorAll('.pp-draw:not(.pp-draw--load), [data-pp-in]');

if (items.length && !reduce.matches && 'IntersectionObserver' in window) {
  const enter = (io, el) => { el.classList.add('is-in'); io.unobserve(el); };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) enter(io, e.target);
  }, { rootMargin: '0px 0px -15% 0px' });
  const half = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const need = Math.min(0.5, (innerHeight * 0.6) / Math.max(1, e.boundingClientRect.height));
      if (e.intersectionRatio + 0.001 >= need) enter(half, e.target);
    }
  }, { threshold: [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1] });
  const fold = innerHeight * 0.85;
  for (const el of items) {
    if (el.getBoundingClientRect().top < fold) continue;   // on screen or above: leave it drawn
    el.classList.add('is-armed');
    (el.dataset.ppIn === 'half' ? half : io).observe(el);
  }
  // motion switched off while the page is open: draw whatever is still waiting
  reduce.addEventListener('change', () => {
    if (!reduce.matches) return;
    io.disconnect();
    half.disconnect();
    for (const el of items) el.classList.add('is-in');
  });
}

document.addEventListener('click', (e) => {
  const a = e.target instanceof Element ? e.target.closest('a[data-pp-jump][href^="#"]') : null;
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const t = document.getElementById(decodeURIComponent(a.hash.slice(1)));
  if (!t) return;
  e.preventDefault();
  if (location.hash !== a.hash) history.pushState(null, '', a.hash);
  if (!t.hasAttribute('tabindex') && !t.matches('a[href], button, input, select, textarea')) t.setAttribute('tabindex', '-1');
  t.focus({ preventScroll: true });
  t.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
});

const barIn = document.querySelector('.pp-bar-in'), nav = document.querySelector('.pp-nav');
const EDGE = 22;                                   // the edge fade (16px, kk-paper.css) + the focus ring (2px, 3px out)
const scrolls = () => !!nav && nav.scrollWidth > nav.clientWidth + 1;
const keep = (a, pad) => {                         // scroll the list so the link is pad px clear of its edges
  const n = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
  if (r.left < n.left + pad) nav.scrollLeft -= n.left + pad - r.left;
  else if (r.right > n.right - pad) nav.scrollLeft += r.right - (n.right - pad);
};
const edges = () => {
  const over = scrolls(), max = nav.scrollWidth - nav.clientWidth;
  nav.classList.toggle('is-l', over && nav.scrollLeft > 1);
  nav.classList.toggle('is-r', over && nav.scrollLeft < max - 1);
};
if (barIn) {
  const fit = () => {
    const h = barIn.getBoundingClientRect().height;
    if (h > 0) document.documentElement.style.setProperty('--bar-h', `${Math.round(h * 100) / 100}px`);
    const cur = nav && nav.querySelector('a[aria-current="page"]');
    if (cur && scrolls()) keep(cur, EDGE);
    if (nav) edges();
  };
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(barIn);
  else addEventListener('resize', fit);
}
if (nav) {
  nav.addEventListener('scroll', edges, { passive: true });
  nav.addEventListener('focusin', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a') : null;
    if (a && scrolls()) { keep(a, EDGE); edges(); }
  });
}

const nws = [...document.querySelectorAll('.nw')];
if (nws.length) {
  const hostOf = (el) => {                         // the block its line boxes belong to
    let e = el.parentElement;
    while (e && e !== document.body && /^(inline|contents)/.test(getComputedStyle(e).display)) e = e.parentElement;
    return e;
  };
  const hosts = new Map(nws.map((n) => [n, hostOf(n)]));
  const free = () => {
    for (const n of nws) n.classList.remove('is-free');
    const over = nws.filter((n) => {
      const h = hosts.get(n);
      if (!h || /^(nowrap|pre)$/.test(getComputedStyle(n.parentElement).whiteSpace)) return false;
      const q = n.getBoundingClientRect();
      if (!q.width) return false;
      const hr = h.getBoundingClientRect();
      return q.right > hr.left + h.clientLeft + h.clientWidth - parseFloat(getComputedStyle(h).paddingRight) + 0.5;
    });
    for (const n of over) n.classList.add('is-free');
  };
  free();
  if ('ResizeObserver' in window) {                // text size and width changes alike
    const ro = new ResizeObserver(free);
    for (const n of nws) ro.observe(n);
    for (const h of new Set(hosts.values())) if (h) ro.observe(h);
  } else addEventListener('resize', free);
}
