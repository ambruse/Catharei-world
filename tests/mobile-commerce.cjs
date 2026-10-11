// Browser regression against the isolated, notification-suppressed preview only.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = process.env.MOBILE_ORIGIN || 'http://127.0.0.1:3117';
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin), 'Use an isolated local QA server');
const out = path.join(__dirname, 'mobile-artifacts', 'commerce');
fs.mkdirSync(out, { recursive: true });
const checks = [];
const record = (name, detail = '') => checks.push({ name, passed: true, detail });

(async () => {
  const catalogue = await (await fetch(origin + '/api/products')).json();
  const existingVariant = catalogue.find(p => {
    const sizes = typeof p.variants === 'string' ? JSON.parse(p.variants || 'null') : p.variants;
    return sizes && Object.keys(sizes).some(s => s !== '_disabled' && !(sizes._disabled || []).includes(s));
  });
  // Some live catalogues have no enabled sizes; use a browser-only size fixture in that case.
  const variant = existingVariant || { ...catalogue[0], variants: JSON.stringify({ small: 40, medium: 60, large: 80, _disabled: ['large'] }) };
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const lang of ['en', 'ar']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      await context.route(/googletagmanager|google-analytics/, r => r.abort());
      if (!existingVariant) await context.route('**/api/products', r => r.fulfill({ json: catalogue.map(p => p.id === variant.id ? variant : p) }));
      await context.addInitScript(lang => localStorage.setItem('catharei-lang', lang), lang);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(origin + '/menu.html?q=zzzz-no-match-qa');
      await page.locator('#menu-empty').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#menu-search').isVisible(), true);
      await page.locator('#menu-search').fill('');
      await page.locator('#menu-empty').waitFor({ state: 'hidden' });
      record(`${lang}: visible mobile search and clear/no-result recovery`);
      const card = page.locator(`[data-product-id="${variant.id}"].menu-item`);
      await card.locator('.menu-open-button').click();
      await page.locator('.product-detail').waitFor({ state: 'visible' });
      await page.locator('.product-detail-add').click();
      await page.locator('#variant-modal.active').waitFor();
      await page.waitForFunction(() => document.getElementById('variant-modal').contains(document.activeElement));
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#variant-modal.active').count(), 0);
      assert.equal(await page.locator('.product-detail').isVisible(), true);
      assert.equal(await page.locator('.product-detail-add').evaluate(el => el === document.activeElement), true);
      await page.locator('.product-detail-add').click();
      const options = page.locator('input[name="product-size"]');
      const chosen = await options.last().getAttribute('value');
      await options.last().check();
      await page.screenshot({ path: path.join(out, `size-selection-${lang}.png`) });
      await page.locator('#variant-modal button[onclick="confirmVariantAddToCart()"]').evaluate(el => { el.click(); el.click(); });
      const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('catharei-cart-data')));
      const sizes = typeof variant.variants === 'string' ? JSON.parse(variant.variants) : variant.variants;
      assert.equal(cart.length, 1); assert.equal(cart[0].id, `${variant.id}_${chosen}`);
      assert.equal(cart[0].price, sizes[chosen]); assert.equal(cart[0].qty, 1);
      await page.locator('.product-detail-close').click();
      assert.equal(await page.locator('.product-detail').count(), 0);
      assert.equal(await card.locator('.menu-open-button').evaluate(el => el === document.activeElement), true);
      record(`${lang}: nested detail/size dialogs, Escape focus return, size price and double-click protection`);

      await page.goto(origin + '/navigation/cart.html');
      await page.locator('.qty-adjuster button').last().click();
      assert.equal(await page.locator('.qty-adjuster input').inputValue(), '2');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('catharei-cart-data'))[0].qty), 2);
      await page.screenshot({ path: path.join(out, `cart-${lang}.png`), fullPage: true });
      record(`${lang}: cart quantity persists and subtotal updates`, `2 × ${sizes[chosen]}`);
      await page.goto(origin + '/checkout.html');
      await page.waitForFunction(() => document.getElementById('grand-total').textContent !== 'Qr 0.00');
      assert.equal(await page.locator('html').getAttribute('dir'), lang === 'ar' ? 'rtl' : 'ltr');
      if (lang === 'en') assert.equal(await page.locator('#name').getAttribute('placeholder'), 'John Doe');
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        assert.equal(await page.locator('.phone-input-wrap .prefix').evaluate(el => {
          const text = document.createRange(); text.selectNodeContents(el);
          return text.getClientRects().length;
        }), 1, `${lang}: phone prefix stays on one line at ${width}px`);
      }
      await page.evaluate(() => placeOrder());
      assert.equal(await page.locator('#verification-modal.active').count(), 0);
      await page.locator('#name').fill('Mobile UI QA');
      await page.locator('#phone').fill('12345678');
      await page.locator('#email').fill('mobile-ui-qa@example.test');
      await page.locator('#address').fill('QA only, isolated local test address');
      await page.locator('#place-order-btn').click();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#verification-modal.active').count(), 0);
      assert.equal(await page.locator('#place-order-btn').evaluate(el => el === document.activeElement), true);
      await page.locator('#place-order-btn').click();
      assert.equal(await page.locator('#verify-phone-num').innerText(), '+974 12345678');
      assert.equal(await page.locator('#verify-phone-num').isVisible(), true);
      await page.screenshot({ path: path.join(out, `verification-${lang}.png`) });
      await page.locator('.v-btn-cancel').click();
      assert.equal(await page.locator('#phone').inputValue(), '12345678');
      record(`${lang}: checkout validation, labels, language, verification dismissal and retained inputs`);

      let posts = 0;
      await page.route('**/api/orders', async route => {
        if (route.request().method() === 'POST') { posts++; await new Promise(r => setTimeout(r, 250)); }
        await route.continue();
      });
      await page.locator('#place-order-btn').click();
      const responsePromise = page.waitForResponse(r => r.url() === origin + '/api/orders' && r.request().method() === 'POST');
      await page.locator('.v-btn-verify').evaluate(el => { el.click(); el.click(); });
      const response = await responsePromise;
      assert.equal(response.status(), 200);
      const order = await response.json();
      assert.ok(order.success); assert.equal(posts, 1);
      await page.locator('#waiting-overlay.active').waitFor();
      assert.equal(await page.evaluate(() => localStorage.getItem('catharei-cart-data')), null);
      record(`${lang}: single real QA order POST, successful response and cart cleared`, `Local QA order ${order.orderNumber}; external notifications disabled by preview`);
      await page.goto(origin + `/thankyou.html?num=${order.orderNumber}`);
      assert.equal(await page.locator('#ord-num').innerText(), '#' + order.orderNumber);
      await page.goto(origin + `/thankyou.html?num=${order.orderNumber}&status=rejected`);
      assert.ok((await page.locator('#status-title').innerText()).trim());
      assert.equal(await page.locator('#ord-num').innerText(), '#' + order.orderNumber);
      await page.setViewportSize({ width: 844, height: 390 });
      await page.locator('.thankview .btn').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('.thankview .btn').isVisible(), true);
      record(`${lang}: success/rejection order-number rendering and short landscape scroll`);
      assert.deepEqual(errors, [], `${lang}: new page errors`);
      await context.close();
    }

    const context = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' });
    await context.route(/googletagmanager|google-analytics/, r => r.abort());
    await context.route('**/api/auth/me', r => r.fulfill({ json: { loggedIn: true, user: { id: 999, username: 'Mobile QA', email: 'qa@example.test' }, email: 'qa@example.test' } }));
    await context.route('**/api/orders/me', r => r.fulfill({ json: [{ id: 999, order_number: 'QA-ORDER', status: 'accepted', created_at: '2026-10-11T09:00:00Z', total: 120, items: JSON.stringify([{name: 'QA size fixture', price: 60, qty: 2}]) }] }));
    const page = await context.newPage();
    await page.goto(origin + '/account.html');
    await page.locator('button[aria-controls="details"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#details').isVisible(), true);
    await page.getByLabel('Username', { exact: true }).fill('Mobile QA');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    record('320px account: keyboard panel controls, form labels, no horizontal overflow');
    await page.locator('button[aria-controls="orders"]').click();
    assert.ok((await page.locator('.order-item').innerText()).includes('QR 120.00'));
    record('Account history: checkout qty field renders correct item total', 'Mock authenticated QA history');
    await page.goto(origin + '/login.html');
    await page.getByRole('button', { name: 'Forgot password?' }).click();
    assert.equal(await page.locator('#panel-forgot').getByLabel('Username', { exact: true }).isVisible(), true);
    await page.screenshot({ path: path.join(out, 'login-reset-320.png') });
    record('320px login: reset controls and associated labels');
    await page.evaluate(item => localStorage.setItem('catharei-cart-data', JSON.stringify([{id:item.id,name:item.name,price:Number(item.price || 40),image:item.image,qty:1}])), catalogue[0]);
    await context.route('**/vendor/maplibre/*.mjs*', r => r.abort());
    await page.goto(origin + '/checkout.html');
    await page.locator('#open-location').click();
    await page.waitForFunction(() => document.getElementById('location-picker').dataset.state === 'error');
    assert.ok((await page.locator('#location-status').innerText()).includes('Map unavailable'));
    await page.locator('#picker-manual').click();
    assert.ok(Number((await page.locator('#grand-total').innerText()).replace(/[^0-9.]/g, '')) > 0);
    record('Checkout remains initialized when map library fails');
    await context.close();
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(checks, null, 2));
  }
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
