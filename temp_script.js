
    async function initMenu() {
      const container = document.getElementById('menu-content');
      container.innerHTML = Array(3).fill('<div class="skeleton" style="height:300px; margin-bottom:40px; border-radius:8px;"></div>').join('');

      const res = await fetch('/api/products');
      const products = await res.json();
      
      const categories = [
        { id: 'savories', label: 'Savouries', i18n: 'cat.savories' },
        { id: 'arabic_sweets', label: 'Arabic Sweets', i18n: 'cat.arabic' },
        { id: 'oriental_sweets', label: 'Oriental Sweets', i18n: 'cat.oriental' },
        { id: 'special', label: 'Special Selection', i18n: 'cat.specialDes' },
        { id: 'cakes', label: 'Traditional Cakes', i18n: 'cat.cakesPlain' },
        { id: 'special_cakes', label: 'Special Occasion Cakes', i18n: 'cat.specialCake' },
        { id: 'customized_cakes', label: 'Custom Creations', i18n: 'cat.customCake' }
      ];

      container.innerHTML = '';

      categories.forEach(cat => {
        let catProducts = products.filter(p => p.category === cat.id);
        if (catProducts.length === 0) return;

        // Sort catProducts alphabetically by name
        catProducts.sort((a, b) => a.name.localeCompare(b.name));

        const section = document.createElement('section');
        section.className = 'category-section';
        section.id = cat.id;
        
        section.innerHTML = `
          <div class="category-header">
            <h2 data-i18n="${cat.i18n}">${translations[currentLang]?.[cat.i18n] || cat.label}</h2>
            <div class="line"></div>
          </div>
          <div class="menu-grid">
            ${catProducts.map(p => {
              // Handle pricing: showing specific variants if they exist
              let priceHTML = `QR ${parseFloat(p.price).toFixed(2)}`;
              if (p.variants) {
                try {
                  const variants = JSON.parse(p.variants);
                  const disabled = variants._disabled || [];
                  const allSizes = ['small', 'medium', 'large'];
                  
                  const activeVariants = allSizes
                    .filter(s => variants[s] !== undefined && !disabled.includes(s))
                    .map(s => {
                      const name = s.charAt(0).toUpperCase() + s.slice(1);
                      return `${name}: ${variants[s]}`;
                    });

                  if (activeVariants.length > 0) {
                    priceHTML = `<span style="font-size:0.8rem; font-weight:600;">${activeVariants.join(', ')}</span>`;
                  }
                } catch (e) { console.error("Error parsing variants", e); }
              }

              // Handle Arabic names dynamically
              let titleText = p.name;
              let descriptionText = p.description || '';
              if (currentLang === 'ar') {
                 if (p.name_ar) titleText = p.name_ar;
                 if (p.description_ar) descriptionText = p.description_ar;
              }

              return `
                <div class="menu-item">
                  <img loading="lazy" src="${p.image || 'https://via.placeholder.com/400x300?text='+p.name}" class="menu-item-img" alt="${titleText}">
                  <div class="menu-item-info">
                    <div class="menu-item-name">${titleText}</div>
                    <div class="menu-item-price">${priceHTML}</div>
                    <div class="menu-item-desc">${descriptionText}</div>
                    <button class="btn btn-primary add-to-cart" style="width:100%; margin-top:15px; padding:8px; font-size:0.8rem;" 
                      onclick="addToCart(event, '${p.id}', '${p.name.replace(/'/g, "\\\\'")}', ${p.price || 0}, '${(p.image || '').replace(/'/g, "\\\\'")}', '${(typeof p.variants === 'string' ? p.variants : JSON.stringify(p.variants) || '').replace(/'/g, "\\\\'").replace(/"/g, '&quot;')}')" 
                      data-i18n="btn.addCart">Add to Cart</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
        container.appendChild(section);
      });
    }

    // Reuse details from script.js if available, or just mock for now
    function showProductDetails(id) {
       // This will trigger the global product modal if integrated
       console.log("Showing details for product", id);
    }

    initMenu();
  