/* /assets/js/lang-toggle.js
 * Language toggle (Korean / English) for the home page.
 *
 * Initial lang is applied via an inline blocking script in head.html
 * to avoid FOWL (Flash Of Wrong Language). This script only wires up
 * the click handler that toggles html.lang and persists to localStorage.
 *
 * CSS in _home.scss handles visibility: `.page-home [lang="en"|"ko"]`
 * is hidden when html.lang doesn't match.
 */

document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('nav-lang-btn');
    if (!btn) return;            // not on home page — no-op

    var html = document.documentElement;

    function applyLang(lang) {
        html.lang = lang;
        try { localStorage.setItem('lang', lang); } catch (e) {}
    }

    btn.addEventListener('click', function (e) {
        e.preventDefault();
        applyLang(html.lang === 'ko' ? 'en' : 'ko');
    });
});
