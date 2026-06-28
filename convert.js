const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'images');

async function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      await processDirectory(fullPath);
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
        const newPath = fullPath.substring(0, fullPath.lastIndexOf('.')) + '.webp';
        console.log(`Converting ${fullPath} to ${newPath}`);
        try {
          await sharp(fullPath)
            .webp({ quality: 80 })
            .toFile(newPath);
          // Delete old file after successful conversion
          fs.unlinkSync(fullPath);
          console.log(`Deleted ${fullPath}`);
        } catch (err) {
          console.error(`Error converting ${fullPath}:`, err);
        }
      }
    }
  }
}

processDirectory(dir).then(() => {
  console.log('Conversion complete!');
}).catch(err => {
  console.error('Error:', err);
});
