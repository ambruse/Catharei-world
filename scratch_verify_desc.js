const fs = require('fs');
const path = require('path');

const map = JSON.parse(fs.readFileSync('scratch_keywords.json', 'utf8'));
let missingCount = 0;

for (const file of Object.keys(map)) {
  if (!fs.existsSync(file)) {
    console.log(`File does not exist: ${file}`);
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  const metaDescRegex = /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i;
  const match = content.match(metaDescRegex);
  if (!match) {
    console.log(`Missing description meta tag in: ${file}`);
    missingCount++;
  }
}
console.log(`Total missing: ${missingCount}`);
