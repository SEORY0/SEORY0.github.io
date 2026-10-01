/* KKACHI 자개 상감 — shared inlay module (home spec §13, subpage spec §2).
   Usage: <script type="module" src="../../assets/kkachi/inlay.js"></script>, once per page, after the markup.

   Every <canvas class="inlay"> gets one najeon shader, drawn still (animate:false) and redrawn only when the viewing angle
   changes — real shell changes colour with the angle, not with time. Without JS or WebGL the canvases keep their CSS
   background (the najeon tile, kk.css §5); without WebGL the runtime falls back to that same tile by itself.
   Motion off (prefers-reduced-motion, or the #kk-still pause switch) stops following the pointer and keeps the colour
   it had; switching back hands the instances the last pointer position. Each canvas gets one instance for the life of
   the page (only a restored GL context builds a new one): the runtime frees no GL objects on destroy().

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
const tileUrl = new URL('../najeon/tiles/najeon-512.webp', import.meta.url).href;
const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };

function init({ najeon }) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)'), pause = document.getElementById('kk-still');
  // still: motion is off. sx, sy: where the pointer was when it went off. live: a position is being handed over.
  let still = false, live = false, px = null, py = null, sx = null, sy = null;
  // The runtime reads the pointer across the canvas's own rect; on an 88px inlay the colours would lap the whole locus
  // every few tiles. All pieces sit in one lacquer board, so they share one viewing angle, read across a board 6x the
  // viewport (centred): screen corner to corner the colour slides about ±0.05 of the locus, inside each piece's pearl window.
  // While motion is off the board is an empty rect: the runtime's pointer handler returns early on it, so the angle stays
  // where the pointer left it (the runtime has no setter for interactive/angle, and rebuilding would leak GL objects).
  const board = () => (still && !live ? new DOMRect()
    : new DOMRect(-2.5 * innerWidth, -2.5 * innerHeight, 6 * innerWidth, 6 * innerHeight));
  addEventListener('pointermove', (e) => { if (e.isTrusted) { px = e.clientX; py = e.clientY; } }, { passive: true });
  // the runtime takes the viewing angle only from pointermove: hand every instance a position (the one motion stopped
  // at while still, else the pointer's), through the board even while still
  const follow = () => {
    const x = still ? sx : px, y = still ? sy : py;
    if (x === null) return;
    live = true;
    try { dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y })); } finally { live = false; }
  };
  const inlays = [...document.querySelectorAll('canvas.inlay')].map((canvas) => {
    const opts = { scale: num(canvas.dataset.scale, DEFAULT_SCALE), angle: num(canvas.dataset.angle, DEFAULT_ANGLE), animate: false, interactive: true, tileUrl };
    canvas.getBoundingClientRect = board;
    const i = { handle: najeon(canvas, opts) };
    // the runtime lets the browser restore a lost context but does not redraw it (the inlay would stay black): the one
    // place an instance is rebuilt; it starts at its base angle, so it is handed the current position
    canvas.addEventListener('webglcontextrestored', () => { i.handle.destroy(); i.handle = najeon(canvas, opts); follow(); });
    return i;
  });
  if (!inlays.length) return;
  function apply() {
    const stop = reduce.matches || !!(pause && pause.checked);
    if (stop === still) return;
    if (stop) { sx = px; sy = py; }       // the angle the pointer gave stays
    still = stop;
    if (!stop) follow();                  // back on: from wherever the pointer is now
  }
  apply();
  reduce.addEventListener('change', apply);
  if (pause) pause.addEventListener('change', apply);
}

// only a failed load of the runtime is swallowed (the tiles stay); errors inside init surface as unhandled rejections.
// (module scripts run after parsing, so every canvas is in the document here; no inlay, no runtime download)
if (document.querySelector('canvas.inlay')) import('../najeon/najeon.js').then(init, () => {});
