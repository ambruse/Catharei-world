const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all("SELECT id, name, category, active FROM products", [], (err, rows) => {
  if (err) throw err;
  console.log(JSON.stringify(rows, null, 2));
});
