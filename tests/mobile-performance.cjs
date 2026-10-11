// QA-only tools live outside the application dependency tree.
// NODE_PATH must include the bundled runtime's node_modules for Playwright.
// MOBILE_QA_TOOLS can point to a temporary folder containing lighthouse + axe-core.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const origin = process.env.MOBILE_ORIGIN || 'http://127.0.0.1:3117';
const qaTools = process.env.MOBILE_QA_TOOLS || path.join(os.tmpdir(), 'catharei-mobile-audit-tools');
const out = path.join(__dirname, 'mobile-artifacts', 'performance');
const mode = process.argv[2] || 'all';
fs.mkdirSync(out, { recursive: true });
const write = (name, data) => fs.writeFileSync(path.join(out, name), JSON.stringify(data, null, 2) + '\n');
const slug = route => route.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';

async function assets() {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else files.push({ path: path.relative(root, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size });
    }
  }
  walk(path.join(root, 'images'));
  const inventory = require('./mobile-route-inventory.json');
  const sourceFiles = [...inventory.basePages.map(p => p.file), 'styles.css', 'homepage.css', 'menu.css', 'script.js', 'menu.js', 'posts.json', 'templates/luqaimat-main.html'];
  const references = new Map();
  const add = (asset, source) => {
    asset = asset.replace(/^\/+/, '');
    if (!references.has(asset)) references.set(asset, new Set());
    references.get(asset).add(source);
  };
  for (const file of sourceFiles) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of text.matchAll(/images\/[A-Za-z0-9_ .\/-]+\.(?:webp|png|jpe?g|gif|svg|mp4|webm)/gi)) add(match[0], file);
  }
  const sqlite3 = require('sqlite3');
  const db = new sqlite3.Database(path.join(root, 'database.sqlite'), sqlite3.OPEN_READONLY);
  const products = await new Promise((resolve, reject) => db.all('SELECT id, image FROM products WHERE active = 1', [], (error, rows) => error ? reject(error) : resolve(rows)));
  await new Promise(resolve => db.close(resolve));
  for (const product of products) {
    if (product.image && !/^https?:/i.test(product.image)) add(product.image, `active product ${product.id}`);
  }
  const missing = [...references].filter(([asset]) => !fs.existsSync(path.join(root, asset))).map(([asset, sources]) => ({ asset, sources: [...sources] }));
  const sharp = require('sharp');
  const largest = await Promise.all([...files].sort((a, b) => b.bytes - a.bytes).slice(0, 18).map(async file => {
    if (/\.mp4$/i.test(file.path)) return file;
    try { const { width, height, format } = await sharp(path.join(root, file.path)).metadata(); return { ...file, width, height, format }; } catch { return file; }
  }));
  const groups = Object.fromEntries([...new Set(files.map(f => f.path.split('/')[1]))].map(group => {
    const matches = files.filter(file => file.path.startsWith(`images/${group}/`));
    return [group, { count: matches.length, bytes: matches.reduce((sum, file) => sum + file.bytes, 0) }];
  }));
  const result = { scope: 'Local file payloads, not page network transfer. No assets were changed or substituted.', count: files.length, totalBytes: files.reduce((sum, file) => sum + file.bytes, 0), groups, largest, missing };
  write('assets.json', result);
  console.log(JSON.stringify({ assets: result.count, totalBytes: result.totalBytes, missing }));
}

async function accessibility() {
  const { chromium } = require('playwright');
  const axeSource = fs.readFileSync(path.join(qaTools, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
  const inventory = require('./mobile-route-inventory.json');
  const allRoutes = [...inventory.basePages.filter(page => page.public).map(page => page.route), ...inventory.dynamicRoutes.map(page => page.route)];
  const routes = process.env.MOBILE_AXE_ROUTES?.split(',') || allRoutes;
  const jobs = routes.flatMap(route => [{ route, lang: 'en' }, { route, lang: 'ar' }]);
  const products = await (await fetch(origin + '/api/products')).json();
  const sample = products.find(p => !p.variants) || products[0];
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  let cursor = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      await context.route(/googletagmanager|google-analytics/, route => route.abort());
      await context.addInitScript(({ lang, item }) => {
        localStorage.setItem('catharei-lang', lang);
        localStorage.setItem('catharei-cart-data', JSON.stringify([{ id: item.id, name: item.name, price: Number(item.price), image: item.image, qty: 2 }]));
      }, { lang: job.lang, item: sample });
      if (job.route === '/account.html') {
        await context.route('**/api/auth/me', route => route.fulfill({ json: { loggedIn: true, user: { id: 999, username: 'Mobile QA', email: 'qa@example.test', role: 'user' } } }));
        await context.route('**/api/orders/me', route => route.fulfill({ json: [] }));
      }
      const page = await context.newPage();
      try {
        const response = await page.goto(origin + job.route, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(600);
        await page.evaluate(async () => {
          await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 2000))]);
          document.querySelectorAll('.reveal-section').forEach(section => section.classList.add('is-visible'));
        });
        await page.addScriptTag({ content: axeSource });
        const report = await page.evaluate(async () => {
          const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
          return { version: result.testEngine.version, violations: result.violations, incomplete: result.incomplete, passes: result.passes.length, inapplicable: result.inapplicable.length };
        });
        const record = { ...job, status: response.status(), width: 390, height: 844, ...report };
        write(`axe-${slug(job.route)}-${job.lang}.json`, record);
        results.push({ ...job, status: response.status(), violationCount: report.violations.length, violations: report.violations.map(v => ({ id: v.id, impact: v.impact, count: v.nodes.length, targets: v.nodes.map(n => n.target) })), incomplete: report.incomplete.map(v => ({ id: v.id, count: v.nodes.length })) });
      } catch (error) {
        results.push({ ...job, error: error.message });
      }
      await context.close();
      if (results.length % 12 === 0) console.log(`axe: ${results.length}/${jobs.length}`);
    }
  }));
  await browser.close();
  const prior = process.env.MOBILE_AXE_ROUTES && fs.existsSync(path.join(out, 'axe-summary.json')) ? JSON.parse(fs.readFileSync(path.join(out, 'axe-summary.json'), 'utf8')).results.filter(result => !routes.includes(result.route)) : [];
  write('axe-summary.json', { scope: 'Automated WCAG A/AA checks at a 390×844 mobile Chrome viewport in both language modes. Partial translation coverage is preserved. Analytics blocked; account identity is a QA-only browser fixture. Automated scans cannot establish full WCAG conformance or real-device behavior.', lastRunAt: new Date().toISOString(), lastRunRoutes: routes, results: [...prior, ...results] });
  console.log(JSON.stringify({ axePages: results.length, failures: results.filter(result => result.error), violationRules: [...new Set(results.flatMap(result => result.violations?.map(v => v.id) || []))] }));
}

async function performance() {
  const lighthouse = (await import(pathToFileURL(path.join(qaTools, 'node_modules', 'lighthouse', 'core', 'index.js')))).default;
  const launcher = await import(pathToFileURL(path.join(qaTools, 'node_modules', 'chrome-launcher', 'dist', 'index.js')));
  const chrome = await launcher.launch({ chromeFlags: ['--headless=new', '--disable-gpu', '--no-first-run'], handleSIGINT: false });
  const routes = process.env.MOBILE_PERF_ROUTES?.split(',') || ['/', '/menu.html', '/locations/al-aziziya.html', '/blog/history-of-luqaimat'];
  const summary = [];
  try {
    for (const route of routes) {
      console.log(`Lighthouse mobile: ${route}`);
      const result = await lighthouse(origin + route, {
        port: chrome.port,
        output: ['json', 'html'],
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        blockedUrlPatterns: ['*googletagmanager.com/*', '*google-analytics.com/*'],
        maxWaitForLoad: 35000
      });
      if (!result) throw new Error('Lighthouse returned no result');
      const { lhr, report } = result;
      fs.writeFileSync(path.join(out, `lighthouse-${slug(route)}.json`), report[0]);
      fs.writeFileSync(path.join(out, `lighthouse-${slug(route)}.html`), report[1]);
      const metric = id => ({ value: lhr.audits[id]?.numericValue, display: lhr.audits[id]?.displayValue, score: lhr.audits[id]?.score });
      summary.push({ route, fetchTime: lhr.fetchTime, version: lhr.lighthouseVersion, environment: lhr.environment, settings: lhr.configSettings, runtimeError: lhr.runtimeError, warnings: lhr.runWarnings, scores: Object.fromEntries(Object.entries(lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])), metrics: { fcp: metric('first-contentful-paint'), lcp: metric('largest-contentful-paint'), cls: metric('cumulative-layout-shift'), tbt: metric('total-blocking-time'), speedIndex: metric('speed-index'), transfer: metric('total-byte-weight') }, failedAudits: Object.entries(lhr.audits).filter(([,audit]) => audit.score !== null && audit.score < 1).map(([id,audit]) => ({ id, title: audit.title, score: audit.score, display: audit.displayValue, description: audit.description })) });
      write('lighthouse-summary.json', { scope: 'One local cold-load mobile Lighthouse lab run per representative route with simulated mobile network/CPU throttling. Analytics requests blocked. Google fonts, map embeds and absolute production asset URLs remain external. These are local lab measurements, not production p75 Core Web Vitals or real-device scores; TBT is not INP.', results: summary });
    }
  } finally { await chrome.kill(); }
  console.log(JSON.stringify(summary.map(({ route, scores, metrics }) => ({ route, scores, metrics }))));
}

(async () => {
  if (mode === 'assets' || mode === 'all') await assets();
  if (mode === 'axe' || mode === 'all') await accessibility();
  if (mode === 'lighthouse' || mode === 'all') await performance();
})().catch(error => { console.error(error); process.exitCode = 1; });
