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
const SHOWCASE_UPLOAD_DIR = path.join(DATA_DIR, 'images', 'showcase');

// ── Directory Initialization (Updated from server2) ──
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(SHOWCASE_UPLOAD_DIR)) {
    fs.mkdirSync(SHOWCASE_UPLOAD_DIR, { recursive: true });
}

// ── Trust Proxy (Required for secure cookies on Render) ──
if (IS_RENDER) {
  app.set('trust proxy', 1); 
}

// ── Session Configuration (Updated from server2) ──
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365; // 1 year — for persistent admin sessions
const EIGHT_HOURS_MS = 1000 * 60 * 60 * 8;      // 8 hours — for regular user sessions

app.use(session({
  store: new SQLiteStore({
      db: 'sessions.sqlite',
      dir: DATA_DIR // Save user sessions to the persistent disk
  }),
  secret: 'catharei_super_secret_session_key_2026',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Refresh cookie expiry on every request
  cookie: {
    httpOnly: true,
    secure: IS_RENDER, // set to true in production with HTTPS
    sameSite: 'lax',
    maxAge: EIGHT_HOURS_MS // Default; overridden to 1 year for admin on login
  }
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const host = req.headers.host || '';
  const proto = req.headers['x-forwarded-proto'];
  const isProd = IS_RENDER || process.env.NODE_ENV === 'production';
  
  if (isProd && (!host.startsWith('www.') || proto === 'http')) {
    const targetHost = host.startsWith('www.') ? host : `www.${host}`;
    return res.redirect(301, `https://${targetHost}${req.url}`);
  }
  next();
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ── SEO 301 Redirects — Legacy URL cleanup ──
// Maps legacy query-param and old paths to canonical clean URLs
const SEO_REDIRECTS = {
  // Homepage ?lang= params
  '/?lang=en': '/',
  '/?lang=ar': '/',
  '/?lang=en-QA': '/',
  '/?lang=ar-QA': '/',
  // Menu
  '/menu.html?lang=en': '/menu.html',
  '/menu.html?lang=ar': '/menu.html',
  // FAQ
  '/faq.html?lang=en': '/faq.html',
  '/faq.html?lang=ar': '/faq.html',
  // Location pages — old ?lang= params
  '/locations/al-wakrah.html?lang=en': '/locations/al-wakrah.html',
  '/locations/al-wakrah.html?lang=ar': '/locations/al-wakrah.html',
  '/locations/al-aziziya.html?lang=en': '/locations/al-aziziya.html',
  '/locations/al-aziziya.html?lang=ar': '/locations/al-aziziya.html',
  '/locations/al-kharaitiyat.html?lang=en': '/locations/al-kharaitiyat.html',
  '/locations/al-kharaitiyat.html?lang=ar': '/locations/al-kharaitiyat.html',
  // Navigation category ?lang= params
  '/navigation/Arabic_sweets.html?lang=en': '/navigation/Arabic_sweets.html',
  '/navigation/Arabic_sweets.html?lang=ar': '/navigation/Arabic_sweets.html',
  '/navigation/customized_cakes.html?lang=en': '/navigation/customized_cakes.html',
  '/navigation/customized_cakes.html?lang=ar': '/navigation/customized_cakes.html',
  '/navigation/cakes.html?lang=en': '/navigation/cakes.html',
  '/navigation/cakes.html?lang=ar': '/navigation/cakes.html',
  '/navigation/savories.html?lang=en': '/navigation/savories.html',
  '/navigation/savories.html?lang=ar': '/navigation/savories.html',
  // About, Catering, Contact
  '/about.html?lang=en': '/about.html',
  '/about.html?lang=ar': '/about.html',
  '/catering.html?lang=en': '/catering.html',
  '/catering.html?lang=ar': '/catering.html',
  '/contact.html?lang=en': '/contact.html',
  '/contact.html?lang=ar': '/contact.html',
};

app.use((req, res, next) => {
  // Check full path+query against redirect table
  const qStr = Object.keys(req.query).length
    ? '?' + new URLSearchParams(req.query).toString()
    : '';
  const fullPath = req.path + qStr;

  if (SEO_REDIRECTS[fullPath]) {
    return res.redirect(301, SEO_REDIRECTS[fullPath]);
  }

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

// ── Serve Images & Showcase Media from Persistent Disk ──
app.use('/images/products', express.static(UPLOAD_DIR));
app.use('/images/showcase', express.static(SHOWCASE_UPLOAD_DIR));

// ── Dynamic Blog System ──
// Redirect old legacy static paths first
app.get('/blog.html', (req, res) => {
  res.redirect(301, '/blog');
});
app.get('/blog/history-of-luqaimat.html', (req, res) => {
  res.redirect(301, '/blog/history-of-luqaimat');
});
app.get('/blog/best-arabic-sweets-gifting.html', (req, res) => {
  res.redirect(301, '/blog/best-arabic-sweets-gifting');
});

// Dynamic Blog Feed / Directory
app.get('/blog', (req, res) => {
  try {
    const posts = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts.json'), 'utf8'));
    let blogTemplate = fs.readFileSync(path.join(__dirname, 'blog.html'), 'utf8');

    const postsHtml = posts.map(post => `
      <article style="background: #111; padding: 25px; border-radius: 8px; border: 1px solid var(--color-accent); margin-bottom: 30px; display: flex; flex-direction: column; gap: 15px;">
        <div style="background: url('${post.cover}') center center / cover; height: 200px; border-radius: 6px;"></div>
        <div>
          <h3 style="font-family: var(--font-serif); margin-bottom: 8px; font-size: 1.5rem;">
            <a href="/blog/${post.slug}" style="color: #fff; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--color-accent)'" onmouseout="this.style.color='#fff'">${post.title}</a>
          </h3>
          <p style="font-size: 0.9rem; color: #888; margin-bottom: 10px;">📅 Published on ${post.date}</p>
          <p style="font-size: 0.95rem; color: #ccc; line-height: 1.6;">${post.desc}</p>
          <a href="/blog/${post.slug}" style="display: inline-block; margin-top: 10px; color: var(--color-accent); font-weight: 600; text-decoration: underline; font-size: 0.95rem;">Read Full Post &rarr;</a>
        </div>
      </article>
    `).join('');

    // Locate and replace the static container in blog.html
    const targetPattern = /<div style="margin-top: 40px;">[\s\S]*?<\/div>\s*<\/div>\s*<\/main>/i;
    
    const newMainSection = `
    <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr; gap: 30px;">
      ${postsHtml}
    </div>
    </div>
    </main>
    `;

    blogTemplate = blogTemplate.replace(targetPattern, newMainSection);
    res.send(blogTemplate);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Dynamic Blog Post Route
app.get('/blog/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const posts = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts.json'), 'utf8'));
    const post = posts.find(p => p.slug === slug);
    if (!post) {
      return res.status(404).send('<h1>Post not found</h1>');
    }

    let blogTemplate = fs.readFileSync(path.join(__dirname, 'blog.html'), 'utf8');

    // Dynamic metadata replacements
    blogTemplate = blogTemplate.replace(/<title>.*?<\/title>/i, `<title>${post.title} | CATHAREI</title>`);
    
    // Description replacements
    const descRegex = /<meta\s+name=["']description["']\s+content=["'][\s\S]*?["']\s*\/?>/i;
    blogTemplate = blogTemplate.replace(descRegex, `<meta name="description" content="${post.desc}">`);
    
    // OpenGraph Title & Description
    blogTemplate = blogTemplate.replace(/<meta\s+property=["']og:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i, `<meta property="og:title" content="${post.title}">`);
    blogTemplate = blogTemplate.replace(/<meta\s+property=["']og:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i, `<meta property="og:description" content="${post.desc}">`);
    
    // OpenGraph URL and Canonical Link
    blogTemplate = blogTemplate.replace(/<meta\s+property=["']og:url["']\s+content=["'][\s\S]*?["']\s*\/?>/i, `<meta property="og:url" content="https://www.catharei.com/blog/${post.slug}">`);
    blogTemplate = blogTemplate.replace(/<link\s+rel=["']canonical["']\s+href=["'][\s\S]*?["']\s*\/?>/i, `<link rel="canonical" href="https://www.catharei.com/blog/${post.slug}">`);

    // Replace alternate links for the post page to point to dynamic slug
    blogTemplate = blogTemplate.replace(/href=["']https:\/\/www\.catharei\.com\/blog\.html\?lang=en["']/g, `href="https://www.catharei.com/blog/${post.slug}?lang=en"`);
    blogTemplate = blogTemplate.replace(/href=["']https:\/\/www\.catharei\.com\/blog\.html\?lang=ar["']/g, `href="https://www.catharei.com/blog/${post.slug}?lang=ar"`);
    blogTemplate = blogTemplate.replace(/href=["']https:\/\/www\.catharei\.com\/blog\.html["']/g, `href="https://www.catharei.com/blog/${post.slug}"`);
    blogTemplate = blogTemplate.replace(/href=["']https:\/\/catharei\.com\/blog\.html\?lang=en["']/g, `href="https://www.catharei.com/blog/${post.slug}?lang=en"`);
    blogTemplate = blogTemplate.replace(/href=["']https:\/\/catharei\.com\/blog\.html\?lang=ar["']/g, `href="https://www.catharei.com/blog/${post.slug}?lang=ar"`);
    blogTemplate = blogTemplate.replace(/href=["']https:\/\/catharei\.com\/blog\.html["']/g, `href="https://www.catharei.com/blog/${post.slug}"`);

    // Dynamic Breadcrumbs & BlogPosting Schema block
    const schemaBlock = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "${post.title}",
      "description": "${post.desc}",
      "image": "https://www.catharei.com/${post.cover}",
      "datePublished": "${post.date}",
      "author": {
        "@type": "Organization",
        "name": "CATHAREI",
        "url": "https://www.catharei.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "CATHAREI",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.catharei.com/images/misc/Catharei_logo.webp"
        }
      },
      "mainEntityOfPage": "https://www.catharei.com/blog/${post.slug}"
    }
    </script>
    `;

    let faqSchema = '';
    if (slug === 'history-of-luqaimat') {
      faqSchema = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Where did Luqaimat originate?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Luqaimat (meaning 'bite-sized morsels' in Arabic) originated in the ancient Arab world and Middle East, tracing back centuries as a staple celebratory dessert during Ramadan, Eid, and family gatherings across Qatar and the Gulf region."
          }
        },
        {
          "@type": "Question",
          "name": "What is Qatari Luqaimat?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Qatari Luqaimat are crisp, golden fried dough balls drizzled with date syrup (Dibs) or honey and sprinkled with sesame seeds or cardamom, served fresh as Qatar's favourite traditional sweet."
          }
        }
      ]
    }
    </script>
      `;
    }

    blogTemplate = blogTemplate.replace('</head>', `${schemaBlock}\n${faqSchema}\n</head>`);

    // Dynamic main section replacement for individual blog post
    const individualPostHtml = `
    <main class="menu-page">
      <section class="menu-hero" style="background: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.9)), url('../${post.cover}') center center / cover;">
        <div class="container" style="text-align: center;">
          <h1 style="font-family: var(--font-serif); font-size: 2.8rem; color: var(--color-accent); margin-bottom: 20px;">${post.title}</h1>
          <p style="font-size: 1rem; color: #fff;">📅 Published on ${post.date}</p>
        </div>
      </section>

      <div class="container" style="max-width: 800px; margin: 60px auto; padding: 0 20px; line-height: 1.8; font-size: 1.1rem; color: #ccc;">
        <div style="margin-bottom: 45px;">
          <a href="/blog" style="color: var(--color-accent); font-weight: 600; text-decoration: none; font-size: 0.95rem;">&larr; Back to Blog Feed</a>
        </div>
        <div class="blog-post-content" style="line-height: 1.9; color: #ddd;">
          ${post.body}
        </div>
      </div>
    </main>
    `;

    blogTemplate = blogTemplate.replace(/<main[\s\S]*?<\/main>/i, individualPostHtml);

    // Adjust relative assets path since this is 1 folder deep (/blog/:slug)
    blogTemplate = blogTemplate.replace(/href="([^"h]*.css.*)"/g, 'href="../$1"');
    blogTemplate = blogTemplate.replace(/src=["'](images\/[^"']*)["']/g, 'src="../$1"');
    blogTemplate = blogTemplate.replace(/src=["'](script.js)["']/g, 'src="../$1"');
    
    // Adjust header and footer relative links to navigate back to root folder
    blogTemplate = blogTemplate.replace(/href=["'](index.html|menu.html|catering.html|about.html|contact.html|faq.html|privacy.html|terms.html)["']/g, 'href="../$1"');
    blogTemplate = blogTemplate.replace(/href=["'](navigation\/[^"']*)["']/g, 'href="../$1"');
    blogTemplate = blogTemplate.replace(/href=["'](locations\/[^"']*)["']/g, 'href="../$1"');

    res.send(blogTemplate);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// ── Static Files (after admin guard & dynamic routes) ──
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

// ── Showcase Media Upload Configuration ──
const showcaseStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SHOWCASE_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'showcase-' + unique + ext);
  }
});
const uploadShowcase = multer({
  storage: showcaseStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for video/image uploads
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.originalname.match(/\.(mp4|webm|mov|ogg|m4v|avi|mkv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
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
    const defaultAdminPass = 'Admin@CATHAREi2026';

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

    // ── Showcase Settings Table ──
    db.run(`
      CREATE TABLE IF NOT EXISTS showcase_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `, (err) => {
      if (!err) {
        db.get("SELECT value FROM showcase_settings WHERE key = 'showcase_config'", (err, row) => {
          if (!err && !row) {
            const defaultShowcaseSettings = {
              enabled: 1,
              trending: {
                enabled: 1,
                badge: "Trending Now",
                title: "Signature Hot Cheese Baklava",
                subtitle: "Freshly Baked & Drizzled with Pure Honey",
                description: "Crispy, golden layers of handmade phyllo pastry stuffed with warm, gooey cheese and soaked in aromatic blossom syrup. Served piping hot for an unmatched sensory experience.",
                videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-chef-plating-a-gourmet-dessert-42795-large.mp4",
                posterUrl: "/images/products/1775115029250-903191392.webp",
                ctaText: "Order Hot Baklava",
                ctaUrl: "navigation/Arabic_sweets.html",
                price: "QR 65.00"
              },
              newArrival: {
                enabled: 1,
                badge: "Just In",
                title: "Royal Pistachio Baklava Box",
                subtitle: "Artisanal Middle Eastern Indulgence",
                description: "Generously layered with freshly ground Antep pistachios, sweet clotted cream, and golden shredded pastry. Beautifully presented in our signature gift box.",
                videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-pouring-syrup-on-a-sweet-pastry-42796-large.mp4",
                posterUrl: "/images/products/1775125327728-831885018.webp",
                ctaText: "Explore Product",
                ctaUrl: "navigation/Arabic_sweets.html",
                price: "QR 95.00"
              }
            };
            db.run("INSERT INTO showcase_settings (key, value) VALUES ('showcase_config', ?)",
              [JSON.stringify(defaultShowcaseSettings)], (err) => {
                if (!err) console.log("✓ Seeded default showcase settings.");
              });
          }
        });
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

      // Admin gets a 1-year persistent cookie so they are never auto-logged-out.
      // The session is stored in sessions.sqlite and survives server/PC restarts.
      // Only an explicit logout will end the admin session.
      if (user.role === 'admin') {
        req.session.cookie.maxAge = ONE_YEAR_MS;
      }

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

// ── CallMeBot Credentials ──
const ADMIN_PHONE       = process.env.ADMIN_PHONE       || '+97450942255';
const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY || '9699041';

/**
 * Sends a WhatsApp message + automated voice call to the store owner
 * via CallMeBot. Runs entirely in the background — never blocks the
 * customer's checkout response and never throws to the caller.
 *
 * @param {string} orderNumber  Human-readable order ID (e.g. "12345678")
 * @param {object} orderData    { name, total, items, address }
 */
async function notifyAdminNewOrder(orderNumber, orderData) {
  try {
    const { name, total, items, address } = orderData;

    // Build a readable item list
    let itemList = '';
    try {
      const parsed = typeof items === 'string' ? JSON.parse(items) : items;
      itemList = Array.isArray(parsed)
        ? parsed.map(i => `${i.name || i.nameKey || 'Item'} x${i.quantity || 1}`).join(', ')
        : String(parsed);
    } catch { itemList = String(items); }

    // ── WhatsApp message (detailed breakdown) ──
    const waText = [
      `🛎️ NEW ORDER #${orderNumber}`,
      `👤 Customer : ${name || 'N/A'}`,
      `📦 Items    : ${itemList}`,
      `💰 Total    : QR ${total}`,
      `📍 Address  : ${address}`,
    ].join('%0A'); // %0A = URL-encoded newline for CallMeBot

    const waUrl = `https://api.callmebot.com/whatsapp.php` +
      `?phone=${encodeURIComponent(ADMIN_PHONE)}` +
      `&text=${waText}` +
      `&apikey=${encodeURIComponent(CALLMEBOT_API_KEY)}`;

    // ── Voice call (short spoken alert) ──
    const callText = encodeURIComponent(
      `Urgent Alert: A new order numbered ${orderNumber} for ${total} Qatari Riyals has just been placed on your website.`
    );
    const callUrl = `https://api.callmebot.com/call.php` +
      `?phone=${encodeURIComponent(ADMIN_PHONE)}` +
      `&text=${callText}` +
      `&apikey=${encodeURIComponent(CALLMEBOT_API_KEY)}`;

    // Fire both concurrently; log individual results without throwing
    const [waResult, callResult] = await Promise.allSettled([
      fetch(waUrl),
      fetch(callUrl),
    ]);

    if (waResult.status === 'fulfilled') {
      console.log(`[Notify] WhatsApp sent for order #${orderNumber} — HTTP ${waResult.value.status}`);
    } else {
      console.error(`[Notify] WhatsApp FAILED for order #${orderNumber}:`, waResult.reason);
    }

    if (callResult.status === 'fulfilled') {
      console.log(`[Notify] Voice call triggered for order #${orderNumber} — HTTP ${callResult.value.status}`);
    } else {
      console.error(`[Notify] Voice call FAILED for order #${orderNumber}:`, callResult.reason);
    }

  } catch (err) {
    // Safety net — notification failure must NEVER affect the customer
    console.error(`[Notify] Unexpected error for order #${orderNumber}:`, err);
  }
}

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
           // Notify admin in background — do not await
           notifyAdminNewOrder(newNum, { name, total, items: JSON.stringify(items), address });
           res.json({ success: true, orderId: this.lastID, orderNumber: newNum });
         });
         return;
      }
      return res.status(500).json({ error: 'Failed to place order.' });
    }
    // Notify admin in background — do not await
    notifyAdminNewOrder(orderNumber, { name, total, items: JSON.stringify(items), address });
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

// ═══════════════════════════════════════════
// SHOWCASE CMS API ROUTES
// ═══════════════════════════════════════════

const defaultShowcaseSettings = {
  enabled: 1,
  trending: {
    enabled: 1,
    badge: "Trending Now",
    title: "Signature Hot Cheese Baklava",
    subtitle: "Freshly Baked & Drizzled with Pure Honey",
    description: "Crispy, golden layers of handmade phyllo pastry stuffed with warm, gooey cheese and soaked in aromatic blossom syrup. Served piping hot for an unmatched sensory experience.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-chef-plating-a-gourmet-dessert-42795-large.mp4",
    posterUrl: "/images/products/1775115029250-903191392.webp",
    ctaText: "Order Hot Baklava",
    ctaUrl: "navigation/Arabic_sweets.html",
    price: "QR 65.00"
  },
  newArrival: {
    enabled: 1,
    badge: "Just In",
    title: "Royal Pistachio Baklava Box",
    subtitle: "Artisanal Middle Eastern Indulgence",
    description: "Generously layered with freshly ground Antep pistachios, sweet clotted cream, and golden shredded pastry. Beautifully presented in our signature gift box.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-pouring-syrup-on-a-sweet-pastry-42796-large.mp4",
    posterUrl: "/images/products/1775125327728-831885018.webp",
    ctaText: "Explore Product",
    ctaUrl: "navigation/Arabic_sweets.html",
    price: "QR 95.00"
  }
};

// GET active showcase config for frontend
app.get('/api/showcase', (req, res) => {
  db.get("SELECT value FROM showcase_settings WHERE key = 'showcase_config'", (err, row) => {
    if (err || !row) return res.json(defaultShowcaseSettings);
    try {
      res.json(JSON.parse(row.value));
    } catch (e) {
      res.json(defaultShowcaseSettings);
    }
  });
});

// GET showcase config for admin
app.get('/api/admin/showcase', requireAdmin, (req, res) => {
  db.get("SELECT value FROM showcase_settings WHERE key = 'showcase_config'", (err, row) => {
    if (err || !row) return res.json(defaultShowcaseSettings);
    try {
      res.json(JSON.parse(row.value));
    } catch (e) {
      res.json(defaultShowcaseSettings);
    }
  });
});

// POST save showcase config from admin
app.post('/api/admin/showcase', requireAdmin, (req, res) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings payload.' });
  }
  db.run("INSERT OR REPLACE INTO showcase_settings (key, value) VALUES ('showcase_config', ?)",
    [JSON.stringify(settings)], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to save showcase settings.' });
      res.json({ success: true, settings });
    });
});

// POST upload showcase media (video/poster image)
app.post('/api/admin/showcase/upload', requireAdmin, uploadShowcase.single('mediaFile'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No media file provided.' });
  const mediaUrl = '/images/showcase/' + req.file.filename;
  res.json({ success: true, url: mediaUrl, mimetype: req.file.mimetype });
});

// Added network binding for Render from server2
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is live on port ${PORT}`);
});