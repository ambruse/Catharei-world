// Targeted checkout recapture after the full visual matrix; uses the same baseline fixture.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const origin = process.env.MOBILE_ORIGIN || 'http://127.0.0.1:3117';
const dir = path.join(__dirname, 'mobile-artifacts', 'after');
(async () => {
  const products = await (await fetch(origin + '/api/products')).json();
  const item = products.find(p => !p.variants) || products[0];
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    for (const [width, lang] of [[320,'en'],[390,'en'],[768,'en'],[1440,'en'],[320,'ar'],[390,'ar']]) {
      const context = await browser.newContext({viewport:{width,height:844}, deviceScaleFactor:1,isMobile:width<=768,hasTouch:width<=768,reducedMotion:'reduce'});
      await context.route(/googletagmanager|google-analytics/, r => r.abort());
      await context.addInitScript(({lang,item}) => {
        localStorage.setItem('catharei-lang', lang);
        localStorage.setItem('catharei-cart-data', JSON.stringify([{id:item.id,name:item.name,price:Number(item.price),image:item.image,qty:2}]));
      }, {lang,item});
      const page = await context.newPage();
      await page.goto(origin + '/checkout.html', {waitUntil:'domcontentloaded'});
      await page.waitForTimeout(750);
      await page.evaluate(() => document.fonts.ready);
      const metric = await page.evaluate(() => {
        const prefix = document.querySelector('.phone-input-wrap .prefix');
        const range = document.createRange(); range.selectNodeContents(prefix);
        return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,prefixLines:range.getClientRects().length,namePlaceholder:document.getElementById('name').placeholder};
      });
      assert.equal(metric.prefixLines, 1); assert.ok(metric.scrollWidth <= width + 1);
      if (lang === 'en') assert.equal(metric.namePlaceholder, 'John Doe');
      const screenshot = `checkout_html-${width}-${lang}.png`;
      await page.screenshot({path:path.join(dir,screenshot),fullPage:true,animations:'disabled'});
      results.push({...metric,lang,screenshot});
      await context.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(dir,'checkout-final-metrics.json'), JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
})().catch(error => {console.error(error);process.exitCode=1;});
