/* KKACHI — Black ICE page motion (spec: docs/superpowers/specs/2026-10-03-kkachi-black-ice-design.md §4.1, §5).
   - hero: the photograph drifts a few pixels against the pointer (the slow push-in and the beam's breathing are CSS).
   - nacre drift: the tile clipped into the proven cell and the footer ㄲ moves slowly.
   - static: cells of the scanner panel flicker like a dead channel.
   - cyberspace: the najeon shader under a lacquer canvas with a perspective grid cut out of it, drifting toward
     the viewer; the ㄲ stands on the horizon as a construct.
   Everything pauses off screen; under prefers-reduced-motion only still frames are drawn. */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tileUrl = new URL('./nacre-512.webp', import.meta.url).href;
const MARK = new Path2D('M15 3H45V33C42.5 22.75 36 29.75 36 16.5V12H31.5C18.25 12 25.25 5.5 15 3ZM3 15H33V45C30.5 34.75 24 41.75 24 28.5V24H19.5C6.25 24 13.25 17.5 3 15Z');

function whenVisible(el, enter, leave, margin = '120px') {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) (e.isIntersecting ? enter : leave)();
  }, { rootMargin: margin });
  io.observe(el);
}

/* ── nacre drift ─────────────────────────────────────────────────────────── */
function drift(selector, path, duration) {
  for (const el of document.querySelectorAll(selector)) {
    const svg = el.ownerSVGElement;
    const anim = el.animate(path.map(([x, y]) => ({ transform: `translate(${x}px, ${y}px)` })),
      { duration, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    anim.pause();
    whenVisible(svg, () => anim.play(), () => anim.pause());
  }
}

/* ── hero ────────────────────────────────────────────────────────────────── */
let najeonModule = null;
function loadNajeon() {
  najeonModule ||= import('../najeon/najeon.js');
  return najeonModule;
}

function heroPhoto() {
  const hero = document.querySelector('.hero');
  const photo = hero && hero.querySelector('.hero-photo');
  if (!photo || reduced) return;
  // a few pixels of depth: the photo drifts against the pointer, eased; nothing moves without a mouse
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
  const step = () => {
    x += (tx - x) * 0.06; y += (ty - y) * 0.06;
    photo.style.setProperty('--px', `${(x * -14).toFixed(2)}px`);
    photo.style.setProperty('--py', `${(y * -9).toFixed(2)}px`);
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(step) : 0;
  };
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
    if (!raf) raf = requestAnimationFrame(step);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(step); });
}

/* ── the static panel ────────────────────────────────────────────────────── */
function staticPanel() {
  const box = document.querySelector('[data-static]');
  if (!box) return;
  const cells = [...box.querySelectorAll('.cell')];
  const rects = cells.map((c) => c.querySelector('rect'));
  let timer = 0;
  const tick = () => {
    for (let i = 0; i < 6; i++) {
      const k = (Math.random() * cells.length) | 0;
      const v = 40 + ((Math.random() * 96) | 0);
      rects[k].setAttribute('fill', `rgb(${v},${v},${v + 4})`);
      cells[k].style.opacity = Math.random() < 0.18 ? '0.35' : '1';
    }
  };
  whenVisible(box, () => { if (!timer) timer = setInterval(tick, 90); }, () => { clearInterval(timer); timer = 0; });
}

/* ── cyberspace ──────────────────────────────────────────────────────────── */
function cyberspace() {
  const section = document.querySelector('#inlaid');
  if (!section) return;
  const nacreCanvas = section.querySelector('.cyber-nacre');
  const canvas = section.querySelector('.cyber-grid');
  const copy = section.querySelector('.cyber-copy');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, phase = 0, last = 0, raf = 0, visible = false, sky0 = 0;
  let px = 0, ppx = 0;   // pointer, eased

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(2.2e6 / Math.max(1, r.width * r.height)));
    W = r.width; H = r.height;
    sky0 = copy.getBoundingClientRect().bottom - r.top + 28;   // the sky starts under the copy
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    draw();
  };

  const draw = () => {
    if (!W || !H) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';

    const narrow = W < 700;
    const size = Math.min(W * 0.15, 180);                       // the construct
    const horizon = Math.max(sky0 + size + 56, H * 0.5);
    const sky = horizon - sky0;
    const vx = W / 2 + ppx * W * 0.04;
    const floor = H - horizon;
    const cam = 1.0;                       // camera height, in grid units
    const f = floor * 0.9;                 // focal length so the nearest line sits near the bottom
    const spacing = narrow ? 0.9 : 1;      // grid unit, world

    // longitudinal lines: world x = k * spacing, from far (z = 60) to near (z = 0.6)
    const lanes = narrow ? 9 : 16;
    for (let k = -lanes; k <= lanes; k++) {
      const wx = k * spacing;
      const zN = 0.55, zF = 60;
      const x1 = vx + (wx / zN) * f / cam, y1 = horizon + (f * cam) / zN;
      const x2 = vx + (wx / zF) * f / cam, y2 = horizon + (f * cam) / zF;
      const g = ctx.createLinearGradient(0, y2, 0, Math.min(H, y1));
      g.addColorStop(0, 'rgba(0,0,0,0.15)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x1, y1); ctx.stroke();
    }
    // transverse lines, drifting toward the viewer
    for (let i = 0; i < 40; i++) {
      const z = 0.6 + i * spacing - (phase % spacing);
      if (z <= 0.35) continue;
      const y = horizon + (f * cam) / z;
      if (y > H + 4) continue;
      const near = Math.min(1, 1.4 / z);
      ctx.globalAlpha = Math.max(0.08, Math.min(1, 2.2 / z));
      ctx.lineWidth = 0.9 + 2.8 * near;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // the horizon
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(W, horizon); ctx.stroke();

    // the construct: the ㄲ standing on the horizon, extruded
    const s = size / 42;
    const cx = vx - size / 2, cy = horizon - size - 6;
    const depth = size * 0.16;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.translate(cx + depth, cy - depth * 0.6); ctx.scale(s, s); ctx.translate(-3, -3);
    ctx.globalAlpha = 0.6; ctx.lineWidth = 1.4 / s; ctx.stroke(MARK);
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-3, -3);
    ctx.globalAlpha = 1; ctx.lineWidth = 2.8 / s; ctx.stroke(MARK);
    ctx.restore();
    // a few data towers along the skyline
    const towers = narrow ? [[-0.4, 0.07, 0.4], [0.3, 0.08, 0.28]] : [[-0.42, 0.035, 0.36], [-0.31, 0.05, 0.7], [-0.2, 0.025, 0.24], [0.17, 0.04, 0.5], [0.29, 0.03, 0.3], [0.39, 0.05, 0.46]];
    ctx.lineWidth = 1.4;
    for (const [ox, w, h] of towers) {
      const x = vx + ox * W, tw = w * W, th = h * sky;
      ctx.globalAlpha = 0.75;
      ctx.strokeRect(x, horizon - th, tw, th);
      ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.moveTo(x, horizon - th); ctx.lineTo(x + tw * 0.35, horizon - th - tw * 0.3); ctx.lineTo(x + tw * 1.35, horizon - th - tw * 0.3); ctx.lineTo(x + tw, horizon - th);
      ctx.moveTo(x + tw * 1.35, horizon - th - tw * 0.3); ctx.lineTo(x + tw * 1.35, horizon - tw * 0.3); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const loop = (t) => {
    if (!visible) { raf = 0; return; }
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    phase += dt * 0.35;
    ppx += (px - ppx) * 0.05;
    draw();
    raf = requestAnimationFrame(loop);
  };

  let nacre = null;
  const startNacre = () => {
    loadNajeon().then((m) => {
      if (visible && !nacre) nacre = m.najeon(nacreCanvas, { animate: false, interactive: !reduced, scale: 1.1, pixelBudget: 700000, tileUrl });
    }).catch(() => {});
  };

  new ResizeObserver(resize).observe(canvas);
  canvas.classList.add('live');
  if (!reduced) {
    section.addEventListener('pointermove', (e) => { const r = section.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - 0.5; }, { passive: true });
  }
  whenVisible(section, () => {
    visible = true;
    startNacre();
    if (!reduced && !raf) { last = 0; raf = requestAnimationFrame(loop); }
  }, () => {
    visible = false;
    if (nacre) { nacre.destroy(); nacre = null; }
  }, '200px');
}

if (!reduced) {
  drift('.cell-drift', [[0, 0], [-24, -18], [10, -30]], 14000);
  drift('.mark-drift', [[0, 0], [-34, -22], [-12, -40]], 30000);
  staticPanel();
}
heroPhoto();
cyberspace();
