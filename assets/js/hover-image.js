/* assets/js/hover-image.js
 * Cursor-following preview for linked rows on the home page.
 *
 * Any row inside a [data-hover-image-group] section that carries a
 * data-hover-image URL shows that thumbnail while the pointer is over it.
 * One preview element serves every section on the page; all thumbnails live in
 * a single stacked track, so moving between rows slides the stack rather than
 * swapping the src — the change reads as one surface travelling, and no row
 * ever waits on a fresh decode.
 *
 * Images are fetched per section, on the first hover into that section, so a
 * visitor pays only for the parts of the page they actually explore.
 *
 * No animation library. The follow is a frame-rate-independent exponential
 * ease applied to a single translate; the fade, the scale and the stack slide
 * are CSS transitions in _hover-image.scss. That split keeps the motion
 * switchable from the stylesheet.
 *
 * Progressive enhancement, in three layers: rows without an image, coarse
 * pointers, and no-JS all keep the plain CV row untouched.
 */

document.addEventListener('DOMContentLoaded', function () {
    var groups = Array.prototype.slice.call(document.querySelectorAll('[data-hover-image-group]'));
    if (!groups.length) return;

    // Touch-only devices never hover — build nothing for them.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ---------------------------------------------------------------- build */

    var preview = document.createElement('div');
    preview.className = 'hover-preview';
    // Decorative: every row already carries its title and description as text.
    preview.setAttribute('aria-hidden', 'true');

    var inner = document.createElement('div');
    inner.className = 'hover-preview-inner';

    var track = document.createElement('div');
    track.className = 'hover-preview-track';

    var frameIndex = new Map();   // row -> its frame in the stack
    var unloaded = new Map();     // group -> [{img, src}] not yet fetched
    var count = 0;

    groups.forEach(function (group) {
        var pending = [];

        Array.prototype.forEach.call(group.querySelectorAll('.note'), function (row) {
            var src = row.dataset.hoverImage;
            if (!src) return;

            var img = document.createElement('img');
            img.className = 'hover-preview-frame';
            img.alt = '';
            img.width = 560;
            img.height = 350;
            img.decoding = 'async';
            track.appendChild(img);

            frameIndex.set(row, count++);
            pending.push({ img: img, src: src });
        });

        if (pending.length) unloaded.set(group, pending);
    });

    if (!count) return;

    inner.appendChild(track);
    preview.appendChild(inner);
    document.body.appendChild(preview);

    // A section's thumbnails are requested the first time the pointer reaches
    // that section, not at page load.
    function warm(group) {
        var pending = unloaded.get(group);
        if (!pending) return;
        unloaded.delete(group);
        pending.forEach(function (frame) { frame.img.src = frame.src; });
    }

    /* --------------------------------------------------------------- follow */

    var TAU = 70;             // ms — how softly the frame trails the pointer
    var targetX = 0, targetY = 0;
    var x = 0, y = 0;
    var raf = 0, last = 0, stopAt = 0;
    var active = false;

    function place() {
        preview.style.transform = 'translate3d(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px, 0)';
    }

    function frame(now) {
        var dt = last ? Math.min(now - last, 64) : 16;
        last = now;

        // Frame-rate independent: the same softness on 60Hz and 144Hz. Under
        // reduced motion the frame sits exactly on the pointer instead.
        var k = reduced.matches ? 1 : 1 - Math.exp(-dt / TAU);
        x += (targetX - x) * k;
        y += (targetY - y) * k;
        place();

        if (active || now < stopAt) {
            raf = requestAnimationFrame(frame);
        } else {
            raf = 0;
            last = 0;
        }
    }

    function start() {
        if (!raf) raf = requestAnimationFrame(frame);
    }

    /* ---------------------------------------------------------------- state */

    function show(row, event) {
        if (!active) {
            // The first painted frame must already be under the pointer, or the
            // preview flies in from the top-left corner.
            x = targetX = event.clientX;
            y = targetY = event.clientY;
            place();
            active = true;
        }

        preview.style.setProperty('--hover-preview-index', String(frameIndex.get(row)));
        preview.classList.add('is-visible');
        start();
    }

    function hide() {
        if (!active) return;
        active = false;
        preview.classList.remove('is-visible');
        // Keep following through the fade-out so the frame does not freeze
        // mid-flight, then let the loop retire.
        stopAt = performance.now() + 400;
        start();
    }

    /* -------------------------------------------------------------- wire up */

    groups.forEach(function (group) {
        Array.prototype.forEach.call(group.querySelectorAll('.note'), function (row) {
            row.addEventListener('mouseenter', function (event) {
                // Rows without a thumbnail dismiss the preview rather than
                // leaving the previous row's image standing under the pointer.
                if (!frameIndex.has(row)) return hide();
                warm(group);
                show(row, event);
            });
        });

        group.addEventListener('mouseenter', function () { warm(group); });
        group.addEventListener('mousemove', function (event) {
            targetX = event.clientX;
            targetY = event.clientY;
        });
        group.addEventListener('mouseleave', hide);
    });

    /* A row can slide out from under a pointer that never moved. Browsers
       re-evaluate :hover after a scroll, but not all of them re-fire boundary
       events without a real pointer move — so resolve it ourselves, once per
       frame at most, since elementFromPoint forces layout. */
    var resync = false;
    window.addEventListener('scroll', function () {
        if (!active || resync) return;
        resync = true;
        requestAnimationFrame(function () {
            resync = false;
            if (!active) return;
            var under = document.elementFromPoint(targetX, targetY);
            var row = under && under.closest ? under.closest('.note') : null;
            if (row && frameIndex.has(row)) {
                preview.style.setProperty('--hover-preview-index', String(frameIndex.get(row)));
            } else {
                hide();
            }
        });
    }, { passive: true });
});
