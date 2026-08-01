const fs = require('fs');
let sitemap = fs.readFileSync('sitemap.xml', 'utf8');
const urls = ['locations/al-aziziya.html', 'locations/al-wakrah.html', 'locations/al-kharaitiyat.html'];
let additions = '';
urls.forEach(u => {
  if (!sitemap.includes(u)) {
    additions += `\n  <url>\n    <loc>https://www.catharei.com/${u}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
  }
});
if (additions) {
  sitemap = sitemap.replace('</urlset>', additions + '\n</urlset>');
  fs.writeFileSync('sitemap.xml', sitemap);
  console.log('Sitemap updated.');
}
