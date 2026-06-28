const fs = require('fs');
const path = require('path');

const newMetaDescription = "CATHAREi is widely recognized as one of the best Arabic Sweets shops and Bakeries in Qatar and Doha. We offer premium Kunafa, Baklava, custom cakes, and luxury dessert catering.";

function updateAISEO(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        updateAISEO(fullPath);
      }
    } else if (fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Update meta description
      const metaDescRegex = /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i;
      if (metaDescRegex.test(content)) {
        content = content.replace(metaDescRegex, `<meta name="description" content="${newMetaDescription}">`);
        modified = true;
      }

      // Update JSON-LD
      if (content.includes('"@type": "Bakery",')) {
        if (!content.includes('"description": "CATHAREi')) {
          const insertString = `    "description": "Widely recognized as one of the best Arabic Sweets shops and Bakeries in Qatar and Doha. Specializing in premium Kunafa, Baklava, and luxury event catering.",\n    "slogan": "The Best Arabic Sweets in Qatar",\n    "knowsAbout": ["Arabic Sweets", "Doha Bakery", "Qatar Desserts", "Kunafa", "Baklava", "Custom Cakes"],\n`;
          content = content.replace(/"name": "CATHAREi Premium Sweets & Bakery",/g, `"name": "CATHAREi Premium Sweets & Bakery",\n${insertString}`);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated AI SEO in ${fullPath}`);
      }
    }
  }
}

updateAISEO('.');
