const fs = require('fs');
const path = require('path');

// Sourced from menu.html which contains the clean layout (no keywords, centered footers, etc.)
const baseContent = fs.readFileSync('menu.html', 'utf8');

const multiLocationSchema = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Bakery",
        "@id": "https://www.catharei.com/#salwaroad",
        "name": "CATHAREi Bakery & Sweets - Salwa Road",
        "url": "https://www.catharei.com",
        "telephone": "+97450942255",
        "priceRange": "$$",
        "image": "https://www.catharei.com/images/salwa-storefront.jpg",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Building 384, Street 340 (Salwa Road), Al Waab / Al Aziziya",
          "addressLocality": "Doha",
          "addressCountry": "QA"
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "06:00",
          "closes": "23:00"
        }
      },
      {
        "@type": "Bakery",
        "@id": "https://www.catharei.com/#alwakrah",
        "name": "CATHAREi Bakery & Sweets - Al Wakrah",
        "url": "https://www.catharei.com",
        "telephone": "+97440075555",
        "priceRange": "$$",
        "image": "https://www.catharei.com/images/wakrah-storefront.jpg",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Al Wakra Main St",
          "addressLocality": "Al Wakrah",
          "addressCountry": "QA"
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "07:00",
          "closes": "23:00"
        }
      },
      {
        "@type": "Bakery",
        "@id": "https://www.catharei.com/#alkharaitiyat",
        "name": "CATHAREi Bakery & Sweets - Al Kharaitiyat",
        "url": "https://www.catharei.com",
        "telephone": "+97455392255",
        "priceRange": "$$",
        "image": "https://www.catharei.com/images/kharaitiyat-storefront.jpg",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Al Kharaitiyat Commercial Street, Zone 71",
          "addressLocality": "Al Kharaitiyat Area",
          "addressCountry": "QA"
        },
        "hasMap": "https://share.google/otBX5VPPoHUPctZgy",
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "07:00",
          "closes": "23:00"
        }
      }
    ]
  }
  </script>

  <!-- Organization Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CATHAREI",
    "alternateName": ["CATHAREi Bakery", "كاثاري"],
    "url": "https://www.catharei.com",
    "logo": "https://www.catharei.com/images/misc/Catharei_logo.webp",
    "description": "Doha's finest Arabic bakery, specializing in handcrafted Baklava, Baklava, Maamoul, and bespoke custom cakes.",
    "foundingLocation": "Doha, Qatar",
    "areaServed": [
      {"@type": "City", "name": "Doha"},
      {"@type": "City", "name": "Al Wakrah"},
      {"@type": "City", "name": "Umm Salal"}
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+974-5094-2255",
      "contactType": "customer service",
      "availableLanguage": ["English", "Arabic"]
    },
    "sameAs": [
      "https://www.instagram.com/catharei_bakery_sweets/",
      "https://www.talabat.com/qatar/catharei-bakery-and-sweets",
      "https://snoonu.com/restaurants/catharei-bakery-and-sweets"
    ]
  }
  </script>
`;

function createPage(filename, title, description, heading, bodyHtml, extraSchema = '') {
  let content = baseContent;
  
  // Replace title exactly
  content = content.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  
  // Replace description meta tag
  const descRegex = /<meta\s+name=["']description["']\s+content=["'][\s\S]*?["']\s*\/?>/i;
  content = content.replace(descRegex, `<meta name="description" content="${description}">`);

  // Remove keywords if they exist in the template
  const keywordsRegex = /<meta\s+name=["']keywords["']\s+content=["'][\s\S]*?["']\s*\/?>\s*/gi;
  content = content.replace(keywordsRegex, '');

  // Inject schema block
  if (extraSchema) {
    content = content.replace('</head>', `${extraSchema}\n</head>`);
  }

  // Update canonical link in the page
  const canonicalUrl = `https://www.catharei.com/${filename}`;
  content = content.replace(/<link\s+rel=["']canonical["']\s+href=["'][\s\S]*?["']\s*\/?>/i, `<link rel="canonical" href="${canonicalUrl}">`);

  // Update alternate links
  content = content.replace(/href=["']https:\/\/catharei.com\/menu.html\?lang=en["']/g, `href="${canonicalUrl}?lang=en"`);
  content = content.replace(/href=["']https:\/\/catharei.com\/menu.html\?lang=ar["']/g, `href="${canonicalUrl}?lang=ar"`);
  content = content.replace(/href=["']https:\/\/catharei.com\/menu.html["']/g, `href="${canonicalUrl}"`);

  // Replace <main> block
  const newMain = `
  <main class="menu-page">
    <section class="menu-hero" style="background: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.9)), url('${filename.startsWith('blog/') ? '../' : ''}images/hero/hero-sweets.webp') center/cover;">
      <div class="container" style="text-align: center;">
        <h1 style="font-family: var(--font-serif); font-size: 3rem; color: var(--color-accent); margin-bottom: 20px;">${heading}</h1>
      </div>
    </section>

    <div class="container" style="max-width: 800px; margin: 60px auto; padding: 0 20px; line-height: 1.8; font-size: 1.1rem; color: #ccc;">
      ${bodyHtml}
    </div>
  </main>
  `;
  
  content = content.replace(/<main[\s\S]*?<\/main>/i, newMain);
  
  // Remove menu-specific init script
  content = content.replace(/<script>\s*async function initMenu[\s\S]*?initMenu\(\);\s*<\/script>/i, '');
  
  // If it's in the blog folder, fix paths
  if (filename.startsWith('blog/')) {
    content = content.replace(/href="([^"h]*.css.*)"/g, 'href="../$1"');
    content = content.replace(/src="([^"h]*images.*)"/g, 'src="../$1"');
    content = content.replace(/src="([^"h]*script.js)"/g, 'src="../$1"');
    content = content.replace(/href="navigation\//g, 'href="../navigation/');
    content = content.replace(/href="menu.html"/g, 'href="../menu.html"');
    content = content.replace(/href="index.html"/g, 'href="../index.html"');
    content = content.replace(/href="about.html"/g, 'href="../about.html"');
    content = content.replace(/href="catering.html"/g, 'href="../catering.html"');
  }

  const fullPath = path.join(__dirname, filename);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created ${filename}`);
}

// 1. Generate contact.html
createPage(
  'contact.html',
  'Contact Us - Locations, Phone & Email | CATHAREI',
  'Contact CATHAREI Bakery. Visit our boutiques on Salwa Road, Al Wakrah, and Al Kharaitiyat, or get in touch for custom cake ordering and VIP catering.',
  'Contact Us',
  `
    <p>We would love to hear from you. For orders, catering inquiries, or general questions, please reach out to our team in Doha.</p>
    <ul style="list-style: none; padding: 0; margin-top: 30px;">
      <li style="margin-bottom: 15px;"><strong>Email:</strong> info@catharei.com</li>
      <li style="margin-bottom: 15px;"><strong>Phone:</strong> +974 5094 2255</li>
      <li style="margin-bottom: 15px;"><strong>Address:</strong> Al Aziziya, Salwa Rd, Doha, Qatar</li>
    </ul>
  `,
  multiLocationSchema
);

// 2. Generate faq.html
createPage(
  'faq.html',
  'Frequently Asked Questions | CATHAREI',
  'Find answers to common questions about ordering, custom wedding/birthday cakes, delivery coverage, and Arabic sweet gifting trays from CATHAREI.',
  'FAQ',
  `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [{
        "@type": "Question",
        "name": "Do you offer delivery in Doha?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we offer fast and reliable delivery across Doha and surrounding areas, including Al Wakrah and Umm Salal."
        }
      }, {
        "@type": "Question",
        "name": "Do you customize cakes for weddings?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! We specialize in custom cakes for weddings, birthdays, and corporate events."
        }
      }]
    }
    </script>
    <h3 style="color:var(--color-accent); font-family:var(--font-serif);">Do you offer delivery in Doha?</h3>
    <p style="margin-bottom: 25px;">Yes, we offer fast and reliable delivery across Doha and surrounding areas, including Al Wakrah and Umm Salal.</p>
    <h3 style="color:var(--color-accent); font-family:var(--font-serif);">Do you customize cakes for weddings?</h3>
    <p style="margin-bottom: 25px;">Absolutely! We specialize in custom cakes for weddings, birthdays, and corporate events.</p>
  `
);

// 3. Generate privacy.html
createPage(
  'privacy.html',
  'Privacy Policy | CATHAREI',
  'Read the privacy policy of CATHAREI Bakery & Sweets to understand how we collect, protect, and handle your personal data.',
  'Privacy Policy',
  `
    <p>Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website or services.</p>
    <p>We do not share your personal information with third parties without your consent.</p>
  `
);

// 4. Generate terms.html
createPage(
  'terms.html',
  'Terms of Service | CATHAREI',
  'Read CATHAREI Bakery\'s terms of service regarding ordering policies, custom design changes, and delivery terms.',
  'Terms of Service',
  `
    <p>By accessing or using CATHAREI Bakery's website, you agree to be bound by these Terms of Service. All orders are subject to availability and confirmation.</p>
  `
);

// 5. Generate blog.html (base template file that dynamic server routes parse and extend)
createPage(
  'blog.html',
  'Arabic Sweets Blog: Recipes, Gifting & Guides | CATHAREI',
  'Read our premium blog for insights into traditional Qatari recipes, the history of Luqaimat, and elegant Arabic sweet corporate gifting guides.',
  'CATHAREi Bakery Blog',
  `
    <p>Welcome to the CATHAREi Bakery blog. Read about the history, culture, and artistry behind our premium Arabic sweets.</p>
    <div style="margin-top: 40px;">
      <article style="background: #111; padding: 20px; border-radius: 8px; border: 1px solid var(--color-accent); margin-bottom: 20px;">
        <h3 style="font-family: var(--font-serif); margin-bottom: 10px;"><a href="blog/history-of-luqaimat.html" style="color: #fff;">The Sweet History of Luqaimat: A Qatari Tradition</a></h3>
        <p style="font-size: 0.95rem;">Discover the rich origins of the beloved golden, crispy dough balls soaked in date syrup.</p>
      </article>
      <article style="background: #111; padding: 20px; border-radius: 8px; border: 1px solid var(--color-accent); margin-bottom: 20px;">
        <h3 style="font-family: var(--font-serif); margin-bottom: 10px;"><a href="blog/best-arabic-sweets-gifting.html" style="color: #fff;">The Ultimate Guide to Arabic Sweets for Corporate Gifting</a></h3>
        <p style="font-size: 0.95rem;">Why premium Baklava and Maamoul are the perfect gifts for any professional occasion.</p>
      </article>
    </div>
  `
);
