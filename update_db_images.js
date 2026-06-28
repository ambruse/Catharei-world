const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all("SELECT id, image FROM products", [], (err, rows) => {
  if (err) throw err;
  rows.forEach(row => {
    if (row.image && (row.image.toLowerCase().endsWith('.png') || row.image.toLowerCase().endsWith('.jpg') || row.image.toLowerCase().endsWith('.jpeg'))) {
      const newImage = row.image.substring(0, row.image.lastIndexOf('.')) + '.webp';
      db.run("UPDATE products SET image = ? WHERE id = ?", [newImage, row.id], (err) => {
        if (err) console.error(err);
        else console.log(`Updated product ${row.id} image to ${newImage}`);
      });
    }
  });
});
