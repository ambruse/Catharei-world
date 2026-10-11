// All production-looking URLs are fulfilled from the isolated local preview.
// External requests are blocked and order responses are fixtures; no real order is placed.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = process.env.MOBILE_ORIGIN || 'http://127.0.0.1:3120';
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'SEO_MONITORING/REPORTS/2026-10-11/browser');
fs.mkdirSync(out, { recursive: true });
const base = 'https://www.catharei.com';
const results = [];
const events = page => page.evaluate(() => (window.dataLayer || []).filter(row => row[0] === 'event').map(row => ({ name: row[1], params: row[2] })));
(async () => {
  const catalogue = await (await fetch(origin + '/api/products')).json();
  const product = {...catalogue[0], variants: JSON.stringify({small:40,large:60})};
  const item = {id:String(product.id),name:product.name,price:Number(product.price),qty:2,image:product.image};
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  async function contextFor({before=false,width=390,lang='en',cart=[]}={}) {
    const context = await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
    let failOrder = true;
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== base) return route.abort();
      if (url.pathname === '/api/orders' && route.request().method() === 'POST') return route.fulfill({status:failOrder ? 500 : 200,json:failOrder ? {error:'QA failure'} : {success:true,orderId:999999,orderNumber:'QA-ONLY'}});
      if (/^\/api\/orders\//.test(url.pathname)) return route.fulfill({json:{status:'pending'}});
      if (url.pathname === '/api/products') return route.fulfill({json:catalogue.map(row=>row.id===product.id?product:row)});
      const backup = path.join(root,'SEO_MONITORING/ARCHIVE/2026-10-11-before',url.pathname.slice(1));
      if (before && ['/script.js','/menu.js','/checkout.html'].includes(url.pathname)) return route.fulfill({path:backup,contentType:url.pathname.endsWith('.js')?'application/javascript':'text/html'});
      const response = await route.fetch({url:origin+url.pathname+url.search});
      return route.fulfill({response});
    });
    await context.addInitScript(({cart,lang}) => {if (localStorage.getItem('catharei-cart-data') === null) localStorage.setItem('catharei-cart-data',JSON.stringify(cart));localStorage.setItem('catharei-lang',lang);}, {cart,lang});
    return {context, allowOrder:()=>failOrder=false};
  }
  try {
    for (const lang of ['en','ar']) {
      const fixture = await contextFor({lang});
      const page = await fixture.context.newPage();
      page.setDefaultTimeout(15000);
      const errors = []; page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'/menu.html');
      const card=page.locator(`.menu-item[data-product-id="${product.id}"]`);
      await card.locator('.menu-open-button').click();
      assert.equal((await events(page)).filter(e=>e.name==='view_item').length,1);
      await page.locator('.product-detail-add').click();
      await page.locator('input[name="product-size"][value="large"]').check();
      await page.locator('#variant-modal button[onclick="confirmVariantAddToCart()"]').evaluate(el=>{el.click();el.click();});
      const add = (await events(page)).filter(e=>e.name==='add_to_cart');
      assert.equal(add.length,1);assert.equal(add[0].params.value,60);assert.equal(add[0].params.items[0].item_variant,'large');
      await page.goto(base+'/checkout.html');
      await page.waitForFunction(()=>(window.dataLayer||[]).some(e=>e[1]==='begin_checkout'));
      assert.equal((await events(page)).filter(e=>e.name==='begin_checkout').length,1);
      await page.locator('#name').fill('SEO QA');await page.locator('#phone').fill('12345678');
      await page.locator('#email').fill('qa@example.test');await page.locator('#address').fill('Private QA address');
      await page.locator('#place-order-btn').click();await page.locator('.v-btn-verify').click();
      await page.waitForFunction(()=>!document.getElementById('place-order-btn').disabled);
      assert.equal((await events(page)).filter(e=>e.name==='order_submitted').length,0);
      fixture.allowOrder();
      await page.locator('#place-order-btn').click();await page.locator('.v-btn-verify').evaluate(el=>{el.click();el.click();});
      await page.locator('#waiting-overlay.active').waitFor();
      const finalEvents = await events(page);
      assert.equal(finalEvents.filter(e=>e.name==='order_submitted').length,1);
      assert.equal(finalEvents.filter(e=>e.name==='purchase').length,0);
      assert.doesNotMatch(JSON.stringify(finalEvents),/qa@example|Private QA|12345678|"lat"|"lng"/);
      assert.deepEqual(errors,[]);
      results.push({test:`${lang} commerce events, failed/successful submission, double click, PII exclusion`,passed:true,events:finalEvents.map(e=>e.name)});
      await fixture.context.close();
    }
    // Confirm measurement-only changes do not alter a pixel of these templates.
    for (const width of [390,1440]) for (const route of ['/','/menu.html','/checkout.html']) {
      const images=[];
      for (const before of [true,false]) {
        const fixture=await contextFor({before,width,cart:[item]}); const page=await fixture.context.newPage();
        await page.goto(base+route);await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);
        await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
        const name=`${route.replace(/\W/g,'')||'home'}-${width}-${before?'before':'after'}.png`;
        images.push(await page.screenshot({path:path.join(out,name)}));await fixture.context.close();
      }
      assert.equal(images[0].equals(images[1]),true,`Visual difference: ${route} ${width}`);
      results.push({test:`Pixel-identical before/after ${route} at ${width}px`,passed:true});
    }
  } finally {await browser.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));}
  console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
