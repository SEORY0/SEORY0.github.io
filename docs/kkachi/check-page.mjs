// Checks /kkachi/ against the Black ICE spec (docs/superpowers/specs/2026-10-03-kkachi-black-ice-design.md §7).
// Serve the repository root first (python3 -m http.server 8765), then:
//   PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs node docs/kkachi/check-page.mjs [url]
// Two runs: default, and WebGL off with reduced motion. Exits 1 on the first failing run.
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const url = process.argv[2] || 'http://localhost:8765/kkachi/';
const IDS = ['top', 'static', 'signal', 'products', 'inlaid', 'contact'];
const MAX_WORDS = 550;
const MAX_CHROMA = 0.06;   // (max − min) / 255 of any painted colour outside nacre

async function run(name, launchArgs, contextOpts) {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: launchArgs });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...contextOpts });
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {   // scroll through so lazy work runs
    for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(500);

  const report = await page.evaluate(({ IDS, MAX_CHROMA }) => {
    const missing = IDS.filter((id) => !document.getElementById(id));
    const words = (s) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
    const tips = [...document.querySelectorAll('[role=tooltip]')].map((t) => t.textContent).join(' ');
    const visible = words(document.body.innerText);
    const tipWords = words(tips);
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
    return { missing, visible, tipWords, fonts, hued: [...new Set(hued)].slice(0, 12) };
  }, { IDS, MAX_CHROMA });
  await browser.close();

  if (report.missing.length) problems.push(`missing ids: ${report.missing.join(', ')}`);
  const total = report.visible + report.tipWords;
  if (total > MAX_WORDS) problems.push(`words: ${total} > ${MAX_WORDS}`);
  if (report.fonts.length) problems.push(`fonts not loaded: ${report.fonts.join(', ')}`);
  for (const h of report.hued) problems.push(`colour outside nacre: ${h}`);
  console.log(`${problems.length ? 'FAIL' : 'PASS'} ${name}: ${report.visible} visible + ${report.tipWords} tooltip words`);
  for (const p of problems) console.log(`  - ${p}`);
  return problems.length === 0;
}

const ok1 = await run('default', [], {});
const ok2 = await run('no-webgl+reduced-motion', ['--disable-webgl', '--disable-3d-apis'], { reducedMotion: 'reduce' });
process.exit(ok1 && ok2 ? 0 : 1);
