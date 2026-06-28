const fs = require('fs');
const path = require('path');

function updateStoreFooters(dir, relativePath = '') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'locations') {
        updateStoreFooters(fullPath, path.join(relativePath, file));
      }
    } else if (fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const prefix = relativePath === '' ? '' : '../';

      let modified = false;

      // Al Aziziya
      const aziziyaRegex = /href="https:\/\/www\.google\.com\/maps\/place\/Catharei\/@[^"]*"\s*target="_blank"(\s*data-i18n="stores\.aziziya")/i;
      if (aziziyaRegex.test(content)) {
        content = content.replace(aziziyaRegex, `href="${prefix}locations/al-aziziya.html"$1`);
        modified = true;
      }

      // Al Wakrah
      const wakrahRegex = /href="https:\/\/www\.google\.com\/maps\/place\/Catharei\+Wakrah\/@[^"]*"\s*target="_blank"(\s*data-i18n="stores\.wakrah")/i;
      if (wakrahRegex.test(content)) {
        content = content.replace(wakrahRegex, `href="${prefix}locations/al-wakrah.html"$1`);
        modified = true;
      }

      // Al Kharaitiyat
      const kharaitiyatRegex = /href="https:\/\/www\.google\.com\/maps\/place\/CATHAREI\/@[^"]*"\s*target="_blank"(\s*data-i18n="stores\.kharaitiyat")/i;
      if (kharaitiyatRegex.test(content)) {
        content = content.replace(kharaitiyatRegex, `href="${prefix}locations/al-kharaitiyat.html"$1`);
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Rerouted footer in ${fullPath}`);
      }
    }
  }
}

updateStoreFooters('.');
