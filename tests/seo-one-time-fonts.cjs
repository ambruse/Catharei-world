const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const inventory = require('./mobile-route-inventory.json');
const origin = process.env.MOBILE_ORIGIN || 'http://127.0.0.1:3123';
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const records=[];
  try {
    for(const lang of ['en','ar']) {
      const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
      await context.route(/googletagmanager|google-analytics/,r=>r.abort());
      const page=await context.newPage();
      for(const route of [...inventory.basePages.filter(p=>p.public).map(p=>p.route),...inventory.dynamicRoutes.map(p=>p.route)]){
        await page.goto(origin+route+'?lang='+lang,{waitUntil:'domcontentloaded'});
        await page.waitForTimeout(100);
        records.push({route,lang,uses:await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>getComputedStyle(e).fontFamily.includes('Josefin')).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,60)})))});
      }
      await context.close();
    }
  }finally{await browser.close();}
  fs.writeFileSync(path.join(__dirname,'../SEO_OPTIMIZATION_2026-10-11/font-usage.json'),JSON.stringify(records,null,2));
  console.log(JSON.stringify({pages:records.length,uses:records.filter(r=>r.uses.length)}));
})().catch(e=>{console.error(e);process.exitCode=1;});
