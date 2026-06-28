const fs = require('fs');
const path = require('path');

const baseContent = fs.readFileSync('menu.html', 'utf8');

function createPage(filename, title, heading, bodyHtml) {
  let content = baseContent;
  
  // Replace title
  content = content.replace(/<title>.*?<\/title>/, `<title>${title} | CATHAREi Bakery</title>`);
  
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
  
  content = content.replace(/<main[\s\S]*?<\/main>/, newMain);
  content = content.replace(/<script>\s*async function initMenu[\s\S]*?initMenu\(\);\s*<\/script>/, '');
  
  // If it's in the blog folder, we must fix all relative paths for css/images
  if (filename.startsWith('blog/')) {
    content = content.replace(/href="([^"h]*.css.*)"/g, 'href="../$1"');
    content = content.replace(/src="([^"h]*images.*)"/g, 'src="../$1"');
    content = content.replace(/src="([^"h]*script.js)"/g, 'src="../$1"');
    // Also fix navigation links to go up a dir
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

createPage('contact.html', 'Contact Us', 'Contact Us', `
  <p>We would love to hear from you. For orders, catering inquiries, or general questions, please reach out to our team in Doha.</p>
  <ul style="list-style: none; padding: 0; margin-top: 30px;">
    <li style="margin-bottom: 15px;"><strong>Email:</strong> info@catharei.com</li>
    <li style="margin-bottom: 15px;"><strong>Phone:</strong> +974 5094 2255</li>
    <li style="margin-bottom: 15px;"><strong>Address:</strong> Al Aziziya, Salwa Rd, Doha, Qatar</li>
  </ul>
`);

createPage('faq.html', 'Frequently Asked Questions', 'FAQ', `
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
`);

createPage('privacy.html', 'Privacy Policy', 'Privacy Policy', `
  <p>Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website or services.</p>
  <p>We do not share your personal information with third parties without your consent.</p>
`);

createPage('terms.html', 'Terms of Service', 'Terms of Service', `
  <p>By accessing or using CATHAREi Bakery's website, you agree to be bound by these Terms of Service. All orders are subject to availability and confirmation.</p>
`);

createPage('blog.html', 'CATHAREi Blog', 'CATHAREi Bakery Blog', `
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
`);

createPage('blog/history-of-luqaimat.html', 'History of Luqaimat', 'The Sweet History of Luqaimat', `
  <p>Luqaimat, meaning "bite-sized" in Arabic, is arguably the most famous and beloved traditional dessert in Qatar and the Gulf region, especially during the holy month of Ramadan.</p>
  <p>These crispy, golden dough balls are famously crunchy on the outside, incredibly airy on the inside, and completely drenched in rich date syrup (dibs) or honey. But where did this sweet tradition originate?</p>
  <p>The origins of Luqaimat can be traced back to early Arabic literature. Similar recipes were mentioned in medieval cookbooks, often referred to as 'Luqmat al-Qadi' or 'The Judge's Bite,' due to their irresistible taste that could supposedly sway a judge's ruling.</p>
  <p>At CATHAREi Bakery in Doha, we honor this timeless recipe by using premium saffron and cardamom in our dough, deep-frying them to perfection, and serving them hot. Come try the best Luqaimat in Qatar today!</p>
`);

createPage('blog/best-arabic-sweets-gifting.html', 'Arabic Sweets Gifting Guide', 'Arabic Sweets for Corporate Gifting', `
  <p>When it comes to corporate gifting in Doha, nothing conveys respect, hospitality, and appreciation quite like a luxury box of premium Arabic sweets.</p>
  <p>Whether you are thanking a loyal client, celebrating a company milestone, or sending Eid greetings, traditional desserts like Pistachio Baklava and Maamoul are universally loved.</p>
  <p>At CATHAREi Bakery, our beautifully curated sweet boxes are designed to leave a lasting impression. With rich flavors, intricate craftsmanship, and elegant packaging, they represent the pinnacle of Middle Eastern culinary heritage.</p>
`);
