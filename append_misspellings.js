const fs = require('fs');
const path = require('path');

const misspellings = ", Catharei, Catharie, Qatharei, Qatharie, qatharei, qatharie, catharei, catharie";

function appendKeywords(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        appendKeywords(fullPath);
      }
    } else if (fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const metaKeywordsRegex = /<meta\s+name="keywords"\s+content="([^"]*)"\s*\/?>/i;
      const match = content.match(metaKeywordsRegex);
      
      if (match) {
        let existingKeywords = match[1];
        if (!existingKeywords.includes("Qatharei")) {
          const updatedKeywords = existingKeywords + misspellings;
          const newMeta = `<meta name="keywords" content="${updatedKeywords}">`;
          content = content.replace(match[0], newMeta);
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Appended misspellings to ${fullPath}`);
        }
      }
    }
  }
}

appendKeywords('.');
