const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const vm = require('node:vm');
const { spawn } = require('node:child_process');
const sqlite3 = require('sqlite3');
const { postMetadata } = require('../seo');
const root = path.resolve(__dirname, '..');
const pages = ['.', 'navigation', 'locations'].flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.html')).map(f => path.join(dir, f)));
let child, dataDir, origin;
before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catharei-seo-test-'));
  const db = new sqlite3.Database(path.join(dataDir, 'database.sqlite'));
  await new Promise((resolve, reject) => db.exec(`CREATE TABLE products (id INTEGER PRIMARY KEY, nameKey TEXT, name TEXT, price TEXT, image TEXT, description TEXT, featured INTEGER DEFAULT 0, active INTEGER DEFAULT 1, category TEXT);
    INSERT INTO products VALUES (1, NULL, 'Test Cake & Honey', '100', '/images/test.webp', 'Fresh cake', 1, 1, 'cakes');
    INSERT INTO products VALUES (2, NULL, 'Inactive cake', '100', '/images/test.webp', '', 0, 0, 'cakes');
    CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, email TEXT, password TEXT, role TEXT);
    INSERT INTO users VALUES (1, 'test', 'test@example.test', '', 'admin');`, err => err ? reject(err) : resolve()));
  await new Promise(resolve => db.close(resolve));
  const authDb = new sqlite3.Database(path.join(dataDir, 'database.sqlite'));
  const password = require('bcrypt').hashSync('fixture-password', 4);
  await new Promise((resolve, reject) => authDb.run('UPDATE users SET password = ? WHERE id = 1', [password], err => err ? reject(err) : resolve()));
  await new Promise(resolve => authDb.close(resolve));
  // Never send real WhatsApp notifications or voice calls from checkout tests.
  fs.writeFileSync(path.join(dataDir, 'offline.cjs'), "global.fetch = async () => new Response('fixture notification suppressed', {status: 200});");
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['--require', path.join(dataDir, 'offline.cjs'), 'server.js'], { cwd: root, env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, NODE_ENV: 'test', RENDER: 'false' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let output = '';
  child.stdout.on('data', chunk => output += chunk);
  child.stderr.on('data', chunk => output += chunk);
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(origin + '/robots.txt')).ok) return; } catch {}
    if (child.exitCode !== null) throw new Error('Server failed: ' + output);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Server startup timed out: ' + output);
});
after(async () => {
  if (child && child.exitCode === null) {
    const stopped = new Promise(resolve => child.once('exit', resolve));
    child.kill();
    await stopped;
  }
  if (dataDir && path.dirname(path.resolve(dataDir)) === path.resolve(os.tmpdir()) && path.basename(dataDir).startsWith('catharei-seo-test-')) fs.rmSync(dataDir, { recursive: true, force: true });
});

test('all pages have unique canonical metadata, valid schema and compilable inline scripts', () => {
  const titles = new Set();
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
    assert.ok(title, page);
    assert.ok(!titles.has(title), 'Duplicate title: ' + page);
    titles.add(title);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1, page);
    assert.equal((html.match(/name="description"/g) || []).length, 1, page);
    assert.equal((html.match(/property="og:title"/g) || []).length, 1, page);
    assert.ok(!html.includes('hreflang='), page);
    assert.ok(!html.includes('name="keywords"'), page);
    const head = html.match(/<head>[\s\S]*?<\/head>/)[0];
    assert.equal((head.match(/<script(?:\s|>)/g) || []).length, (head.match(/<\/script>/g) || []).length, 'Unbalanced head script tags: ' + page);
    for (const block of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (block[1].includes('application/ld+json')) JSON.parse(block[2]);
      else if (block[2].trim()) new vm.Script(block[2], { filename: page });
    }
  }
});

test('Google Tag Manager appears once in each page head and body', () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const head = html.match(/<head>[\s\S]*?<\/head>/i)?.[0];
    const body = html.match(/<body(?:\s[^>]*)?>[\s\S]*?<\/body>/i)?.[0];
    assert.ok(head && body, page);
    assert.equal((head.match(/googletagmanager\.com\/gtm\.js\?id=/g) || []).length, 1, page);
    assert.equal((head.match(/GTM-NQ5NWZC4/g) || []).length, 1, page);
    assert.equal((body.match(/googletagmanager\.com\/ns\.html\?id=GTM-NQ5NWZC4/g) || []).length, 1, page);
    assert.ok(head.indexOf('GTM-NQ5NWZC4') < head.indexOf('<meta'), page);
    assert.match(body, /^<body(?:\s[^>]*)?>\s*<!-- Google Tag Manager \(noscript\) -->/, page);
  }
});

test('public local assets and links resolve', async () => {
  const urls = new Set();
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
      if (!match[1].startsWith('//')) urls.add(match[1]);
    }
  }
  for (const url of urls) {
    const response = await fetch(origin + url);
    assert.ok(response.ok, `${url}: ${response.status}`);
  }
});

test('sitemap contains only reachable canonical indexable pages', async () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  for (const [, url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const response = await fetch(origin + new URL(url).pathname, { redirect: 'manual' });
    assert.equal(response.status, 200, url);
    const html = await response.text();
    assert.ok(html.includes(`rel="canonical" href="${url}"`), url);
    assert.ok(!html.includes('content="noindex'), url);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, url);
  }
});

test('language selection survives and homepage alias redirects', async () => {
  for (const route of ['/?lang=ar', '/navigation/cakes.html?lang=ar', '/menu.html?lang=en']) {
    assert.equal((await fetch(origin + route, { redirect: 'manual' })).status, 200, route);
  }
  const response = await fetch(origin + '/index.html?lang=ar', { redirect: 'manual' });
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), '/?lang=ar');
});

test('private pages are noindex and internal files cannot be fetched', async () => {
  for (const route of ['/login.html', '/account.html', '/checkout.html', '/thankyou.html', '/navigation/cart.html', '/admin.html']) {
    const response = await fetch(origin + route, { redirect: 'manual' });
    assert.match(response.headers.get('x-robots-tag'), /noindex/, route);
  }
  for (const route of ['/server.js', '/seo.js', '/database.sqlite', '/sessions.sqlite', '/package.json', '/posts.json', '/node_modules/express/package.json', '/.git/config']) {
    assert.equal((await fetch(origin + route)).status, 404, route);
  }
  for (const route of ['/catalogue-seo.js', '/templates/luqaimat-main.html']) assert.equal((await fetch(origin + route)).status, 404);
});

test('catalogue content is in initial HTML and excludes inactive items', async () => {
  const html = await (await fetch(origin + '/navigation/cakes.html')).text();
  assert.match(html, /Test Cake &amp; Honey/);
  assert.ok(!html.includes('Inactive cake'));
  assert.match(html, /lang="ar" dir="rtl"/);
  const otherCategory = await (await fetch(origin + '/navigation/savories.html')).text();
  assert.ok(!otherCategory.includes('Test Cake &amp; Honey'));
  for (const route of ['/', '/menu.html']) {
    const page = await (await fetch(origin + route)).text();
    assert.match(page, /Test Cake &amp; Honey/, route);
    assert.ok(!page.includes('Inactive cake'), route);
  }
});

test('blog metadata escapes quotes and safely serializes JSON-LD', () => {
  const template = fs.readFileSync(path.join(root, 'blog.html'), 'utf8');
  const post = { slug: 'example', title: 'A "cake" & </script>', desc: 'A "quoted" description', cover: '/images/hero/hero-sweets.webp', date: '2026-01-01' };
  const html = postMetadata(template, post);
  assert.match(html, /og:type" content="article"/);
  assert.match(html, /twitter:title" content="A &quot;cake&quot; &amp; &lt;\/script&gt;"/);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.headline, post.title);
  assert.equal(schema.image, 'https://www.catharei.com/images/hero/hero-sweets.webp');
});

test('SEO helpers escape product text, validate images and preserve variant prices', () => {
  const { isLuqaimat, imageUrl, priceText, cards } = require('../catalogue-seo');
  for (const name of ['Luqimat Molasses Dates', 'Lokmat El Kadi', 'لقيمات']) assert.ok(isLuqaimat({ name }));
  assert.ok(!isLuqaimat({ name: 'Cake' }));
  assert.equal(imageUrl('javascript:alert(1)'), '');
  assert.equal(imageUrl('https://example.com/cake.webp'), 'https://example.com/cake.webp');
  assert.equal(priceText({ price: null }), '');
  assert.equal(priceText({ price: '60' }), 'QAR 60.00');
  assert.equal(priceText({ price: '60', variants: '{"small":40,"medium":60,"large":80,"_disabled":["large"]}' }), 'Small: 40, Medium: 60');
  const html = cards([{ id: 1, name: '</script><img onerror="alert(1)">', description: '<b>test</b>', price: null }]);
  assert.ok(!html.includes('<img onerror'));
  assert.match(html, /&lt;b&gt;test/);
});

test('catalogue database failures return a useful 503 page without indexing unavailable records', () => {
  const handlers = [];
  require('../catalogue-seo').registerCatalogueSeo({ get: (routes, handler) => handlers.push(handler) }, () => ({ all: (sql, params, callback) => callback(new Error('fixture database unavailable')) }), root);
  let html = '', status = 200;
  const headers = {};
  const res = { set: (key, value) => { headers[key] = value; return res; }, status: code => { status = code; return res; }, send: body => { html = body; return res; } };
  handlers[1]({ path: '/luqaimat-qatar.html' }, res, () => assert.fail('Unexpected fallback'));
  assert.equal(status, 503);
  assert.match(headers['X-Robots-Tag'], /noindex/);
  assert.match(html, /Menu details are currently unavailable/);
  assert.ok(!html.includes('Our fresh Luqaimat is available'));
  assert.ok(!html.includes('catalogue-schema'));
  assert.ok(!html.includes('fixture database unavailable'));
});

test('admin CRUD updates the read-only Luqaimat page and sitemap without stale records', async () => {
  const before = await (await fetch(origin + '/api/products')).json();
  let page = await fetch(origin + '/luqaimat-qatar.html');
  assert.match(page.headers.get('x-robots-tag'), /noindex/);
  assert.ok(!(await (await fetch(origin + '/sitemap.xml')).text()).includes('luqaimat-qatar.html'));
  const login = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'test', password: 'fixture-password' }) });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const request = (url, method, body) => fetch(origin + url, { method, headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const created = await request('/api/products', 'POST', { name: 'Luqimat fixture </script>', price: '40', description: '1 Kilo.', category: 'arabic_sweets' });
  assert.equal(created.status, 200);
  const product = await created.json();
  const edited = await request(`/api/products/${product.id}/variants`, 'PATCH', { variants: '{"small":40,"large":60}' });
  assert.equal(edited.status, 200);
  page = await fetch(origin + '/luqaimat-qatar.html');
  assert.equal(page.status, 200);
  assert.equal(page.headers.get('x-robots-tag'), null);
  const html = await page.text();
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert.match(html, /Small: 40, Large: 60/);
  assert.match(html, /Luqimat fixture &lt;\/script&gt;/);
  const schema = JSON.parse(html.match(/<script id="catalogue-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.itemListElement[0].name, 'Luqimat fixture </script>');
  assert.ok(!html.includes('schema.org/InStock'));
  assert.ok((await (await fetch(origin + '/sitemap.xml')).text()).includes('luqaimat-qatar.html'));
  const recordsAfterReads = await (await fetch(origin + '/api/products')).json();
  assert.deepEqual(recordsAfterReads.filter(p => p.id !== product.id), before);
  assert.equal(recordsAfterReads.find(p => p.id === product.id).price, '40');
  await request(`/api/products/${product.id}/toggle`, 'PATCH');
  assert.ok(!(await (await fetch(origin + '/api/products')).json()).some(p => p.id === product.id));
  page = await fetch(origin + '/luqaimat-qatar.html');
  assert.match(page.headers.get('x-robots-tag'), /noindex/);
  assert.ok(!(await page.text()).includes('Our fresh Luqaimat is available'));
  assert.ok(!(await (await fetch(origin + '/sitemap.xml')).text()).includes('luqaimat-qatar.html'));
  const deleted = await request(`/api/products/${product.id}`, 'DELETE');
  assert.equal(deleted.status, 200);
  assert.deepEqual(await (await fetch(origin + '/api/products')).json(), before);
});

test('guest checkout still persists an order in the disposable database', async () => {
  const result = await fetch(origin + '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: '1_small', name: 'Test cake (Small)', price: 40, quantity: 2 }], total: 80, name: 'Fixture only', address: 'Test address', paymentMethod: 'cash' }) });
  assert.equal(result.status, 200);
  const order = await result.json();
  assert.ok(order.success);
  assert.match(order.orderNumber, /^\d{8}$/);
  const status = await (await fetch(origin + `/api/orders/${order.orderId}/status`)).json();
  assert.equal(status.order_number, order.orderNumber);
});

test('browser: menu variants, cart quantities and mobile SEO pages', { skip: !process.env.CATHAREI_PLAYWRIGHT }, async () => {
  const { chromium } = require(process.env.CATHAREI_PLAYWRIGHT);
  const login = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'test', password: 'fixture-password' }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  await fetch(origin + '/api/products/1/variants', { method: 'PATCH', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ variants: '{"small":40,"medium":60,"large":80,"_disabled":["large"]}' }) });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('**/*', async route => {
      const url = route.request().url();
      if (url.startsWith(origin)) return route.continue();
      if (url.startsWith('https://www.catharei.com/images/')) return route.fulfill({ response: await route.fetch({ url: url.replace('https://www.catharei.com', origin) }) });
      return route.abort();
    });
    await page.goto(origin + '/menu.html');
    await page.locator('#product-1 button.add-to-cart').click();
    await page.locator('input[name="product-size"][value="medium"]').check();
    assert.equal(await page.locator('input[name="product-size"][value="large"]').count(), 0);
    await page.locator('#variant-modal button[onclick="confirmVariantAddToCart()"]').click();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('catharei-cart-data')));
    assert.equal(cart[0].price, 60);
    assert.equal(cart[0].id, '1_medium');
    await page.evaluate(() => updateCartQuantity('1_medium', 1));
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('catharei-cart-data'))[0].qty), 2);
    await page.goto(origin + '/navigation/cart.html');
    assert.ok((await page.locator('body').innerText()).includes('Test Cake & Honey (Medium)'));
    await fetch(origin + '/api/products', { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Luqimat fixture', price: '40', description: '1 Kilo.', imageUrl: '/images/background/hero_spread.webp', category: 'arabic_sweets' }) });
    for (const route of ['/', '/navigation/cakes.html', '/navigation/Arabic_sweets.html', '/luqaimat-qatar.html', '/locations/al-wakrah.html']) {
      await page.goto(origin + route);
      assert.equal(await page.locator('h1').count(), 1, route);
      assert.ok(!(await page.locator('body').innerText()).includes('"@context"'), 'Structured data leaked into visible content: ' + route);
      const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth, elements: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(el).position !== 'fixed').slice(0, 8).map(el => ({ tag: el.tagName, class: el.className, width: el.getBoundingClientRect().width })) }));
      assert.ok(overflow.width <= overflow.viewport + 1, 'Mobile overflow: ' + route + ' ' + JSON.stringify(overflow));
    }
    await page.goto(origin + '/luqaimat-qatar.html');
    await page.screenshot({ path: path.join(os.tmpdir(), 'catharei-seo-mobile.png'), fullPage: true, animations: 'disabled' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    const frames = [];
    page.on('request', request => { if (request.url().includes('/images/herosection_1/')) frames.push(request.url()); });
    await page.goto(origin + '/');
    await page.screenshot({ path: path.join(os.tmpdir(), 'catharei-seo-desktop.png'), animations: 'disabled' });
    assert.equal(frames.length, 0, 'Below-fold animation should not compete with the initial page load');
    const firstFrame = page.waitForRequest(request => request.url().includes('/images/herosection_1/'));
    await page.locator('#cake-scroll-section').scrollIntoViewIfNeeded();
    await firstFrame;
    assert.ok(frames.length > 0, 'Animation frames still load when approached');
  } finally { await browser.close(); }
});
