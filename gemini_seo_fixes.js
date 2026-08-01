const fs = require('fs');
const path = require('path');

const titleMap = {
  'index.html': 'Order Premium Sweets & Custom Cakes in Doha | CATHAREi',
  'menu.html': 'Buy Authentic Arabic Sweets & Cakes Online | CATHAREi Menu',
  'Arabic_sweets.html': 'Order Authentic Arabic Sweets in Doha | CATHAREi',
  'cakes.html': 'Buy Luxury Custom Cakes in Doha | CATHAREi',
  'customized_cakes.html': 'Order Custom 3D Cakes & Birthday Cakes in Doha | CATHAREi',
  'oriental_sweets.html': 'Buy Premium Oriental Sweets & Desserts in Doha | CATHAREi',
  'savories.html': 'Order Fresh Savories & Fatayer in Doha | CATHAREi',
  'special.html': 'Buy Special Selection Desserts & Gift Boxes | CATHAREi',
  'special_cakes.html': 'Order Special Occasion & Wedding Cakes in Doha | CATHAREi'
};

function processHtmlFiles(dir, relativePath = '') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        processHtmlFiles(fullPath, path.join(relativePath, file));
      }
    } else if (fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const urlPath = (relativePath ? relativePath.replace(/\\/g, '/') + '/' : '') + file;
      
      // 1. Inject Hreflang
      if (!content.includes('hreflang="ar"')) {
        const hreflangTags = `
  <link rel="alternate" hreflang="en" href="https://www.catharei.com/${urlPath}?lang=en" />
  <link rel="alternate" hreflang="ar" href="https://www.catharei.com/${urlPath}?lang=ar" />
  <link rel="alternate" hreflang="x-default" href="https://www.catharei.com/${urlPath}" />`;
        content = content.replace('</head>', `${hreflangTags}\n</head>`);
      }

      // 2. Transactional Meta Titles
      if (titleMap[file]) {
        content = content.replace(/<title>.*?<\/title>/, `<title>${titleMap[file]}</title>`);
      }

      // 3. Image Alt Text Optimization
      // Find <img> tags
      const imgRegex = /<img\s+([^>]*?)>/gi;
      content = content.replace(imgRegex, (match, attrs) => {
        // Check if it has alt
        if (!/alt\s*=\s*"[^"]+"/i.test(match)) {
          // No alt or empty alt. 
          // Extract filename to make a good alt text if possible
          const srcMatch = attrs.match(/src="([^"]+)"/);
          let altText = "Premium CATHAREi Dessert Doha";
          if (srcMatch) {
            const filename = srcMatch[1].split('/').pop().split('.')[0];
            altText = filename.replace(/[-_]/g, ' ') + " - Custom Cake and Arabic Sweets Doha";
          }
          
          if (/alt\s*=\s*""/i.test(match)) {
             return match.replace(/alt\s*=\s*""/i, `alt="${altText}"`);
          } else {
             return `<img ${attrs} alt="${altText}">`;
          }
        }
        return match;
      });

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Processed ${fullPath}`);
    }
  }
}

processHtmlFiles('.');
