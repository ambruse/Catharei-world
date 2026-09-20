const ORIGIN = 'https://www.catharei.com';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function postMetadata(template, post) {
  const url = `${ORIGIN}/blog/${encodeURIComponent(post.slug)}`;
  const image = new URL(post.cover, ORIGIN).href;
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(post.title)} | CATHAREi</title>`);
  const values = { description: post.desc, 'og:title': post.title, 'og:description': post.desc, 'og:url': url, 'og:type': 'article', 'og:image': image, 'twitter:title': post.title, 'twitter:description': post.desc, 'twitter:image': image };
  html = html.replace(/<meta\s+(?:name|property)="([^"]+)"\s+content="[^"]*"\s*\/?>/g, (tag, key) => key in values ? tag.replace(/content="[^"]*"/, `content="${escapeHtml(values[key])}"`) : tag);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}">`);
  // The feed's schema does not describe an individual article.
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.desc, image, datePublished: post.date, mainEntityOfPage: url, author: { '@type': 'Organization', name: 'CATHAREi', url: ORIGIN }, publisher: { '@type': 'Organization', name: 'CATHAREi', logo: { '@type': 'ImageObject', url: `${ORIGIN}/images/misc/Catharei_logo.webp` } } };
  return html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>\n</head>`);
}

module.exports = { escapeHtml, postMetadata };
