const fs = require('fs');
const path = require('path');

function updateNavLinks(dir, isRoot) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        updateNavLinks(fullPath, false);
      }
    } else if (fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (!content.includes('data-i18n="nav.about"')) {
        const prefix = isRoot ? '' : '../';
        const newLinks = `
        <li class="nav-item"><a href="${prefix}about.html" data-i18n="nav.about">About Us</a></li>
        <li class="nav-item"><a href="${prefix}catering.html" data-i18n="nav.catering">Catering</a></li>\n        `;
        
        // Find the language dropdown LI which starts before <button id="lang-btn"
        // Regex to find: <li class="nav-item has-dropdown"> followed by whitespace and <button id="lang-btn"
        const langRegex = /(<li class="nav-item has-dropdown">\s*<button id="lang-btn")/i;
        if (langRegex.test(content)) {
          content = content.replace(langRegex, newLinks + '$1');
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Added nav links to ${fullPath}`);
        } else {
          console.log(`Could not find lang-btn in ${fullPath}`);
        }
      }
    }
  }
}

updateNavLinks('.', true);
