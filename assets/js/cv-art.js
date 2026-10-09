/* /assets/js/cv-art.js
 * The home cat. It decodes from ASCII noise on load, left to right, and
 * again when hovered; then it sits there and blinks every few seconds.
 * Static under reduced motion.
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
        out += c === ' ' ? ' ' : (x < cut - y * 0.6 ? c : pick());
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
  el.addEventListener('mouseenter', function () { decode(700); });

  /* Blink: the eyes are the two "o" glyphs; shut for 140 ms every 4 s,
     sometimes twice, like a real cat. */
  function blink(times) {
    if (raf) return;
    el.textContent = art.replace(/o/g, '-');
    setTimeout(function () {
      if (!raf) el.textContent = art;
      if (times > 1) setTimeout(function () { blink(times - 1); }, 160);
    }, 140);
  }
  setInterval(function () {
    if (document.hidden) return;
    blink(Math.random() < 0.25 ? 2 : 1);
  }, 4000);
})();
