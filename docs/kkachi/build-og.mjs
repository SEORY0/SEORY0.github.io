// KKACHI OG image: the hero of /kkachi/ itself at 1200 x 630 (the photograph, the logo and the headline; the nav links,
// the paragraphs and the CTA hidden) → assets/kkachi/og/kkachi-og.png. Build time only.
//   python3 -m http.server 8765 --bind 127.0.0.1 &          (the repository root)
//   PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs node docs/kkachi/build-og.mjs
// (PLAYWRIGHT defaults to the 'playwright' package; CHROME picks a browser binary.) DPR 1, reduced motion, after fonts.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const base = process.env.BASE || 'http://127.0.0.1:8765';
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const pg = await (await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })).newPage();
await pg.goto(`${base}/kkachi/`, { waitUntil: 'networkidle' });
await pg.addStyleTag({ content: `
  .nav nav, .hero-copy p { display: none !important; }
  .hero { height: 630px !important; min-height: 0 !important; }
  .hero-copy { padding-bottom: 64px !important; }
  .hero h1 { font-size: 60px !important; margin: 0 !important; }` });
await pg.evaluate(() => document.fonts.ready);
await pg.waitForTimeout(400);
await pg.screenshot({ path: path.join(root, 'assets/kkachi/og/kkachi-og.png') });
await b.close();
console.log('assets/kkachi/og/kkachi-og.png');
