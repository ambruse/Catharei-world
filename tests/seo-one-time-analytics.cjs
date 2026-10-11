// Extend the existing isolated EN/AR funnel test; never contact production.
const fs = require('node:fs');
const path = require('node:path');
let source = fs.readFileSync(path.join(__dirname, 'seo-measurement-browser.cjs'), 'utf8');
source = source.replace('SEO_MONITORING/REPORTS/2026-10-11/browser', 'SEO_OPTIMIZATION_2026-10-11/analytics');
source = source.replace('SEO_MONITORING/ARCHIVE/2026-10-11-before', 'SEO_OPTIMIZATION_2026-10-11/before');
source = source.replace("      await page.goto(base+'/checkout.html');", `
      assert.equal((await events(page)).find(e=>e.name==='view_item').params.value, undefined);
      await page.goto(base+'/navigation/cart.html');
      await page.locator('[data-cart-action="increase"]').click();
      await page.locator('[data-cart-action="decrease"]').click();
      await page.evaluate(() => removeFromCart(JSON.parse(localStorage.getItem('catharei-cart-data'))[0].id));
      await page.locator('.toast-undo').click();
      const deltas = await events(page);
      assert.equal(deltas.filter(e=>e.name==='add_to_cart').length, 2);
      assert.equal(deltas.filter(e=>e.name==='remove_from_cart').length, 2);
      assert.ok(deltas.every(e=>e.params.value===60 && e.params.items[0].quantity===1));
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('catharei-cart-data'))[0].qty),1);
      await page.goto(base+'/checkout.html');`);
const Module = require('node:module');
const runner = new Module(__filename, module); runner.filename = __filename; runner.paths = module.paths;
runner._compile(source, __filename);
