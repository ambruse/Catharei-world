const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const phase = process.argv[2] || 'after';
const origin = process.env.MOBILE_ORIGIN || 'http://127.0.0.1:3122';
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const out = path.join(root, 'SEO_OPTIMIZATION_2026-10-11', phase);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const routes = ['/', '/menu.html', '/navigation/Arabic_sweets.html', '/navigation/cakes.html', '/locations/al-kharaitiyat.html', '/blog', '/blog/history-of-luqaimat', '/blog/best-arabic-sweets-gifting'];
  const results = [];
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.route(/googletagmanager|google-analytics/, route => route.abort());
      const page = await context.newPage();
      for (const route of routes) {
        const errors = [];
        const listener = e => errors.push(e.message);
        page.on('pageerror', listener);
        const response = await page.goto(origin + route + '?lang=en', { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => document.querySelectorAll('.reveal-section').forEach(s => s.classList.add('is-visible')));
        await page.screenshot({ path: path.join(out, (route.replace(/[^a-z0-9]/gi, '_') || 'home') + `-${width}.png`), fullPage: true, animations: 'disabled' });
        const data = await page.evaluate(() => ({ title: document.title, overflow: document.documentElement.scrollWidth > innerWidth, h1: [...document.querySelectorAll('main h1')].map(e => e.textContent), brand: document.querySelector('.site-header .brand-name-big')?.textContent, canonical: document.querySelector('link[rel=canonical]')?.href, schema: [...document.querySelectorAll('script[type="application/ld+json"]')].map(e => JSON.parse(e.textContent)) }));
        results.push({ route, width, status: response.status(), errors, ...data });
        page.off('pageerror', listener);
      }
      await context.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(out, 'browser.json'), JSON.stringify(results, null, 2));
  assert.ok(results.every(r => r.status === 200 && !r.overflow && !r.errors.length && r.brand === 'CATHAREi'));
  console.log(JSON.stringify({ phase, pages: results.length, failures: results.filter(r => r.overflow || r.errors.length || r.status !== 200) }));
})().catch(e => { console.error(e); process.exitCode = 1; });
