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
const CATEGORIES = {
  cakes: { label: 'Cakes', ar: 'كيك', path: '/navigation/cakes.html' },
  arabic_sweets: { label: 'Arabic Sweets', ar: 'حلويات عربية', path: '/navigation/Arabic_sweets.html' },
  oriental_sweets: { label: 'Oriental Sweets', ar: 'حلويات شرقية', path: '/navigation/oriental_sweets.html' },
  savories: { label: 'Savouries', ar: 'موالح', path: '/navigation/savories.html' }
};
const BRANCHES = [
  ['Salwa Road', '/locations/al-aziziya.html'],
  ['Al Wakrah', '/locations/al-wakrah.html'],
  ['Al Kharaitiyat', '/locations/al-kharaitiyat.html']
];
// The trailing id keeps product URLs unique and stable when a name is edited.
function productPath(product) {
  const slug = String(product.name || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
  return `/menu/${slug}-${encodeURIComponent(product.id)}`;
}
function displayName(product) {
  const name = String(product.name || '').trim();
  return name === name.toLowerCase() ? name.replace(/\b[a-z]/g, c => c.toUpperCase()) : name;
}
function priceRange(product) {
  try {
    const variants = typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants;
    if (variants) {
      const disabled = Array.isArray(variants._disabled) ? variants._disabled : [];
      const prices = ['small', 'medium', 'large'].filter(size => !disabled.includes(size)).map(size => Number(variants[size])).filter(n => Number.isFinite(n) && n > 0);
      if (prices.length) return [Math.min(...prices), Math.max(...prices)];
    }
  } catch { /* Fall back to the base price, as the menu does. */ }
  const price = Number(product.price);
  return product.price !== null && product.price !== undefined && String(product.price).trim() !== '' && Number.isFinite(price) && price > 0 ? [price, price] : null;
}
function cards(products) {
  return products.map(product => {
    const image = imageUrl(product.image);
    return `<article class="menu-item" id="product-${e(product.id)}">${image ? `<img class="menu-item-img" loading="lazy" width="400" height="300" src="${e(image)}" alt="${e(product.name || '')}">` : ''}<div class="menu-item-info"><div><h2 class="menu-item-name"><a href="${e(productPath(product))}">${e(product.name || '')}</a></h2><p class="menu-item-price">${e(priceText(product))}</p><p class="menu-item-desc">${e(product.description || '')}</p>${product.name_ar ? `<p lang="ar" dir="rtl">${e(product.name_ar)}</p>` : ''}</div><a href="/menu.html">View menu &amp; order</a></div></article>`;
  }).join('');
}
function catalogueSchema(products, pagePath) {
  return { '@context': 'https://schema.org', '@type': 'ItemList', '@id': ORIGIN + pagePath + '#catalogue', itemListElement: products.map((product, i) => ({ '@type': 'ListItem', position: i + 1, name: product.name, url: ORIGIN + productPath(product), ...(product.description ? { description: product.description } : {}), ...(imageUrl(product.image) ? { image: imageUrl(product.image) } : {}) })) };
}
function metadata(html, title, description, pagePath) {
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${e(title)}</title>`).replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${ORIGIN + pagePath}">`);
  const values = { description, 'og:title': title, 'twitter:title': title, 'og:description': description, 'twitter:description': description, 'og:url': ORIGIN + pagePath };
  return html.replace(/<meta\s+(?:name|property)="([^"]+)"\s+content="[^"]*"\s*\/?>/g, (tag, key) => key in values ? tag.replace(/content="[^"]*"/, `content="${e(values[key])}"`) : tag);
}
function productPage(template, product, related) {
  const name = displayName(product);
  const category = CATEGORIES[product.category];
  const pagePath = productPath(product);
  const image = imageUrl(product.image);
  const price = priceText(product);
  const description = String(product.description || '').trim();
  const where = category ? `${category.label} · Doha, Qatar` : 'Doha, Qatar';
  const metaDescription = `${name}${description ? ` – ${description.replace(/\s+/g, ' ').slice(0, 90).replace(/\s+\S*$/, '')}` : ''}. ${price ? price.replace(/^(?!QAR)/, 'QAR ') + '. ' : ''}Order from CATHAREi Bakery & Sweets in Doha, Qatar.`;
  let html = template.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  html = metadata(html, `${name} in Doha, Qatar | CATHAREi`, metaDescription, pagePath);
  if (image) html = html.replace(/<meta\s+(?:name|property)="(?:og|twitter):image"\s+content="[^"]*"\s*\/?>/g, tag => tag.replace(/content="[^"]*"/, `content="${e(image)}"`));
  const variants = typeof product.variants === 'string' ? product.variants : (product.variants ? JSON.stringify(product.variants) : '');
  const main = `<main><nav class="container seo-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / ${category ? `<a href="${category.path}">${e(category.label)}</a> / ` : ''}${e(name)}</nav>
    <article class="container product-page" id="product-${e(product.id)}">
      ${image ? `<img class="product-page-img" width="560" height="700" src="${e(image)}" alt="${e(name)}">` : ''}
      <div class="product-page-info">
        <h1>${e(name)}</h1>
        <p class="product-page-where">${e(where)}</p>
        ${price ? `<p class="menu-item-price">${e(price.replace(/^(?!QAR)/, 'QAR '))}</p>` : ''}
        ${description ? `<p>${e(description)}</p>` : ''}
        ${product.name_ar ? `<p lang="ar" dir="rtl">${e(product.name_ar)}</p>` : ''}
        <p class="product-page-actions"><button class="menu-add-button" type="button" id="product-page-add" data-id="${e(product.id)}" data-name="${e(product.name || '')}" data-price="${e(Number(product.price) || 0)}" data-image="${e(product.image || '')}" data-variants="${e(variants)}">Add to cart</button> <a href="/menu.html#product-${e(product.id)}">View on full menu</a></p>
      </div>
    </article>
    <section class="container seo-copy"><h2>Order ${e(name)} in Doha</h2><p>Order ${e(name)} online from CATHAREi Bakery &amp; Sweets, or contact one of our branches in Qatar to ask about sizes, ingredients, allergens and preparation time: ${BRANCHES.map(([label, href]) => `<a href="${href}">${label}</a>`).join(', ')}.</p>${category ? `<p>Browse all <a href="${category.path}">${e(category.label.toLowerCase())} in Doha, Qatar</a> or the <a href="/menu.html">full menu</a>.</p>` : ''}
      <div lang="ar" dir="rtl"><h2>${e(product.name_ar || name)} في الدوحة، قطر</h2><p>اطلب ${e(product.name_ar || name)} من كاثاري للمخبوزات والحلويات عبر الموقع، أو تواصل مع أحد فروعنا في قطر للاستفسار عن الأحجام والمكونات ووقت التحضير.</p>${category ? `<a href="${category.path}">${category.ar} في قطر</a>` : ''}</div>
    </section>
    ${related.length ? `<section class="container"><h2>More ${e(category ? category.label.toLowerCase() : 'from our menu')}</h2><div class="menu-grid">${cards(related)}</div></section>` : ''}
    <script>document.getElementById('product-page-add').addEventListener('click', function (event) { var b = this.dataset; addToCart(event, b.id, b.name, Number(b.price), b.image, b.variants); });</script>
  </main>`;
  html = html.replace(/<main>[\s\S]*?<\/main>/, () => main);
  // Size variants do not have individually selectable URLs yet. AggregateOffer
  // describes multiple offers, not size variants (Google Product guidelines).
  // Keep their visible prices, but do not advertise a fabricated single offer.
  let hasVariants = false;
  try { hasVariants = Boolean(typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants); } catch { /* Same fallback as the menu. */ }
  const range = hasVariants ? null : priceRange(product);
  const offer = !range ? undefined : { '@type': 'Offer', price: range[0].toFixed(2), priceCurrency: 'QAR', url: ORIGIN + pagePath };
  const schema = [
    { '@context': 'https://schema.org', '@type': 'Product', name, url: ORIGIN + pagePath, sku: String(product.id), brand: { '@type': 'Brand', name: 'CATHAREi' }, ...(description ? { description } : {}), ...(image ? { image } : {}), ...(category ? { category: category.label } : {}), ...(offer ? { offers: offer } : {}) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' },
      ...(category ? [{ '@type': 'ListItem', position: 2, name: category.label, item: ORIGIN + category.path }] : []),
      { '@type': 'ListItem', position: category ? 3 : 2, name, item: ORIGIN + pagePath }
    ] }
  ];
  return html.replace('</head>', () => `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script></head>`);
}
function registerCatalogueSeo(app, getDb, root) {
  app.get('/sitemap.xml', (req, res) => {
    getDb().all('SELECT * FROM products WHERE active = 1 ORDER BY id', [], (err, products) => {
      if (err) return res.status(503).set('Retry-After', '300').type('text/plain').send('Sitemap temporarily unavailable');
      let xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
      if (products.some(isLuqaimat)) xml = xml.replace('</urlset>', `<url><loc>${ORIGIN + LUQ_PATH}</loc></url>\n</urlset>`);
      const productUrls = products.map(product => `  <url><loc>${e(ORIGIN + productPath(product))}</loc></url>\n`).join('');
      res.type('application/xml').send(xml.replace('</urlset>', () => productUrls + '</urlset>'));
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
  app.get('/menu/:slug', (req, res, next) => {
    const id = req.params.slug.match(/-(\d+)$/)?.[1];
    if (!id) return next();
    getDb().all('SELECT * FROM products WHERE active = 1 ORDER BY name', [], (err, products) => {
      if (err) return res.status(503).set('Retry-After', '300').set('X-Robots-Tag', 'noindex, follow').type('text/plain').send('Menu temporarily unavailable. Please try again shortly.');
      const product = products.find(p => String(p.id) === id);
      if (!product) return next();
      const canonical = productPath(product);
      if (req.path !== canonical) return res.redirect(301, canonical + req.originalUrl.slice(req.path.length));
      const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 6);
      res.send(productPage(fs.readFileSync(path.join(root, 'navigation/cakes.html'), 'utf8'), product, related));
    });
  });
}
module.exports = { registerCatalogueSeo, isLuqaimat, imageUrl, priceText, cards, catalogueSchema, productPath };
