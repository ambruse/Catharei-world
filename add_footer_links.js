const fs = require('fs');
const path = require('path');

const newLinks = `            <li><a href="/about.html" style="color:#ccc; font-size:0.85rem;">About Us</a></li>
            <li><a href="/catering.html" style="color:#ccc; font-size:0.85rem;">Catering & Occasions</a></li>\n`;

function updateLinks(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        updateLinks(fullPath);
      }
    } else if (fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (!content.includes('about.html') && content.includes('data-i18n="nav.offers"')) {
        // Insert right before the Offers link
        const offersLine = content.match(/.*data-i18n="nav\.offers".*\n?/);
        if (offersLine) {
          content = content.replace(offersLine[0], newLinks + offersLine[0]);
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Added footer links to ${fullPath}`);
        }
      }
    }
  }
}

updateLinks('.');
