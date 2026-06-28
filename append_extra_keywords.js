const fs = require('fs');
const path = require('path');

const extraKeywords = ", salwa, Doha, CATHAREi, Food, food, trending, best, fatayer, Dibs";

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
        if (!existingKeywords.includes("Dibs")) {
          const updatedKeywords = existingKeywords + extraKeywords;
          const newMeta = `<meta name="keywords" content="${updatedKeywords}">`;
          content = content.replace(match[0], newMeta);
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Appended extra keywords in ${fullPath}`);
        }
      } else {
        // If it doesn't have keywords at all, inject it
        if (content.includes('</head>')) {
          content = content.replace('</head>', `  <meta name="keywords" content="${extraKeywords.substring(2)}">\n</head>`);
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Injected extra keywords in ${fullPath}`);
        }
      }
    }
  }
}

appendKeywords('.');
