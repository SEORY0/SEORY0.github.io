/* /assets/js/scroll-video.js
 * Don Quixote ambient video — position-bound + RAF lerp.
 *
 * scrollY → video.currentTime (modulo duration). Smooth lerp via requestAnimationFrame.
 * scroll down → forward, scroll up → reverse. Video is always paused; we manipulate
 * currentTime directly so play/pause toggling doesn't introduce frame jumps.
 *
 * Tuning knobs:
 *   SCROLL_PER_SEC — px of scroll per second of video (lower = faster, higher = slower)
 *   SMOOTHING      — lerp factor per RAF tick (0 = no move, 1 = instant)
 */

document.addEventListener('DOMContentLoaded', function () {
    var video = document.querySelector('.home-side-video video');
    if (!video) return;

    // Video is CSS-hidden ≤1100px — skip listener attachment for perf
    if (!window.matchMedia('(min-width: 1100px)').matches) return;

    // Accessibility: respect reduce-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var SCROLL_PER_SEC = 1200;   // 1200 px scroll = 1 s of video time
    var SMOOTHING = 0.12;         // lerp factor per RAF tick
    var EPSILON = 0.005;          // settled threshold (seconds)

    var duration = 0;
    var targetTime = 0;
    var displayedTime = 0;
    var rafId = null;

    function mod(n, m) { return ((n % m) + m) % m; }

    function readTarget() {
        return mod(window.scrollY / SCROLL_PER_SEC, duration);
    }

    // Shortest signed distance through the loop boundary.
    // e.g. duration 4s, current 3.9s, target 0.1s → diff = +0.2s (not -3.8s)
    function shortestDiff(target, current, total) {
        var diff = target - current;
        var half = total / 2;
        if (diff > half) diff -= total;
        if (diff < -half) diff += total;
        return diff;
    }

    function step() {
        if (duration <= 0) {
            rafId = requestAnimationFrame(step);
            return;
        }

        var diff = shortestDiff(targetTime, displayedTime, duration);

        if (Math.abs(diff) < EPSILON) {
            displayedTime = targetTime;
            rafId = null;                       // settled — stop RAF until next scroll
        } else {
            displayedTime = mod(displayedTime + diff * SMOOTHING, duration);
            rafId = requestAnimationFrame(step);
        }

        // Avoid spamming currentTime when change is negligible
        // (mitigates Safari VP9 alpha decoder seek stutter)
        if (Math.abs(video.currentTime - displayedTime) > EPSILON) {
            video.currentTime = displayedTime;
        }
    }

    function onScroll() {
        targetTime = readTarget();
        if (rafId === null) rafId = requestAnimationFrame(step);
    }

    function init() {
        duration = video.duration;
        if (!isFinite(duration) || duration <= 0) return;
        video.pause();
        targetTime = readTarget();
        displayedTime = targetTime;
        video.currentTime = displayedTime;
    }

    if (video.readyState >= 1) init();
    else video.addEventListener('loadedmetadata', init);

    window.addEventListener('scroll', onScroll, { passive: true });
});
