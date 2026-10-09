/* /assets/js/cv-art.js
 * The home CV button is a figlet "CV". This decodes it: every glyph starts
 * as ASCII noise and settles into place, left to right, along the slant.
 * Runs once on load, again on hover or focus, and every few seconds a few
 * glyphs twitch so the eye lands on it. Static under reduced motion.
 */
(function () {
  var el = document.querySelector('[data-cv]');
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var art = el.textContent;
  var lines = art.split('\n');
  var width = lines.reduce(function (m, l) { return Math.max(m, l.length); }, 0);
  var noise = '/\\|_-=+*#%@<>:;~^';
  var raf = null, last = 0;

  function pick() { return noise[Math.random() * noise.length | 0]; }

  /* t in [0, 1]: columns left of the sweep are settled, the rest is noise. */
  function frame(t) {
    var cut = t * (width + 8);
    el.textContent = lines.map(function (line, y) {
      var out = '';
      for (var x = 0; x < line.length; x++) {
        var c = line[x];
        out += c === ' ' ? ' ' : (x < cut - y * 1.2 ? c : pick());
      }
      return out;
    }).join('\n');
  }

  function decode(ms) {
    if (raf) cancelAnimationFrame(raf);
    var t0 = performance.now();
    (function step(now) {
      var t = (now - t0) / ms;
      if (t >= 1) { el.textContent = art; raf = null; return; }
      if (now - last > 45) { frame(t); last = now; }   /* ~22 fps reads as a terminal */
      raf = requestAnimationFrame(step);
    })(t0);
  }

  decode(1100);
  var link = el.closest('a') || el;
  link.addEventListener('mouseenter', function () { decode(700); });
  link.addEventListener('focus', function () { decode(700); });

  /* Idle twitch: four glyphs flip for 120 ms, every 3.5 s, unless decoding. */
  setInterval(function () {
    if (raf || document.hidden) return;
    var s = art.split('');
    for (var k = 0; k < 4; k++) {
      var i = Math.random() * s.length | 0;
      if (s[i] !== ' ' && s[i] !== '\n') s[i] = pick();
    }
    el.textContent = s.join('');
    setTimeout(function () { if (!raf) el.textContent = art; }, 120);
  }, 3500);
})();
