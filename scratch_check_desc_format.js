const fs = require('fs');
const path = require('path');

const map = JSON.parse(fs.readFileSync('scratch_keywords.json', 'utf8'));

for (const file of Object.keys(map)) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('name="description"') || line.toLowerCase().includes('name=\'description\'')) {
      console.log(`${file}: ${line.trim()}`);
    }
  }
}
