// Run with NODE_PATH pointing at the bundled Playwright packages.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { productPath } = require('../catalogue-seo');
const root = path.resolve(__dirname, '..');
const phase = process.argv[2] || 'after';
const origin = process.env.MOBILE_ORIGIN || 'http://127.0.0.1:3117';
const dir = path.join(root, 'tests', 'mobile-artifacts', phase);
fs.mkdirSync(dir, { recursive: true });
const slug = route => route.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
(async () => {
  const products = await (await fetch(origin + '/api/products')).json();
  const routes = ['/', ...['.', 'navigation', 'locations'].flatMap(d => fs.readdirSync(path.join(root,d)).filter(f => f.endsWith('.html') && !['index.html','blog.html','admin.html'].includes(f)).map(f => '/' + (d === '.' ? '' : d + '/') + f)), '/blog', ...JSON.parse(fs.readFileSync(path.join(root,'posts.json'))).map(p => '/blog/' + p.slug), ...products.map(productPath), '/luqaimat-qatar.html'];
  fs.writeFileSync(path.join(dir, 'routes.json'), JSON.stringify(routes,null,2));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const sample = products.find(p => !p.variants) || products[0];
  let jobs = routes.map(route => ({route,width:390,lang:'en',shot:true}));
  const representatives = ['/', '/menu.html','/navigation/Arabic_sweets.html','/navigation/cart.html','/checkout.html','/contact.html','/login.html','/account.html','/thankyou.html','/locations/al-aziziya.html','/blog/history-of-luqaimat',productPath(products[0])];
  const widths = phase === 'before' ? [320,768,1440] : [320,360,375,393,414,430,600,768,844,1440];
  for (const width of widths) for (const route of (width===1440 ? representatives.slice(0,6) : representatives)) jobs.push({route,width,lang:'en',shot:[320,768,1440].includes(width)});
  for(const route of representatives) jobs.push({route,width:390,lang:'ar',shot:true});
  if(phase !== 'before') for(const route of routes) jobs.push({route,width:320,lang:'ar',shot:false});
  if(phase !== 'before' && process.env.MOBILE_ALL_WIDTHS === '1') {
    const screenshots = new Set(jobs.filter(j=>j.shot).map(j=>`${j.route}|${j.width}|${j.lang}`));
    jobs = routes.flatMap(route => [320,360,375,390,393,414,430,768].flatMap(width => ['en','ar'].map(lang=>({route,width,lang,shot:screenshots.has(`${route}|${width}|${lang}`)}))));
    for(const route of representatives) for(const width of [600,844,1440]) jobs.push({route,width,lang:'en',shot:width===1440&&representatives.indexOf(route)<6});
    for(const route of ['/menu/no-such-product','/blog/no-such-article','/mobile-qa-not-found','/admin.html']) jobs.push({route,width:320,lang:'en',shot:true});
  }
  const onlyWidth = Number(process.env.MOBILE_ONLY_WIDTH || 0);
  if (onlyWidth) jobs = jobs.filter(job => job.width === onlyWidth);
  const onlyRoutes = (process.env.MOBILE_ONLY_ROUTES || '').split(',').filter(Boolean);
  if (onlyRoutes.length) jobs = jobs.filter(job => onlyRoutes.includes(job.route));
  const results=[];
  let cursor=0;
  await Promise.all(Array.from({length:4},async()=>{
    while(cursor<jobs.length){
      const job=jobs[cursor++];
      const context=await browser.newContext({viewport:{width:job.width,height:job.width===844?390:844}, deviceScaleFactor:1, isMobile:job.width<=768,hasTouch:job.width<=768, reducedMotion:'reduce'});
      await context.route(/googletagmanager|google-analytics/,r=>r.abort());
      await context.addInitScript(({lang,item})=>{
        localStorage.setItem('catharei-lang',lang);
        localStorage.setItem('catharei-cart-data',JSON.stringify([{id:item.id,name:item.name,price:Number(item.price),image:item.image,qty:2}]));
      },{lang:job.lang,item:sample});
      // Account screenshot uses a QA-only signed-in response; backend authorization is tested separately.
      if(job.route==='/account.html'){
        await context.route('**/api/auth/me',r=>r.fulfill({json:{loggedIn:true,user:{id:999,username:'Mobile QA',email:'qa@example.test',role:'user'}}}));
        await context.route('**/api/orders/me',r=>r.fulfill({json:[]}));
      }
      const page=await context.newPage(); const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      try{
        const response=await page.goto(origin+job.route,{waitUntil:'domcontentloaded',timeout:20000});
        await page.waitForTimeout(750);
        await page.evaluate(async()=>{await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]); for(const el of document.querySelectorAll('.reveal-section'))el.classList.add('is-visible');});
        const metrics=await page.evaluate(()=>{
          const w=document.documentElement.clientWidth;
          const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
          return {scrollWidth:document.documentElement.scrollWidth,width:w,dir:document.documentElement.dir,overflow:[...document.querySelectorAll('main *,header *,footer *')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.left < -1 || r.right>w+1;}).slice(0,15).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.trim().slice(0,55)})),smallInputs:[...document.querySelectorAll('input:not([type=radio]):not([type=checkbox]),textarea,select')].filter(visible).filter(e=>parseFloat(getComputedStyle(e).fontSize)<16).map(e=>e.id),images:[...document.images].filter(e=>!e.complete||!e.naturalWidth).map(e=>e.getAttribute('src')).slice(0,8),h1:[...document.querySelectorAll('h1')].map(e=>e.textContent),navigation:performance.getEntriesByType('navigation')[0]?.toJSON()};
        });
        let screenshot;
        if(job.shot){screenshot=`${slug(job.route)}-${job.width}-${job.lang}.png`;await page.screenshot({path:path.join(dir,screenshot),fullPage:true,animations:'disabled'});}
        results.push({...job,status:response.status(),...metrics,errors,screenshot});
      }catch(error){results.push({...job,error:error.message,errors});}
      await context.close();
      if(results.length%25===0)console.log(`${phase}: ${results.length}/${jobs.length}`);
    }
  }));
  await browser.close();
  const resultPath = path.join(dir,'results.json');
  const previous = (onlyWidth || onlyRoutes.length) && fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath)) : [];
  const keys = new Set(results.map(r=>`${r.route}|${r.width}|${r.lang}`));
  const merged = [...previous.filter(r=>!keys.has(`${r.route}|${r.width}|${r.lang}`)), ...results];
  fs.writeFileSync(resultPath,JSON.stringify(merged,null,2));
  console.log(JSON.stringify({phase,jobs:results.length,documentOverflow:results.filter(r=>r.scrollWidth>r.width+1).map(r=>[r.route,r.width,r.lang]),errors:results.filter(r=>r.error||r.errors.length).map(r=>({route:r.route,width:r.width,error:r.error,errors:r.errors})),artifacts:dir},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
