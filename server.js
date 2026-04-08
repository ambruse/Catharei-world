const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session); // Added from server2

const app = express();
const PORT = process.env.PORT || 3000; // Updated from server2
const SALT_ROUNDS = 12;

// ── Render Environment Variables & Paths (Added from server2) ──
const IS_RENDER = process.env.RENDER === 'true';

// Define the master data directory. 
// If on Render, use the Persistent Disk. If local, use the current folder.
const DATA_DIR = IS_RENDER ? '/opt/render/project/src/data' : __dirname;

// Point the database and uploads to the DATA_DIR
const DB_PATH = path.join(DATA_DIR, 'database.sqlite');
const UPLOAD_DIR = path.join(DATA_DIR, 'images', 'products');

// ── Directory Initialization (Updated from server2) ──
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Trust Proxy (Required for secure cookies on Render) ──
if (IS_RENDER) {
  app.set('trust proxy', 1); 
}

// ── Session Configuration (Updated from server2) ──
app.use(session({
  store: new SQLiteStore({
      db: 'sessions.sqlite',
      dir: DATA_DIR // Save user sessions to the persistent disk
  }),
  secret: 'catharei_super_secret_session_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: IS_RENDER, // set to true in production with HTTPS
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8  // 8 hours
  }
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ── Auth Middleware ──
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  // For API calls, return a JSON error instead of a redirect
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized: Admin session expired.' });
  }
  res.redirect('/login.html?redirect=admin');
}

function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login.html');
}

// ── Protect /admin.html at server level ──
// This intercepts the file BEFORE express.static can serve it
app.get('/admin.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ── Serve Images from the Persistent Disk (Added from server2) ──
app.use('/images/products', express.static(UPLOAD_DIR));

// ── Static Files (after admin guard) ──
app.use(express.static(__dirname));

// ── File Upload Configuration (Updated from server2) ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// ── Database (Updated from server2) ──
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log(`Connected to the SQLite database at ${DB_PATH}.`);
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // ── Products Table ──
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nameKey TEXT,
        name TEXT,
        price TEXT,
        image TEXT,
        description TEXT,
        featured INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        category TEXT DEFAULT 'savories'
      )
    `);

    // Helper to safely add columns
    const addColumn = (table, col, def) => {
      db.get(`PRAGMA table_info(${table})`, (err, rows) => {
        db.all(`PRAGMA table_info(${table})`, (err, cols) => {
           if (!err && cols) {
             if (!cols.find(c => c.name === col)) {
               db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`, (err) => {
                 if(!err) console.log(`✓ Added [${col}] to [${table}]`);
               });
             }
           }
        });
      });
    };

    addColumn('products', 'active', 'INTEGER DEFAULT 1');
    addColumn('products', 'category', "TEXT DEFAULT 'savories'");
    addColumn('products', 'variants', 'TEXT'); // KEPT FROM SERVER1!

    db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
      if (!err && row) {
        if (row.count === 0) console.log('Products DB is empty.');
        else console.log(`Products DB loaded with ${row.count} product(s).`);
      }
    });

    // ── Users Table ──
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── Orders Table ──
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE,
        user_id INTEGER,
        items TEXT NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        address TEXT NOT NULL,
        lat REAL,
        lng REAL,
        payment_method TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if(!err) {
        // Migrations for existing orders table
        addColumn('orders', 'order_number', 'TEXT UNIQUE');
        addColumn('orders', 'status', "TEXT DEFAULT 'pending'");
      }
    });

    // Create default admin if no admin exists
    const defaultAdminUser = 'catharei_admin';
    const defaultAdminPass = 'Admin@Catharei2026';

    db.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1", (err, row) => {
      if (!row) {
        bcrypt.hash(defaultAdminPass, SALT_ROUNDS, (err, hash) => {
          if (!err) {
            db.run(`INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, 'admin')`,
              [defaultAdminUser, 'admin@catharei.com', hash], (err) => {
                if (!err) {
                  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                  console.log('  Admin account created:');
                  console.log(`  Username : ${defaultAdminUser}`);
                  console.log(`  Password : ${defaultAdminPass}`);
                  console.log('  Login at : /login.html');
                  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                }
              }
            );
          }
        });
      } else {
        console.log('Admin account exists.');
      }
    });
  });
}

// ═══════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    db.run(
      `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')`,
      [username.trim(), email.trim().toLowerCase(), hash],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'Username or email already exists.' });
          }
          return res.status(500).json({ error: 'Server error. Please try again.' });
        }
        req.session.user = { id: this.lastID, username: username.trim(), email: email.trim().toLowerCase(), role: 'user' };
        res.json({ success: true, username: username.trim(), role: 'user' });
      }
    );
  } catch (e) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  db.get(
    `SELECT * FROM users WHERE username = ? OR email = ?`,
    [username.trim(), username.trim().toLowerCase()],
    async (err, user) => {
      if (err) return res.status(500).json({ error: 'Server error.' });
      if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'Invalid username or password.' });

      req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role };
      res.json({ success: true, username: user.username, role: user.role });
    }
  );
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Get current session user
app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ 
      loggedIn: true, 
      user: req.session.user,
      email: req.session.user.email 
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// Verify identity (for forgot password — non-admin only)
app.post('/api/auth/verify-identity', (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) return res.status(400).json({ error: 'Username and email are required.' });
  db.get('SELECT * FROM users WHERE username = ? AND email = ?',
    [username.trim(), email.trim().toLowerCase()],
    (err, user) => {
      if (err) return res.status(500).json({ error: 'Server error.' });
      if (!user) return res.status(404).json({ error: 'No account found with that username and email.' });
      if (user.role === 'admin') return res.status(403).json({ error: 'Password reset is not available for admin accounts.' });
      // Store verified username in session temporarily
      req.session.resetUser = username.trim();
      res.json({ success: true });
    });
});

// Reset password (only allowed after verify-identity)
app.post('/api/auth/reset-password', async (req, res) => {
  const { username, password } = req.body;
  if (!req.session.resetUser || req.session.resetUser !== username) {
    return res.status(403).json({ error: 'Identity verification required first.' });
  }
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    db.run('UPDATE users SET password = ? WHERE username = ? AND role != ?', [hash, username, 'admin'], function(err) {
      if (err) return res.status(500).json({ error: 'Server error.' });
      delete req.session.resetUser;
      res.json({ success: true });
    });
  } catch { res.status(500).json({ error: 'Server error.' }); }
});

// Update profile (username/email)
app.post('/api/auth/update-profile', requireLogin, async (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) return res.status(400).json({ error: 'Username and email are required.' });
  db.run('UPDATE users SET username = ?, email = ? WHERE id = ?',
    [username.trim(), email.trim().toLowerCase(), req.session.user.id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username or email already taken.' });
        return res.status(500).json({ error: 'Server error.' });
      }
      req.session.user.username = username.trim();
      res.json({ success: true, username: username.trim(), email: email.trim().toLowerCase() });
    });
});

// Change password
app.post('/api/auth/change-password', requireLogin, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Old and new passwords are required.' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  db.get('SELECT * FROM users WHERE id = ?', [req.session.user.id], async (err, user) => {
    if (err || !user) return res.status(500).json({ error: 'Server error.' });
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hash, user.id], (err) => {
      if (err) return res.status(500).json({ error: 'Server error.' });
      res.json({ success: true });
    });
  });
});

// ═══════════════════════════════════════════
// PRODUCT API ROUTES (admin routes protected)
// ═══════════════════════════════════════════

// GET all active products (optionally filter by category)
app.get('/api/products', (req, res) => {
  const { category } = req.query;
  let query = "SELECT * FROM products WHERE active = 1";
  const params = [];
  if (category) { query += " AND category = ?"; params.push(category); }
  db.all(query, params, (err, rows) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json(rows);
  });
});

// GET all products for admin (including inactive) — admin only
app.get('/api/admin/products', requireAdmin, (req, res) => {
  db.all("SELECT * FROM products ORDER BY category, name", [], (err, rows) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json(rows);
  });
});

// PATCH toggle active — admin only
app.patch('/api/products/:id/toggle', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run("UPDATE products SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?", [id], function(err) {
    if (err) { res.status(500).json({ error: err.message }); return; }
    db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
      if (err) { res.status(500).json({ error: err.message }); return; }
      res.json(row);
    });
  });
});

// DELETE product — admin only
app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM products WHERE id = ?", [id], function(err) {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ success: true, deleted: id });
  });
});

// PATCH update product variants — admin only (KEPT FROM SERVER1)
app.patch('/api/products/:id/variants', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { variants } = req.body; // Expects JSON string or null
  
  const query = `UPDATE products SET variants = ? WHERE id = ?`;
  db.run(query, [variants, id], function(err) {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ success: true, id, variants });
  });
});

// POST add a new product — admin only (KEPT FROM SERVER1)
app.post('/api/products', requireAdmin, upload.single('image'), (req, res) => {
  const { name, price, description, featured, category, variants } = req.body;
  if (!name || (!price && !variants)) return res.status(400).json({ error: "Name and price or variants are required." });

  let imageUrl = req.body.imageUrl || '';
  if (req.file) imageUrl = '/images/products/' + req.file.filename;

  const insertQuery = `INSERT INTO products (nameKey, name, price, image, description, featured, active, category, variants) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`;
  db.run(insertQuery, [null, name, price || null, imageUrl, description || '', featured === '1' ? 1 : 0, category || 'savories', variants || null], function(err) {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ id: this.lastID, name, price, image: imageUrl, description, featured: featured === '1' ? 1 : 0, active: 1, category: category || 'savories', variants });
  });
});

// ── Root ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ═══════════════════════════════════════════
//   ORDERS API
// ═══════════════════════════════════════════

function generateOrderNumber() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

app.post('/api/orders', (req, res) => {
  const { items, total, name, email, phone, address, lat, lng, paymentMethod } = req.body;
  const userId = req.session.user ? req.session.user.id : null;
  const orderNumber = generateOrderNumber();

  if (!items || !total || !address || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required order details.' });
  }

  const query = `INSERT INTO orders (order_number, user_id, items, total, customer_name, customer_email, customer_phone, address, lat, lng, payment_method) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [orderNumber, userId, JSON.stringify(items), total, name, email, phone, address, lat, lng, paymentMethod];

  db.run(query, params, function(err) {
    if (err) {
      console.error("Order error:", err);
      // If it's a conflict (rare with 8-digits), try once more
      if(err.code === 'SQLITE_CONSTRAINT') {
         const newNum = generateOrderNumber();
         db.run(query, [newNum, ...params.slice(1)], function(err2) {
           if(err2) return res.status(500).json({ error: 'Failed to place order.' });
           res.json({ success: true, orderId: this.lastID, orderNumber: newNum });
         });
         return;
      }
      return res.status(500).json({ error: 'Failed to place order.' });
    }
    res.json({ success: true, orderId: this.lastID, orderNumber });
  });
});

app.get('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  db.get('SELECT status, order_number FROM orders WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Order not found.' });
    res.json(row);
  });
});

app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if(!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to update status.' });
    res.json({ success: true });
  });
});

app.get('/api/orders/me', requireLogin, (req, res) => {
  const userId = req.session.user.id;
  db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error.' });
    res.json(rows);
  });
});

app.get('/api/orders', requireAdmin, (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error.' });
    res.json(rows);
  });
});

// Added network binding for Render from server2
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is live on port ${PORT}`);
});