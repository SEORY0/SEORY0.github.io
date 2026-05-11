/* /assets/js/mobile-nav.js — top-nav drawer toggle */

document.addEventListener('DOMContentLoaded', function() {
    var menuBtn = document.getElementById('mobile-menu-btn');
    var drawer = document.getElementById('top-nav-drawer');
    var overlay = document.getElementById('mobile-overlay');
    var body = document.body;

    if (!menuBtn || !drawer || !overlay) {
        return;
    }

    function openMenu() {
        drawer.classList.add('menu-open');
        menuBtn.classList.add('active');
        menuBtn.setAttribute('aria-expanded', 'true');
        overlay.style.display = 'block';
        // next frame to enable transition
        requestAnimationFrame(function () {
            overlay.classList.add('visible');
        });
        body.classList.add('mobile-menu-active');
    }

    function closeMenu() {
        drawer.classList.remove('menu-open');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        overlay.classList.remove('visible');
        setTimeout(function () { overlay.style.display = 'none'; }, 250);
        body.classList.remove('mobile-menu-active');
    }

    function toggleMenu() {
        if (drawer.classList.contains('menu-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    menuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleMenu();
    });

    overlay.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('menu-open')) {
            closeMenu();
        }
    });

    var closeBtn = drawer.querySelector('.top-nav-drawer-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            closeMenu();
        });
    }

    // Close drawer when a nav link is clicked (helpful for in-page anchors)
    var navLinks = drawer.querySelectorAll('a');
    navLinks.forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });
});
