// KKACHI OG image: renders docs/kkachi/og.html (1200 x 630, lacquer, the wordmark with its nacre-inlaid mark, the
// tagline in Wanted Sans) to assets/kkachi/og/kkachi-og.png. Build time only.
//   python3 -m http.server 8765 --bind 127.0.0.1 &          (the repository root)
//   PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs node docs/kkachi/build-og.mjs
// (PLAYWRIGHT defaults to the 'playwright' package.) DPR 1, reduced motion, after document.fonts.ready.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const base = process.env.BASE || 'http://127.0.0.1:8765';
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })).newPage();
await pg.goto(`${base}/docs/kkachi/og.html`, { waitUntil: 'networkidle' });
await pg.evaluate(() => document.fonts.ready);
await pg.waitForTimeout(300);
await pg.screenshot({ path: path.join(root, 'assets/kkachi/og/kkachi-og.png') });
await b.close();
console.log('assets/kkachi/og/kkachi-og.png');
