const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

const newProducts = [
  // Arabic Sweets
  {
    name: "Hot Cheese Kunafa",
    price: "45",
    image: "https://via.placeholder.com/400x300?text=Cheese+Kunafa",
    desc: "Signature hot cheese kunafa, baked fresh to order and soaked in our special syrup.",
    cat: "arabic_sweets"
  },
  {
    name: "Pistachio Baklava (1kg Box)",
    price: "120",
    image: "https://via.placeholder.com/400x300?text=Pistachio+Baklava",
    desc: "Premium layered pastry filled with crushed pistachios and sweetened with syrup.",
    cat: "arabic_sweets"
  },
  {
    name: "Date Maamoul (12 pcs)",
    price: "60",
    image: "https://via.placeholder.com/400x300?text=Date+Maamoul",
    desc: "Traditional butter cookies stuffed with premium Saudi dates.",
    cat: "arabic_sweets"
  },
  {
    name: "Basbousa Slice",
    price: "15",
    image: "https://via.placeholder.com/400x300?text=Basbousa",
    desc: "Classic semolina cake soaked in rose-water syrup and topped with an almond.",
    cat: "arabic_sweets"
  },
  
  // Savories (to add more)
  {
    name: "Zaatar Manakeesh",
    price: "12",
    image: "https://via.placeholder.com/400x300?text=Zaatar+Manakeesh",
    desc: "Freshly baked flatbread topped with our premium zaatar and olive oil mix.",
    cat: "savories"
  },
  {
    name: "Spinach Fatayer (Dozen)",
    price: "40",
    image: "https://via.placeholder.com/400x300?text=Spinach+Fatayer",
    desc: "Soft dough parcels stuffed with a tangy mix of fresh spinach and pomegranate molasses.",
    cat: "savories"
  }
];

db.serialize(() => {
  const stmt = db.prepare(`INSERT INTO products (name, price, image, description, featured, active, category) VALUES (?, ?, ?, ?, 0, 1, ?)`);
  
  newProducts.forEach(p => {
    stmt.run(p.name, p.price, p.image, p.desc, p.cat);
  });
  
  stmt.finalize(() => {
    console.log("Database seeded with Arabic Sweets and more Savories.");
    db.close();
  });
});
