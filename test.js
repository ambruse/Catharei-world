const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('file://' + path.resolve('index.html'), { waitUntil: 'networkidle0' });
  
  console.log("Checking for blocking elements...");
  const blockingEl = await page.evaluate(() => {
    const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    return el ? el.outerHTML.substring(0, 150) : 'none';
  });
  console.log("Element at center:", blockingEl);
  
  const headerBtn = await page.evaluate(() => {
    const el = document.elementFromPoint(window.innerWidth - 50, 20);
    return el ? el.outerHTML.substring(0, 150) : 'none';
  });
  console.log("Element at top right:", headerBtn);

  await browser.close();
})();
