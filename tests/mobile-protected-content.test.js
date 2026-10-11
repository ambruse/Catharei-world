const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sqlite3 = require('sqlite3');
const inventory = require('./mobile-route-inventory.json');
const root = path.resolve(__dirname, '..');

function protectedContent(html) {
  const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0] || '';
  return {
    title: head.match(/<title>[\s\S]*?<\/title>/)?.[0],
    meta: [...head.matchAll(/<meta\b[^>]*>/gi)].map(match => match[0]).filter(tag => !tag.includes('name="viewport"')),
    canonical: head.match(/<link[^>]*rel="canonical"[^>]*>/)?.[0],
    schema: [...head.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]),
    headings: [...html.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map(match => match[1].replace(/<[^>]*>/g, '').trim()),
    links: [...html.matchAll(/<a\b[^>]*href="([^"]*)"/gi)].map(match => match[1]),
    analytics: [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].filter(match => /gtag\(|gtm\.start/.test(match[1])).map(match => match[0])
  };
}

const deliveryPartners = [
  'https://www.talabat.com/qatar/catharei-bakery-and-sweets',
  'https://snoonu.com/restaurants/catharei-bakery-and-sweets',
  'https://www.gorafeeq.com/en/home/restaurants/catharei-bakery-1170'
];
const addedContactLinks = {
  'contact.html': ['mailto:info@catharei.com', 'tel:+97450942255'],
  'locations/al-aziziya.html': ['tel:+97450942255'],
  'locations/al-wakrah.html': ['tel:+97440075555'],
  'locations/al-kharaitiyat.html': ['tel:+97455392255']
};

test('mobile refinements preserve all page metadata, heading text, schema and analytics', () => {
  for (const page of inventory.basePages) {
    const current = protectedContent(fs.readFileSync(path.join(root, page.file), 'utf8'));
    for (const key of ['title', 'meta', 'canonical', 'schema', 'headings', 'analytics']) {
      assert.deepEqual(current[key], page.protectedContent[key], `${page.file}: protected ${key} changed`);
    }
  }
});

test('original link destinations are preserved except documented delivery placeholder repairs', () => {
  for (const page of inventory.basePages) {
    const current = protectedContent(fs.readFileSync(path.join(root, page.file), 'utf8')).links;
    const expected = [...page.protectedContent.links];
    if (page.file === 'delivery.html') {
      let partner = 0;
      for (let index = 0; index < expected.length; index++) {
        if (expected[index] === '#' && partner < deliveryPartners.length) expected[index] = deliveryPartners[partner++];
      }
      assert.equal(partner, 3, 'The baseline must contain exactly the three delivery placeholders');
    }
    expected.push(...(addedContactLinks[page.file] || []));
    const remaining = [...current];
    for (const destination of expected) {
      const index = remaining.indexOf(destination);
      assert.notEqual(index, -1, `${page.file}: original destination missing: ${destination}`);
      remaining.splice(index, 1);
    }
    // A skip-to-content fragment can be added as an accessibility affordance.
    assert.ok(remaining.every(destination => /^#[\w-]+$/.test(destination)), `${page.file}: unexpected added destinations: ${remaining.join(', ')}`);
  }
});

test('robots, sitemap, posts and SEO renderer source are unchanged', () => {
  for (const [file, expected] of Object.entries(inventory.protectedFiles)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
    assert.equal(actual, expected, file);
  }
});

test('existing active product records and generated product paths are unchanged', async () => {
  const db = new sqlite3.Database(path.join(root, 'database.sqlite'), sqlite3.OPEN_READONLY);
  try {
    const products = await new Promise((resolve, reject) => db.all('SELECT * FROM products WHERE active = 1 ORDER BY id', [], (error, rows) => error ? reject(error) : resolve(rows)));
    const expected = inventory.dynamicRoutes.filter(route => route.template === 'product detail');
    assert.equal(products.length, expected.length);
    const { productPath } = require('../catalogue-seo');
    for (const product of products) {
      const original = expected.find(route => route.productId === product.id);
      assert.ok(original, `Unexpected active product ${product.id}`);
      assert.equal(productPath(product), original.route);
      assert.equal(crypto.createHash('sha256').update(JSON.stringify(product)).digest('hex'), original.productContentHash, `Product ${product.id}`);
    }
  } finally {
    await new Promise((resolve, reject) => db.close(error => error ? reject(error) : resolve()));
  }
});
