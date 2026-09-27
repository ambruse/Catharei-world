const fs = require('node:fs');
const path = require('node:path');
const { escapeHtml: e } = require('./seo');
const ORIGIN = 'https://www.catharei.com';
const LUQ_PATH = '/luqaimat-qatar.html';

function isLuqaimat(product) {
  return /\b(?:luqaimat|luqimat|luqaymat|lokmat|loqaimat)\b|لقيمات|لقمة\s*القاضي/iu.test(`${product.name || ''} ${product.name_ar || ''}`);
}
function imageUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value).startsWith('http') ? value : '/' + String(value).replace(/^\/+/, ''), ORIGIN);
    return /^https?:$/.test(url.protocol) && !/^[a-z]+:/i.test(value.replace(/^https?:/i, '')) ? url.href : '';
  } catch { return ''; }
}
function priceText(product) {
  try {
    const variants = typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants;
    if (variants) {
      const disabled = Array.isArray(variants._disabled) ? variants._disabled : [];
      const prices = ['small', 'medium', 'large'].filter(size => variants[size] !== undefined && !disabled.includes(size)).map(size => `${size[0].toUpperCase() + size.slice(1)}: ${variants[size]}`);
      if (prices.length) return prices.join(', ');
    }
  } catch { /* The menu falls back to the base price for malformed variants. */ }
  const raw = product.price;
  return raw !== null && raw !== undefined && String(raw).trim() !== '' && Number.isFinite(Number(raw)) && Number(raw) >= 0 ? `QAR ${Number(raw).toFixed(2)}` : '';
}
function cards(products) {
  return products.map(product => {
    const image = imageUrl(product.image);
    return `<article class="menu-item" id="product-${e(product.id)}">${image ? `<img class="menu-item-img" loading="lazy" width="400" height="300" src="${e(image)}" alt="${e(product.name || '')}">` : ''}<div class="menu-item-info"><div><h2 class="menu-item-name">${e(product.name || '')}</h2><p class="menu-item-price">${e(priceText(product))}</p><p class="menu-item-desc">${e(product.description || '')}</p>${product.name_ar ? `<p lang="ar" dir="rtl">${e(product.name_ar)}</p>` : ''}</div><a href="/menu.html">View menu &amp; order</a></div></article>`;
  }).join('');
}
function catalogueSchema(products, pagePath) {
  return { '@context': 'https://schema.org', '@type': 'ItemList', '@id': ORIGIN + pagePath + '#catalogue', itemListElement: products.map((product, i) => ({ '@type': 'ListItem', position: i + 1, name: product.name, url: ORIGIN + pagePath + '#product-' + encodeURIComponent(product.id), ...(product.description ? { description: product.description } : {}), ...(imageUrl(product.image) ? { image: imageUrl(product.image) } : {}) })) };
}
function metadata(html, title, description, pagePath) {
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${e(title)}</title>`).replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${ORIGIN + pagePath}">`);
  const values = { description, 'og:title': title, 'twitter:title': title, 'og:description': description, 'twitter:description': description, 'og:url': ORIGIN + pagePath };
  return html.replace(/<meta\s+(?:name|property)="([^"]+)"\s+content="[^"]*"\s*\/?>/g, (tag, key) => key in values ? tag.replace(/content="[^"]*"/, `content="${e(values[key])}"`) : tag);
}
function registerCatalogueSeo(app, getDb, root) {
  app.get('/sitemap.xml', (req, res) => {
    getDb().all('SELECT * FROM products WHERE active = 1', [], (err, products) => {
      if (err) return res.status(503).set('Retry-After', '300').type('text/plain').send('Sitemap temporarily unavailable');
      let xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
      if (products.some(isLuqaimat)) xml = xml.replace('</urlset>', `<url><loc>${ORIGIN + LUQ_PATH}</loc></url>\n</urlset>`);
      res.type('application/xml').send(xml);
    });
  });
  app.get(['/', '/menu.html', '/navigation/:category.html', LUQ_PATH], (req, res, next) => {
    const luq = req.path === LUQ_PATH;
    const file = luq ? 'navigation/cakes.html' : req.path === '/' ? 'index.html' : req.path.slice(1);
    if (!/^(?:(?:index|menu)\.html|navigation\/[a-zA-Z_-]+\.html)$/.test(file)) return next();
    const filename = path.join(root, file);
    if (!fs.existsSync(filename)) return next();
    let template = fs.readFileSync(filename, 'utf8');
    if (luq) {
      template = template.replace(/<main>[\s\S]*?<\/main>/, fs.readFileSync(path.join(root, 'templates/luqaimat-main.html'), 'utf8'));
      template = template.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
      template = metadata(template, 'Fresh Luqaimat in Qatar | CATHAREi Bakery & Sweets', 'Explore CATHAREi Luqaimat, current menu prices and our branches on Salwa Road, in Al Wakrah and Al Kharaitiyat. لقيمات طازجة في قطر.', LUQ_PATH);
      const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' },
        { '@type': 'ListItem', position: 2, name: 'Arabic sweets', item: ORIGIN + '/navigation/Arabic_sweets.html' },
        { '@type': 'ListItem', position: 3, name: 'Luqaimat', item: ORIGIN + LUQ_PATH }
      ] };
      template = template.replace('</head>', `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script></head>`);
    }
    const grid = template.match(/<div\b[^>]*id="(?:product-grid|menu-content|luqaimat-products)"[^>]*>\s*(?:<!--[^]*?-->)?\s*<\/div>/);
    if (!grid) return next();
    getDb().all('SELECT * FROM products WHERE active = 1 ORDER BY name', [], (err, allProducts) => {
      const all = err ? [] : allProducts;
      const hasLuq = all.some(isLuqaimat);
      const category = grid[0].match(/data-category="([^"]+)"/)?.[1];
      const products = all.filter(product => luq ? isLuqaimat(product) : category ? product.category === category : grid[0].includes('data-type="featured"') ? product.featured === 1 : true);
      let content = products.length ? cards(products) : '<p>Menu details are currently unavailable. Please contact a branch for assistance.</p>';
      if (file === 'menu.html') content = `<div class="menu-grid">${content}</div>`;
      template = template.replace(grid[0], grid[0].replace('</div>', content + '</div>'));
      template = template.replace(/<!-- luqaimat-link -->/g, hasLuq ? '<p><a href="/luqaimat-qatar.html">Fresh Luqaimat in Qatar · لقيمات طازجة في قطر</a></p>' : '');
      if (luq && !hasLuq) template = template.replace(/<!-- availability-start -->[\s\S]*?<!-- availability-end -->/, '<p>Contact our branches for Luqaimat menu information. تواصل مع فروعنا للاستفسار عن اللقيمات.</p>');
      if (err || (luq && !hasLuq)) {
        res.set('X-Robots-Tag', 'noindex, follow');
        template = template.replace(/<meta name="robots"[^>]*>/g, '').replace('</head>', '<meta name="robots" content="noindex, follow"></head>');
      }
      if (err) res.status(503).set('Retry-After', '300');
      const schema = catalogueSchema(products, req.path);
      const json = JSON.stringify(schema).replace(/</g, '\\u003c');
      if (products.length) template = template.replace('</head>', `<script id="catalogue-schema" type="application/ld+json">${json}</script></head>`);
      res.send(template);
    });
  });
}
module.exports = { registerCatalogueSeo, isLuqaimat, imageUrl, priceText, cards, catalogueSchema };
