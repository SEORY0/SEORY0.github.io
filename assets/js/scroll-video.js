/* /assets/js/scroll-video.js
 * Don Quixote ambient scroll-sync animation — image sequence + canvas.
 *
 * Apple iPhone-style: preload 96 frames into Image[], paint to <canvas>
 * via drawImage() based on accumulated scroll distance. requestAnimationFrame
 * uses GPU; no <video> decoder seek lag.
 *
 * Forward-only: scroll in either direction advances the windmill forward.
 * Loops at modulo boundary via forward-only diff (never plays backward).
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
    var FRAME_CB = canvas.dataset.frameCb || '';     // cache buster: invalidates stale frames after re-encoding
    if (!FRAME_BASE || !FRAME_COUNT || !FRAME_PAD) return;

    var SCROLL_PER_FRAME = 25;     // 25 px scroll = 1 frame advance
    var SMOOTHING = 0.18;          // lerp factor per RAF tick
    var EPSILON = 0.05;            // settled threshold (in frames)

    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    var frames = new Array(FRAME_COUNT);
    var firstFramePainted = false;

    var targetFrame = 0;
    var displayedFrame = 0;
    var rafId = null;

    // Accumulated absolute scroll distance — drives forward-only advance.
    // Scrolling up or down both add to this total, so the windmill never reverses.
    var totalScroll = 0;
    var lastScrollY = window.scrollY;

    function pad(n) {
        var s = String(n);
        while (s.length < FRAME_PAD) s = '0' + s;
        return s;
    }

    function mod(n, m) { return ((n % m) + m) % m; }

    // Forward-only distance through loop boundary.
    // e.g. count=96, current=95, target=2 → diff=+3 (wrap forward, never backward).
    function forwardDiff(target, current, total) {
        var diff = target - current;
        if (diff < 0) diff += total;
        return diff;
    }

    function drawFrame(idx) {
        var img = frames[Math.floor(idx) % FRAME_COUNT];
        if (img && img.complete && img.naturalWidth > 0) {
            // Clear before drawing — RGBA frames have transparent regions, so
            // without clear the previous frame's lines stay visible underneath.
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    }

    function step() {
        var diff = forwardDiff(targetFrame, displayedFrame, FRAME_COUNT);
        if (diff < EPSILON) {
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
        var currentY = window.scrollY;
        totalScroll += Math.abs(currentY - lastScrollY);
        lastScrollY = currentY;
        targetFrame = mod(totalScroll / SCROLL_PER_FRAME, FRAME_COUNT);
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
                        // Setting canvas.width/height resets ctx state — re-apply smoothing
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        firstFramePainted = true;
                        // Start at frame 0 — subsequent scroll events advance from here
                        drawFrame(displayedFrame);
                    }
                };
            })(i, img);
            img.src = FRAME_BASE + '/f_' + pad(i + 1) + '.webp' + (FRAME_CB ? '?v=' + FRAME_CB : '');
        }
    }

    preloadFrames();
    window.addEventListener('scroll', onScroll, { passive: true });
});
