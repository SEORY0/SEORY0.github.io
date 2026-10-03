/* KKACHI app behaviour (v4) — the dashboard pages and the style guide. Loaded after kk-system.js, same module graph:
     <script type="module" src="../../assets/kkachi/kk-system.js"></script>
     <script type="module" src="../../assets/kkachi/kk-app.js"></script>
   A page module imports what it needs: import { openDrawer, closeDrawer, addKeys } from '../../assets/kkachi/kk-app.js';
   Spec: docs/superpowers/specs/2026-10-02-kkachi-v4-symbol-system-design.md §4 (keyboard / ↑↓ Enter Esc ←→ Space ?).
   Markup recipes: kk-system.css §28–§31 and /kkachi/system/#sys-app.

   What it does by itself (each only where its markup is on the page):
   1. Tooltips. [data-tip="…"] shows one shared bubble (.kk-tip, role="tooltip") on hover and keyboard focus; while it
      shows, the element is described by it (aria-describedby). Esc hides it. Use it for a symbol whose word is not
      visible (the word must still be the element's accessible name) and for a disabled control's reason.
   2. Disabled with a reason. A control with aria-disabled="true" stays focusable; a click does nothing but say its
      data-tip (polite announcement) — the sample's review buttons ("샘플 화면이라 결정할 수 없습니다").
   3. Copy. [data-kk-copy="text"] copies the text (or, with data-kk-copy="#id", that element's text without a leading
      "$ "), then says 복사했습니다 in place for 2 s and announces it.
   4. Keys. "/" focuses the page search ([data-kk-search], else .kk-appbar input[type=search]); "?" opens the keyboard
      map (a <dialog class="kk-keys">, made once); Esc clears a search that has text, else closes the drawer, the dialog
      or the tooltip. ←, →, Space, j, k
      are sent as kk:key { key } on document when the focus is not in a field or a control, so a page can step a
      replay. ↑ ↓ Home End Enter in tables come from kk-system.js. addKeys([[keys, what], …]) adds page lines to the map;
      setKeys([...]) replaces it: an item is a default line by name ('search', 'list', 'open', 'esc', 'step', 'play',
      'help') or a [keys, what] line, so a page without replay drops the replay lines (the overview, a finding).
   4b. Search everywhere. Every app page's search works: on a page that cannot filter its own lists (a finding, a
      session) the input carries data-kk-search-go="../", its output (.kk-search-out) says 'Enter: 개요에서 찾기' while
      there is text, and Enter goes to the overview with ?q=…; a page whose search has no data-kk-search-go gets ?q=
      filled in on arrival, with a bubbling 'input' event so its own filter runs (and writes its own output). The
      output's width is kept free inside the field (--kk-search-out-w on .kk-search), so typed text never runs under it.
      Enter and Esc wait while a Korean syllable is still being composed.
   5. Drawer. [data-kk-drawer="id"] opens <aside class="kk-drawer" id hidden> beside a list (focus moves in, returns to
      the opener on close); [data-kk-close] or Esc closes it. Sends kk:drawer { open, drawer } on the drawer.
   6. Sticky head. [data-kk-stick] gets .is-stuck while it holds under whatever stays at the top: the app bar where it
      is sticky (>= 600px), else the nav strip (phones, where the bar scrolls away). That height goes to --kk-stick-top
      on <html> (the bar's own to --kk-appbar-h), so sticky offsets follow it.
   Exports: openDrawer(el, opener?), closeDrawer(), addKeys(lines), setKeys(items), showTip(el), hideTip(). */
import { announce, copy, reduce } from './kk-system.js';

const root = document.documentElement;
const isField = (el) => el instanceof Element && !!el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
const isControl = (el) => el instanceof Element && !!el.closest('a[href], button, input, textarea, select, summary, [role="tab"], [role="row"], [role="slider"], tr[tabindex], [contenteditable]');

// ── 1. tooltips ──
let tip = null, tipFor = null, tipPrev = null;
function bubble() {
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'kk-tip';
    tip.id = 'kk-tip';
    tip.setAttribute('role', 'tooltip');
    // inside <main> so the bubble sits in a landmark (axe region); main is static with no stacking context or
    // containing block on every app page, so the fixed bubble is placed exactly as from <body>
    (document.querySelector('main') || document.body).append(tip);
  }
  return tip;
}
export function showTip(el) {
  const text = el.getAttribute('data-tip');
  if (!text) return;
  const t = bubble();
  if (tipFor && tipFor !== el) hideTip();
  t.textContent = text;
  tipFor = el;
  tipPrev = el.getAttribute('aria-describedby');
  if (!(tipPrev || '').split(' ').includes('kk-tip')) el.setAttribute('aria-describedby', `${tipPrev ? tipPrev + ' ' : ''}kk-tip`);
  const r = el.getBoundingClientRect();
  t.style.left = '0px'; t.style.top = '0px';
  t.classList.add('is-on');
  const w = t.offsetWidth, h = t.offsetHeight, pad = 8;
  let x = r.left + r.width / 2 - w / 2, y = r.top - h - 6;
  if (y < pad) y = r.bottom + 6;
  x = Math.max(pad, Math.min(innerWidth - w - pad, x));
  t.style.left = `${Math.round(x)}px`;
  t.style.top = `${Math.round(y)}px`;
}
export function hideTip() {
  if (!tip || !tipFor) return;
  tip.classList.remove('is-on');
  if (tipPrev === null) tipFor.removeAttribute('aria-describedby'); else tipFor.setAttribute('aria-describedby', tipPrev);
  tipFor = null; tipPrev = null;
}
document.addEventListener('pointerover', (e) => {
  const el = e.target instanceof Element ? e.target.closest('[data-tip]') : null;
  if (el) showTip(el); else if (tipFor && !tipFor.matches(':focus-visible')) hideTip();
});
document.addEventListener('focusin', (e) => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) showTip(el); });
document.addEventListener('focusout', (e) => { if (tipFor && e.target === tipFor) hideTip(); });
addEventListener('scroll', () => hideTip(), { passive: true, capture: true });

// ── 2. disabled with a reason ──
document.addEventListener('click', (e) => {
  const el = e.target instanceof Element ? e.target.closest('[aria-disabled="true"]') : null;
  if (!el) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const why = el.getAttribute('data-tip');
  if (why) { announce(why); showTip(el); }
}, true);

// ── 3. copy ──
document.addEventListener('click', async (e) => {
  const b = e.target instanceof Element ? e.target.closest('[data-kk-copy]') : null;
  if (!b || b.getAttribute('aria-disabled') === 'true') return;
  const src = b.getAttribute('data-kk-copy');
  let text = src;
  if (src.startsWith('#')) { const t = document.querySelector(src); text = t ? t.textContent.trim().replace(/^\$\s*/, '').split('\n')[0] : ''; }
  const ok = text ? await copy(text) : false;
  const msg = ok ? '복사했습니다' : '복사하지 못했습니다. 직접 골라 복사해 주세요';
  announce(msg);
  const label = [...b.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  if (label && ok) {
    const was = label.textContent;
    label.textContent = '복사했습니다';
    setTimeout(() => { label.textContent = was; }, 2000);
  }
});

// ── 4b. search: feedback, Enter to the overview, ?q= on arrival ──
const searchOf = (el) => (el instanceof HTMLInputElement && el.matches('[data-kk-search], .kk-search > input[type="search"]') ? el : null);
const outOf = (input) => { const s = input.closest('.kk-search'); return s ? s.querySelector('.kk-search-out') : null; };
const GO_HINT = 'Enter: 개요에서 찾기';
function goHint(input) {
  const o = outOf(input);
  if (o && input.hasAttribute('data-kk-search-go')) o.textContent = input.value.trim() ? GO_HINT : '';
}
function fitOut(o) {                     // inside the field only while it sits there (absolute); under it below 520px
  const s = o.parentElement;
  const inside = o.textContent.trim() && getComputedStyle(o).position === 'absolute';
  s.style.setProperty('--kk-search-out-w', inside ? `${Math.ceil(o.getBoundingClientRect().width) + 8}px` : '0px');
}
const outs = document.querySelectorAll('.kk-search > .kk-search-out');
if (outs.length && 'ResizeObserver' in window) {
  const ro = new ResizeObserver((ents) => { for (const en of ents) fitOut(en.target); });
  for (const o of outs) ro.observe(o);
}
document.addEventListener('input', (e) => { const s = searchOf(e.target); if (s) goHint(s); });
let arrived = false;
function arrive() {
  if (arrived) return;
  arrived = true;
  for (const s of document.querySelectorAll('input[data-kk-search-go]')) goHint(s);   // a value kept by the back button
  const q = new URLSearchParams(location.search).get('q');
  if (!q || !q.trim()) return;
  const s = document.querySelector('[data-kk-search]') || document.querySelector('.kk-appbar input[type="search"]');
  if (!s || s.hasAttribute('data-kk-search-go')) return;
  s.value = q.trim();
  s.dispatchEvent(new Event('input', { bubbles: true }));
}
// module scripts run before DOMContentLoaded, so the page's own module (after this one) has its listeners by then
if (document.readyState === 'complete') setTimeout(arrive); else { document.addEventListener('DOMContentLoaded', arrive, { once: true }); addEventListener('load', arrive, { once: true }); }
addEventListener('pageshow', (e) => { if (e.persisted) for (const s of document.querySelectorAll('input[data-kk-search-go]')) goHint(s); });

// ── 5. drawer ──
let drawer = null, opener = null;
export function openDrawer(el, from = document.activeElement) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return;
  if (drawer && drawer !== el) closeDrawer(false);
  drawer = el; opener = from;
  el.hidden = false;
  const h = el.querySelector('h1, h2, h3');
  const target = h || el;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  el.dispatchEvent(new CustomEvent('kk:drawer', { detail: { open: true, drawer: el }, bubbles: true }));
}
export function closeDrawer(restore = true) {
  if (!drawer) return;
  const el = drawer;
  el.hidden = true;
  drawer = null;
  if (restore && opener && opener.isConnected) opener.focus({ preventScroll: true });
  el.dispatchEvent(new CustomEvent('kk:drawer', { detail: { open: false, drawer: el }, bubbles: true }));
}
document.addEventListener('click', (e) => {
  if (!(e.target instanceof Element)) return;
  const o = e.target.closest('[data-kk-drawer]');
  if (o) { e.preventDefault(); openDrawer(o.getAttribute('data-kk-drawer'), o); return; }
  if (e.target.closest('.kk-drawer [data-kk-close]')) closeDrawer();
});

// ── 4. keys ──
const DEFAULT_KEYS = {
  search: [['/'], '검색으로 가기'],
  list: [['↑', '↓'], '목록에서 위아래로 (서랍을 연 채로도)'],
  open: [['Enter'], '고른 항목 열기'],
  esc: [['Esc'], '서랍 · 창 · 도움말 닫기'],
  step: [['←', '→'], '재생: 앞뒤 사건으로'],
  play: [['Space'], '재생 · 멈춤'],
  help: [['?'], '이 목록 열기'],
};
const KEYS = Object.values(DEFAULT_KEYS).slice();
export function addKeys(lines) { for (const l of lines) KEYS.push(l); if (dlg) fillKeys(); }
export function setKeys(items) {
  KEYS.length = 0;
  for (const it of items) { const l = typeof it === 'string' ? DEFAULT_KEYS[it] : it; if (l) KEYS.push(l); }
  if (dlg) fillKeys();
}
let dlg = null;
function fillKeys() {
  const dl = dlg.querySelector('dl');
  dl.textContent = '';
  for (const [keys, what] of KEYS) {
    const dt = document.createElement('dt');
    for (const k of keys) { const kb = document.createElement('kbd'); kb.className = 'kk-kbd'; kb.textContent = k; dt.append(kb); }
    const dd = document.createElement('dd');
    dd.textContent = what;
    dl.append(dt, dd);
  }
}
function keysDialog() {
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.className = 'kk-keys';
    dlg.setAttribute('aria-labelledby', 'kk-keys-t');
    dlg.innerHTML = '<h2 id="kk-keys-t">키보드</h2><dl></dl><form method="dialog"><button class="kk-btn kk-btn--sm" type="submit">닫기</button></form>';
    document.body.append(dlg);
    fillKeys();
  }
  return dlg;
}
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  const t = e.target;
  const search = searchOf(t);
  if (search && (e.isComposing || e.keyCode === 229)) return;   // Hangul still being composed: its Enter / Esc are the IME's
  if (search && e.key === 'Enter' && search.hasAttribute('data-kk-search-go') && search.value.trim()) {
    e.preventDefault();
    location.assign(`${search.getAttribute('data-kk-search-go')}?q=${encodeURIComponent(search.value.trim())}`);
    return;
  }
  if (search && e.key === 'Escape' && search.value) {
    e.preventDefault();
    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    const o = outOf(search);
    if (o) o.textContent = '';
    hideTip();
    return;
  }
  if (e.key === 'Escape') {
    if (tipFor) hideTip();
    if (drawer && !(dlg && dlg.open)) { e.preventDefault(); closeDrawer(); }
    return;
  }
  if (isField(t)) return;
  if (e.key === '/') {
    const s = document.querySelector('[data-kk-search]') || document.querySelector('.kk-appbar input[type="search"]');
    if (s) { e.preventDefault(); s.focus(); s.select && s.select(); }
    return;
  }
  if (e.key === '?') {
    e.preventDefault();
    const d = keysDialog();
    if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
    return;
  }
  if (['ArrowLeft', 'ArrowRight', ' ', 'j', 'k'].includes(e.key) && !isControl(t)) {
    const ev = new CustomEvent('kk:key', { detail: { key: e.key === ' ' ? 'Space' : e.key }, cancelable: true });
    document.dispatchEvent(ev);
    if (ev.defaultPrevented) e.preventDefault();
  }
});

// ── 6. sticky head and the bar's height ──
const bar = document.querySelector('.kk-appbar');
const strip = document.querySelector('.kk-side');
let stickTop = 0;
// what stays at the top: the bar while it is sticky (>= 600px), else the nav strip when it runs across the top (phones)
function measureTop() {
  const barH = bar && getComputedStyle(bar).position === 'sticky' ? bar.offsetHeight : 0;
  let stripH = 0;
  if (!barH && strip && getComputedStyle(strip).position === 'sticky' && strip.offsetWidth > innerWidth * .6) stripH = strip.offsetHeight;
  root.style.setProperty('--kk-appbar-h', `${barH}px`);
  root.style.setProperty('--kk-stick-top', `${barH || stripH}px`);
  return barH || stripH;
}
const sticks = [...document.querySelectorAll('[data-kk-stick]')];
const watchers = [];
function watchSticks() {
  for (const w of watchers.splice(0)) w.disconnect();
  if (!sticks.length || !('IntersectionObserver' in window)) return;
  for (const el of sticks) {
    let probe = el.previousElementSibling;
    if (!probe || !probe.hasAttribute('data-kk-stick-probe')) {
      probe = document.createElement('span');
      probe.setAttribute('aria-hidden', 'true');
      probe.setAttribute('data-kk-stick-probe', '');
      probe.style.cssText = 'display:block;height:1px;margin-bottom:-1px;visibility:hidden';
      el.before(probe);
    }
    const io = new IntersectionObserver(([en]) => {
      el.classList.toggle('is-stuck', !en.isIntersecting && en.boundingClientRect.top < stickTop + 1);
    }, { rootMargin: `-${stickTop}px 0px 0px 0px` });
    io.observe(probe);
    watchers.push(io);
  }
}
if ((bar || strip) && 'ResizeObserver' in window) {
  new ResizeObserver(() => {
    const t = measureTop();
    if (t !== stickTop) { stickTop = t; watchSticks(); }
  }).observe(bar || strip);
  addEventListener('resize', () => { const t = measureTop(); if (t !== stickTop) { stickTop = t; watchSticks(); } }, { passive: true });
}
stickTop = measureTop();
watchSticks();

// reduced motion is read live by the CSS; nothing here animates on its own
void reduce;
