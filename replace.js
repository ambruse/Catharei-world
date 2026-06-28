const fs = require('fs');
const path = require('path');

const dir = __dirname;
const targetExts = ['.html', '.css', '.js'];

async function processFiles(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'images' || file === 'convert.js' || file === 'replace.js' || file === 'test.js') continue;
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      await processFiles(fullPath);
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (targetExts.includes(ext)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        // Replace .png and .jpg with .webp
        if (content.includes('.png') || content.includes('.jpg') || content.includes('.jpeg')) {
          content = content.replace(/\.png/g, '.webp');
          content = content.replace(/\.jpg/g, '.webp');
          content = content.replace(/\.jpeg/g, '.webp');
          modified = true;
        }

        // Add loading="lazy" to <img> tags in HTML, but NOT if it already has it.
        // We will skip logos or critical hero images if possible, but for simplicity we'll add it to all images that don't have it.
        if (ext === '.html' && content.includes('<img ')) {
          content = content.replace(/<img (?![^>]*loading="lazy")/g, '<img loading="lazy" ');
          modified = true;
        }

        // In script.js, we have dynamically generated <img src="..."> tags
        if (file === 'script.js' && content.includes('<img ')) {
           content = content.replace(/<img src="/g, '<img loading="lazy" src="');
           modified = true;
        }

        if (modified) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated ${fullPath}`);
        }
      }
    }
  }
}

processFiles(dir).then(() => {
  console.log('Replacement complete!');
}).catch(err => {
  console.error('Error:', err);
});
