/* /assets/js/scroll-video.js
 * Don Quixote ambient video sync — scroll velocity drives windmill rotation.
 * Plays only while user is scrolling, pauses on idle.
 */

document.addEventListener('DOMContentLoaded', function () {
    var video = document.querySelector('.home-side-video video');
    if (!video) return;

    // Mobile/tablet: video is CSS-hidden (≤1100px), skip for perf
    if (!window.matchMedia('(min-width: 1100px)').matches) return;

    // Accessibility: respect reduce-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Initial state: paused at frame 0 (autoplay attribute removed from HTML)
    video.pause();
    video.currentTime = 0;

    var lastY = window.scrollY;
    var lastTime = performance.now();
    var pauseTimer;
    var PAUSE_DELAY_MS = 150;

    function onScroll() {
        var now = performance.now();
        var dy = Math.abs(window.scrollY - lastY);
        var dt = now - lastTime;

        if (dt > 0) {
            var velocity = dy / dt; // px/ms
            // Typical slow scroll ~0.5 px/ms → ~1x rate; fast scroll → 4x clamp
            video.playbackRate = Math.min(4, Math.max(0.5, velocity * 2));
        }

        if (video.paused) {
            // play() returns Promise; suppress rejection from autoplay policy
            var p = video.play();
            if (p && typeof p.catch === 'function') p.catch(function () {});
        }

        lastY = window.scrollY;
        lastTime = now;

        clearTimeout(pauseTimer);
        pauseTimer = setTimeout(function () { video.pause(); }, PAUSE_DELAY_MS);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
});
