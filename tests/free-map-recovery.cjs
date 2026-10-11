const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const origin=process.env.MOBILE_ORIGIN||'http://127.0.0.1:3118';assert.match(origin,/^http:\/\/127\.0\.0\.1:\d+$/);
const results=[];const out=path.join(__dirname,'map-artifacts','after');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const context=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await context.route(/googletagmanager|google-analytics/,r=>r.abort());
 await context.addInitScript(()=>{if(!localStorage.getItem('catharei-cart-data'))localStorage.setItem('catharei-cart-data','[{"id":"qa","name":"Recovery QA","price":40,"qty":1}]');});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://tiles.openfreemap.org/styles/liberty',r=>r.abort());
 await page.goto(origin+'/checkout.html');await page.locator('#address').fill('QA manual address');await page.locator('#open-location').click();
 await page.waitForFunction(()=>document.getElementById('location-picker').dataset.state==='error');assert.equal(await page.locator('#confirm-location').isDisabled(),true);
 await page.locator('#location-search').fill('Al Sadd');await page.locator('#location-results button').first().click();assert.ok((await page.locator('#delivery-area').inputValue()).length>0);
 assert.equal(await page.locator('#lat').inputValue(),'');
 await page.screenshot({path:path.join(out,'network-error-320.png')});
 await page.locator('#picker-manual').click();assert.equal(await page.locator('#address').inputValue(),'QA manual address');assert.equal(await page.evaluate(()=>deliveryPicker.payload().latitude),null);
 results.push({name:'Style failure disables confirmation; local area search and manual address survive',passed:true});
 // Recovery uses the real free provider, not a mocked map implementation.
 await page.unroute('https://tiles.openfreemap.org/styles/liberty');await page.locator('#open-location').click();await page.waitForFunction(()=>!document.getElementById('locate-btn').disabled,{},{timeout:25000});
 const canvas=page.locator('.maplibregl-canvas');await canvas.focus();await page.keyboard.press('+');await page.keyboard.press('ArrowRight');
 await page.locator('#map').click({position:{x:140,y:85}});await page.locator('#confirm-location').click();assert.ok(Number.isFinite(await page.evaluate(()=>deliveryPicker.payload().latitude)));
 results.push({name:'Map retry and keyboard pan/zoom recover after provider failure',passed:true});
 // A different cart must never inherit another cart's location draft.
 await page.evaluate(()=>localStorage.setItem('catharei-cart-data','[{"id":"other","name":"Other QA","price":50,"qty":1}]'));await page.reload();assert.equal(await page.locator('#lat').inputValue(),'');
 results.push({name:'Address restoration is scoped to the unchanged cart',passed:true});
 await page.locator('#open-location').click();await page.waitForFunction(()=>!document.getElementById('locate-btn').disabled,{},{timeout:25000});
 // Short viewport emulates keyboard-reduced visual space; not a real iOS keyboard.
 await page.setViewportSize({width:390,height:380});await page.locator('#location-search').fill('Doha');await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(out,'keyboard-space-390.png')});await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 results.push({name:'Reduced keyboard viewport keeps search usable with no horizontal overflow',passed:true});
 // Module failure, not only tiles, also offers an address fallback.
 await page.route('**/vendor/maplibre/*.mjs*',r=>r.abort());await page.reload();await page.locator('#open-location').click();await page.waitForFunction(()=>document.getElementById('location-picker').dataset.state==='error');await page.locator('#picker-manual').click();
 await page.locator('#name').fill('Recovery QA');await page.locator('#phone').fill('12345678');await page.locator('#email').fill('recovery@example.test');await page.locator('#address').fill('QA Building 12 Street 120 Zone 39');
 await page.locator('#place-order-btn').click();const responsePromise=page.waitForResponse(r=>r.url()===origin+'/api/orders'&&r.request().method()==='POST');await page.locator('.v-btn-verify').click();const response=await responsePromise;assert.equal(response.status(),200);assert.equal(response.request().postDataJSON().deliveryLocation.latitude,null);
 results.push({name:'Library failure still permits existing staff-reviewed manual checkout without invented coordinates',passed:true});
 const bad=await context.request.post(origin+'/api/orders',{data:{items:[{name:'QA',qty:1,price:40}],total:40,address:'QA',paymentMethod:'cod',deliveryLocation:{latitude:999,longitude:51,locationSource:'map-pin',confirmedAt:new Date().toISOString()}}});assert.equal(bad.status(),400);
 results.push({name:'Order API rejects invalid coordinates',passed:true});assert.deepEqual(errors,[]);
 await context.close();
}finally{await browser.close();fs.writeFileSync(path.join(out,'recovery-results.json'),JSON.stringify(results,null,2));}console.log(results);})().catch(e=>{console.error(e);process.exitCode=1;});
