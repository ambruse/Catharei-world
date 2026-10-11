// Local QA only. Requires tests/start-mobile-preview.cjs (notifications suppressed).
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = process.env.MOBILE_ORIGIN || 'http://127.0.0.1:3118';
assert.match(origin,/^http:\/\/127\.0\.0\.1:\d+$/);
const out=path.join(__dirname,'map-artifacts','after');fs.mkdirSync(out,{recursive:true});
const results=[]; const record=(name,detail)=>{results.push({name,passed:true,detail});console.log('PASS '+name);};
const engine=process.env.MAP_ENGINE || 'chromium';
(async()=>{
 const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try {
  for(const lang of ['en','ar']) {
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   await context.route(/googletagmanager|google-analytics/,r=>r.abort());
   await context.addInitScript(lang=>{
    localStorage.setItem('catharei-lang',lang);localStorage.setItem('catharei-cart-data','[{"id":"qa","name":"Location QA","price":40,"qty":1}]');
    window.__gpsMode='success';window.__gpsCalls=0;
    navigator.geolocation.getCurrentPosition=(success,error,options)=>{window.__gpsCalls++;window.__gpsOptions=options;
     if(window.__gpsMode==='denied')error({code:1});else if(window.__gpsMode==='timeout')error({code:3});else if(window.__gpsMode==='late')window.__lateGPS=()=>success({coords:{latitude:25.1639,longitude:51.5974,accuracy:20}});else success({coords:{latitude:25.28541,longitude:51.53101,accuracy:window.__gpsMode==='inaccurate'?250:12}});
    };
   },lang);
   const page=await context.newPage();const errors=[];const requests=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
   await page.goto(origin+'/checkout.html?lang='+lang);
   assert.deepEqual(await page.evaluate(()=>[document.getElementById('lat').value,document.getElementById('lng').value,window.__gpsCalls]),['','',0]);
   assert.equal(requests.some(u=>/maplibre|tiles.openfreemap/.test(u)),false);
   await page.screenshot({path:path.join(out,`checkout-390-${lang}.png`),fullPage:true});
   await page.locator('#open-location').click();
   await page.waitForFunction(()=>!document.getElementById('locate-btn').disabled,{},{timeout:25000});
   assert.equal(await page.locator('#confirm-location').isDisabled(),true);
   assert.equal(await page.evaluate(()=>window.__gpsCalls),0);
   record(`${lang}: lazy live map; no implicit GPS or default confirmed coordinates`);
   await page.locator('#location-search').fill(lang==='ar'?'الدوحة':'Doha');
   await page.waitForFunction(()=>document.querySelectorAll('#location-results button').length>0);
   await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
   assert.equal(await page.locator('#confirm-location').isDisabled(),true);
   // Deliberately refine the area centre to a building point through the actual map.
   await page.locator('#map').click({position:{x:150,y:100}});
   await page.waitForFunction(()=>!document.getElementById('confirm-location').disabled);
   await page.locator('#confirm-location').click();
   const searched=await page.evaluate(()=>deliveryPicker.payload());assert.equal(searched.locationSource,'map-pin');assert.ok(Number.isFinite(searched.latitude));
   record(`${lang}: local area search, keyboard results and exact map refinement`);
   await page.locator('#delivery-area').fill(lang==='ar'?'الدوحة':'Doha');await page.locator('#delivery-buildingNumber').fill('12');await page.locator('#delivery-streetNumber').fill('120');await page.locator('#delivery-zoneNumber').fill('39');await page.locator('#delivery-propertyType').selectOption('apartment');await page.locator('#delivery-unitNumber').fill('8');await page.locator('#delivery-floorNumber').fill('2');await page.locator('#delivery-deliveryInstructions').fill('Side entrance');
   await page.locator('#address').fill('QA building address');
   await page.locator('#open-location').click();await page.locator('#locate-btn').click();
   await page.waitForFunction(()=>!document.getElementById('confirm-location').disabled,{},{timeout:25000});
   await page.locator('#confirm-location').click();
   const gps=await page.evaluate(()=>deliveryPicker.payload());assert.equal(gps.latitude,25.28541);assert.equal(gps.longitude,51.53101);assert.equal(gps.accuracyMeters,12);assert.equal(gps.unitNumber,'8');
   assert.deepEqual(await page.evaluate(()=>window.__gpsOptions),{enableHighAccuracy:true,timeout:10000,maximumAge:30000});
   await page.locator('#open-location').click();await page.evaluate(()=>window.__gpsMode='denied');await page.locator('#locate-btn').click();
   assert.match(await page.locator('#location-status').innerText(),lang==='ar'?/رفض/:/denied/);
   await page.evaluate(()=>window.__gpsMode='timeout');await page.locator('#locate-btn').click();
   assert.match(await page.locator('#location-status').innerText(),lang==='ar'?/مهلة/:/timed out/);
   await page.evaluate(()=>window.__gpsMode='inaccurate');await page.locator('#locate-btn').click();assert.match(await page.locator('#location-status').innerText(),/250/);
   await page.evaluate(()=>window.__gpsMode='late');await page.locator('#locate-btn').click();
   await page.locator('#map').click({position:{x:145,y:125}});await page.evaluate(()=>window.__lateGPS());
   await page.locator('#confirm-location').click();const adjusted=await page.evaluate(()=>deliveryPicker.payload());assert.equal(adjusted.locationSource,'map-pin');assert.notEqual(adjusted.latitude,25.1639);assert.equal(adjusted.unitNumber,'8');
   record(`${lang}: GPS permission/timeout/accuracy and stale GPS cannot replace manual selection`);
   await page.reload();await page.waitForFunction(()=>window.deliveryPicker&&document.getElementById('lat'));
   assert.equal(await page.locator('#lat').inputValue(),String(adjusted.latitude));assert.equal(await page.locator('#delivery-unitNumber').inputValue(),'8');
   await page.locator('#open-location').click();await page.waitForFunction(()=>!document.getElementById('locate-btn').disabled,{},{timeout:25000});
   await page.locator('#map').click({position:{x:100,y:100}});await page.keyboard.press('Escape');
   assert.equal(await page.locator('#location-picker').isVisible(),false);assert.equal(await page.locator('#lat').inputValue(),String(adjusted.latitude));assert.equal(await page.locator('#open-location').evaluate(el=>el===document.activeElement),true);
   record(`${lang}: session restoration; cancel preserves confirmed pin and focus`);
   await page.locator('#open-location').click();
   for(const [width,height] of [[320,568],[360,800],[375,812],[390,844],[393,851],[414,896],[430,932],[768,1024],[1440,900],[844,390]]) {
    await page.setViewportSize({width,height});await page.waitForTimeout(200);
    const metric=await page.evaluate(()=>{const pin=document.getElementById('location-pin'),r=pin.getBoundingClientRect(),c=document.getElementById('confirm-location').getBoundingClientRect(),m=document.getElementById('map').getBoundingClientRect();return{width:innerWidth,scrollWidth:document.documentElement.scrollWidth,pinHidden:pin.hasAttribute('hidden'),pinDisplay:getComputedStyle(pin).display,pinX:r.left+r.width/2,pinY:r.bottom,mapX:m.left+m.width/2,mapY:m.top+m.height/2,confirmBottom:c.bottom,confirmTop:c.top,height:innerHeight};});
    assert.ok(metric.scrollWidth<=width+1);assert.equal(metric.pinHidden,false);assert.notEqual(metric.pinDisplay,'none');assert.ok(Math.abs(metric.pinX-metric.mapX)<1);assert.ok(Math.abs(metric.pinY-metric.mapY)<1);
    assert.ok(metric.confirmBottom<=height+1, `Confirmation clipped at ${width}x${height}: ${metric.confirmBottom}`);
    assert.ok((await page.locator('#close-location').boundingBox()).y>=0, 'Close action must stay visible');
    await page.locator('#confirm-location').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(out,`${engine}-picker-${width}-${lang}.png`)});
    results.push({name:`${lang}: ${width}x${height} layout`,passed:true,detail:metric});
   }
   await page.setViewportSize({width:390,height:844});await page.locator('#close-location').click();
   await page.locator('#name').fill('Location QA');await page.locator('#phone').fill('12345678');await page.locator('#email').fill('location@example.test');await page.locator('#address').fill('QA building address');
   await page.locator('#place-order-btn').click();const responsePromise=page.waitForResponse(r=>r.url()===origin+'/api/orders'&&r.request().method()==='POST');await page.locator('.v-btn-verify').click();const response=await responsePromise;assert.equal(response.status(),200);const posted=response.request().postDataJSON();const order=await response.json();assert.equal(posted.deliveryLocation.latitude,adjusted.latitude);assert.equal(posted.deliveryLocation.unitNumber,'8');
   if(process.env.MAP_TEST_DB){const sqlite3=require('sqlite3');const db=new sqlite3.Database(process.env.MAP_TEST_DB,sqlite3.OPEN_READONLY);const saved=await new Promise((resolve,reject)=>db.get('SELECT * FROM orders WHERE id=?',[order.orderId],(e,row)=>e?reject(e):resolve(row)));await new Promise(resolve=>db.close(resolve));assert.equal(saved.lat,adjusted.latitude);assert.equal(saved.lng,adjusted.longitude);assert.equal(saved.total,40);assert.equal(JSON.parse(saved.delivery_details).unitNumber,'8');assert.match(saved.address,/Side entrance/);assert.equal(saved.status,'pending');}
   assert.equal(await page.evaluate(()=>sessionStorage.getItem('catharei-delivery-draft-v1')),null);
   record(`${lang}: sandbox order stores exact pin, building details, unchanged total and pending acceptance`);
   assert.deepEqual(errors,[]);assert.equal(requests.some(u=>/maps.googleapis|places.googleapis|api.mapbox|nominatim|tile.openstreetmap.org/.test(u)),false);
   record(`${lang}: no paid mapping/geocoding requests or page errors`);
   await context.close();
  }
 }finally{await browser.close();fs.writeFileSync(path.join(out,`${engine}-results.json`),JSON.stringify(results,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
