/* KKACHI 자개 상감 — shared inlay module (home spec §13; v3 spec §5; v4 spec §2: one shader per screen). Pages:
   - home: the wordmark ㄲ (canvas.inlay over the mark);
   - why: the F-01 seal at the 04:12 confirmation (one claim-ok seal at the graph's sink, swept once by kk:inlay-sweep
     when the replay reaches 3/3, then still; before 04:12 it is the empty traced plate, never nacre);
   - dashboard/finding: the head seal (the 48px claim-ok, 40px on phones), masked to its three pieces and shown in the
     claim-ok layer only after the rep2 → ok moment, swept once after first paint (requestIdleCallback), then still.
   Every other seal and the waitlist use the static tile (no shader).
   Usage: <script type="module" src="../../assets/kkachi/inlay.js"></script>, once per page, after the markup.

   Every <canvas class="inlay"> gets one najeon shader, drawn still (animate:false) and redrawn only when the viewing angle
   changes — real shell changes colour with the angle, not with time. Without JS or WebGL the canvases keep their CSS
   background (the najeon tile: .inlay, kk-system.css §6, --nacre); without WebGL the runtime falls back to that same
   tile by itself (tileUrl below: the same file the system's --nacre paints).
   After first paint. The shader is not part of loading: the CSS tile paints the inlays first, and the runtime is imported
   on the reader's first intent (pointermove, pointerdown, keydown, touchstart) or, failing that, at the first idle moment
   2.5 s after the page has loaded and painted (requestIdleCallback, timeout 2.5 s; at once where there is none). The shader's first frame does not cut in
   over the tile: each inlay on screen is covered by a copy of itself (a canvas with no context: the same classes, so the
   same mask, size and tile) that fades out over 300 ms; one off screen, or in a transition of its own, swaps at once.
   Motion off (prefers-reduced-motion, or the #kk-still pause switch) stops following the pointer and keeps the colour
   it had; switching back hands the instances the last pointer position. Each canvas gets one instance for the life of
   the page (only a restored GL context builds a new one): the runtime frees no GL objects on destroy().

   Touch screens ((hover: none) and (pointer: coarse)) have no pointer that hovers, so the reader's scroll stands in for
   it: while any inlay is in the viewport (IntersectionObserver), each scroll (passive, one update a frame) hands the
   instances a viewing position derived from it — x swings with sin(scrollY / 500) across 0.8 of the screen's width
   either side of its centre, y follows the scroll's progress down the page — so the shell turns as the page moves.
   A finger that drags where the page lets it (a plate with touch-action: pan-y gives trusted pointermove) takes over
   while it is down; the next scroll after it lifts hands the angle back to the scroll. Motion off: none of this
   (the colour stays, as above). The desktop pointer behaves as before.
   Sweep. document.dispatchEvent(new CustomEvent('kk:inlay-sweep', { detail: { duration: 900 } })) turns the viewing
   angle once across the board and back to where the pointer (or the scroll) has it, over duration ms (default 900):
   the shell catches the light once. If the runtime is not in yet it is brought in at once and the sweep runs when it
   is ready; where the shader cannot run (no WebGL, or the runtime failed to load) the canvases' CSS tile sweeps
   instead (a WAAPI background-position/size move of the same najeon tile, out and back). A no-op under reduced motion
   or the #kk-still pause.

   Data attributes (per canvas; read once at start):
     data-scale  shader scale (default 1.5). Keep it under 2: small pieces get thin rainbow contours and read as oil.
                 Home: ㄲ 1.5, + 1.6.
     data-angle  base viewing angle (default 0). Pick it by the plugin's criterion (chroma-weighted hue histogram, L1 to
                 ref-1, mint kept sparse), never by eye. Home: ㄲ 0, + 1.32. Two inlays on one page should differ.
   The shape comes from CSS (--inlay-mask on the canvas, e.g. .logo-inlay); an unmasked canvas.inlay is a nacre panel.
   Give the canvas width/height attributes (home: 88) so it is square even without aspect-ratio.
   najeon.js and its tile are resolved from this module's own URL, so the page path does not matter. */
const DEFAULT_SCALE = 1.5;
const DEFAULT_ANGLE = 0;
const tileUrl = new URL('./nacre-512.webp', import.meta.url).href;   // the najeon tile re-encoded (kk-system.css §1 --nacre)
const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };

// px, py: the pointer's last position, kept from the start (the first move is also what brings the runtime in).
// finger: a touch pointer is down and has moved (a drag the page let through): it gives the angle until it lifts
let px = null, py = null, finger = false;
const track = (e) => {
  if (!e.isTrusted) return;
  px = e.clientX; py = e.clientY;
  if (e.pointerType === 'touch') finger = true;
};
const lifted = (e) => { if (e.isTrusted && e.pointerType === 'touch') finger = false; };
const coarse = matchMedia('(hover: none) and (pointer: coarse)');
const stopped = () => matchMedia('(prefers-reduced-motion: reduce)').matches || !!(document.getElementById('kk-still') || {}).checked;
// touch screens: the viewing position the scroll gives (see the header)
function scrolled() {
  const W = innerWidth, H = innerHeight, y = scrollY;
  const max = Math.max(1, document.documentElement.scrollHeight - H);
  return [W / 2 + Math.sin(y / 500) * W * 0.8, H * Math.min(1, Math.max(0, y / max))];
}
// the sweep's offset at k (0…1): out across the board and back, eased at both ends
const swing = (k) => Math.sin(Math.PI * (0.5 - 0.5 * Math.cos(Math.PI * k)));
// the CSS tile's sweep (no shader): the same tile, enlarged and slid out and back
function tileSweep(canvases, ms) {
  for (const c of canvases) {
    if (typeof c.animate !== 'function') continue;
    const r = rectOf(c), S = Math.max(r.width, r.height);
    if (!S) continue;
    const at = (z, x, y) => ({ backgroundSize: `${S * z}px ${S * z}px`, backgroundPosition: `${x}% ${y}%` });
    c.animate([at(1, 50, 50), { ...at(2.2, 82, 26), offset: 0.5 }, at(1, 50, 50)], { duration: ms, easing: 'ease-in-out' });
  }
}

// the tile copies laid over the inlays on screen while the shader's first frame comes in (see the header)
const FADE = 300;
const rectOf = (el) => Element.prototype.getBoundingClientRect.call(el);
function veil(canvas) {
  const r = rectOf(canvas);
  if (!r.width || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) return null;
  const own = typeof canvas.getAnimations === 'function' ? canvas.getAnimations() : [];
  if (own.some((a) => typeof CSSTransition === 'function' && a instanceof CSSTransition)) return null;
  const c = canvas.cloneNode(false);
  c.removeAttribute('id');
  c.style.position = 'absolute';
  c.style.margin = '0';
  c.style.pointerEvents = 'none';
  c.style.width = `${canvas.offsetWidth}px`;
  c.style.height = `${canvas.offsetHeight}px`;
  c.style.left = `${canvas.offsetLeft}px`;
  c.style.top = `${canvas.offsetTop}px`;
  canvas.after(c);
  const q = rectOf(c);                       // the copy's containing block may not be the canvas's offsetParent: correct
  c.style.left = `${canvas.offsetLeft + r.left - q.left}px`;
  c.style.top = `${canvas.offsetTop + r.top - q.top}px`;
  // the same CSS animations (the +'s breathing mask), at the same time
  for (const a of own) {
    const b = c.getAnimations().find((x) => x.animationName && x.animationName === a.animationName);
    if (b && a.currentTime !== null) b.currentTime = a.currentTime;
  }
  return c;
}

function init({ najeon }) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)'), pause = document.getElementById('kk-still');
  // still: motion is off. sx, sy: where the viewing position was when it went off. live: a position is being handed
  // over. seen: inlays in the viewport (touch screens). sweeping: a sweep owns the angle.
  let still = false, live = false, sx = null, sy = null, sweeping = false;
  const seen = new Set();
  // The runtime reads the pointer across the canvas's own rect; on an 88px inlay the colours would lap the whole locus
  // every few tiles. All pieces sit in one lacquer board, so they share one viewing angle, read across a board 6x the
  // viewport (centred): screen corner to corner the colour slides about ±0.05 of the locus, inside each piece's pearl window.
  // While motion is off the board is an empty rect: the runtime's pointer handler returns early on it, so the angle stays
  // where the pointer left it (the runtime has no setter for interactive/angle, and rebuilding would leak GL objects).
  const board = () => (still && !live ? new DOMRect()
    : new DOMRect(-2.5 * innerWidth, -2.5 * innerHeight, 6 * innerWidth, 6 * innerHeight));
  // the runtime takes the viewing angle only from pointermove: hand every instance a position (the one motion stopped
  // at while still, else the pointer's — on a touch screen the scroll's, unless a finger holds it), through the board
  // even while still
  const aim = (x, y) => {
    live = true;
    try { dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y })); } finally { live = false; }
  };
  const here = () => (coarse.matches && !finger ? scrolled() : px === null ? null : [px, py]);
  const follow = () => {
    const p = still ? (sx === null ? null : [sx, sy]) : here();
    if (p) aim(p[0], p[1]);
  };
  const veils = [];
  const inlays = [...document.querySelectorAll('canvas.inlay')].map((canvas) => {
    const opts = { scale: num(canvas.dataset.scale, DEFAULT_SCALE), angle: num(canvas.dataset.angle, DEFAULT_ANGLE), animate: false, interactive: true, tileUrl };
    const v = veil(canvas);
    if (v) veils.push(v);
    canvas.getBoundingClientRect = board;
    const i = { canvas, handle: najeon(canvas, opts) };
    // the runtime lets the browser restore a lost context but does not redraw it (the inlay would stay black): the one
    // place an instance is rebuilt; it starts at its base angle, so it is handed the current position
    canvas.addEventListener('webglcontextrestored', () => { i.handle.destroy(); i.handle = najeon(canvas, opts); follow(); });
    return i;
  });
  // the shader's first frames are drawn under the copies: fade the copies out from the next frame
  if (veils.length) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      for (const v of veils) {
        const a = v.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE, easing: 'linear', fill: 'forwards' });
        a.finished.then(() => v.remove(), () => v.remove());
      }
    }));
    setTimeout(() => veils.forEach((v) => v.remove()), FADE + 1000);   // a background tab: no frames, still cleared
  }
  if (!inlays.length) return;
  function apply() {
    const stop = reduce.matches || !!(pause && pause.checked);
    if (stop === still) return;
    if (stop) { const p = here(); sx = p ? p[0] : null; sy = p ? p[1] : null; }   // the angle it had stays
    still = stop;
    if (!stop) follow();                  // back on: from wherever the pointer (the scroll) is now
  }
  apply();
  if (!still) follow();                   // the pointer that brought the runtime in already gives the angle
  reduce.addEventListener('change', apply);
  if (pause) pause.addEventListener('change', apply);

  // touch screens: the scroll turns the shell while an inlay is in view (one update a frame)
  let queued = false;
  const onScroll = () => {
    if (queued || !coarse.matches) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      if (seen.size && !still && !finger && !sweeping) follow();
    });
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target);
      onScroll();                         // one coming into view takes the scroll's colour at once
    });
    for (const i of inlays) io.observe(i.canvas);
  } else inlays.forEach((i) => seen.add(i.canvas));
  addEventListener('scroll', onScroll, { passive: true });

  // the sweep (see the header). Instances that fell back to the tile (no WebGL) sweep their tile instead.
  let sweepRaf = 0;
  const sweep = (ms) => {
    if (still) return;
    const flat = inlays.filter((i) => /url\(/.test(i.canvas.style.backgroundImage)).map((i) => i.canvas);
    if (flat.length) tileSweep(flat, ms);
    if (flat.length === inlays.length) return;
    cancelAnimationFrame(sweepRaf);
    sweeping = true;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      const W = innerWidth, H = innerHeight, p = here() || [W / 2, H / 2], o = swing(k);
      if (still) { sweeping = false; follow(); return; }   // motion went off mid-sweep: back to where it stopped
      aim(p[0] + o * 2.4 * W, p[1] - o * 1.2 * H);
      if (k < 1) sweepRaf = requestAnimationFrame(step);
      else { sweeping = false; follow(); }
    };
    sweepRaf = requestAnimationFrame(step);
  };
  return { sweep };
}

// only a failed load of the runtime is swallowed (the tiles stay); errors inside init surface as unhandled rejections.
// (module scripts run after parsing, so every canvas is in the document here; no inlay, no runtime download)
if (document.querySelector('canvas.inlay')) {
  const INTENT = ['pointerdown', 'keydown', 'touchstart'];
  const opt = { passive: true, capture: true };
  let started = false, mx = null, my = null, api = null, wanted = null, failed = false;
  const start = () => {
    if (started) return;
    started = true;
    INTENT.forEach((t) => removeEventListener(t, start, opt));
    removeEventListener('pointermove', moved, opt);
    import('../najeon/najeon.js').then((m) => {
      api = init(m) || null;
      if (wanted !== null && api && !stopped()) api.sweep(wanted);
      wanted = null;
    }, () => {
      failed = true;                      // the CSS tiles stay; a sweep asked for meanwhile moves them
      if (wanted !== null && !stopped()) tileSweep([...document.querySelectorAll('canvas.inlay')], wanted);
      wanted = null;
    });
  };
  document.addEventListener('kk:inlay-sweep', (e) => {
    const d = e && e.detail && Number(e.detail.duration);
    const ms = d > 0 ? d : 900;
    if (stopped()) return;
    if (api) api.sweep(ms);
    else if (failed) tileSweep([...document.querySelectorAll('canvas.inlay')], ms);
    else { wanted = ms; start(); }        // not in yet: bring it in now, sweep when ready
  });
  // a pointer that moves. A browser also sends pointermove when the page changes under a pointer standing still (after
  // load, a layout, a scroll), always at the same spot: that is not the reader, so it takes a change of position
  const moved = (e) => {
    if (!e.isTrusted) return;
    if (mx !== null && (e.clientX !== mx || e.clientY !== my)) start();
    mx = e.clientX; my = e.clientY;
  };
  addEventListener('pointermove', track, opt);
  addEventListener('pointermove', moved, opt);
  addEventListener('pointerup', lifted, opt);
  addEventListener('pointercancel', lifted, opt);
  INTENT.forEach((t) => addEventListener(t, start, opt));
  // no intent: the first idle moment 2.5 s after the page has loaded and painted its first content, so the shader's
  // compile — a long task on a slow device or a software GL — stays out of the loading window (measured with Lighthouse
  // mobile: TBT 300–480 ms with the compile right after load, under 150 ms like this)
  const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  const painted = new Promise((r) => {
    const has = () => performance.getEntriesByName('first-contentful-paint').length > 0;
    const types = typeof PerformanceObserver === 'function' ? PerformanceObserver.supportedEntryTypes || [] : [];
    if (has() || !types.includes('paint')) { r(); return; }
    try {
      const o = new PerformanceObserver(() => { if (has()) { o.disconnect(); r(); } });
      o.observe({ type: 'paint', buffered: true });
    } catch (e) { r(); }
  });
  Promise.all([loaded, painted]).then(() => setTimeout(() => {
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2500 });
    else start();
  }, 2500));
}
