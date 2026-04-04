const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'", (err, rows) => {
    if (err) {
      console.error("Schema error:", err);
    } else if (rows.length === 0) {
      console.log("Orders table DOES NOT EXIST.");
    } else {
      console.log("Orders table EXISTS. Checking columns...");
      db.all("PRAGMA table_info(orders)", (err2, columns) => {
        if (err2) {
          console.error(err2);
        } else {
          console.log("Columns:", JSON.stringify(columns, null, 2));
        }
      });
    }
  });
});

setTimeout(() => db.close(), 1000);
