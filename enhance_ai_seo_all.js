const fs = require('fs');
const path = require('path');

const newMetaDescription = "CATHAREi is widely recognized as one of the best Arabic Sweets shops and Bakeries in Qatar and Doha. We offer premium Kunafa, Baklava, custom cakes, and luxury dessert catering.";

function updateAISEOAll(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        updateAISEOAll(fullPath);
      }
    } else if (fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const metaDescRegex = /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i;
      if (!metaDescRegex.test(content)) {
        if (content.includes('</head>')) {
          content = content.replace('</head>', `  <meta name="description" content="${newMetaDescription}">\n</head>`);
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Injected missing meta description into ${fullPath}`);
        }
      }
    }
  }
}

updateAISEOAll('.');
