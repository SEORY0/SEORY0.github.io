/* KKACHI 금문 전환 — the page transition between the four KKACHI marketing pages (home, why, notes, waitlist).
   Spec: docs/superpowers/specs/2026-09-30-kkachi-paper-pages-design.md §2; pages per the v3 spec
   (2026-10-02-kkachi-v3-unified-design.md §1): /kkachi/system/ and /kkachi/dashboard/ are left out — links to and from
   them are plain links, and those pages carry neither the head snippet nor this module. It is the one exception to home spec §9: the
   금문 pattern (ㄲ translated and repeated) appears here, on the transition curtain, and nowhere else. The pattern is
   kkachi/drafts/c-pattern-tile-dark.svg at 1:1 — the unmodified C′1 master path in #363333 on lacquer #292623, bricks of
   76 × 136 px with modules at (14,10), (−24,78), (52,78) from the viewport's top-left, so a module is 48 px (the ㄲ ink
   42 px). Modules only ever TRANSLATE: no rotation, no tilt, no scale, no circle.

   Usage (every KKACHI marketing page: home, why, notes, waitlist):
     1. paste the head snippet below, verbatim, into <head> BEFORE the stylesheets;
     2. <script type="module" src="../../assets/kkachi/transition.js"></script> (anywhere; modules run after parsing).

   Leaving. A click on a link to another KKACHI marketing page (/kkachi/{home,why,notes,waitlist}/, with or without the
   trailing slash or index.html) is taken over: in the click's own frame a fixed curtain of solid lacquer
   wipes in across the screen from the bottom-left corner to the top-right one (a straight 45° edge along
   x − y = const, 150 ms, EASE: the empty lacquer screen; see slab()); the modules are built in the frame after, and
   once the lacquer is whole
   every ㄲ slides in from its lower left (−d,+d) to its place, fading in, 150 ms each, started in diagonal order: the
   delay grows with the module's normalised x − y over 300 ms — twice one module's own move, so the lattice travels as
   a front from the bottom-left corner to the top-right one (the whole cover 0.6 s). The target is prefetched
   meanwhile (and already on pointer-over / focus of the link). When the lattice is complete the page stamps
   sessionStorage and navigates. While the lacquer is whole the page under it is hushed (html.kk-hush: its CSS
   animations paused, so the wave has the main thread; nothing of the page shows).
   Left alone: modifier or middle clicks, target=…, download, a link to this same page (hash jumps), other origins,
   clicks a page script already handled (defaultPrevented), links marked data-kk-plain, and everything under
   prefers-reduced-motion: reduce. A second click while leaving is swallowed. A plain link to this very page with no
   hash (the top bar's current page) does not reload it: the page goes back to its top (smooth; instant under reduced
   motion) and focus moves to <main id="main">, as after a fresh load.

   Slow networks. The stamp carries its own validity ("time path ttl"; the snippet reads ttl, 4 s when absent): 8 s
   where navigator.connection says the network is slow (effectiveType slow-2g, 2g or 3g), else 4 s, and the leaving
   page's "still here" reopen waits as long — so on a slow link the cover holds while the next page downloads and that
   page still arrives under its curtain.

   Arriving. The head snippet reads the stamp (valid for its ttl, for this exact path, consumed on read) and adds
   html.kk-arriving before the first paint; its CSS paints the lattice on a fixed html::after, so the first frame of the
   new page is the finished cover (no white flash). This module then lays its own curtain over it and removes the class,
   waits for the web fonts (at most 60 ms) and lifts it: the ㄲ leave towards their upper right (+d,−d) in the same
   diagonal order (150 ms each, spread over 260 ms), and the lacquer wipes away behind them, bottom-left to top-right,
   its edge passing each place once that module has left (from 105 ms, over 260 ms; the page is whole at 0.37 s and
   the curtain goes then — hero drawings wait for the lift to start, see the hooks below). Click to readable page
   ≈ 1.2 s on a local server. No frame is a grey wash: every pixel is lacquer, a module, or the page itself, but for
   the anti-aliased edge. Both wipes and all module moves are compositor animations (transform, opacity), started on
   one clock (sync()), so a busy page cannot make them stutter or drift apart.

   Pixel-identical hand-offs. Whenever a curtain is at rest — the leaving cover's last frame, the ::after, the arrival
   curtain before it lifts — it is painted by the very same CSS: lacquer + TILE, repeated from the viewport's top-left
   (0, 34px). Only while modules move is each one its own element: an opaque window (lacquer + the same tile at the same
   origin) over its ink box + 1 px (44 px). The tile is cut 34 px down from the draft's cut (the same lattice) so that every
   window straddles a tile seam: Chrome then paints the windows through the same tiled raster as the ::after (a window
   inside one tile is drawn as a single image and its curves anti-alias differently); and opaque, a window composited
   as a moving layer has, back in place, the same pixels too (a transparent layer blends its edges ±3 levels off).
   Measured in Chromium: all identical at DPR 1, 1.5, 2 and 3; at 1.25 the resting states are identical and the windows
   (seen only once they move) are off by up to 14 levels on edge pixels. While a window fades, its lacquer square rounds
   ±1 level against the curtain (ΔL* ≈ 0.4, below visibility). The wipes' slab is the same solid lacquer as the
   curtain's own background, so handing the lacquer from one to the other (a cover's wipe done, a lift begun) changes
   no pixel.

   Scrollbars. A classic scrollbar (Windows, Linux, macOS "always show") sits outside the fixed curtain; while the
   lacquer is opaque it is darkened too (color-scheme dark + scrollbar-color graphite on lacquer): html.kk-arriving (the
   snippet), then html.kk-veiled and html.kk-lifting (until the arrival lacquer starts to wipe away), and html.kk-leaving
   (from the moment the leaving lacquer is whole). The flips happen under opaque lacquer, so nothing on the page is
   seen changing scheme.

   Back / forward (bfcache). A page put away under a curtain — its leaving cover, or its own arrival curtain — keeps it
   (frozen as it stood; a cover still under way is abandoned: the page never navigates by itself once restored, nor
   on top of a Back / Forward still loading — the Navigation API's navigate event tells us of one). The
   browser may show that last frame again while it restores the page (Chromium: for ~100 ms before the page paints;
   Safari: its swipe-back snapshot), so the restored page paints the same curtain and lifts it, as on an arrival: a
   curtain at rest is laid anew (same pixels, modules for the current viewport) and lifted; one caught mid-motion fades
   out from where it stands (the one place the lacquer still fades). Never a lattice flashed over a bare page. A page
   put away hushed (kk-hush) is let go again when it comes back.

   Load cost. Nothing here is on the load path beyond wiring: the module reads one class and registers listeners
   (≈3 ms with the CPU slowed 4x); the curtain's sheet waits for the first aim at a KKACHI link (warm, below) or the
   click, and an arrival builds its curtain only when it is covered. Lighthouse lists the task in which the page's
   module scripts are evaluated under this file's name, as it is the first of them: a long task there is the work of
   the modules after it (a page script that measures the layout as it runs), not of this one.

   Safety. A curtain can never stay: the snippet's ::after fades itself out after 3 s by CSS alone (a page whose module
   failed still shows) and at 3.3 s the snippet itself takes html.kk-arriving off and sends kk:reveal if the module
   never did; this module's own curtains have timeouts (cleared while the page sits in the bfcache, set again when it
   comes back); the hush goes with the curtain, with an abandoned cover and with the "still here" fallback (4 s; 8 s
   on a slow network). Without JS, or if anything here throws before the click is taken, links are plain links.
   Overlays are aria-hidden and hold no focus.

   Hooks for page scripts and CSS. html.kk-arriving is set from the first paint of a covered arrival and html.kk-veiled
   while the module's arrival curtain is still closed; at the moment it starts to lift the class goes and document gets
   one `kk:reveal` event (also when the arrival is skipped, and from the snippet if this module never runs; a page
   restored from the bfcache gets none, unless it was put away before its arrival curtain had lifted). A page that
   wants an entrance to play after the curtain waits for it:
     const lifted = document.documentElement.matches('.kk-arriving, .kk-veiled')
       ? new Promise((r) => document.addEventListener('kk:reveal', r, { once: true })) : Promise.resolve();
   and CSS holds a load animation with html:is(.kk-arriving, .kk-veiled) … { animation-play-state: paused }
   (kk-system.css already holds .kk-draw--load so; kk-system.js exports the promise above as `lifted`).

   The head snippet — paste verbatim; the tile data URI must stay identical to TILE below:
<!-- kk-transition:start (assets/kkachi/transition.js) -->
<style>html.kk-arriving{color-scheme:dark;scrollbar-color:#363333 #292623}html.kk-arriving::after{content:"";position:fixed;inset:0;z-index:2147483647;pointer-events:none;background:#292623 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='76' height='136'%3E%3Cpath id='k' fill='%23363333' transform='translate(14 112)' d='M15 3H45V33C42.5 22.75 36 29.75 36 16.5V12H31.5C18.25 12 25.25 5.5 15 3ZM3 15H33V45C30.5 34.75 24 41.75 24 28.5V24H19.5C6.25 24 13.25 17.5 3 15Z'/%3E%3Cuse href='%23k' y='-136'/%3E%3Cuse href='%23k' x='38' y='-68'/%3E%3Cuse href='%23k' x='-38' y='-68'/%3E%3C/svg%3E") 0 34px/76px 136px;animation:kk-failsafe .3s 3s forwards}@keyframes kk-failsafe{to{opacity:0;visibility:hidden}}</style>
<script>try{let s=sessionStorage,k=(s.getItem("kk-arrive")||"").split(" "),r=document.documentElement;s.removeItem("kk-arrive");Date.now()-k[0]<(k[2]||4e3)&&k[1]==location.pathname&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&(r.classList.add("kk-arriving"),setTimeout(function(){r.classList.contains("kk-arriving")&&(r.classList.remove("kk-arriving"),document.dispatchEvent(new Event("kk:reveal")))},3300))}catch(e){}</script>
<!-- kk-transition:end -->
*/

const PAGES = /^\/kkachi\/(home|why|notes|waitlist)(?:\/(?:index\.html)?)?$/;
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
// cover: the lacquer wipes in (150), then the ㄲ wave: each module 150 ms, started over 300 ms (spread = 2 × each: the
// lattice travels as a front, half the diagonal in motion at a time)
const COVER = { wipe: 150, each: 150, spread: 300 };               // 150 + 300 + 150 = 600 ms
// reveal: the ㄲ leave over the same diagonal (each 150, spread 260); the lacquer wipes away behind them, its edge at a
// place 0.7 × each after that place's module started to leave (105 → 365 ms); fade: restore()'s mid-motion path only.
// hold: the most the lift waits for the web fonts (a late swap happens under the lacquer: the wipe reaches the text later)
const REVEAL = { hold: 60, each: 150, spread: 260, liftAt: 105, lift: 260, fade: 240 };
const LATE = 2800;                         // ms the snippet's curtain has shown: past it, its own fade (at 3 s) is near

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const canon = (u) => { const m = PAGES.exec(u.pathname); return m ? `/kkachi/${m[1]}/` : null; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const slowNet = () => {                      // the browser's own estimate of the link (navigator.connection, where it exists)
  try { return /^(slow-2g|2g|3g)$/.test(navigator.connection.effectiveType); } catch (e) { return false; }
};
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
  // html.kk-hush (the lacquer whole over a leaving page): the page's own CSS animations hold still under it
  // kk-curtain[data-wipe]: the lacquer is the slab alone (kk-w, see slab()), the curtain itself clear
  s.textContent = 'html:is(.kk-veiled,.kk-lifting,.kk-leaving){color-scheme:dark;scrollbar-color:#363333 #292623}'
    + 'html.kk-hush body *,html.kk-hush body ::before,html.kk-hush body ::after{animation-play-state:paused!important}'
    + 'kk-curtain{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:block;overflow:hidden;'
    + 'contain:strict;background:#292623;pointer-events:none}kk-curtain[data-hold]{pointer-events:auto;cursor:progress}'
    + 'kk-curtain[data-wipe]{background:none}kk-w{position:absolute;left:0;top:0;display:block;will-change:transform}'
    + `kk-curtain[data-rest]{background:#292623 ${TILE} 0 ${CUT}px/${TW}px ${TH}px}kk-curtain[data-rest] kk-m{visibility:hidden}`
    + `kk-m{position:absolute;display:block;width:${K}px;height:${K}px;background:#292623 ${TILE} 0 0/${TW}px ${TH}px repeat}`;
  document.head.append(s);
}

// A lacquer curtain holding every module that shows in the viewport, each an opaque window (lacquer + tile, like the
// ::after) over its ink box, at the ::after's origin: opaque, so a module moved as a composited layer and put back
// still has the tiled paint's exact pixels. u: the module's place on the bottom-left → top-right diagonal, 0…1.
// lattice: false lays the lacquer alone (a cover's first frame); lattice(c) adds the modules later.
function curtain({ hold = false, rest = false, lattice: withLattice = true } = {}) {
  style();
  const el = document.createElement('kk-curtain');
  el.setAttribute('aria-hidden', 'true');
  if (hold) el.dataset.hold = '';
  if (rest) el.dataset.rest = '';
  root.append(el);
  const c = { el, mods: [], W: el.clientWidth || innerWidth, H: el.clientHeight || innerHeight };
  if (withLattice) lattice(c);
  return c;
}
function lattice(c) {
  const { W, H } = c, frag = document.createDocumentFragment();
  for (let y0 = 0; y0 < H; y0 += TH) {
    for (let x0 = -TW; x0 < W; x0 += TW) {
      for (const [mx, my] of MODS) {
        const x = x0 + mx, y = y0 + my;
        const l = x + INK, t = y + INK;
        if (l + K <= 0 || l >= W || t >= H) continue;
        const m = document.createElement('kk-m');
        m.style.cssText = `left:${l}px;top:${t}px;background-position:${-l}px ${CUT - t}px`;
        frag.append(m);
        const ctr = M / 2;
        c.mods.push({ el: m, u: Math.min(1, Math.max(0, (x + ctr - (y + ctr) + H) / (W + H))) });
      }
    }
  }
  c.el.append(frag);
  return c;
}

// The diagonal wipe: a square slab of lacquer, side W + H, painted lacquer on one half of a hard linear-gradient stop
// along its top-left → bottom-right diagonal (so the edge is a straight 45° line, x − y = const) and translated along
// the bottom-left → top-right diagonal. 'in' (a cover) is lacquer on its lower-left half and sweeps from beyond the
// bottom-left corner to beyond the top-right one; 'out' (a lift) is lacquer on its upper-right half, covering all at
// first, and sweeps the same way until nothing is left. A transform: it runs on the compositor, smooth however busy the
// page is (a clip-path wipe would wait for the main thread). Nothing turns: the slab only translates. Its edge sits at
// e on the modules' u diagonal (0: the bottom-left corner, 1: the top-right one) at time e × duration (linear).
function slab(c, side, opts) {
  const { W, H } = c, P = 4, S = W + H + 2 * P, d = (W + H) / 2 + P;
  const k = document.createElement('kk-w');
  k.style.width = k.style.height = `${S}px`;
  k.style.background = `linear-gradient(to top right,${side === 'in' ? '#292623 50%,transparent 50%' : 'transparent 50%,#292623 50%'})`;
  c.el.dataset.wipe = '';
  c.el.prepend(k);                                          // under the modules
  const [x, y] = side === 'in' ? [-P - d, -W - 2 * P + d] : [-H - P, 0];
  const a = k.animate([{ transform: `translate(${x}px,${y}px)` }, { transform: `translate(${x + d}px,${y - d}px)` }],
    { fill: 'both', ...opts });
  return { el: k, a };
}


// the lift's module timing: EASE over REVEAL.each, then held at the end for HOLD ms (a linear() curve sampled from
// EASE); where linear() is unknown, EASE over each alone
const HOLD = 1500;
let heldTiming = null;
function held() {
  if (heldTiming) return heldTiming;
  heldTiming = { duration: REVEAL.each, easing: EASE };
  try {
    if (!(window.CSS && CSS.supports('animation-timing-function', 'linear(0, 1)'))) return heldTiming;
    const [x1, y1, x2, y2] = [0.2, 0.7, 0.2, 1];               // EASE
    const bz = (a, b, u) => 3 * a * (1 - u) * (1 - u) * u + 3 * b * (1 - u) * u * u + u * u * u;
    const y = (x) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (bz(x1, x2, m) < x) lo = m; else hi = m; } return bz(y1, y2, (lo + hi) / 2); };
    const T = REVEAL.each + HOLD;
    const xs = [0, .02, .05, .08, .12, .16, .2, .25, .3, .36, .43, .5, .6, .7, .8, .9, 1];
    const pts = xs.map((x) => `${y(x).toFixed(4)} ${(x * REVEAL.each / T * 100).toFixed(3)}%`);
    heldTiming = { duration: T, easing: `linear(${pts.join(', ')}, 1 100%)` };
  } catch (e) { /* EASE over each */ }
  return heldTiming;
}

// one clock for a wipe and its modules: hundreds of animations made in one task may reach the compositor a frame or two
// after the slab, and a module running late would still show beside the passing edge. Started at one explicit time
// (now, or the slab's), they keep their delays to the millisecond however late each one is committed.
function sync(list, at = null) {
  const tl = document.timeline, t = at !== null && at !== undefined ? at : (tl ? tl.currentTime : null);
  if (t === null || t === undefined) return;
  for (const a of list) a.startTime = t;
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
// warm the target: <link rel=prefetch> where the browser has it; where it does not (Safari), a low-priority fetch of the
// same document fills the HTTP cache instead (same origin, no-store pages aside). Each page once.
function prefetched() {
  const seen = new Set();
  let link = true;
  try { link = document.createElement('link').relList.supports('prefetch'); } catch (e) { /* assume it does */ }
  return (url) => {
    const h = url.href.split('#')[0];
    if (seen.has(h)) return;
    seen.add(h);
    if (!link && typeof fetch === 'function') {
      try { fetch(h, { credentials: 'same-origin', priority: 'low' }).catch(() => {}); } catch (e) { /* nothing to warm */ }
      return;
    }
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
  const ttl = slowNet() ? 8000 : 4000;           // how long the stamp holds, and the cover before it reopens
  // the click's own frame: the lacquer alone, wiping in from the bottom-left corner (already one frame under way, so
  // the first frame the click paints shows it)
  const c = curtain({ hold: true, lattice: false });
  const w = slab(c, 'in', { duration: COVER.wipe, delay: -16, easing: EASE });
  const anims = [w.a];
  let gone = false;
  // the lacquer is whole: the curtain takes it over from the slab (the same colour), the page's own scrollbar may go
  // dark too, and the page hushes (nothing on it shows)
  w.a.finished.then(() => {
    delete c.el.dataset.wipe;
    w.el.remove();
    if (leaving && !gone) root.classList.add('kk-leaving', 'kk-hush');
  }, () => {});
  // still here after the stamp's ttl (the navigation was stopped, or it downloads): open up again — a curtain at rest
  // lifts as on an arrival (the wipe); one still in motion (a background tab) fades
  const reopen = () => later(() => {
    leaving = false;
    root.classList.remove('kk-leaving', 'kk-hush');
    if (c.el.hasAttribute('data-rest') && !reduce.matches) uncover(c); else lift(c.el);
  }, ttl);
  // another navigation of this page to another document while the cover is under way (Back or Forward pressed, the
  // address bar): that one goes; the cover never navigates on top of it (where the Navigation API tells us)
  const nav = window.navigation;
  const other = (e) => {
    if (gone || !e.destination || e.destination.sameDocument) return;
    gone = true;
    nav.removeEventListener('navigate', other);
    reopen();
  };
  if (nav) nav.addEventListener('navigate', other);
  const go = () => {
    if (gone) return;
    gone = true;
    if (nav) nav.removeEventListener('navigate', other);
    try { sessionStorage.setItem(KEY, `${Date.now()} ${path} ${ttl}`); } catch (e) { /* the new page simply opens uncovered */ }
    location.assign(url.href);
    reopen();
  };
  // back / forward during the cover puts this page away (bfcache) before go(): stow() calls this, so the page, if it is
  // restored, never navigates by itself; the cover stays as it stood (paused), for restore() to take off.
  abandon = () => { gone = true; anims.forEach((a) => a.pause()); root.classList.remove('kk-hush'); };
  // lattice complete: rest the curtain (the ::after's own paint) and navigate from the frame that paints it — the old
  // page keeps painting until the next one commits, and that frame is what stays up until the next page paints the
  // same pixels. The timer covers a background tab, where nothing animates.
  const rested = () => { c.el.dataset.rest = ''; frame().then(go); };   // painted in this frame, before the next page commits
  // the frame after the click's: the modules, timed from the wipe's own start (they come in once the lacquer is whole).
  // (A frame callback runs before its frame's paint: the click's frame paints the lacquer alone, the next one builds.)
  frame().then(() => requestAnimationFrame(() => {
    if (gone) return;
    try {
      lattice(c);
      const ms = c.mods.map((m) => m.el.animate(
        [{ transform: `translate(${-D}px,${D}px)`, opacity: 0 }, { transform: 'translate(0,0)', opacity: 1 }],
        { duration: COVER.each, delay: COVER.wipe - 16 + COVER.spread * m.u, easing: EASE, fill: 'both' }));
      sync(ms, w.a.startTime);                               // (still pending: they all start with this frame)
      anims.push(...ms);
    } catch (err) { /* no lattice: the lacquer alone covers, and rests as the lattice */ }
    Promise.all(anims.map((a) => a.finished)).then(rested, go);
  }));
  later(go, COVER.wipe + COVER.spread + COVER.each + 400);
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

// a KKACHI link is pointed at or focused: fetch its page, and lay in the curtain's sheet now (adding a sheet restyles the
// whole page: better while the reader aims than in the click's own frame; not at load, where it would hold up the page)
const warm = (e) => { const d = destination(e); if (d) { prefetch(d.url); if (able) style(); } };
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

// lift a curtain at rest: the ㄲ leave towards their upper right in diagonal order, and the lacquer wipes away behind
// them (its edge passes a place once that place's module has left); the page is whole when the wipe ends
function uncover(c) {
  later(() => c.el.remove(), 3000);                          // a lift that never finishes (a background tab) still clears
  root.classList.remove('kk-leaving', 'kk-hush');
  root.classList.add('kk-lifting');                          // the scrollbar stays dark until the lacquer starts to go
  later(() => root.classList.remove('kk-lifting'), REVEAL.liftAt);
  reveal();
  // the modules take over from the tile as they start to move, over the slab that holds the lacquer (same pixels)
  delete c.el.dataset.rest;
  const w = slab(c, 'out', { duration: REVEAL.lift, delay: REVEAL.liftAt, easing: 'linear' });
  // a module is clear (opacity 0) at 0.97 of its eased move, 0.7 × each in: before the edge, which passes its place
  // then, uncovers the page there (the move itself goes on unseen). Each module's animation then holds, still running,
  // until well after the curtain has gone (HOLD): a compositor animation that ends while the page's main thread is busy
  // can hand its layer back at a stale, half-faded value for a few frames — a ghost square over the page.
  const t = held();
  const ms = c.mods.map((m) => m.el.animate(
    [{ transform: 'translate(0,0)', opacity: 1 }, { opacity: 0, offset: 0.97 }, { transform: `translate(${D}px,${-D}px)`, opacity: 0 }],
    { duration: t.duration, delay: REVEAL.spread * m.u, easing: t.easing, fill: 'forwards' }));
  // a beat ahead: hundreds of animations reach the compositor a frame or so after this task; until then the curtain
  // holds still (the slab covers, the modules stand as at rest)
  const tl = document.timeline;
  sync([w.a, ...ms], tl && tl.currentTime !== null ? tl.currentTime + 34 : null);
  w.a.finished.then(() => c.el.remove(), () => c.el.remove());   // the page is whole
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
  root.classList.remove('kk-hush');                          // the page underneath moves again (still under lacquer)
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
