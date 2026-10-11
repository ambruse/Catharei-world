// Equivalent WebKit engine checks on Windows; this is not real iOS Safari hardware.
const { webkit } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const inventory = require('./mobile-route-inventory.json');
const { productPath } = require('../catalogue-seo');
const origin = process.env.MOBILE_ORIGIN || 'http://127.0.0.1:3117';
const out = path.join(__dirname, 'mobile-artifacts', 'webkit');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const products = await (await fetch(origin + '/api/products')).json();
  const sample = products.find(product => !product.variants) || products[0];
  const realVariant = products.find(product => product.variants && product.variants !== 'null');
  const variant = realVariant || sample;
  const allRoutes = [...inventory.basePages.filter(page => page.public).map(page => page.route), ...inventory.dynamicRoutes.map(page => page.route)];
  const representatives = ['/', '/menu.html', '/navigation/Arabic_sweets.html', '/navigation/cart.html', '/checkout.html', '/contact.html', '/login.html', '/account.html', '/thankyou.html', '/locations/al-wakrah.html', '/blog/history-of-luqaimat', productPath(variant || sample)];
  const jobs = allRoutes.map(route => ({ route, width: 390, height: 844, lang: 'en' }));
  for (const route of representatives) {
    jobs.push({ route, width: 320, height: 568, lang: 'ar' });
    jobs.push({ route, width: 844, height: 390, lang: 'en' });
  }
  const browser = await webkit.launch({ headless: true });
  const results = [];
  const journeys = [];
  const setup = async ({ width = 390, height = 844, lang = 'en', route = '/' } = {}) => {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await context.route(/googletagmanager|google-analytics/, route => route.abort());
    await context.addInitScript(({ lang, item }) => {
      localStorage.setItem('catharei-lang', lang);
      localStorage.setItem('catharei-cart-data', JSON.stringify([{ id: item.id, name: item.name, price: Number(item.price), image: item.image, qty: 2 }]));
    }, { lang, item: sample });
    if (route === '/account.html') {
      await context.route('**/api/auth/me', route => route.fulfill({ json: { loggedIn: true, user: { id: 999, username: 'Mobile QA', email: 'qa@example.test', role: 'user' } } }));
      await context.route('**/api/orders/me', route => route.fulfill({ json: [] }));
    }
    return context;
  };
  try {
    const selectedJobs = process.env.MOBILE_WEBKIT_JOURNEYS_ONLY ? [] : process.env.MOBILE_WEBKIT_LANDSCAPE_ONLY ? jobs.filter(job => job.width === 844) : jobs;
    for (const job of selectedJobs) {
      const context = await setup(job);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        const response = await page.goto(origin + job.route, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(350);
        await page.evaluate(async () => {
          await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1500))]);
          document.querySelectorAll('.reveal-section').forEach(section => section.classList.add('is-visible'));
        });
        const metrics = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, dir: document.documentElement.dir, smallInputs: [...document.querySelectorAll('input:not([type=radio]):not([type=checkbox]),select,textarea')].filter(input => input.getBoundingClientRect().height > 0 && getComputedStyle(input).visibility !== 'hidden' && parseFloat(getComputedStyle(input).fontSize) < 16).map(input => input.id) }));
        results.push({ ...job, status: response.status(), ...metrics, errors });
        if (job.width === 390 && representatives.includes(job.route)) await page.screenshot({ path: path.join(out, `${job.route.replace(/[^a-z0-9]+/gi, '_') || 'home'}-390.png`), fullPage: true, animations: 'disabled' });
      } catch (error) { results.push({ ...job, error: error.message, errors }); }
      await context.close();
      if (results.length % 15 === 0) console.log(`WebKit: ${results.length}/${jobs.length}`);
    }
    for (const lang of ['en', 'ar']) {
      const context = await setup({ lang });
      const page = await context.newPage();
      try {
        await page.goto(origin, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const toggle = page.locator('#mobile-menu-toggle');
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'mobile-menu-toggle');
        journeys.push({ lang, journey: 'Mobile navigation opens, Escape closes, focus returns', passed: true });
      } catch (error) { journeys.push({ lang, journey: 'Mobile navigation opens, Escape closes, focus returns', passed: false, error: error.message }); }
      try {
        if (variant) {
          await page.goto(origin + productPath(variant), { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(500);
          // This catalogue currently has no configured variants. Exercise the existing
          // modal with a browser-only fixture; no product/API/database is changed.
          if (!realVariant) await page.locator('#product-page-add').evaluate(button => { button.dataset.variants = JSON.stringify({ small: 17.5, large: 25 }); });
          await page.locator('#product-page-add').click();
          await page.locator('#variant-modal.active').waitFor({ state: 'visible' });
          await page.keyboard.press('Escape');
          assert.equal(await page.evaluate(() => document.activeElement?.id), 'product-page-add');
          await page.locator('#product-page-add').click();
          await page.locator('#variant-modal.active').waitFor({ state: 'visible' });
          const radio = page.locator('#variant-options input[type=radio]').first();
          await radio.check();
          const selected = await radio.inputValue();
          await page.locator('#variant-modal button[onclick="confirmVariantAddToCart()"]:visible').click();
          const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('catharei-cart-data')));
          assert.ok(cart.some(item => item.id === `${variant.id}_${selected}` && item.qty > 0));
          journeys.push({ lang, journey: 'Product modal Escape restores focus; option selected and stored in cart', passed: true, productId: variant.id, selected, browserOnlyVariantFixture: !realVariant });
        }
      } catch (error) { journeys.push({ lang, journey: 'Product option selected and stored in cart', passed: false, error: error.message }); }
      await context.close();
    }
  } finally { await browser.close(); }
  const rowKey = row => `${row.route}|${row.width}|${row.height}|${row.lang}`;
  const priorResults = (process.env.MOBILE_WEBKIT_JOURNEYS_ONLY || process.env.MOBILE_WEBKIT_LANDSCAPE_ONLY) && fs.existsSync(path.join(out, 'results.json')) ? JSON.parse(fs.readFileSync(path.join(out, 'results.json'), 'utf8')).results.filter(row => !results.some(result => rowKey(row) === rowKey(result))) : [];
  const report = { engine: 'Playwright WebKit 26.5 on Windows', scope: '37 public routes at 390×844 English, 12 representative templates at 320×568 Arabic and 844×390 landscape. Local preview, analytics blocked, QA-only account fixture. Equivalent engine emulation; no claim of real iPhone, iOS Safari, virtual keyboard or device-safe-area verification.', lastRunAt: new Date().toISOString(), results: [...priorResults, ...results], journeys };
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ rows: results.length, overflow: results.filter(result => result.scrollWidth > result.width + 1), errors: results.filter(result => result.error || result.errors.length), journeys }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
