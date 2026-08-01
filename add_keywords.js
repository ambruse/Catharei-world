const fs = require('fs');
const path = require('path');

const newKeywords = "Arabic sweets Salwa Road, sweet shop Salwa Rd Doha, best bakery Salwa Road, CATHAREi Bakery Doha, buy Arabic sweets Doha, dessert places near Salwa Road, traditional Arabic desserts Doha, Baklava Salwa Road, premium chocolates Doha, luxury sweet boxes Salwa Rd, Baklava shop Doha, Arabic sweets Al Wakrah, Wakra bakery, sweet shop in Wakra, CATHAREi Bakery Al Wakrah, dessert shop near me Al Wakrah, best sweets in Wakra, family dessert shop Wakra, fresh Arabic sweets Al Wakrah, high-quality chocolates Wakra, premium sweet gifting Al Wakrah, Arabic sweets Al Kharaitiyat, Umm Salal Muhammed bakery, sweet shop Umm Salal, North Doha dessert shop, bakery near Al Kharaitiyat, sweets for events Umm Salal, dessert takeaway North Doha, authentic Arabic sweets Kharaitiyat, custom sweet boxes Umm Salal Muhammed, fine chocolates North Doha";

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
        // Only add if not already there
        if (!existingKeywords.includes("Salwa Road")) {
          const updatedKeywords = existingKeywords + ", " + newKeywords;
          const newMeta = `<meta name="keywords" content="${updatedKeywords}">`;
          content = content.replace(match[0], newMeta);
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated keywords in ${fullPath}`);
        }
      }
    }
  }
}

updateKeywords('.');
