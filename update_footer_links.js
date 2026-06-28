const fs = require('fs');
const path = require('path');

function updateFooters(dir, isRoot) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        updateFooters(fullPath, false);
      }
    } else if (fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const prefix = isRoot ? '' : '../';
      
      // Update Contact, FAQs, Privacy Policy, Terms of Service
      content = content.replace(/href="#"([^>]*data-i18n="nav.contact")/g, `href="${prefix}contact.html"$1`);
      content = content.replace(/href="#"([^>]*data-i18n="nav.faq")/g, `href="${prefix}faq.html"$1`);
      content = content.replace(/href="#"([^>]*data-i18n="nav.privacy")/g, `href="${prefix}privacy.html"$1`);
      content = content.replace(/href="#"([^>]*data-i18n="nav.terms")/g, `href="${prefix}terms.html"$1`);
      
      // Inject Blog link before Contact Us (Wait, Blog fits better under "Links", but let's just append it to the "Help" section if we can't find Links easily, or just before Offers).
      // Actually, we already added "About Us" and "Catering & Occasions" in "Links". We can add Blog there too.
      if (!content.includes('Blog</a>')) {
        const cateringLinkRegex = /(<a href="[^"]*catering\.html"[^>]*>Catering & Occasions<\/a><\/li>)/;
        if (cateringLinkRegex.test(content)) {
          content = content.replace(cateringLinkRegex, `$1\n            <li><a href="${prefix}blog.html" style="color:#ccc; font-size:0.85rem;">Blog</a></li>`);
        }
      }

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated footers in ${fullPath}`);
    }
  }
}

updateFooters('.', true);
