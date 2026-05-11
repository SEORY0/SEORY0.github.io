/* /assets/js/scroll-video.js
 * Don Quixote ambient scroll-sync animation — image sequence + canvas.
 *
 * Apple iPhone-style: preload 96 JPG frames into Image[], paint to <canvas>
 * via drawImage() based on scrollY. requestAnimationFrame uses GPU; no
 * <video> decoder seek lag.
 *
 * Bidirectional: scroll down → forward, scroll up → backward.
 * Loops at modulo boundary via shortest-signed-diff.
 *
 * Tuning:
 *   SCROLL_PER_FRAME — px of scroll per 1 frame advance (lower = faster)
 *   SMOOTHING        — lerp factor per RAF tick (0=no move, 1=instant)
 */

document.addEventListener('DOMContentLoaded', function () {
    var canvas = document.querySelector('.home-side-video canvas');
    if (!canvas) return;

    // Mobile/tablet: canvas is CSS-hidden ≤1100px — skip preload + listeners for perf
    if (!window.matchMedia('(min-width: 1100px)').matches) return;

    // Accessibility: respect reduce-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var FRAME_BASE = canvas.dataset.frameBase;
    var FRAME_COUNT = parseInt(canvas.dataset.frameCount, 10);
    var FRAME_PAD = parseInt(canvas.dataset.framePad, 10);
    if (!FRAME_BASE || !FRAME_COUNT || !FRAME_PAD) return;

    var SCROLL_PER_FRAME = 25;     // 25 px scroll = 1 frame advance
    var SMOOTHING = 0.18;          // lerp factor per RAF tick
    var EPSILON = 0.05;            // settled threshold (in frames)

    var ctx = canvas.getContext('2d');
    var frames = new Array(FRAME_COUNT);
    var firstFramePainted = false;

    var targetFrame = 0;
    var displayedFrame = 0;
    var rafId = null;

    function pad(n) {
        var s = String(n);
        while (s.length < FRAME_PAD) s = '0' + s;
        return s;
    }

    function mod(n, m) { return ((n % m) + m) % m; }

    // Shortest signed distance through loop boundary.
    // e.g. count=96, current=94, target=2 → diff=+4 (not -92)
    function shortestDiff(target, current, total) {
        var diff = target - current;
        var half = total / 2;
        if (diff > half) diff -= total;
        if (diff < -half) diff += total;
        return diff;
    }

    function readTargetFrame() {
        return mod(window.scrollY / SCROLL_PER_FRAME, FRAME_COUNT);
    }

    function drawFrame(idx) {
        var img = frames[Math.floor(idx) % FRAME_COUNT];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    }

    function step() {
        var diff = shortestDiff(targetFrame, displayedFrame, FRAME_COUNT);
        if (Math.abs(diff) < EPSILON) {
            displayedFrame = targetFrame;
            drawFrame(displayedFrame);
            rafId = null;                       // settled — stop RAF until next scroll
            return;
        }
        displayedFrame = mod(displayedFrame + diff * SMOOTHING, FRAME_COUNT);
        drawFrame(displayedFrame);
        rafId = requestAnimationFrame(step);
    }

    function onScroll() {
        targetFrame = readTargetFrame();
        if (rafId === null) rafId = requestAnimationFrame(step);
    }

    function preloadFrames() {
        for (var i = 0; i < FRAME_COUNT; i++) {
            var img = new Image();
            frames[i] = img;
            // Bind closure over current index
            (function (idx, imgRef) {
                imgRef.onload = function () {
                    // Paint first frame as soon as it arrives so the canvas isn't blank
                    if (!firstFramePainted && idx === 0) {
                        canvas.width = imgRef.naturalWidth;
                        canvas.height = imgRef.naturalHeight;
                        ctx.drawImage(imgRef, 0, 0, canvas.width, canvas.height);
                        firstFramePainted = true;
                        // Sync initial scroll position once first frame is ready
                        targetFrame = readTargetFrame();
                        displayedFrame = targetFrame;
                        drawFrame(displayedFrame);
                    }
                };
            })(i, img);
            img.src = FRAME_BASE + '/f_' + pad(i + 1) + '.jpg';
        }
    }

    preloadFrames();
    window.addEventListener('scroll', onScroll, { passive: true });
});
