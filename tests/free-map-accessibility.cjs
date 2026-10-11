const {chromium}=require('playwright');const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const origin=process.env.MOBILE_ORIGIN||'http://127.0.0.1:3118';
const axe=path.join(process.env.TEMP,'catharei-mobile-audit-tools/node_modules/axe-core/axe.min.js');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});const results=[];try{for(const lang of ['en','ar']){
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await page.route(/googletagmanager|google-analytics/,r=>r.abort());
 await page.addInitScript(lang=>{localStorage.setItem('catharei-lang',lang);localStorage.setItem('catharei-cart-data','[{"id":"qa","name":"QA","price":40,"qty":1}]');},lang);
 await page.goto(origin+'/checkout.html?lang='+lang);await page.locator('#open-location').click();await page.waitForFunction(()=>!document.getElementById('locate-btn').disabled,{},{timeout:25000});await page.addScriptTag({path:axe});
 for(const state of ['picker','suggestions','details']){
  if(state==='suggestions')await page.locator('#location-search').fill(lang==='ar'?'الدوحة':'Doha');
  if(state==='details'){await page.locator('#close-location').click();await page.locator('#delivery-details summary').click();}
  const audit=await page.evaluate(()=>axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
  results.push({lang,state,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
 }
 await page.close();
}}finally{await browser.close();fs.writeFileSync(path.join(__dirname,'map-artifacts/after/accessibility.json'),JSON.stringify(results,null,2));}console.log(JSON.stringify(results,null,2));assert.ok(results.every(r=>r.violations.length===0));})().catch(e=>{console.error(e);process.exitCode=1});
