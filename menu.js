(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const categoryMeta = {
    all: { en: 'All creations', ar: 'كل الأصناف', tone: '203, 164, 66', description: 'From delicate Arabic sweets to celebration cakes and savouries, each piece is made to turn sharing into an occasion.' },
    savories: { en: 'Savouries', ar: 'موالح', tone: '203, 164, 66', description: 'Golden, crisp and prepared for generous tables, morning meetings and every gathering in between.' },
    arabic_sweets: { en: 'Arabic sweets', ar: 'حلويات عربية', tone: '218, 168, 69', description: 'Layered pastry, roasted nuts and fragrant syrup—heritage recipes presented with contemporary precision.' },
    oriental_sweets: { en: 'Oriental sweets', ar: 'حلويات شرقية', tone: '184, 139, 72', description: 'A collection shaped by the flavours, textures and rituals of hospitality across the region.' },
    cakes: { en: 'Cakes', ar: 'كيك', tone: '178, 132, 97', description: 'Contemporary cakes with composed layers, elegant finishes and a balance of texture and sweetness.' },
  };

  const fallbackImages = [
    '/images/products/1775115029250-903191392.webp',
    '/images/products/1775125327728-831885018.webp',
    '/images/products/1775125336887-558730937.webp',
    '/images/products/1775138850586-203824645.webp',
    '/images/products/1775146563418-538236780.webp'
  ];

  let products = [];
  let activeCategory = 'all';
  let searchTerm = '';
  let constellationMetrics = [];
  let activeDetail = null;
  let pointerTimer = 0;
  let lastScrollY = window.scrollY;
  let lastScrollTime = performance.now();
  let scrollLean = 0;
  let filterRevision = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isArabic = () => document.documentElement.lang === 'ar';
  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const safeImage = (value, index = 0) => {
    const image = String(value || '');
    if (/^\/images\/[a-zA-Z0-9_ /.-]+\.(webp|png|jpe?g)$/i.test(image)) return image;
    if (/^https:\/\//i.test(image) && !/via\.placeholder\.com/i.test(image)) return image;
    return fallbackImages[index % fallbackImages.length];
  };
  const titleFor = product => isArabic() && product.name_ar ? product.name_ar : product.name;
  const descriptionFor = product => isArabic() && product.description_ar ? product.description_ar : (product.description || 'Handcrafted daily by CATHAREi.');
  const categoryLabel = id => (categoryMeta[id] || categoryMeta.all)[isArabic() ? 'ar' : 'en'];

  function parseVariants(product) {
    if (!product.variants) return null;
    try { return typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants; }
    catch { return null; }
  }

  function priceFor(product) {
    const variants = parseVariants(product);
    if (variants) {
      const disabled = Array.isArray(variants._disabled) ? variants._disabled : [];
      const available = ['small', 'medium', 'large']
        .filter(size => variants[size] !== undefined && !disabled.includes(size))
        .map(size => `${size[0].toUpperCase() + size.slice(1)} ${Number(variants[size]).toFixed(0)}`);
      if (available.length) return `QAR ${available.join(' · ')}`;
    }
    return `QAR ${Number(product.price || 0).toFixed(2)}`;
  }

  function cardTemplate(product, index) {
    const title = titleFor(product);
    const description = descriptionFor(product);
    return `
      <article class="menu-item${index % 4 === 1 ? ' is-break-frame' : ''}" id="product-${escapeHTML(product.id)}" data-product-id="${escapeHTML(product.id)}" data-category="${escapeHTML(product.category)}" tabindex="0" aria-label="Open ${escapeHTML(title)} details">
        <div class="menu-product-media">
          <img loading="${index < 6 ? 'eager' : 'lazy'}" decoding="async" width="560" height="700" src="${escapeHTML(safeImage(product.image, index))}" alt="${escapeHTML(title)}">
        </div>
        <div class="menu-item-info">
          <h3 class="menu-item-name">${escapeHTML(title)}</h3>
          <p class="menu-item-price">${escapeHTML(priceFor(product))}</p>
          <p class="menu-item-desc">${escapeHTML(description)}</p>
          <div class="menu-item-actions">
            <button class="menu-open-button" type="button">View creation</button>
            <button class="menu-add-button" type="button">Add</button>
          </div>
        </div>
      </article>`;
  }

  function buildRail() {
    const track = document.getElementById('category-rail-track');
    const available = ['all', ...new Set(products.map(product => product.category).filter(Boolean))];
    track.innerHTML = available.map((id, index) => `<button class="category-button${index === 0 ? ' is-active' : ''}" type="button" data-category="${escapeHTML(id)}" aria-pressed="${index === 0}">${escapeHTML(categoryLabel(id))}</button>`).join('');
    track.querySelectorAll('.category-button').forEach(button => {
      button.addEventListener('click', () => selectCategory(button.dataset.category, button));
      if (finePointer.matches) addMagnetism(button);
    });
    requestAnimationFrame(() => moveIndicator(track.querySelector('.is-active'), false));
  }

  function renderProducts() {
    const container = document.getElementById('menu-content');
    container.innerHTML = `<div class="menu-grid">${products.map(cardTemplate).join('')}</div>`;
    container.querySelectorAll('.menu-item').forEach((card, index) => {
      const product = products.find(item => String(item.id) === card.dataset.productId);
      card.querySelector('.menu-open-button').addEventListener('click', event => { event.stopPropagation(); openProduct(product, card); });
      card.querySelector('.menu-add-button').addEventListener('click', event => {
        event.stopPropagation();
        const variantsData = typeof product.variants === 'string' ? product.variants : (product.variants ? JSON.stringify(product.variants) : '');
        addToCart(event, String(product.id), product.name, Number(product.price || 0), product.image || '', variantsData);
      });
      card.addEventListener('click', event => { if (!event.target.closest('button')) openProduct(product, card); });
      card.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button')) { event.preventDefault(); openProduct(product, card); } });
      if (finePointer.matches) addDepthWindow(card);
      if (index < 4) card.classList.add('is-constellation-target');
    });
    updateCount(products.length);
  }

  function buildConstellation() {
    const holder = document.getElementById('menu-constellation');
    const featured = products.slice(0, 4);
    holder.innerHTML = featured.map((product, index) => `<button class="constellation-product" type="button" data-product-id="${escapeHTML(product.id)}" aria-label="Explore ${escapeHTML(titleFor(product))}"><img src="${escapeHTML(safeImage(product.image, index))}" alt=""></button>`).join('');
    holder.querySelectorAll('.constellation-product').forEach(node => {
      const product = products.find(item => String(item.id) === node.dataset.productId);
      node.addEventListener('click', () => openProduct(product, document.getElementById(`product-${product.id}`)));
    });
    requestAnimationFrame(measureConstellation);
  }

  function measureConstellation() {
    document.querySelectorAll('.constellation-product').forEach(node => { node.style.transform = ''; node.style.opacity = ''; });
    constellationMetrics = [...document.querySelectorAll('.constellation-product')].map(node => {
      const target = document.querySelector(`#product-${CSS.escape(node.dataset.productId)} .menu-product-media`);
      if (!target) return null;
      const sourceRect = node.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      return { node, dx: targetRect.left - sourceRect.left, dy: (targetRect.top + window.scrollY) - (sourceRect.top + window.scrollY), scale: targetRect.width / sourceRect.width };
    }).filter(Boolean);
    updateConstellation();
  }

  function updateConstellation() {
    if (reducedMotion.matches || !constellationMetrics.length) return;
    const stage = document.getElementById('menu-stage');
    const progress = clamp(window.scrollY / Math.max(1, stage.offsetHeight * .72), 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    constellationMetrics.forEach((metric, index) => {
      const lateral = (index % 2 ? -1 : 1) * Math.sin(progress * Math.PI) * 24;
      metric.node.style.transform = `translate3d(${metric.dx * eased + lateral}px,${metric.dy * eased}px,0) scale(${1 + (metric.scale - 1) * eased})`;
      metric.node.style.opacity = progress > .86 ? String(1 - (progress - .86) / .14) : '1';
    });
    document.body.classList.toggle('constellation-settled', progress > .92);
  }

  function moveIndicator(button, animate = true) {
    if (!button) return;
    const rail = document.getElementById('category-rail');
    const indicator = document.getElementById('category-indicator');
    const railRect = rail.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    if (!animate) indicator.style.transition = 'none';
    indicator.style.width = `${buttonRect.width}px`;
    indicator.style.transform = `translateX(${buttonRect.left - railRect.left + rail.scrollLeft}px)`;
    if (!animate) requestAnimationFrame(() => { indicator.style.transition = ''; });
    if (window.innerWidth <= 768) button.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
  }

  function selectCategory(category, trigger) {
    if (category === activeCategory && !searchTerm) return;
    activeCategory = category;
    document.querySelectorAll('.category-button').forEach(button => {
      const active = button.dataset.category === category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    moveIndicator(trigger || document.querySelector(`[data-category="${CSS.escape(category)}"]`));
    updateAtmosphere(category);
    updateHeading(category);
    filterProducts();
  }

  function updateAtmosphere(category) {
    document.body.style.setProperty('--ambient-rgb', (categoryMeta[category] || categoryMeta.all).tone);
  }

  function updateHeading(category) {
    const heading = document.getElementById('active-category-title');
    const next = categoryLabel(category);
    if (reducedMotion.matches) { heading.textContent = next; return; }
    heading.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-18px)', opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished.then(() => {
      heading.textContent = next;
      heading.animate([{ transform: 'translateY(18px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.2,.72,.18,1)', fill: 'forwards' });
    });
    document.getElementById('collection-description').textContent = (categoryMeta[category] || categoryMeta.all).description;
  }

  function matchesFilters(card) {
    const product = products.find(item => String(item.id) === card.dataset.productId);
    const categoryMatch = activeCategory === 'all' || product.category === activeCategory;
    const haystack = `${titleFor(product)} ${descriptionFor(product)} ${categoryLabel(product.category)}`.toLowerCase();
    return categoryMatch && (!searchTerm || haystack.includes(searchTerm));
  }

  async function filterProducts() {
    const revision = ++filterRevision;
    const cards = [...document.querySelectorAll('.menu-item')];
    cards.forEach(card => card.getAnimations().forEach(animation => animation.cancel()));
    const before = new Map(cards.filter(card => !card.hidden).map(card => [card, card.getBoundingClientRect()]));
    const leaving = cards.filter(card => !card.hidden && !matchesFilters(card));
    const entering = cards.filter(card => card.hidden && matchesFilters(card));
    const staying = cards.filter(card => !card.hidden && matchesFilters(card));

    if (!reducedMotion.matches) {
      leaving.forEach((card, index) => card.animate([
        { opacity: 1, filter: 'blur(0)', transform: 'translate3d(0,0,0) scale(1)' },
        { opacity: 0, filter: 'blur(8px)', transform: `translate3d(${index % 2 ? 24 : -24}px,28px,-60px) scale(.94)` }
      ], { duration: 300, delay: index * 18, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }));
      await new Promise(resolve => setTimeout(resolve, Math.min(380, 300 + leaving.length * 18)));
      if (revision !== filterRevision) return;
    }

    leaving.forEach(card => { card.hidden = true; card.getAnimations().forEach(animation => animation.cancel()); });
    entering.forEach(card => { card.hidden = false; });

    requestAnimationFrame(() => {
      if (revision !== filterRevision) return;
      staying.forEach(card => {
        const first = before.get(card);
        const last = card.getBoundingClientRect();
        if (!first || reducedMotion.matches) return;
        card.animate([
          { transform: `translate3d(${first.left - last.left}px,${first.top - last.top}px,0)` },
          { transform: 'translate3d(0,0,0)' }
        ], { duration: 620, easing: 'cubic-bezier(.2,.72,.18,1)' });
      });
      if (!reducedMotion.matches) entering.forEach((card, index) => card.animate([
        { opacity: 0, filter: 'blur(7px)', transform: `translate3d(${index % 2 ? 32 : -32}px,25px,0) scale(.95)` },
        { opacity: 1, filter: 'blur(0)', transform: 'translate3d(0,0,0) scale(1)' }
      ], { duration: 560, delay: index * 38, easing: 'cubic-bezier(.2,.72,.18,1)' }));
      const visible = cards.filter(card => !card.hidden);
      updateCount(visible.length);
      document.getElementById('menu-empty').hidden = visible.length !== 0;
      updateSignature(visible.length ? products.find(item => String(item.id) === visible[Math.floor(visible.length / 2)].dataset.productId) : null);
      setTimeout(measureConstellation, 680);
    });
  }

  function updateCount(count) {
    document.getElementById('visible-count').textContent = String(count).padStart(2, '0');
  }

  function updateSignature(product) {
    const section = document.getElementById('signature-moment');
    if (!product) { section.hidden = true; return; }
    section.hidden = false;
    section.innerHTML = `<article class="signature-story" tabindex="0" data-product-id="${escapeHTML(product.id)}">
      <div class="signature-story-media"><img loading="lazy" width="760" height="760" src="${escapeHTML(safeImage(product.image, Number(product.id)))}" alt="${escapeHTML(titleFor(product))}"></div>
      <div class="signature-story-copy"><p class="menu-kicker">CATHAREi signature</p><h3 id="signature-title">${escapeHTML(titleFor(product))}</h3><p>${escapeHTML(descriptionFor(product))}</p><span class="signature-story-price">${escapeHTML(priceFor(product))}</span></div>
    </article>`;
    const story = section.querySelector('.signature-story');
    story.addEventListener('click', () => openProduct(product, document.getElementById(`product-${product.id}`), story.querySelector('img')));
    story.addEventListener('keydown', event => { if (event.key === 'Enter') openProduct(product, document.getElementById(`product-${product.id}`), story.querySelector('img')); });
  }

  function addDepthWindow(card) {
    let frame = 0;
    card.addEventListener('pointermove', event => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = card.querySelector('.menu-product-media').getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        card.style.setProperty('--tilt-x', `${(x - .5) * 1.5}deg`);
        card.style.setProperty('--tilt-y', `${(.5 - y) * 1.2}deg`);
        card.style.setProperty('--image-x', `${(x - .5) * 8}px`);
        card.style.setProperty('--image-y', `${(y - .5) * 6}px`);
        card.style.setProperty('--image-rotate', `${(x - .5) * .9}deg`);
        card.style.setProperty('--glow-x', `${x * 100}%`);
        card.style.setProperty('--glow-y', `${y * 100}%`);
      });
    });
    card.addEventListener('pointerleave', () => ['--tilt-x','--tilt-y','--image-x','--image-y','--image-rotate'].forEach(property => card.style.removeProperty(property)));
  }

  function addMagnetism(button) {
    button.addEventListener('pointermove', event => {
      const rect = button.getBoundingClientRect();
      button.style.transform = `translate3d(${(event.clientX - rect.left - rect.width / 2) * .08}px,${(event.clientY - rect.top - rect.height / 2) * .1}px,0)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  }

  function detailMarkup(product) {
    return `<div class="product-detail" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <button class="product-detail-close" type="button" aria-label="Close product details">×</button>
      <div class="product-detail-media"><img src="${escapeHTML(safeImage(product.image, Number(product.id)))}" alt="${escapeHTML(titleFor(product))}"></div>
      <div class="product-detail-content"><p class="product-detail-category">${escapeHTML(categoryLabel(product.category))}</p><h2 id="detail-title">${escapeHTML(titleFor(product))}</h2><p class="product-detail-description">${escapeHTML(descriptionFor(product))}</p><p class="product-detail-price">${escapeHTML(priceFor(product))}</p><button class="product-detail-add" type="button">Add to cart</button><p class="product-detail-note">Prepared by CATHAREi. Contact your nearest boutique for ingredient and allergen guidance.</p></div>
    </div>`;
  }

  async function openProduct(product, card, sourceOverride) {
    if (!product || activeDetail) return;
    const source = sourceOverride || card?.querySelector('.menu-product-media img');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = detailMarkup(product);
    const detail = wrapper.firstElementChild;
    detail.hidden = true;
    document.body.appendChild(detail);
    const detailImage = detail.querySelector('.product-detail-media img');
    const transitionName = `menu-product-${product.id}`;
    if (source) source.style.viewTransitionName = transitionName;
    detailImage.style.viewTransitionName = transitionName;

    const reveal = () => {
      if (source) source.style.viewTransitionName = '';
      detail.hidden = false;
      document.body.classList.add('has-product-open');
      if (source) source.style.visibility = 'hidden';
    };
    if (document.startViewTransition && !reducedMotion.matches && source) {
      const transition = document.startViewTransition(reveal);
      await transition.finished.catch(() => {});
    } else reveal();

    if (source) source.style.viewTransitionName = '';
    detailImage.style.viewTransitionName = '';
    activeDetail = { detail, product, card, source, lastFocus: document.activeElement };
    detail.querySelector('.product-detail-close').addEventListener('click', closeProduct);
    detail.querySelector('.product-detail-add').addEventListener('click', event => {
      const variantsData = typeof product.variants === 'string' ? product.variants : (product.variants ? JSON.stringify(product.variants) : '');
      addToCart(event, String(product.id), product.name, Number(product.price || 0), product.image || '', variantsData);
    });
    detail.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = [...detail.querySelectorAll('button,[href],input,[tabindex]:not([tabindex="-1"])')].filter(element => !element.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    detail.addEventListener('pointermove', event => {
      if (!finePointer.matches) return;
      const media = detail.querySelector('.product-detail-media');
      const rect = media.getBoundingClientRect();
      detail.style.setProperty('--detail-x', `${clamp((event.clientX - rect.left) / rect.width - .5,-.5,.5) * 9}px`);
      detail.style.setProperty('--detail-y', `${clamp((event.clientY - rect.top) / rect.height - .5,-.5,.5) * 7}px`);
    });
    detail.querySelector('.product-detail-close').focus();
  }

  async function closeProduct() {
    if (!activeDetail) return;
    const { detail, source, card, product, lastFocus } = activeDetail;
    const detailImage = detail.querySelector('.product-detail-media img');
    const transitionName = `menu-product-${product.id}`;
    detailImage.style.viewTransitionName = transitionName;
    const conceal = () => {
      if (source) {
        source.style.visibility = '';
        source.style.viewTransitionName = transitionName;
      }
      detail.remove();
      document.body.classList.remove('has-product-open');
    };
    if (document.startViewTransition && !reducedMotion.matches && source && card && !card.hidden) {
      const transition = document.startViewTransition(conceal);
      await transition.finished.catch(() => {});
    } else conceal();
    if (source) source.style.viewTransitionName = '';
    activeDetail = null;
    (lastFocus?.isConnected ? lastFocus : card)?.focus?.();
  }

  function showEntry() {
    let hasSeen = false;
    try { hasSeen = sessionStorage.getItem('catharei-menu-reveal') === 'seen'; } catch {}
    if (hasSeen || reducedMotion.matches) return;
    const entry = document.createElement('div');
    entry.className = 'menu-entry';
    entry.setAttribute('aria-hidden', 'true');
    entry.innerHTML = `<span class="menu-entry-word">Savouries</span><span class="menu-entry-word">Arabic sweets</span><span class="menu-entry-word">Cakes</span><span class="menu-entry-word">Celebrations</span><img class="menu-entry-product" src="${escapeHTML(safeImage(products[0]?.image,0))}" alt="">`;
    document.body.appendChild(entry);
    setTimeout(() => entry.remove(), 1550);
    try { sessionStorage.setItem('catharei-menu-reveal', 'seen'); } catch {}
  }

  function bindGlobalMotion() {
    const header = document.querySelector('.site-header');
    const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
    updateHeader();
    window.addEventListener('scroll', () => {
      updateHeader();
      updateConstellation();
      if (!reducedMotion.matches) {
        const now = performance.now();
        const velocity = (window.scrollY - lastScrollY) / Math.max(16, now - lastScrollTime);
        scrollLean += (clamp(velocity * 6,-1,1) - scrollLean) * .34;
        document.documentElement.style.setProperty('--scroll-lag', `${scrollLean * 14}px`);
        lastScrollY = window.scrollY;
        lastScrollTime = now;
        clearTimeout(bindGlobalMotion.settle);
        bindGlobalMotion.settle = setTimeout(() => document.documentElement.style.setProperty('--scroll-lag','0px'),120);
      }
      const signature = document.querySelector('.signature-story');
      if (signature && !reducedMotion.matches) {
        const rect = signature.getBoundingClientRect();
        const progress = clamp(1 - Math.abs(rect.top + rect.height / 2 - innerHeight / 2) / innerHeight,0,1);
        signature.style.setProperty('--signature-scale', String(.82 + progress * .18));
      }
    }, { passive: true });
    window.addEventListener('resize', () => { measureConstellation(); moveIndicator(document.querySelector('.category-button.is-active'),false); }, { passive: true });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && activeDetail) closeProduct(); });
    if (finePointer.matches) document.addEventListener('pointermove', event => {
      document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
      document.body.classList.add('is-pointer-moving');
      clearTimeout(pointerTimer);
      pointerTimer = setTimeout(() => document.body.classList.remove('is-pointer-moving'),700);
    }, { passive: true });
  }

  window.initCinematicMenu = async function initCinematicMenu() {
    const container = document.getElementById('menu-content');
    if (!container) return;
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Menu request failed');
      products = (await response.json()).filter(product => product.active !== 0);
      if (!products.length) throw new Error('No menu products returned');
      showEntry();
      buildRail();
      renderProducts();
      buildConstellation();
      updateSignature(products[Math.floor(products.length / 2)]);
      bindGlobalMotion();
      const input = document.getElementById('menu-search');
      input.addEventListener('input', () => {
        searchTerm = input.value.trim().toLocaleLowerCase();
        filterProducts();
      });
      document.body.classList.add('menu-ready');
    } catch (error) {
      console.error('Cinematic menu enhancement unavailable:', error);
      document.body.classList.add('menu-fallback');
      document.getElementById('category-rail')?.setAttribute('hidden','');
      document.querySelector('.menu-search')?.setAttribute('hidden','');
    }
  };
})();
