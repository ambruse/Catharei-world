const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all("SELECT DISTINCT category FROM products", [], (err, rows) => {
  if (err) throw err;
  console.log("Categories in DB:", rows.map(r => r.category));
});
