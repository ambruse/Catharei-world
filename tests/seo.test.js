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
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, NODE_ENV: 'test', RENDER: 'false' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
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
  if (dataDir) fs.rmSync(dataDir, { recursive: true, force: true });
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
