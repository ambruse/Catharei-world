const fs = require('fs');
const path = require('path');

const titles = {
  'Arabic_sweets.html': 'Authentic Arabic Sweets | CATHAREi Doha',
  'cakes.html': 'Traditional & Modern Cakes | CATHAREi Doha',
  'customized_cakes.html': 'Customized Cakes & Creations | CATHAREi Doha',
  'oriental_sweets.html': 'Premium Oriental Sweets | CATHAREi Doha',
  'special.html': 'Special Selection Desserts | CATHAREi Doha',
  'special_cakes.html': 'Special Occasion Cakes | CATHAREi Doha',
  'savories.html': 'Premium Savories & Pastries | CATHAREi Doha'
};

const navDir = path.join(__dirname, 'navigation');

if (fs.existsSync(navDir)) {
  const files = fs.readdirSync(navDir);
  for (const file of files) {
    if (file.endsWith('.html') && titles[file]) {
      let content = fs.readFileSync(path.join(navDir, file), 'utf8');
      
      // 1. Update Title
      content = content.replace(/<title>.*?<\/title>/, `<title>${titles[file]}</title>`);
      
      // 2. Fix Al Ain to Doha
      content = content.replace(/Al Ain/g, 'Doha');
      
      // 3. Ensure H1 tag (Most use <h1 class="... category-title">. We'll leave H1 as is if it exists, otherwise it's fine since we added titles. Actually, most already have H1 from the template)
      
      fs.writeFileSync(path.join(navDir, file), content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
}

// 4. Preload Hero Image for index.html and menu.html
function addPreload(file, imagePath) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('rel="preload"')) {
      content = content.replace('</head>', `  <link rel="preload" href="${imagePath}" as="image">\n</head>`);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Added preload to ${file}`);
    }
  }
}

addPreload('index.html', 'images/background/hero_spread.webp');
addPreload('menu.html', 'images/background/hero_spread.webp');

// 5. Admin Security (noindex)
function addNoIndex(file) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('name="robots" content="noindex')) {
      content = content.replace('</head>', `  <meta name="robots" content="noindex, nofollow">\n</head>`);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Added noindex to ${file}`);
    }
  }
}

addNoIndex('admin.html');
addNoIndex('account.html');
