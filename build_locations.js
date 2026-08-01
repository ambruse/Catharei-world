const fs = require('fs');
const path = require('path');

const locations = [
  {
    id: 'al-aziziya',
    name: 'Al Aziziya (Salwa Road)',
    title: 'Best Bakery in Al Aziziya, Salwa Rd | Order Arabic Sweets',
    desc: 'Visit CATHAREi Bakery in Al Aziziya, Salwa Road for the best fresh Arabic sweets, custom cakes, and premium Baklava in Doha.',
    lat: 25.2425559,
    lng: 51.4594252,
    address: 'Building 384, Street 340 (Salwa Road), Al Waab / Al Aziziya, Doha, Qatar',
    phone: '+974 5094 2255',
    plusCode: '6FV5+2Q Doha',
    mapsUrl: 'https://www.google.com/maps/place/Catharei/@25.2427661,51.4571838,17.35z/data=!4m6!3m5!1s0x3e45db0706a6f2b3:0x1aaa8102b449d84d!8m2!3d25.2425559!4d51.4594252!16s%2Fg%2F11fn79k3vx',
    keywords: 'Best Bakery in Qatar, Best Bakery in Doha, Best Arabic Sweets in Doha, Arabic sweets Salwa Road, CATHAREi Bakery Doha, كتري, مخبز كتري, salwa road bakery, traditional Arabic desserts Doha'
  },
  {
    id: 'al-wakrah',
    name: 'Al Wakrah',
    title: 'Best Bakery in Al Wakrah | Order Fresh Arabic Sweets & Cakes',
    desc: 'Visit CATHAREi Bakery in Al Wakrah. Enjoy our famous premium Baklava, Maamoul, and luxury custom cakes available for pickup and delivery.',
    lat: 25.1639112,
    lng: 51.5974203,
    address: 'Al Wakra Main St, Al Wakrah, Qatar',
    phone: '+974 4007 5555',
    plusCode: '5H7W+FW Al Wakrah',
    mapsUrl: 'https://www.google.com/maps/place/Catharei+Wakrah/@25.163916,51.59484,17z/data=!3m1!4b1!4m6!3m5!1s0x3e45cd007ea1c319:0x66da9b23749a18c1!8m2!3d25.1639112!4d51.5974203!16s%2Fg%2F11yp0h_08s',
    keywords: 'Best Bakery in Qatar, Arabic sweets Al Wakrah, bakery Al Wakrah, best arabic sweets in al wakrah, كتري الوكرة, cake shop wakra, cake shop in wakra, custom birthday cakes wakrah'
  },
  {
    id: 'al-kharaitiyat',
    name: 'Al Kharaitiyat',
    title: 'Best Bakery in Al Kharaitiyat | Premium Arabic Sweets Doha',
    desc: 'CATHAREi Bakery in Al Kharaitiyat offers the finest selection of traditional Arabic desserts, oriental pastries, and modern custom cakes.',
    lat: 25.397421,
    lng: 51.425266,
    address: 'Al Kharaitiyat Commercial Street, Zone 71, Al Kharaitiyat, Qatar',
    phone: '+974 5539 2255',
    plusCode: '',
    mapsUrl: 'https://share.google/otBX5VPPoHUPctZgy',
    keywords: 'Best Bakery in Qatar, Arabic sweets Al Kharaitiyat, كتري الخريطيات, كتري للحلويات الخريطيات, Umm Salal bakery, best arabic sweets in al kharaitiyat, bakery near umm salal muhammed'
  }
];

const baseContent = fs.readFileSync('about.html', 'utf8');

function createLocationPage(loc) {
  let content = baseContent;
  
  // Replace Title
  content = content.replace(/<title>.*?<\/title>/, `<title>${loc.title}</title>`);
  
  // Replace Meta Description
  content = content.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${loc.desc}">`);
  
  // Replace Keywords if custom specified
  if (loc.keywords) {
    content = content.replace(/<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i, `<meta name="keywords" content="${loc.keywords}">`);
  }
  
  // Fix Hreflang Tags
  const hreflangRegex = /<link rel="alternate" hreflang="([a-z-]+)" href="[^"]*" \/>/g;
  content = content.replace(hreflangRegex, `<link rel="alternate" hreflang="$1" href="https://www.catharei.com/locations/${loc.id}.html${'$1'==='x-default'?'':'?lang='+'$1'}" />`);

  // Build the specific Branch HTML
  const newMain = `
  <main class="menu-page">
    <section class="menu-hero" style="background: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.9)), url('../images/hero/hero-sweets.webp') center/cover;">
      <div class="container" style="text-align: center;">
        <h1 style="font-family: var(--font-serif); font-size: 3rem; color: var(--color-accent); margin-bottom: 20px;">CATHAREi Bakery - ${loc.name}</h1>
        <p style="font-size: 1.2rem; color: #fff; max-width: 600px; margin: 0 auto;">Available for Pickup and Fast Delivery</p>
      </div>
    </section>

    <div class="container" style="max-width: 1000px; margin: 60px auto; padding: 0 20px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;">
        <div style="line-height: 1.8; font-size: 1.1rem; color: #ccc;">
          <h2 style="font-family: var(--font-serif); color: var(--color-accent); font-size: 2rem; margin-bottom: 20px;">Visit Our ${loc.name} Branch</h2>
          <p style="margin-bottom: 20px;">${loc.desc}</p>
          <ul style="list-style: none; padding: 0; margin-bottom: 30px;">
            <li style="margin-bottom: 15px;"><strong>📍 Address:</strong> ${loc.address}</li>
            ${loc.plusCode ? `<li style="margin-bottom: 15px;"><strong>📍 Plus Code:</strong> ${loc.plusCode}</li>` : ''}
            <li style="margin-bottom: 15px;"><strong>🕒 Hours:</strong> 08:00 AM - 10:00 PM</li>
            <li style="margin-bottom: 15px;"><strong>📞 Phone:</strong> ${loc.phone}</li>
          </ul>
          <a href="${loc.mapsUrl}" target="_blank" class="btn btn-primary" style="font-size: 1.1rem; padding: 15px 40px; margin-right: 15px;">Get Directions</a>
          <a href="../menu.html" class="btn btn-outline" style="font-size: 1.1rem; padding: 15px 40px;">Order Online</a>
        </div>
        <div>
          <iframe 
            width="100%" 
            height="400" 
            style="border:0; border-radius: 12px;" 
            loading="lazy" 
            allowfullscreen 
            src="https://maps.google.com/maps?q=${loc.lat},${loc.lng}&z=15&output=embed">
          </iframe>
        </div>
      </div>
    </div>
  </main>
  `;
  
  content = content.replace(/<main[\s\S]*?<\/main>/, newMain);
  
  // Inject LocalBusiness/Bakery Schema for this specific branch
  const schema = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "name": "CATHAREi Premium Sweets & Bakery - ${loc.name}",
    "image": "https://www.catharei.com/images/background/hero_spread.webp",
    "@id": "https://www.catharei.com/locations/${loc.id}.html",
    "url": "https://www.catharei.com/locations/${loc.id}.html",
    "telephone": "${loc.phone}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "${loc.address}",
      "addressLocality": "Doha",
      "addressRegion": "Doha",
      "addressCountry": "QA"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": ${loc.lat},
      "longitude": ${loc.lng}
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "08:00",
      "closes": "22:00"
    }
  }
  </script>
  `;
  content = content.replace('</head>', `${schema}\n</head>`);

  // Fix relative paths for the subfolder
  content = content.replace(/href="([^"h]*.css.*)"/g, 'href="../$1"');
  content = content.replace(/src="([^"h]*images.*)"/g, 'src="../$1"');
  content = content.replace(/src="([^"h]*script.js)"/g, 'src="../$1"');
  content = content.replace(/href="about.html"/g, 'href="../about.html"');
  content = content.replace(/href="catering.html"/g, 'href="../catering.html"');
  content = content.replace(/href="contact.html"/g, 'href="../contact.html"');
  content = content.replace(/href="faq.html"/g, 'href="../faq.html"');
  content = content.replace(/href="privacy.html"/g, 'href="../privacy.html"');
  content = content.replace(/href="terms.html"/g, 'href="../terms.html"');
  content = content.replace(/href="blog.html"/g, 'href="../blog.html"');
  content = content.replace(/href="index.html"/g, 'href="../index.html"');
  content = content.replace(/href="menu.html"/g, 'href="../menu.html"');
  content = content.replace(/href="navigation\//g, 'href="../navigation/');

  const fullPath = path.join(__dirname, 'locations', `${loc.id}.html`);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created location page: ${loc.id}.html`);
}

locations.forEach(createLocationPage);
