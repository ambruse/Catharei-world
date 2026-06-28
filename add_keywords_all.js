const fs = require('fs');
const path = require('path');

const newKeywords = "Arabic sweets Salwa Road, sweet shop Salwa Rd Doha, best bakery Salwa Road, CATHAREi Bakery Doha, buy Arabic sweets Doha, dessert places near Salwa Road, traditional Arabic desserts Doha, Kunafa Salwa Road, premium chocolates Doha, luxury sweet boxes Salwa Rd, Baklava shop Doha, Arabic sweets Al Wakrah, Wakra bakery, sweet shop in Wakra, CATHAREi Bakery Al Wakrah, dessert shop near me Al Wakrah, best sweets in Wakra, family dessert shop Wakra, fresh Arabic sweets Al Wakrah, high-quality chocolates Wakra, premium sweet gifting Al Wakrah, Arabic sweets Al Kharaitiyat, Umm Salal Muhammed bakery, sweet shop Umm Salal, North Doha dessert shop, bakery near Al Kharaitiyat, sweets for events Umm Salal, dessert takeaway North Doha, authentic Arabic sweets Kharaitiyat, custom sweet boxes Umm Salal Muhammed, fine chocolates North Doha";
const fullKeywords = "Arabic sweets near me, Best Arabic bakery in Doha, Order Kunafa online, Authentic Baklava delivery, Halal bakery near me, Lebanese sweets shop Doha, Fresh Arabic pastries daily, Middle Eastern dessert shop open now, Authentic pistacho Baklava, Cheese Kunafa / Knafeh hot delivery, Maamoul cookies with dates, Basbousa / Harissa cake, Umm Ali traditional dessert, Halawet el Jibn fresh, Awameh / Luqaimat sweet balls, Freshly baked pita bread, Manakish Zaatar and cheese, Fatayer spinach and meat pastries, Traditional Ka'ak bread, Middle Eastern savory pastries savory box, Ramadan sweets boxes, Eid dessert catering, Arabic sweets gift box delivery, Middle Eastern wedding dessert table, Corporate gifting Arabic sweets, Iftar dessert platters, Best Luqaimat, " + newKeywords;

function updateKeywords(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        updateKeywords(fullPath);
      }
    } else if (fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const metaKeywordsRegex = /<meta\s+name="keywords"\s+content="([^"]*)"\s*\/?>/i;
      const match = content.match(metaKeywordsRegex);
      
      if (match) {
        let existingKeywords = match[1];
        if (!existingKeywords.includes("Salwa Road")) {
          const updatedKeywords = existingKeywords + ", " + newKeywords;
          const newMeta = `<meta name="keywords" content="${updatedKeywords}">`;
          content = content.replace(match[0], newMeta);
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated keywords in ${fullPath}`);
        }
      } else {
        // Inject fullKeywords right before </head>
        if (content.includes('</head>')) {
          content = content.replace('</head>', `  <meta name="keywords" content="${fullKeywords}">\n</head>`);
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Added keywords to ${fullPath}`);
        }
      }
    }
  }
}

updateKeywords('.');
