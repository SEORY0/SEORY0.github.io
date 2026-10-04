// Checks every KKACHI page against the spec (docs/superpowers/specs/2026-10-03-kkachi-black-ice-design.md §7, §8).
// Serve the repository root first (python3 -m http.server 8765), then:
//   PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs node docs/kkachi/check-page.mjs [base-url]
// Two runs per page: default, and WebGL off with reduced motion. Exits 1 if any page fails.
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const base = (process.argv[2] || 'http://localhost:8765').replace(/\/$/, '');
const PAGES = [
  { path: '/kkachi/', ids: ['top', 'static', 'signal', 'products', 'inlaid', 'contact'], maxWords: 560 },
  { path: '/kkachi/keel/', ids: ['top', 'contact'], maxWords: 450 },
  { path: '/kkachi/code/', ids: ['top', 'contact'], maxWords: 450 },
  { path: '/kkachi/web/', ids: ['top', 'contact'], maxWords: 450 },
  { path: '/kkachi/about/', ids: ['top', 'contact'], maxWords: 450 },
  { path: '/kkachi/resources/', ids: ['top', 'contact'], maxWords: 450 },
];
const MAX_CHROMA = 0.06;   // (max − min) / 255 of any painted colour outside nacre

async function check(browser, page, contextOpts) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...contextOpts });
  const p = await ctx.newPage();
  const problems = [];
  p.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  p.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));
  p.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  await p.goto(base + page.path, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(async () => {   // scroll through so lazy work runs
    for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
    scrollTo(0, 0);
  });
  await p.waitForTimeout(400);

  const report = await p.evaluate(({ ids, MAX_CHROMA }) => {
    const missing = ids.filter((id) => !document.getElementById(id));
    const words = (s) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
    const tips = [...document.querySelectorAll('[role=tooltip]')].map((t) => t.textContent).join(' ');
    const fonts = ['KK Serif', 'KK Cond', 'KK Mono'].filter((f) => !document.fonts.check(`16px "${f}"`));
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r, g, b, a }; };
    const hued = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.nacre')) continue;
      const cs = getComputedStyle(el);
      for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'fill', 'stroke']) {
        const v = parse(cs[prop] || '');
        if (!v || v.a === 0) continue;
        const chroma = (Math.max(v.r, v.g, v.b) - Math.min(v.r, v.g, v.b)) / 255;
        if (chroma > MAX_CHROMA) hued.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${[...el.classList].join('.')} ${prop}=${cs[prop]}`);
      }
    }
    const nav = ['/kkachi/keel/', '/kkachi/code/', '/kkachi/web/', '/kkachi/about/', '/kkachi/resources/']
      .filter((h) => !document.querySelector(`.nav a[href="${h}"]`));
    return { missing, visible: words(document.body.innerText), tipWords: words(tips), fonts, hued: [...new Set(hued)].slice(0, 10), nav };
  }, { ids: page.ids, MAX_CHROMA });

  // the Products menu opens on click and closes on Escape
  const btn = await p.$('.menu-btn');
  if (!btn) problems.push('no Products menu button');
  else {
    await btn.click();
    const open = await btn.getAttribute('aria-expanded');
    await p.keyboard.press('Escape');
    const closed = await btn.getAttribute('aria-expanded');
    if (open !== 'true' || closed !== 'false') problems.push(`menu: expanded=${open} after click, ${closed} after Escape`);
  }
  await ctx.close();

  if (report.missing.length) problems.push(`missing ids: ${report.missing.join(', ')}`);
  if (report.nav.length) problems.push(`nav links missing: ${report.nav.join(', ')}`);
  const total = report.visible + report.tipWords;
  if (total > page.maxWords) problems.push(`words: ${total} > ${page.maxWords}`);
  if (report.fonts.length) problems.push(`fonts not loaded: ${report.fonts.join(', ')}`);
  for (const h of report.hued) problems.push(`colour outside nacre: ${h}`);
  return { problems, total };
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: [] });
const bare = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--disable-webgl', '--disable-3d-apis'] });
let failed = 0;
for (const page of PAGES) {
  for (const [name, b, opts] of [['default', browser, {}], ['no-webgl+reduced', bare, { reducedMotion: 'reduce' }]]) {
    const { problems, total } = await check(b, page, opts);
    console.log(`${problems.length ? 'FAIL' : 'PASS'} ${page.path} ${name}: ${total} words`);
    for (const pr of problems.slice(0, 8)) console.log(`  - ${pr}`);
    if (problems.length) failed++;
  }
}
await browser.close(); await bare.close();
process.exit(failed ? 1 : 0);
