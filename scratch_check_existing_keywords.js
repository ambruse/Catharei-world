const fs = require('fs');
const path = require('path');

const map = JSON.parse(fs.readFileSync('scratch_keywords.json', 'utf8'));
let existingCount = 0;

for (const file of Object.keys(map)) {
  if (!fs.existsSync(file)) {
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  const metaKeywordsRegex = /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i;
  const match = content.match(metaKeywordsRegex);
  if (match) {
    console.log(`Already has keywords: ${file}`);
    existingCount++;
  }
}
console.log(`Total files with existing keywords: ${existingCount}`);
