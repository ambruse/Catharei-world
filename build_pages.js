const fs = require('fs');

const aboutContent = `
  <main class="menu-page">
    <section class="menu-hero" style="background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('images/hero/hero-sweets.webp') center/cover;">
      <div class="container" style="text-align: center;">
        <h1 style="font-family: var(--font-serif); font-size: 3rem; color: var(--color-accent); margin-bottom: 20px;">Our Story</h1>
        <p style="font-size: 1.2rem; color: #fff; max-width: 600px; margin: 0 auto;">A Celebration of Culture, Hospitality, and Timeless Heritage</p>
      </div>
    </section>

    <div class="container" style="max-width: 800px; margin: 60px auto; padding: 0 20px; line-height: 1.8; font-size: 1.1rem; color: #ccc;">
      <h2 style="font-family: var(--font-serif); color: var(--color-accent); font-size: 2rem; margin-bottom: 30px; text-align: center;">Welcome to Catharei</h2>
      <p style="margin-bottom: 20px;">At Catharei, we believe that traditional Arabic desserts are more than just food—they are a celebration of culture, hospitality, and timeless heritage. As a premier Arabic bakery, we take pride in serving an exquisite selection of freshly baked delicacies, from savory staples like traditional Ka'ak bread and freshly baked pita bread to perfectly spiced Manakish Zaatar and cheese.</p>
      
      <p style="margin-bottom: 20px;">For those with a sweet tooth, our pastry chefs specialize in authentic, heavy-hitting classics. We are renowned for our signature cheese Kunafa / Knafeh, standard-setting pistachio Baklava, melts-in-your-mouth Maamoul cookies with dates, and rich Basbousa.</p>

      <p style="margin-bottom: 40px;">Whether you are looking for a casual weekend treat or searching for a "Middle Eastern dessert shop open now," Catharei guarantees an unparalleled premium experience.</p>
      
      <div style="text-align: center;">
        <a href="menu.html" class="btn btn-primary" style="font-size: 1.1rem; padding: 15px 40px;">Explore Our Menu</a>
      </div>
    </div>
  </main>
`;

const cateringContent = `
  <main class="menu-page">
    <section class="menu-hero" style="background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('images/hero/hero-cakes.webp') center/cover;">
      <div class="container" style="text-align: center;">
        <h1 style="font-family: var(--font-serif); font-size: 3rem; color: var(--color-accent); margin-bottom: 20px;">Catering & Occasions</h1>
        <p style="font-size: 1.2rem; color: #fff; max-width: 600px; margin: 0 auto;">Elevate Your Events with Catharei Luxury Dessert Catering</p>
      </div>
    </section>

    <div class="container" style="max-width: 800px; margin: 60px auto; padding: 0 20px; line-height: 1.8; font-size: 1.1rem; color: #ccc;">
      <h2 style="font-family: var(--font-serif); color: var(--color-accent); font-size: 2rem; margin-bottom: 30px; text-align: center;">Premium Catering for All Occasions</h2>
      <p style="margin-bottom: 20px;">Make your next celebration unforgettable with the finest Middle Eastern dessert tables from Catharei. We specialize in premium catering for all occasions—offering beautifully curated Ramadan sweets boxes, bespoke Eid dessert catering, luxury Iftar dessert platters, and stunning corporate gifting options.</p>
      
      <p style="margin-bottom: 40px;">From fresh, hot-delivered cheese Kunafa to elegantly packaged Arabic sweets gift boxes, our artisanal pastries add a touch of sophisticated tradition to weddings, family gatherings, and corporate events.</p>

      <div style="text-align: center; background: #111; padding: 40px; border-radius: 12px; border: 1px solid var(--color-accent);">
        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 15px; color: #fff;">Contact Us to Customize Your Order</h3>
        <p style="margin-bottom: 25px; font-size: 1rem;">Let us design the perfect premium dessert box delivery for your next event.</p>
        <a href="mailto:info@catharei.com" class="btn btn-outline" style="font-size: 1.1rem; padding: 15px 40px;">Email Us Now</a>
      </div>
    </div>
  </main>
`;

function replaceMain(filePath, newMain, title) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Replace <title>
  content = content.replace(/<title>.*?<\/title>/, `<title>${title} | CATHAREi Bakery</title>`);
  
  // Replace everything between <main...> and </main> with newMain
  content = content.replace(/<main[\s\S]*?<\/main>/, newMain);

  // Remove the <script> block for initMenu since these are static pages
  content = content.replace(/<script>\s*async function initMenu[\s\S]*?initMenu\(\);\s*<\/script>/, '');

  fs.writeFileSync(filePath, content, 'utf8');
}

replaceMain('about.html', aboutContent, 'Our Story');
replaceMain('catering.html', cateringContent, 'Catering & Occasions');
