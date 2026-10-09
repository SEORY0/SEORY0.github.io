/* /assets/js/willow.js
 * The home willow. Nothing is drawn by hand: a trunk, a ground line and
 * two dozen hanging strands are laid into a character grid every frame.
 * The whole crown leans with a slow wind and each strand sways on a phase
 * of its own, more at the tip than at the crown. Hover sends a gust
 * through. Under reduced motion one still frame is drawn and left alone.
 */
(function () {
  var el = document.querySelector('[data-willow]');
  if (!el) return;

  var W = 36, H = 16, CX = 17;           /* grid and trunk column */
  var strands = [];
  for (var i = 0; i < 24; i++) {
    var x = 3 + Math.round(i * 30 / 23);           /* 3 .. 33 across the crown */
    var d = Math.abs(x - CX) / 15;                 /* 0 centre .. 1 edge */
    strands.push({
      x0: x,
      y0: Math.round(d * d * 4),                   /* the dome: outer strands start lower */
      len: 10 + ((i * 7) % 4) - Math.round(d * 3), /* inner strands reach the ground */
      phase: i * 0.9,
      drift: (x - CX) / 26,                        /* outer strands fall outward */
      speed: 1.1 + (i % 4) * 0.12,
      tip: i % 3 === 0 ? ',' : '\''
    });
  }

  function render(t, gust) {
    var g = [];
    for (var y = 0; y < H; y++) { g.push(new Array(W).fill(' ')); }
    var wind = Math.sin(t * 0.45) * 0.9;           /* the slow lean everyone shares */

    strands.forEach(function (s) {
      var px = s.x0;
      for (var k = 0; k < s.len; k++) {
        var y = s.y0 + k;
        if (y >= H - 1) break;
        var reach = k / s.len;                     /* tips move, crowns barely */
        var sway = Math.sin(t * s.speed + s.phase + k * 0.3) * (1.1 + gust * 0.6);
        var x = Math.round(s.x0 + s.drift * k + (sway + wind + gust) * reach);
        if (x < 0 || x >= W) { px = x; continue; }
        var dx = x - px;
        g[y][x] = k === s.len - 1 ? s.tip : (dx < 0 ? '/' : dx > 0 ? '\\' : '|');
        px = x;
      }
    });

    /* trunk and ground, drawn last so they read through the strands */
    for (var y2 = H - 7; y2 < H - 2; y2++) { g[y2][CX - 1] = '|'; g[y2][CX] = ' '; g[y2][CX + 1] = '|'; }
    g[H - 2][CX - 2] = '/'; g[H - 2][CX - 1] = ' '; g[H - 2][CX] = ' '; g[H - 2][CX + 1] = ' '; g[H - 2][CX + 2] = '\\';
    for (var x2 = 2; x2 < W - 2; x2++) { g[H - 1][x2] = '_'; }
    g[H - 1][CX - 3] = '/'; g[H - 1][CX + 3] = '\\';
    for (var x3 = CX - 2; x3 <= CX + 2; x3++) { g[H - 1][x3] = ' '; }

    el.textContent = g.map(function (r) { return r.join(''); }).join('\n');
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { render(0, 0); return; }

  var t0 = performance.now(), gust = 0;
  setInterval(function () {
    if (document.hidden) return;
    gust *= 0.92;
    render((performance.now() - t0) / 1000, gust);
  }, 100);
  el.addEventListener('mouseenter', function () { gust = 2.5; });
})();
