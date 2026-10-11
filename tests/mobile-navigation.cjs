// Browser checks use only the isolated local preview and this browser's storage.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = process.env.MOBILE_ORIGIN || 'http://127.0.0.1:3117';
const artifactDir = path.join(__dirname, 'mobile-artifacts', 'interactions');
fs.mkdirSync(artifactDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await context.route(/googletagmanager|google-analytics/, route => route.abort());
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const check = async (name, fn) => {
    try { await fn(); results.push({ name, passed: true }); console.log('PASS', name); }
    catch (error) { results.push({ name, passed: false, error: error.message }); console.log('FAIL', name, error.message); }
  };
  try {
    await check('Navigation responds while catalogue request is pending', async () => {
      await page.route('**/api/products*', async route => {
        await new Promise(resolve => setTimeout(resolve, 2500));
        await route.continue().catch(() => {}); // A later test may already have navigated away.
      });
      await page.goto(origin + '/navigation/cakes.html', { waitUntil: 'domcontentloaded' });
      await page.locator('#mobile-menu-toggle').click({ timeout: 1200 });
      assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('body').evaluate(element => element.style.position), 'fixed');
      await page.screenshot({ path: path.join(artifactDir, 'navigation-320-en.png') });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'mobile-menu-toggle');
      await page.unroute('**/api/products*');
    });
    await check('Drawer closes via backdrop and button, traps focus and restores scroll', async () => {
      await page.goto(origin + '/about.html', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => window.scrollTo(0, 260));
      const before = await page.evaluate(() => window.scrollY);
      await page.locator('#mobile-menu-toggle').click();
      await page.waitForFunction(() => document.querySelector('#nav-list').contains(document.activeElement));
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'mobile-menu-toggle');
      await page.keyboard.press('Shift+Tab');
      assert.ok(await page.locator('#nav-list').evaluate(element => element.contains(document.activeElement)));
      await page.locator('.nav-backdrop').click({ position: { x: 314, y: 150 } });
      assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'false');
      assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - before) <= 1);
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#mobile-menu-toggle').click();
      assert.equal(await page.locator('#nav-list').evaluate(element => element.inert), true);
    });
    await check('RTL drawer, language dropdown and breakpoint reset preserve navigation', async () => {
      await page.goto(origin + '/about.html?lang=ar', { waitUntil: 'domcontentloaded' });
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#lang-btn').click();
      assert.equal(await page.locator('#lang-btn').getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
      const bounds = await page.locator('#nav-list').boundingBox();
      assert.ok(bounds.x >= -1 && bounds.x + bounds.width <= 321);
      await page.screenshot({ path: path.join(artifactDir, 'navigation-320-ar.png') });
      await page.setViewportSize({ width: 1440, height: 900 });
      assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('#nav-list').evaluate(element => element.inert), false);
      assert.equal(await page.locator('body').evaluate(element => element.style.position), '');
      await page.locator('#sweets-btn').click();
      assert.equal(await page.locator('#sweets-btn').getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#sweets-btn').getAttribute('aria-expanded'), 'false');
    });
    await check('Shared search submits to existing menu and nested route cart uses correct destination', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(origin + '/navigation/cakes.html?lang=en', { waitUntil: 'domcontentloaded' });
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#search-input').fill('cake');
      await page.locator('#search-input').press('Enter');
      await page.waitForURL('**/menu.html?q=cake');
      await page.locator('#menu-search').waitFor();
      assert.equal(await page.locator('#menu-search').inputValue(), 'cake');
      await page.goto(origin + '/locations/al-wakrah.html', { waitUntil: 'domcontentloaded' });
      await page.locator('#cart-btn').click();
      await page.waitForURL('**/navigation/cart.html');
    });
    await check('Variant dialog supports size selection, Escape, outside close and focus restore', async () => {
      const products = await (await fetch(origin + '/api/products')).json();
      let product = products.find(item => {
        try { const sizes = JSON.parse(item.variants || 'null'); return sizes && Object.keys(sizes).some(size => size !== '_disabled' && !(sizes._disabled || []).includes(size)); } catch { return false; }
      });
      if (!product) {
        // Existing catalogue has no variants; exercise the existing variant contract
        // through a browser-only API fixture without changing a product or database.
        product = { ...products[0], variants: JSON.stringify({ small: Number(products[0].price), medium: Number(products[0].price) + 10 }) };
        await page.route('**/api/products*', route => route.fulfill({ json: products.map(item => item.id === product.id ? product : item) }));
      }
      await page.goto(origin + '/menu.html?lang=en', { waitUntil: 'domcontentloaded' });
      const button = page.locator(`#product-${product.id} .menu-add-button`);
      await button.waitFor();
      await button.click();
      const overlay = page.locator('#variant-modal');
      await page.waitForFunction(() => document.querySelector('#variant-modal').contains(document.activeElement));
      assert.equal(await overlay.getAttribute('aria-hidden'), 'false');
      assert.equal(await overlay.locator('.modal-content').getAttribute('aria-modal'), 'true');
      assert.ok(await overlay.evaluate(element => element.contains(document.activeElement)));
      await page.keyboard.press('Escape');
      assert.equal(await overlay.getAttribute('aria-hidden'), 'true');
      await page.unroute('**/api/products*');
      assert.equal(await button.evaluate(element => element === document.activeElement), true);
      await page.waitForTimeout(460);
      await button.click();
      await overlay.click({ position: { x: 3, y: 3 } });
      assert.equal(await overlay.getAttribute('aria-hidden'), 'true');
      await page.waitForTimeout(460);
      await button.click();
      const option = overlay.locator('input[type=radio]').last();
      const selectedSize = await option.getAttribute('value');
      await option.check();
      await page.screenshot({ path: path.join(artifactDir, 'variant-390.png') });
      await overlay.locator('button[onclick="confirmVariantAddToCart()"]').click();
      const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('catharei-cart-data')));
      assert.ok(cart.some(item => item.id === `${product.id}_${selectedSize}`));
      assert.equal(await overlay.getAttribute('aria-hidden'), 'true');
    });
    await check('Cart keeps quantity focus, restores removed item with Undo and reports unsupported coupon', async () => {
      await page.goto(origin + '/navigation/cart.html', { waitUntil: 'domcontentloaded' });
      const plus = page.locator('[data-cart-action=increase]').first();
      const quantityBefore = Number(await page.locator('.qty-adjuster input').first().inputValue());
      await plus.click();
      assert.equal(Number(await page.locator('.qty-adjuster input').first().inputValue()), quantityBefore + 1);
      assert.equal(await page.evaluate(() => document.activeElement.dataset.cartAction), 'increase');
      const cartBefore = await page.evaluate(() => localStorage.getItem('catharei-cart-data'));
      await page.locator('.cart-col-remove button').first().click();
      await page.locator('.toast-undo').last().click();
      assert.equal(await page.evaluate(() => localStorage.getItem('catharei-cart-data')), cartBefore);
      await page.evaluate(() => {
        cartItems[0].qty = 1;
        localStorage.setItem('catharei-cart-data', JSON.stringify(cartItems));
        renderCartPage();
      });
      await page.locator('[data-cart-action=decrease]').first().click();
      await page.locator('.toast-undo').last().click();
      assert.equal(Number(await page.locator('.qty-adjuster input').first().inputValue()), 1);
      const afterUndo = await page.evaluate(() => localStorage.getItem('catharei-cart-data'));
      await page.locator('[data-i18n="cart.apply"]').click();
      assert.equal(await page.locator('#cart-coupon-area input').getAttribute('aria-invalid'), 'true');
      assert.ok(await page.locator('#cart-coupon-feedback').isVisible());
      await page.locator('#cart-coupon-area input').fill('QA-NOT-A-COUPON');
      await page.locator('[data-i18n="cart.apply"]').click();
      assert.equal(await page.evaluate(() => localStorage.getItem('catharei-cart-data')), afterUndo);
    });
    await check('Current homepage does not load the dormant legacy cake sequence', async () => {
      const frames = new Set();
      page.on('request', request => { if (request.url().includes('/images/herosection_1/')) frames.add(request.url()); });
      await page.goto(origin + '/', { waitUntil: 'domcontentloaded' });
      await page.locator('footer').scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      assert.equal(await page.locator('#cake-scroll-section').count(), 0);
      assert.equal(frames.size, 0);
    });
    await check('Short viewport drawer and dialog remain scrollable with enlarged text', async () => {
      await page.setViewportSize({ width: 320, height: 360 });
      await page.goto(origin + '/navigation/cakes.html', { waitUntil: 'domcontentloaded' });
      // CSS text enlargement stress test, not a claim of OS/browser zoom or real keyboard testing.
      await page.addStyleTag({ content: 'html {font-size:200% !important} body {font-size:200% !important}' });
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#lang-btn').scrollIntoViewIfNeeded();
      await page.locator('#lang-btn').click();
      await page.locator('#lang-ar').scrollIntoViewIfNeeded();
      const languageBounds = await page.locator('#lang-ar').boundingBox();
      assert.ok(languageBounds.y >= 0 && languageBounds.y + languageBounds.height <= 361);
      await page.keyboard.press('Escape');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.evaluate(() => openVariantModal('qa-geometry-only', 'QA geometry fixture', 10, '', { small: 10, medium: 20, large: 30 }));
      const add = page.locator('#variant-modal button[onclick="confirmVariantAddToCart()"]');
      await add.scrollIntoViewIfNeeded();
      const addBounds = await add.boundingBox();
      assert.ok(addBounds.y >= 0 && addBounds.y + addBounds.height <= 361);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('body').evaluate(element => element.style.position), '');
      await page.evaluate(() => { cartItems = [{id:'qa-badge',name:'QA badge',price:1,qty:2}]; updateCartBadgeUI(); });
      assert.deepEqual(await page.locator('.cart-badge').allTextContents(), ['2', '2']);
    });
    await check('No unhandled browser errors', async () => assert.deepEqual(errors, []));
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(artifactDir, 'navigation-results.json'), JSON.stringify({ browser: 'Desktop Chrome with mobile/touch emulation; not a real device', results, errors }, null, 2));
  }
  console.log(JSON.stringify(results, null, 2));
  if (results.some(result => !result.passed)) process.exitCode = 1;
})();
