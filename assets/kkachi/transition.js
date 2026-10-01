/* KKACHI 금문 전환 — the page transition between the six KKACHI pages.
   Spec: docs/superpowers/specs/2026-09-30-kkachi-paper-pages-design.md §2. It is the one exception to home spec §9: the
   금문 pattern (ㄲ translated and repeated) appears here, on the transition curtain, and nowhere else. The pattern is
   kkachi/drafts/c-pattern-tile-dark.svg at 1:1 — the unmodified C′1 master path in #363333 on lacquer #292623, bricks of
   76 × 136 px with modules at (14,10), (−24,78), (52,78) from the viewport's top-left, so a module is 48 px (the ㄲ ink
   42 px). Modules only ever TRANSLATE: no rotation, no tilt, no scale, no circle.

   Usage (every KKACHI page):
     1. paste the head snippet below, verbatim, into <head> BEFORE the stylesheets;
     2. <script type="module" src="../../assets/kkachi/transition.js"></script> (anywhere; modules run after parsing).

   Leaving. A click on a link to another KKACHI page (/kkachi/{home,method,console,report,notes,waitlist}/, with or
   without the trailing slash or index.html) is taken over: a fixed lacquer curtain fades in (140 ms, the empty lacquer
   screen), then every ㄲ slides in from its lower left (−d,+d) to its place, fading in, 320 ms each, started in
   diagonal order: the delay grows with the module's normalised x − y, so the wave spreads from the bottom-left corner
   to the top-right one (all in by 560 ms; the whole cover ≈ 0.7 s). The target is prefetched meanwhile (and already on
   pointer-over / focus of the link). When the lattice is complete the page stamps sessionStorage and navigates.
   Left alone: modifier or middle clicks, target=…, download, a link to this same page (hash jumps), other origins,
   clicks a page script already handled (defaultPrevented), links marked data-kk-plain, and everything under
   prefers-reduced-motion: reduce. A second click while leaving is swallowed. A plain link to this very page with no
   hash (the top bar's current page) does not reload it: the page goes back to its top (smooth; instant under reduced
   motion) and focus moves to <main id="main">, as after a fresh load.

   Arriving. The head snippet reads the stamp (valid ≈ 4 s, for this exact path, consumed on read) and adds
   html.kk-arriving before the first paint; its CSS paints the lattice on a fixed html::after, so the first frame of the
   new page is the finished cover (no white flash). This module then lays its own curtain over it and removes the class,
   waits for the web fonts (at most 400 ms) and lifts it: the ㄲ leave towards their upper right (+d,−d) in the same
   diagonal order, then the lacquer fades (≈ 0.5 s; hero drawings wait for it, see the hooks below).

   Pixel-identical hand-offs. Whenever a curtain is at rest — the leaving cover's last frame, the ::after, the arrival
   curtain before it lifts — it is painted by the very same CSS: lacquer + TILE, repeated from the viewport's top-left
   (0, 34px). Only while modules move is each one its own element: an opaque window (lacquer + the same tile at the same
   origin) over its ink box + 1 px (44 px). The tile is cut 34 px down from the draft's cut (the same lattice) so that every
   window straddles a tile seam: Chrome then paints the windows through the same tiled raster as the ::after (a window
   inside one tile is drawn as a single image and its curves anti-alias differently); and opaque, a window composited
   as a moving layer has, back in place, the same pixels too (a transparent layer blends its edges ±3 levels off).
   Measured in Chromium: all identical at DPR 1, 1.5, 2 and 3; at 1.25 the resting states are identical and the windows
   (seen only once they move) are off by up to 14 levels on edge pixels. While a window fades, its lacquer square rounds
   ±1 level against the curtain (ΔL* ≈ 0.4, below visibility).

   Scrollbars. A classic scrollbar (Windows, Linux, macOS "always show") sits outside the fixed curtain; while the
   lacquer is opaque it is darkened too (color-scheme dark + scrollbar-color graphite on lacquer): html.kk-arriving (the
   snippet), then html.kk-veiled and html.kk-lifting (until the arrival lacquer starts to fade), and html.kk-leaving
   (from the moment the leaving lacquer is opaque). The flips happen under opaque lacquer, so nothing on the page is
   seen changing scheme.

   Back / forward (bfcache). A page put away under a curtain — its leaving cover, or its own arrival curtain — keeps it
   (frozen as it stood; a cover still under way is abandoned: the page never navigates by itself once restored). The
   browser may show that last frame again while it restores the page (Chromium: for ~100 ms before the page paints;
   Safari: its swipe-back snapshot), so the restored page paints the same curtain and lifts it, as on an arrival: a
   curtain at rest is laid anew (same pixels, modules for the current viewport) and lifted; one caught mid-motion fades
   out from where it stands. Never a lattice flashed over a bare page.

   Safety. A curtain can never stay: the snippet's ::after fades itself out after 3 s by CSS alone (a page whose module
   failed still shows) and at 3.3 s the snippet itself takes html.kk-arriving off and sends kk:reveal if the module
   never did; this module's own curtains have timeouts (cleared while the page sits in the bfcache, set again when it
   comes back). Without JS, or if anything here throws before the click is taken, links are plain links. Overlays are
   aria-hidden and hold no focus.

   Hooks for page scripts and CSS. html.kk-arriving is set from the first paint of a covered arrival and html.kk-veiled
   while the module's arrival curtain is still closed; at the moment it starts to lift the class goes and document gets
   one `kk:reveal` event (also when the arrival is skipped, and from the snippet if this module never runs; a page
   restored from the bfcache gets none, unless it was put away before its arrival curtain had lifted). A page that
   wants an entrance to play after the curtain waits for it:
     const lifted = document.documentElement.matches('.kk-arriving, .kk-veiled')
       ? new Promise((r) => document.addEventListener('kk:reveal', r, { once: true })) : Promise.resolve();
   and CSS holds a load animation with html:is(.kk-arriving, .kk-veiled) … { animation-play-state: paused }
   (kk-paper.css already holds .pp-draw--load so).

   The head snippet — paste verbatim; the tile data URI must stay identical to TILE below:
<!-- kk-transition:start (assets/kkachi/transition.js) -->
<style>html.kk-arriving{color-scheme:dark;scrollbar-color:#363333 #292623}html.kk-arriving::after{content:"";position:fixed;inset:0;z-index:2147483647;pointer-events:none;background:#292623 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='76' height='136'%3E%3Cpath id='k' fill='%23363333' transform='translate(14 112)' d='M15 3H45V33C42.5 22.75 36 29.75 36 16.5V12H31.5C18.25 12 25.25 5.5 15 3ZM3 15H33V45C30.5 34.75 24 41.75 24 28.5V24H19.5C6.25 24 13.25 17.5 3 15Z'/%3E%3Cuse href='%23k' y='-136'/%3E%3Cuse href='%23k' x='38' y='-68'/%3E%3Cuse href='%23k' x='-38' y='-68'/%3E%3C/svg%3E") 0 34px/76px 136px;animation:kk-failsafe .3s 3s forwards}@keyframes kk-failsafe{to{opacity:0;visibility:hidden}}</style>
<script>try{let s=sessionStorage,k=(s.getItem("kk-arrive")||"").split(" "),r=document.documentElement;s.removeItem("kk-arrive");Date.now()-k[0]<4e3&&k[1]==location.pathname&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&(r.classList.add("kk-arriving"),setTimeout(function(){r.classList.contains("kk-arriving")&&(r.classList.remove("kk-arriving"),document.dispatchEvent(new Event("kk:reveal")))},3300))}catch(e){}</script>
<!-- kk-transition:end -->
*/

const PAGES = /^\/kkachi\/(home|method|console|report|notes|waitlist)(?:\/(?:index\.html)?)?$/;
const KEY = 'kk-arrive';
// the draft brick, cut 34 px lower (same lattice): A (14,10) now straddles the tile's top/bottom seam, B (52,78) its side seam
const TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='76' height='136'%3E%3Cpath id='k' fill='%23363333' transform='translate(14 112)' d='M15 3H45V33C42.5 22.75 36 29.75 36 16.5V12H31.5C18.25 12 25.25 5.5 15 3ZM3 15H33V45C30.5 34.75 24 41.75 24 28.5V24H19.5C6.25 24 13.25 17.5 3 15Z'/%3E%3Cuse href='%23k' y='-136'/%3E%3Cuse href='%23k' x='38' y='-68'/%3E%3Cuse href='%23k' x='-38' y='-68'/%3E%3C/svg%3E")`;
const TW = 76, TH = 136, CUT = 34, M = 48;  // brick, tile cut, module box (px, 1:1 with the draft tile)
const MODS = [[14, 10], [52, 78]];         // per brick; the draft's third copy (−24,78) is (52,78) of the brick to the left
const INK = 2, K = 44;                     // a module's window in its 48 box: the ㄲ ink box (3…45) + 1 px of lacquer, so
                                           // window edges never cut ink (even on half device pixels), and two windows 24 px
                                           // out along the diagonal only touch: a moving square never covers a neighbour
const D = 24;                              // slide distance per axis, px
const EASE = 'cubic-bezier(.2,.7,.2,1)';
const COVER = { fade: 140, each: 320, spread: 240 };               // 140 + 240 + 320 = 700 ms
const REVEAL = { hold: 400, each: 280, spread: 180, fadeAt: 220, fade: 240 };   // 180 + 280 = 460, fade ends 460 ms
const LATE = 2800;                         // ms the snippet's curtain has shown: past it, its own fade (at 3 s) is near

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const canon = (u) => { const m = PAGES.exec(u.pathname); return m ? `/kkachi/${m[1]}/` : null; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

let storage = false;
try { sessionStorage.setItem(KEY + '-t', '1'); sessionStorage.removeItem(KEY + '-t'); storage = true; } catch (e) { /* no stamp, no transition */ }
const able = storage && typeof Element.prototype.animate === 'function';

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  const s = document.createElement('style');
  // custom element names: no page rule can reach them. The curtain is a child of <html>, outside <body>, so no
  // containment or transform on the body can become its containing block. [data-rest]: the curtain at rest, painted
  // exactly as the snippet's ::after (its modules hidden).
  // html.kk-veiled / .kk-lifting / .kk-leaving: a classic scrollbar beside the curtain goes dark (as under kk-arriving)
  s.textContent = 'html:is(.kk-veiled,.kk-lifting,.kk-leaving){color-scheme:dark;scrollbar-color:#363333 #292623}'
    + 'kk-curtain{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:block;overflow:hidden;'
    + 'contain:strict;background:#292623;pointer-events:none}kk-curtain[data-hold]{pointer-events:auto;cursor:progress}'
    + `kk-curtain[data-rest]{background:#292623 ${TILE} 0 ${CUT}px/${TW}px ${TH}px}kk-curtain[data-rest] kk-m{visibility:hidden}`
    + `kk-m{position:absolute;display:block;width:${K}px;height:${K}px;background:#292623 ${TILE} 0 0/${TW}px ${TH}px repeat}`;
  document.head.append(s);
}

// A lacquer curtain holding every module that shows in the viewport, each an opaque window (lacquer + tile, like the
// ::after) over its ink box, at the ::after's origin: opaque, so a module moved as a composited layer and put back
// still has the tiled paint's exact pixels. u: the module's place on the bottom-left → top-right diagonal, 0…1.
function curtain({ hold = false, rest = false } = {}) {
  style();
  const el = document.createElement('kk-curtain');
  el.setAttribute('aria-hidden', 'true');
  if (hold) el.dataset.hold = '';
  if (rest) el.dataset.rest = '';
  root.append(el);
  const W = el.clientWidth || innerWidth, H = el.clientHeight || innerHeight;
  const mods = [], frag = document.createDocumentFragment();
  for (let y0 = 0; y0 < H; y0 += TH) {
    for (let x0 = -TW; x0 < W; x0 += TW) {
      for (const [mx, my] of MODS) {
        const x = x0 + mx, y = y0 + my;
        const l = x + INK, t = y + INK;
        if (l + K <= 0 || l >= W || t >= H) continue;
        const m = document.createElement('kk-m');
        m.style.cssText = `left:${l}px;top:${t}px;background-position:${-l}px ${CUT - t}px`;
        frag.append(m);
        const c = M / 2;
        mods.push({ el: m, u: Math.min(1, Math.max(0, (x + c - (y + c) + H) / (W + H))) });
      }
    }
  }
  el.append(frag);
  return { el, mods };
}

let leaving = false, timers = [], abandon = null, epoch = 0;   // epoch: bumped when the page is put away (bfcache)
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const animsOf = (el) => (typeof el.getAnimations === 'function' ? el.getAnimations({ subtree: true }) : []);
function lift(el, ms = 200) {
  const a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: 'linear', fill: 'forwards' });
  a.finished.then(() => el.remove(), () => el.remove());
  later(() => el.remove(), ms + 200);
}

// ── leaving ──
function prefetched() {
  const seen = new Set();
  return (url) => {
    const h = url.href.split('#')[0];
    if (seen.has(h)) return;
    seen.add(h);
    const l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = h;
    document.head.append(l);
  };
}
const prefetch = prefetched();

// the KKACHI page a click (or a hover) is headed for, or null when the browser should just follow the link
function destination(e) {
  const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
  if (!a || a.hasAttribute('download') || a.hasAttribute('data-kk-plain')) return null;
  const t = a.getAttribute('target');
  if (t && t !== '_self') return null;
  let url;
  try { url = new URL(a.getAttribute('href'), a.baseURI); } catch (err) { return null; }
  if (url.origin !== location.origin) return null;
  const path = canon(url);
  if (!path || path === canon(location)) return null;       // not a KKACHI page, or this page (hash jumps included)
  url.pathname = path;
  return { url, path };
}

function leave({ url, path }) {
  leaving = true;
  prefetch(url);
  const c = curtain({ hold: true });
  const anims = [c.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: COVER.fade, easing: 'linear', fill: 'both' })];
  for (const m of c.mods) {
    anims.push(m.el.animate(
      [{ transform: `translate(${-D}px,${D}px)`, opacity: 0 }, { transform: 'translate(0,0)', opacity: 1 }],
      { duration: COVER.each, delay: COVER.fade + COVER.spread * m.u, easing: EASE, fill: 'both' }));
  }
  // the lacquer is opaque: now the page's own scrollbar may go dark too (nothing on the page flips visibly)
  anims[0].finished.then(() => { if (leaving) root.classList.add('kk-leaving'); }, () => {});
  let gone = false;
  const go = () => {
    if (gone) return;
    gone = true;
    try { sessionStorage.setItem(KEY, `${Date.now()} ${path}`); } catch (e) { /* the new page simply opens uncovered */ }
    location.assign(url.href);
    // still here (the navigation was stopped, or it downloads): open up again
    later(() => { leaving = false; root.classList.remove('kk-leaving'); lift(c.el); }, 4000);
  };
  // back / forward during the cover puts this page away (bfcache) before go(): stow() calls this, so the page, if it is
  // restored, never navigates by itself; the cover stays as it stood (paused), for restore() to take off.
  abandon = () => { gone = true; anims.forEach((a) => a.pause()); };
  // lattice complete: rest the curtain (the ::after's own paint) and navigate once that frame is on screen — it is what
  // stays up until the next page paints the same pixels. The timer covers a background tab, where nothing animates.
  const rested = () => { c.el.dataset.rest = ''; frame().then(frame).then(go); };
  Promise.all(anims.map((a) => a.finished)).then(rested, go);
  later(go, COVER.fade + COVER.spread + COVER.each + 400);
}

// a plain link to this very page, no hash (the top bar's current page): back to the top instead of a reload
function here(e) {
  const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
  if (!a || a.hasAttribute('download') || a.hasAttribute('data-kk-plain') || a.getAttribute('href').includes('#')) return false;
  const t = a.getAttribute('target');
  if (t && t !== '_self') return false;
  let url;
  try { url = new URL(a.getAttribute('href'), a.baseURI); } catch (err) { return false; }
  const path = canon(url);
  return url.origin === location.origin && !!path && path === canon(location) && url.search === location.search;
}
function toTop() {
  const main = document.getElementById('main');
  if (main && main.hasAttribute('tabindex')) main.focus({ preventScroll: true });
  scrollTo({ top: 0, left: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
}

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const d = destination(e);
  if (!d) {
    if (!leaving && here(e)) { e.preventDefault(); toTop(); }
    return;
  }
  if (leaving) { e.preventDefault(); return; }             // double click: one cover, one navigation
  if (!able || reduce.matches) return;                     // plain navigation
  try { leave(d); e.preventDefault(); } catch (err) { leaving = false; }   // anything wrong: the link just works
});

const warm = (e) => { const d = destination(e); if (d) prefetch(d.url); };
if (!(navigator.connection && navigator.connection.saveData)) {
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('focusin', warm);
}

// ── arriving ──
// one kk:reveal per covered arrival: at the lift, or from the fail-safe — whichever comes first
let veiled = false;
function reveal() {
  root.classList.remove('kk-veiled');
  if (!veiled) return;
  veiled = false;
  document.dispatchEvent(new Event('kk:reveal'));
}

// lift a curtain at rest: the ㄲ leave towards their upper right in diagonal order, then the lacquer fades
function uncover(c) {
  later(() => c.el.remove(), 3000);                          // a lift that never finishes (a background tab) still clears
  root.classList.remove('kk-leaving');
  root.classList.add('kk-lifting');                          // the scrollbar stays dark until the lacquer starts to fade
  later(() => root.classList.remove('kk-lifting'), REVEAL.fadeAt);
  reveal();
  delete c.el.dataset.rest;                                  // the modules take over from the tile as they start to move
  const anims = c.mods.map((m) => m.el.animate(
    [{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${D}px,${-D}px)`, opacity: 0 }],
    { duration: REVEAL.each, delay: REVEAL.spread * m.u, easing: EASE, fill: 'forwards' }));
  anims.push(c.el.animate([{ opacity: 1 }, { opacity: 0 }],
    { duration: REVEAL.fade, delay: REVEAL.fadeAt, easing: 'linear', fill: 'forwards' }));
  Promise.all(anims.map((a) => a.finished)).then(() => c.el.remove(), () => c.el.remove());
}

function arrive() {
  if (!root.classList.contains('kk-arriving')) return;
  veiled = true;
  // how long the snippet's ::after has been up (its fail-safe animation starts with it)
  const own = document.getAnimations && document.getAnimations().find((a) => a.animationName === 'kk-failsafe');
  const shown = own && own.currentTime !== null ? own.currentTime : performance.now();
  let c = null;
  if (able && !reduce.matches && shown < LATE) {
    try { c = curtain({ rest: true }); } catch (err) { c = null; }
  }
  root.classList.remove('kk-arriving');
  if (!c) { reveal(); return; }
  root.classList.add('kk-veiled');
  const failsafe = setTimeout(() => { c.el.remove(); reveal(); }, 3000);   // whatever happens below, the page shows
  timers.push(failsafe);
  const fonts = document.fonts ? document.fonts.ready : null, ep = epoch;
  Promise.race([fonts, wait(REVEAL.hold)]).then(frame).then(() => {
    if (!veiled || ep !== epoch) return;                     // the fail-safe came first, or the page was put away
    clearTimeout(failsafe);
    uncover(c);
  });
}
arrive();

// back / forward from the bfcache. Put away (pagehide persisted: the next page has already committed, nothing of this one
// is painted any more), the page keeps its curtain as it stands: frozen, its timers and any cover under way dropped.
// Restored (pageshow persisted), it lifts it — the first frames of the restored page are that curtain again, so the
// frame a browser may still be showing from before it went away (the lattice) is simply the start of the reveal.
function stow() {
  epoch++;                                                   // an arrival chain still waiting (fonts, hold) stands down
  timers.forEach(clearTimeout);
  timers = [];
  if (abandon) { abandon(); abandon = null; }                // a cover still under way never navigates after all
  root.querySelectorAll('kk-curtain').forEach((el) => animsOf(el).forEach((a) => a.pause()));
}
function restore() {
  timers.forEach(clearTimeout);
  timers = [];
  abandon = null;
  leaving = false;
  if (root.classList.contains('kk-arriving')) { root.classList.remove('kk-arriving'); veiled = true; }
  const old = [...root.querySelectorAll('kk-curtain')];
  const drop = (el) => { animsOf(el).forEach((a) => a.cancel()); el.remove(); };
  let c = null;
  if (old.some((el) => el.hasAttribute('data-rest')) && able && !reduce.matches) {
    try { c = curtain({ rest: true }); } catch (err) { c = null; }
  }
  if (c) {                                                   // at rest: the same pixels, laid anew, then lifted
    old.forEach(drop);
    const ep = epoch;
    frame().then(frame).then(() => { if (ep === epoch && c.el.isConnected) uncover(c); });
    later(() => { c.el.remove(); reveal(); root.classList.remove('kk-leaving', 'kk-lifting'); }, 3000);
    return;
  }
  // caught mid-motion (a cover or a lift under way), or motion is off now: fade out from where it stands
  root.classList.remove('kk-leaving', 'kk-lifting');
  reveal();
  for (const el of old) {
    if (reduce.matches || !able) { drop(el); continue; }
    const from = +getComputedStyle(el).opacity;
    const a = el.animate([{ opacity: from }, { opacity: 0 }], { duration: REVEAL.fade, easing: 'linear', fill: 'forwards' });
    a.finished.then(() => drop(el), () => el.remove());
    later(() => el.remove(), REVEAL.fade + 200);
  }
}
addEventListener('pagehide', (e) => { if (e.persisted) stow(); });
addEventListener('pageshow', (e) => { if (e.persisted) restore(); });
