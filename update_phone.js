const fs = require('fs');
const path = require('path');

const locDir = path.join(__dirname, 'locations');
if (fs.existsSync(locDir)) {
  const files = fs.readdirSync(locDir);
  for (const file of files) {
    if (file.endsWith('.html')) {
      const filePath = path.join(locDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/0000 0000/g, '5094 2255');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated phone number in ${file}`);
    }
  }
}
