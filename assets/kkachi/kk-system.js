/* KKACHI system behaviour — shared by every KKACHI page (marketing and app). Specs: v4 symbol system, v3 §5; the markup
   recipes are in kk-system.css and rendered at /kkachi/system/. The draw-on-scroll, jump links, bar measuring and .nw
   handling of the pre-v3 white pages (their paper.js, now removed) live here, renamed kk-.
   Usage: <script type="module" src="../../assets/kkachi/kk-system.js"></script> once per page. A page module imports
   what it needs from the same URL (one module instance per page):
     import { reduce, lifted, toast, copy, announce, setTheme } from '../../assets/kkachi/kk-system.js';

   What it does by itself (each only where its markup is on the page):
   1. Top bar (.kk-bar). Its real height goes to --bar-h on <html> whenever it changes (large text grows it), so
      scroll-padding and sticky offsets follow. When the links do not fit, the list (.kk-bar-nav) scrolls sideways:
      the current link is kept in view (and any link that takes focus), and an edge with more links behind it gets
      .is-l / .is-r (a fade). Without JS --bar-h stays --bar-min and the list still scrolls.
   2. Draw on scroll. .kk-draw (line art, not --load; not --scrub where view timelines exist) and [data-kk-in] (a page's
      own entrance): anything on screen or above it at load is left as it is (never hidden, nothing flashes); the rest
      is armed (.is-armed) and gets .is-in once its top passes 85% of the viewport (data-kk-in="half": once half of it
      shows). Without JS / IntersectionObserver, or under reduced motion, nothing is armed. Note: Chromium intersects
      an element through its own clip-path; observe an unclipped ancestor of a clipped-shut element.
   3. Jump links. <a href="#id" data-kk-jump>: a plain click scrolls the target into view (smooth; instant under
      reduced motion), puts the hash in the address bar and moves focus there (tabindex="-1" added if needed).
   4. Unbreakable runs. .nw that no longer fits its line (large text, narrow screen) gets .is-free (wraps) until it fits.
   5. Tabs. .kk-tabs[role="tablist"]: click, ←/→ (↑/↓ when aria-orientation="vertical"), Home, End select a tab
      (roving tabindex); the panels named by aria-controls are shown / hidden. Sends kk:tab { tab } on the tablist.
   6. Segmented groups. .kk-seg[role="group"]: one button pressed at a time (aria-pressed); ←/→ move focus. Sends
      kk:seg { value, button } on the group (value = the button's data-value, else its text). data-kk-multi: toggles.
   7. Tables. table[data-kk-sort]: header buttons .kk-sort sort the body by each cell's data-v (numbers when every value
      is one) else its text; aria-sort on the th. table[data-kk-select]: rows are one tab stop (roving tabindex; ↑/↓,
      Home/End move, Enter/Space or a click select: aria-selected); sends kk:select { row } on the table; a row with
      data-href opens that address on Enter / double click.
   8. Theme. [data-kk-theme] (a .kk-seg with buttons data-value="dark" / "light", or one button that toggles,
      aria-pressed = light): sets html[data-theme], keeps it in localStorage "kk-theme" (the head snippet in
      kk-system.css §1 reads it before the first paint), updates <meta name="theme-color">. App pages only: marketing
      pages are dark and have no switch. Sends kk:theme { theme } on document. Ship the switch visible and hide it
      without JS by <noscript><style>[data-kk-theme] { visibility: hidden; }</style></noscript> (a `hidden` switch
      revealed here would move the bar: a layout shift Lighthouse measured at 0.12 on the style guide).
   9. Touch screens. Where nothing hovers, an end link (.kk-tile) in view (>= 60%) gets .is-lit (the --next seam lights;
      its face is for hover and keyboard focus).
   10. Live fills. A stage in progress (.kk-sline-track > li[data-s="now"], .kk-sline--mini > i[data-s="now"]) breathes
      by a compositor transform (kk-system.css §25); each one off screen, and all of them while the page is hidden, get
      data-kk-off (paused). Stages drawn later (a table filled from data, a replay that moves 'now') are picked up by a
      MutationObserver on data-s and new children, one scan a frame at most.

   Exports
     reduce               MediaQueryList for prefers-reduced-motion: reduce
     lifted               Promise, resolved when the arrival curtain lifts (kk:reveal from transition.js) or at once
     toast(text, opts)    a toast in .kk-toasts (made if missing). opts: { tone: 'ok'|'approved'|'fail'|'run'|'hold'|'no'|'turn',
                          label, ms } (tone shows the status glyph; label = its word, default from the tone; closing is
                          the word 닫기 and Esc). Returns close(). The box is not a live region (a role="status" left in
                          the markup is taken off here): it would read the 닫기 button with the words. The toast is said
                          once, through announce(): '<label> · <text>' (재현 확인 · F-01 · 재현 3/3 · …).
     announce(text)       says text through a polite, visually hidden live region. Calls in the same frame are said
                          together, in order (a toast and the page's own line both get through; neither cuts the other)
     copy(text)           Promise<boolean>: Clipboard API, else a hidden textarea + execCommand
     setTheme(t)          'dark' | 'light' (app pages) */
export const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;

export const lifted = root.matches('.kk-arriving, .kk-veiled')
  ? new Promise((r) => document.addEventListener('kk:reveal', () => r(), { once: true }))
  : Promise.resolve();

const fire = (el, type, detail) => el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));

// ── live region, toasts, copy ──
let live = null, said = [], sayAt = 0;
export function announce(text) {
  if (!live) {
    live = document.createElement('div');
    live.className = 'sr-only';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    document.body.append(live);
  }
  text = String(text || '').trim();
  if (!text || said.includes(text)) return;
  said.push(text);
  if (sayAt) return;
  live.textContent = '';
  sayAt = requestAnimationFrame(() => {
    live.textContent = said.reduce((a, t) => (a ? `${a}${/[.!?]$/.test(a) ? '' : '.'} ${t}` : t), '');
    said = []; sayAt = 0;
  });
}

const TONE_WORD = { ok: '재현 확인', approved: '승인', fail: '실패', run: '실행 중', hold: '보류', no: '기각', wait: '대기', turn: '사람 차례' };
// a toast box is never a live region (it would read 닫기 too): the markup's role="status" goes before any toast
const quiet = (box) => { box.removeAttribute('role'); box.removeAttribute('aria-live'); };
for (const box of document.querySelectorAll('.kk-toasts[role], .kk-toasts[aria-live]')) quiet(box);
export function toast(text, { tone = null, label = null, ms = 5000 } = {}) {
  let box = document.querySelector('.kk-toasts');
  if (!box) {
    box = document.createElement('div');
    box.className = 'kk-toasts';
    document.body.append(box);
  }
  if (box.hasAttribute('role') || box.hasAttribute('aria-live')) quiet(box);
  const t = document.createElement('div');
  t.className = 'kk-toast';
  if (tone) {
    const g = document.createElement('span');
    g.className = 'kk-st kk-st--bare';
    g.dataset.st = tone;
    g.textContent = label || TONE_WORD[tone] || '';
    t.append(g);
  }
  const p = document.createElement('p');
  p.textContent = text;
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'kk-toast-x';
  x.textContent = '닫기';                // v4: the word, never ×
  t.append(p, x);
  box.append(t);
  const word = label || (tone && TONE_WORD[tone]) || '';
  announce(word ? `${word} · ${text}` : text);
  let timer = 0, gone = false;
  const close = () => {
    if (gone) return;
    gone = true;
    clearTimeout(timer);
    if (reduce.matches) { t.remove(); return; }
    t.classList.add('is-out');
    t.addEventListener('animationend', () => t.remove(), { once: true });
    setTimeout(() => t.remove(), 400);
  };
  const arm = () => { clearTimeout(timer); if (ms > 0) timer = setTimeout(close, ms); };
  x.addEventListener('click', close);
  t.addEventListener('pointerenter', () => clearTimeout(timer));
  t.addEventListener('pointerleave', arm);
  t.addEventListener('focusin', () => clearTimeout(timer));
  t.addEventListener('focusout', arm);
  arm();
  return close;
}
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const last = [...document.querySelectorAll('.kk-toast:not(.is-out)')].pop();
  if (last) last.querySelector('.kk-toast-x').click();
});

export async function copy(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch (e) { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) { return false; }
}

// ── 3. jump links ──
document.addEventListener('click', (e) => {
  const a = e.target instanceof Element ? e.target.closest('a[data-kk-jump][href^="#"]') : null;
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const t = document.getElementById(decodeURIComponent(a.hash.slice(1)));
  if (!t) return;
  e.preventDefault();
  if (location.hash !== a.hash) history.pushState(null, '', a.hash);
  if (!t.hasAttribute('tabindex') && !t.matches('a[href], button, input, select, textarea')) t.setAttribute('tabindex', '-1');
  t.focus({ preventScroll: true });
  t.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
});

// ── 5. tabs ──
function tabsOf(list) { return [...list.querySelectorAll('[role="tab"]')].filter((t) => t.closest('[role="tablist"]') === list); }
function selectTab(list, tab, focus) {
  for (const t of tabsOf(list)) {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const p = t.getAttribute('aria-controls') && document.getElementById(t.getAttribute('aria-controls'));
    if (p) p.hidden = !on;
  }
  if (focus) tab.focus();
  fire(list, 'kk:tab', { tab });
}
for (const list of document.querySelectorAll('.kk-tabs[role="tablist"]')) {
  const tabs = tabsOf(list);
  const cur = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
  if (cur) for (const t of tabs) t.tabIndex = t === cur ? 0 : -1;
}
document.addEventListener('click', (e) => {
  const tab = e.target instanceof Element ? e.target.closest('.kk-tabs[role="tablist"] [role="tab"]') : null;
  if (tab && !tab.disabled) selectTab(tab.closest('[role="tablist"]'), tab, false);
});
document.addEventListener('keydown', (e) => {
  const tab = e.target instanceof Element ? e.target.closest('.kk-tabs[role="tablist"] [role="tab"]') : null;
  if (!tab) return;
  const list = tab.closest('[role="tablist"]');
  const tabs = tabsOf(list).filter((t) => !t.disabled);
  const v = list.getAttribute('aria-orientation') === 'vertical';
  const i = tabs.indexOf(tab);
  const to = { [v ? 'ArrowDown' : 'ArrowRight']: i + 1, [v ? 'ArrowUp' : 'ArrowLeft']: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  selectTab(list, tabs[(to + tabs.length) % tabs.length], true);
});

// ── 6. segmented groups and 8. theme ──
const metaTheme = document.querySelector('meta[name="theme-color"]');
export function setTheme(t) {
  const light = t === 'light';
  if (light) root.dataset.theme = 'light'; else delete root.dataset.theme;
  try { localStorage.setItem('kk-theme', light ? 'light' : 'dark'); } catch (e) { /* not kept */ }
  if (metaTheme) metaTheme.content = light ? '#F0F0F0' : '#292623';
  for (const sw of document.querySelectorAll('[data-kk-theme]')) syncTheme(sw);
  fire(document, 'kk:theme', { theme: light ? 'light' : 'dark' });
}
function syncTheme(sw) {
  const light = root.dataset.theme === 'light';
  if (sw.matches('button')) sw.setAttribute('aria-pressed', String(light));
  else for (const b of sw.querySelectorAll('button[data-value]')) b.setAttribute('aria-pressed', String((b.dataset.value === 'light') === light));
}
for (const sw of document.querySelectorAll('[data-kk-theme]')) { syncTheme(sw); sw.hidden = false; }
if (metaTheme && document.querySelector('[data-kk-theme]')) metaTheme.content = root.dataset.theme === 'light' ? '#F0F0F0' : '#292623';

document.addEventListener('click', (e) => {
  if (!(e.target instanceof Element)) return;
  const solo = e.target.closest('button[data-kk-theme]');
  if (solo) { setTheme(root.dataset.theme === 'light' ? 'dark' : 'light'); return; }
  const b = e.target.closest('.kk-seg[role="group"] > button');
  if (!b || b.disabled) return;
  const g = b.parentElement;
  if (g.hasAttribute('data-kk-multi')) b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  else for (const o of g.children) if (o.matches('button')) o.setAttribute('aria-pressed', String(o === b));
  if (g.hasAttribute('data-kk-theme')) { setTheme(b.dataset.value); return; }
  fire(g, 'kk:seg', { value: b.dataset.value || b.textContent.trim(), button: b });
});
document.addEventListener('keydown', (e) => {
  const b = e.target instanceof Element ? e.target.closest('.kk-seg[role="group"] > button') : null;
  if (!b || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
  const bs = [...b.parentElement.children].filter((o) => o.matches('button:not(:disabled)'));
  const i = bs.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1);
  e.preventDefault();
  bs[(i + bs.length) % bs.length].focus();
});

// ── 7. tables ──
const cellValue = (row, i) => { const c = row.cells[i]; return c ? (c.dataset.v !== undefined ? c.dataset.v : c.textContent.trim()) : ''; };
document.addEventListener('click', (e) => {
  const btn = e.target instanceof Element ? e.target.closest('table[data-kk-sort] th .kk-sort') : null;
  if (!btn) return;
  const th = btn.closest('th'), table = th.closest('table'), body = table.tBodies[0];
  if (!body) return;
  const i = th.cellIndex;
  const dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
  for (const h of table.tHead.querySelectorAll('th[aria-sort]')) h.setAttribute('aria-sort', 'none');
  th.setAttribute('aria-sort', dir);
  const rows = [...body.rows];
  const vals = rows.map((r) => cellValue(r, i));
  const numeric = vals.every((v) => v !== '' && !Number.isNaN(Number(v)));
  const coll = new Intl.Collator('ko', { numeric: true });
  const order = rows.map((r, k) => k).sort((a, b) => {
    const d = numeric ? Number(vals[a]) - Number(vals[b]) : coll.compare(vals[a], vals[b]);
    return (dir === 'ascending' ? d : -d) || a - b;
  });
  body.append(...order.map((k) => rows[k]));
  const name = btn.textContent.trim();
  announce(`${name} ${dir === 'ascending' ? '오름차순' : '내림차순'}으로 정렬했습니다`);
});

function rowsOf(table) { return table.tBodies[0] ? [...table.tBodies[0].rows].filter((r) => !r.hidden) : []; }
function armRows(table) {
  const rows = rowsOf(table);
  if (!rows.length) return;
  const cur = rows.find((r) => r.tabIndex === 0) || rows.find((r) => r.getAttribute('aria-selected') === 'true') || rows[0];
  for (const r of rows) { r.tabIndex = r === cur ? 0 : -1; if (!r.hasAttribute('aria-selected')) r.setAttribute('aria-selected', 'false'); }
}
function pickRow(table, row) {
  for (const r of rowsOf(table)) { r.setAttribute('aria-selected', String(r === row)); r.tabIndex = r === row ? 0 : -1; }
  fire(table, 'kk:select', { row });
}
for (const t of document.querySelectorAll('table[data-kk-select]')) {
  armRows(t);
  if (t.tBodies[0] && 'MutationObserver' in window) new MutationObserver(() => armRows(t)).observe(t.tBodies[0], { childList: true });
}
document.addEventListener('click', (e) => {
  const row = e.target instanceof Element ? e.target.closest('table[data-kk-select] > tbody > tr') : null;
  if (!row || e.target.closest('a, button, input, select, label')) return;
  pickRow(row.closest('table'), row);
});
document.addEventListener('dblclick', (e) => {
  const row = e.target instanceof Element ? e.target.closest('table[data-kk-select] > tbody > tr[data-href]') : null;
  if (row) location.assign(row.dataset.href);
});
document.addEventListener('keydown', (e) => {
  const row = e.target instanceof Element && e.target.matches('table[data-kk-select] > tbody > tr') ? e.target : null;
  if (!row) return;
  const table = row.closest('table'), rows = rowsOf(table), i = rows.indexOf(row);
  let to = null;
  if (e.key === 'ArrowDown') to = Math.min(rows.length - 1, i + 1);
  else if (e.key === 'ArrowUp') to = Math.max(0, i - 1);
  else if (e.key === 'Home') to = 0;
  else if (e.key === 'End') to = rows.length - 1;
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (e.key === 'Enter' && row.dataset.href && row.getAttribute('aria-selected') === 'true') { location.assign(row.dataset.href); return; }
    pickRow(table, row);
    return;
  }
  if (to === null) return;
  e.preventDefault();
  for (const r of rows) r.tabIndex = r === rows[to] ? 0 : -1;
  rows[to].focus();
});

// ── 1, 2, 4: everything that measures waits for the first frame (a read before the browser has laid the page out
// would force that layout inside this module: a long task charged to it). Nothing visible depends on it: armed
// figures are below the fold, and --bar-h already holds the bar's drawn height. ──
const scrubbed = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline: view()');
function measure() {
  // 2. draw on scroll
  const items = document.querySelectorAll(scrubbed ? '.kk-draw:not(.kk-draw--load, .kk-draw--scrub), [data-kk-in]'
    : '.kk-draw:not(.kk-draw--load), [data-kk-in]');
  if (items.length && !reduce.matches && 'IntersectionObserver' in window) {
    const enter = (io, el) => { el.classList.add('is-in'); io.unobserve(el); };
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) enter(io, e.target); }, { rootMargin: '0px 0px -15% 0px' });
    const half = new IntersectionObserver((es) => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        const need = Math.min(0.5, (innerHeight * 0.6) / Math.max(1, e.boundingClientRect.height));
        if (e.intersectionRatio + 0.001 >= need) enter(half, e.target);
      }
    }, { threshold: [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1] });
    const fold = innerHeight * 0.85;
    const below = [...items].filter((el) => el.getBoundingClientRect().top >= fold);   // all reads, then the writes
    for (const el of below) { el.classList.add('is-armed'); (el.dataset.kkIn === 'half' ? half : io).observe(el); }
    reduce.addEventListener('change', () => {
      if (!reduce.matches) return;
      io.disconnect(); half.disconnect();
      for (const el of items) el.classList.add('is-in');
    });
  }

  // 1. the bar
  const barIn = document.querySelector('.kk-bar-in'), nav = document.querySelector('.kk-bar-nav');
  if (nav) {
    const over = () => nav.scrollWidth > nav.clientWidth + 1;
    const keep = (a) => {
      const n = nav.getBoundingClientRect(), r = a.getBoundingClientRect(), pad = 22;
      if (r.left < n.left + pad) nav.scrollLeft -= n.left + pad - r.left;
      else if (r.right > n.right - pad) nav.scrollLeft += r.right - (n.right - pad);
    };
    let l = null, r = null;
    const edges = () => {
      const o = over(), max = nav.scrollWidth - nav.clientWidth;
      const nl = o && nav.scrollLeft > 1, nr = o && nav.scrollLeft < max - 1;
      if (nl !== l) { l = nl; nav.classList.toggle('is-l', nl); }
      if (nr !== r) { r = nr; nav.classList.toggle('is-r', nr); }
    };
    let queued = 0;
    nav.addEventListener('scroll', () => { if (!queued) queued = requestAnimationFrame(() => { queued = 0; edges(); }); }, { passive: true });
    nav.addEventListener('focusin', (e) => { const a = e.target.closest('a'); if (a && over()) { keep(a); edges(); } });
    let moved = false;
    for (const t of ['pointerdown', 'wheel', 'keydown']) nav.addEventListener(t, () => { moved = true; }, { passive: true, once: true });
    const place = () => {
      const cur = nav.querySelector('a[aria-current="page"]');
      if (!moved && cur && over()) keep(cur);
      edges();
    };
    if ('ResizeObserver' in window) new ResizeObserver(place).observe(nav); else addEventListener('resize', place);
    place();
  }
  if (barIn) {
    let barH = null;
    const fit = () => {
      const h = Math.round(barIn.getBoundingClientRect().height * 100) / 100;
      if (h > 0 && h !== barH) {
        const base = barH === null ? parseFloat(getComputedStyle(root).getPropertyValue('--bar-min')) : NaN;
        if (Math.abs(h - base) > 0.01 || barH !== null) root.style.setProperty('--bar-h', `${h}px`);
        barH = h;
      }
    };
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(barIn); else addEventListener('resize', fit);
  }

  // 4. unbreakable runs
  const nws = [...document.querySelectorAll('.nw')];
  if (nws.length) {
    const hostOf = (el) => {
      let e = el.parentElement;
      while (e && e !== document.body && /^(inline|contents)/.test(getComputedStyle(e).display)) e = e.parentElement;
      return e;
    };
    const hosts = new Map(nws.map((n) => [n, hostOf(n)]));
    const free = () => {
      for (const n of nws) if (n.classList.contains('is-free')) n.classList.remove('is-free');
      const over = nws.filter((n) => {
        const h = hosts.get(n);
        if (!h || /^(nowrap|pre)$/.test(getComputedStyle(n.parentElement).whiteSpace)) return false;
        const q = n.getBoundingClientRect();
        if (!q.width) return false;
        const hr = h.getBoundingClientRect();
        return q.right > hr.left + h.clientLeft + h.clientWidth - parseFloat(getComputedStyle(h).paddingRight) + 0.5;
      });
      for (const n of over) n.classList.add('is-free');
    };
    free();
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(free);
      for (const n of nws) ro.observe(n);
      for (const h of new Set(hosts.values())) if (h) ro.observe(h);
    } else addEventListener('resize', free);
  }
}
requestAnimationFrame(() => setTimeout(measure, 0));

// ── 10. live fills: paused off screen and while the page is hidden ──
const FILL = '.kk-sline-track > li[data-s="now"], .kk-sline--mini > i[data-s="now"]';
if ('IntersectionObserver' in window && 'MutationObserver' in window) {
  const seen = new Map();                               // stage → on screen
  const set = (el) => {
    const off = document.hidden || !seen.get(el);
    if (el.hasAttribute('data-kk-off') !== off) el.toggleAttribute('data-kk-off', off);
  };
  const io = new IntersectionObserver((es) => { for (const e of es) { seen.set(e.target, e.isIntersecting); set(e.target); } });
  let queued = 0;
  const scan = () => {
    queued = 0;
    for (const el of seen.keys()) {
      if (el.isConnected && el.matches(FILL)) continue;
      io.unobserve(el); seen.delete(el); el.removeAttribute('data-kk-off');
    }
    for (const el of document.querySelectorAll(FILL)) if (!seen.has(el)) { seen.set(el, false); io.observe(el); }
  };
  scan();
  new MutationObserver(() => { if (!queued) queued = requestAnimationFrame(scan); })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-s'] });
  document.addEventListener('visibilitychange', () => { for (const el of seen.keys()) set(el); });
}

// ── 9. end tiles on touch screens ──
const tiles = document.querySelectorAll('.kk-tile');
const touch = matchMedia('(hover: none)');
if (tiles.length && 'IntersectionObserver' in window) {
  let lit = null;
  const arm = () => {
    if (touch.matches && !lit) {
      lit = new IntersectionObserver((es) => { for (const e of es) e.target.classList.toggle('is-lit', e.isIntersecting && e.intersectionRatio >= 0.599); }, { threshold: [0, 0.6] });
      tiles.forEach((t) => lit.observe(t));
    } else if (!touch.matches && lit) {
      lit.disconnect(); lit = null;
      tiles.forEach((t) => t.classList.remove('is-lit'));
    }
  };
  arm();
  touch.addEventListener('change', arm);
}
