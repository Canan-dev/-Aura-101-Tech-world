// AURA 101 TECH WORLD - Interactive Core Application
// Enhanced with Store Owner Dashboard (Password: Aura123), Live Product Adding & Tracking,
// Full-Screen Product Details, "You May Also Like" Recommendations, Direct WhatsApp Ordering,
// Cart Drawer, Zero Strikethrough Pricing, and Stable Mobile Nav.

(function() {
  'use strict';

  // State
  let activeCategory = 'all';
  let activeBudget = 'all';
  let searchQuery = '';
  let sortBy = 'featured';
  let cart = [];
  let showAllProducts = false; // When true, shows all products in catalog view (not categories hub)

  // LocalStorage Keys
  const CART_KEY = 'aura101_cart_v2';
  const CUSTOM_PRODUCTS_KEY = 'aura101_custom_products_v2';
  const DELETED_PIDS_KEY = 'aura101_deleted_pids_v2';
  const ORDERS_TRACKER_KEY = 'aura101_orders_tracker_v2';
  const OWNER_AUTH_SESSION_KEY = 'aura101_owner_auth_session';
  const STORE_SETTINGS_KEY = 'aura101_owner_settings_v2';

  // Owner Password — changeable (default: Aura123, saved in localStorage)
  const OWNER_PASS_KEY = 'aura101_owner_pass_v1';
  let ownerPassword = (() => {
    try { return localStorage.getItem(OWNER_PASS_KEY) || 'Aura123'; } catch(e) { return 'Aura123'; }
  })();

  // Owner Catalog & Tracking State
  let customProducts = [];
  let deletedProductIds = [];
  let ordersLog = [];
  let isServerOnline = false;
  let serverProducts = [];
  let lastCatalogTimestamp = 0;

  // Fixed WhatsApp Order Number — default 256759375151, can be changed in Store Config
  const DEFAULT_WA_NUMBER = "256759375151";
  if (typeof STORE_CONFIG !== 'undefined') {
    STORE_CONFIG.whatsappNumber = DEFAULT_WA_NUMBER;
    STORE_CONFIG.displayPhone = "+256 759 375 151";
  } else if (typeof window !== 'undefined' && window.STORE_CONFIG) {
    window.STORE_CONFIG.whatsappNumber = DEFAULT_WA_NUMBER;
    window.STORE_CONFIG.displayPhone = "+256 759 375 151";
  }

  // Load custom store configuration if saved by owner
  try {
    const savedSettings = localStorage.getItem(STORE_SETTINGS_KEY);
    if (savedSettings) {
      const cfg = JSON.parse(savedSettings);
      if (cfg.whatsappNumber && typeof STORE_CONFIG !== 'undefined') {
        STORE_CONFIG.whatsappNumber = cfg.whatsappNumber;
      }
      if (cfg.location && typeof STORE_CONFIG !== 'undefined') {
        STORE_CONFIG.location = cfg.location;
      }
    }
  } catch (err) {}

  // Load state from localStorage
  try {
    const savedCart = localStorage.getItem(CART_KEY);
    if (savedCart) cart = JSON.parse(savedCart);

    const savedCustom = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
    if (savedCustom) customProducts = JSON.parse(savedCustom);

    const savedDeleted = localStorage.getItem(DELETED_PIDS_KEY);
    if (savedDeleted) deletedProductIds = JSON.parse(savedDeleted);

    // Permanently excluded products (removed from catalog)
    const PERMANENTLY_EXCLUDED = [
      'apple-magsafe-duo',
      'iphone-18-pro-max-burgundy',
      'iphone-18-pro-burgundy',
      'iphone-18-pro-max-512gb',
      'iphone-18-pro-max-1tb',
      'iphone-18-pro-512gb',
      'iphone-duo-512gb'
    ];
    PERMANENTLY_EXCLUDED.forEach(pid => {
      if (!deletedProductIds.includes(pid)) {
        deletedProductIds.push(pid);
      }
    });
    try { localStorage.setItem(DELETED_PIDS_KEY, JSON.stringify(deletedProductIds)); } catch (e) {}
    customProducts = customProducts.filter(p => p && !PERMANENTLY_EXCLUDED.includes(p.id) && p.image && p.image.trim() !== '');

    const savedOrders = localStorage.getItem(ORDERS_TRACKER_KEY);
    if (savedOrders) {
      ordersLog = JSON.parse(savedOrders);
    } else {
      // Seed initial realistic inquiries so dashboard tracking demonstrates live utility immediately
      ordersLog = [
        {
          id: 'AURA-8419',
          timestamp: 'Today, 4:15 PM',
          type: 'Product Order',
          items: 'Apple iPhone 18 Pro Max 256GB Burgundy',
          total: 7500000,
          ref: 'AURA-8419'
        },
        {
          id: 'AURA-7290',
          timestamp: 'Today, 2:30 PM',
          type: 'Cart Multi-Checkout',
          items: 'Sony PlayStation 5 Slim 1TB + JBL Boombox 3',
          total: 5800000,
          ref: 'AURA-7290'
        },
        {
          id: 'AURA-6112',
          timestamp: 'Yesterday, 6:45 PM',
          type: 'General WhatsApp Chat',
          items: 'Delivery inquiry: Kampala & Entebbe Express',
          total: 0,
          ref: 'AURA-6112'
        }
      ];
      try { localStorage.setItem(ORDERS_TRACKER_KEY, JSON.stringify(ordersLog)); } catch (e) {}
    }
  } catch (err) {
    console.warn('Error reading localStorage:', err);
  }

  // Helper: Get active product catalog (new owner-added items appear FIRST at the top of the store)
  function getCatalog() {
    if (isServerOnline && Array.isArray(serverProducts) && serverProducts.length > 0) {
      return [...serverProducts];
    }

    const defaults = (typeof window !== 'undefined' && window.PRODUCTS) 
      ? window.PRODUCTS 
      : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
    
    // Custom products added or edited by the owner (filtered for validity and non-deleted)
    const activeCustom = customProducts.filter(c => c && c.id && !deletedProductIds.includes(c.id) && c.image && c.image.trim() !== '');
    const customIds = new Set(activeCustom.map(c => c.id));

    // Factory products that have not been overridden or deleted
    const activeDefaults = defaults.filter(d => d && d.id && !customIds.has(d.id) && !deletedProductIds.includes(d.id) && d.image && d.image.trim() !== '');

    // Owner-added new items appear FIRST at the very top of the store!
    const merged = [...activeCustom, ...activeDefaults];

    // Sort product variants by storage capacity (GB/TB) ascending within the same base product.
    // e.g. iPhone 17 Pro Max 128GB comes before iPhone 17 Pro Max 256GB which comes before 512GB.
    merged.sort((a, b) => {
      const baseA = getProductBaseName(a.name);
      const baseB = getProductBaseName(b.name);
      if (baseA !== baseB) return 0; // different products — keep original order
      const gbA = extractStorageGB(a.name);
      const gbB = extractStorageGB(b.name);
      return gbA - gbB; // smallest storage first
    });

    return merged;
  }

  // Extract a product's base name by stripping storage capacity suffixes (e.g. "128GB", "1TB")
  function getProductBaseName(name) {
    if (!name) return '';
    return name.replace(/\s*\d+\s*(GB|TB)\b/gi, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  // Extract storage capacity in GB from a product name. Returns 0 if not found.
  function extractStorageGB(name) {
    if (!name) return 0;
    const match = name.match(/(\d+)\s*(GB|TB)\b/i);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    const unit = match[2].toUpperCase();
    return unit === 'TB' ? value * 1024 : value;
  }

  // Save custom products
  function saveCustomProducts() {
    try {
      localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(customProducts));
      localStorage.setItem(DELETED_PIDS_KEY, JSON.stringify(deletedProductIds));
    } catch (e) {}
  }

  // Track customer WhatsApp clicks & inquiries in Owner Log
  function logWhatsAppOrder(order) {
    const entry = {
      id: 'AURA-' + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toLocaleString('en-US', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      }),
      type: order.type || 'WhatsApp Inquiry',
      items: order.items || 'General Customer Inquiry',
      total: order.total || 0,
      ref: order.ref || ('REF-' + Date.now().toString(36).toUpperCase())
    };
    ordersLog.unshift(entry);
    if (ordersLog.length > 80) ordersLog = ordersLog.slice(0, 80);
    try {
      localStorage.setItem(ORDERS_TRACKER_KEY, JSON.stringify(ordersLog));
    } catch (e) {}

    // Send order to shared server so both owner and friend can view inquiries in admin panel
    if (isServerOnline) {
      try {
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        }).catch(e => {});
      } catch(e) {}
    }

    renderOwnerDashboard();
  }

  // DOM Elements - Shop
  const productsGrid = document.getElementById('productsGrid');
  const categoriesPillsContainer = document.getElementById('categoriesPillsContainer');
  const searchCategorySelect = document.getElementById('searchCategorySelect');
  const headerSearchInput = document.getElementById('headerSearchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const headerSearchForm = document.getElementById('headerSearchForm');
  const searchLiveDropdown = document.getElementById('searchLiveDropdown');
  const sectionTitle = document.getElementById('sectionTitle');
  const resultsCount = document.getElementById('resultsCount');
  const budgetPills = document.querySelectorAll('.budget-pill');
  const sortSelect = document.getElementById('sortSelect');
  const explorePromoBtn = document.getElementById('explorePromoBtn');

  // Badge counters
  const cartBadges = document.querySelectorAll('.cart-badge-count');
  const cartAmountPill = document.getElementById('cartAmountPill');

  // Floating Buttons
  const floatingScrollTop = document.getElementById('floatingScrollTop');
  const floatingWhatsapp = document.getElementById('floatingWhatsapp');

  // Full-Screen Product Details Overlay
  const fullscreenDetailOverlay = document.getElementById('fullscreenDetailOverlay');
  const fullscreenDetailContent = document.getElementById('fullscreenDetailContent');
  const fullscreenBackBtn = document.getElementById('fullscreenBackBtn');
  const fullscreenCloseBtn = document.getElementById('fullscreenCloseBtn');
  const fullscreenTopTitle = document.getElementById('fullscreenTopTitle');

  // Cart Drawer
  const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
  const cartDrawerBody = document.getElementById('cartDrawerBody');
  const cartSubtotalText = document.getElementById('cartSubtotalText');
  const cartDrawerCloseBtn = document.getElementById('cartDrawerCloseBtn');
  const cartWhatsappCheckoutBtn = document.getElementById('cartWhatsappCheckoutBtn');
  const openCartBtn = document.getElementById('openCartBtn');
  const mobileCartBtn = document.getElementById('mobileCartBtn');
  const mobileCategoriesBtn = document.getElementById('mobileCategoriesBtn');

  // Toast Notice
  const toastNotice = document.getElementById('toastNotice');
  const toastText = document.getElementById('toastText');

  // Save Cart to LocalStorage
  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch(e) {}
    updateCartUI();
  }

  // ============================================================
  // DOMINANT COLOR EXTRACTION — Pull the main colour from an
  // image and use it as the card background (via canvas sampling)
  // ============================================================
  function getDominantColor(imgEl, callback) {
    try {
      const canvas = document.createElement('canvas');
      const size = 32; // Small sample size for speed
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgEl, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const pr = data[i], pg = data[i+1], pb = data[i+2], pa = data[i+3];
        // Skip near-transparent, near-white, and near-black pixels
        if (pa < 80) continue;
        const brightness = (pr + pg + pb) / 3;
        if (brightness > 240 || brightness < 15) continue;
        r += pr; g += pg; b += pb; count++;
      }
      if (count === 0) { callback(null); return; }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      // Soften toward a dark tone for the card background
      const mix = 0.35; // how much of the original colour to keep
      const dark = 12; // base dark value
      const fr = Math.round(dark + r * mix);
      const fg = Math.round(dark + g * mix);
      const fb = Math.round(dark + b * mix);
      callback(`rgb(${fr},${fg},${fb})`, `rgb(${r},${g},${b})`);
    } catch(e) {
      callback(null);
    }
  }

  // Ensure card image wrap has clean background and image covers fully
  function applyCardColor(imgEl) {
    if (!imgEl) return;
    const wrap = imgEl.closest('.card-image-wrap');
    if (!wrap) return;
    wrap.style.background = '#ffffff';
  }

  // Apply colour to all card images currently in the DOM
  function applyAllCardColors() {
    document.querySelectorAll('.card-image-wrap .card-product-img').forEach(img => {
      applyCardColor(img);
    });
  }

  // Toast Notification
  function showToast(msg) {
    if (!toastNotice) return;
    toastText.textContent = msg;
    toastNotice.classList.add('show');
    clearTimeout(toastNotice._timer);
    toastNotice._timer = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 2800);
  }

  // Update Cart Counters
  function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    cartBadges.forEach(b => {
      b.textContent = totalItems;
      b.setAttribute('data-count', totalItems);
      // Hide badge when empty, show when items added
      b.style.display = totalItems > 0 ? 'flex' : 'none';
    });
    const cartDrawerCount = document.getElementById('cartDrawerCount');
    if (cartDrawerCount) cartDrawerCount.textContent = totalItems;
    if (cartAmountPill) cartAmountPill.textContent = formatUGX(totalPrice);
    if (cartSubtotalText) cartSubtotalText.textContent = formatUGX(totalPrice);

    renderCartItems();
  }

  // Render Category Pills
  function renderCategoryPills() {
    if (searchCategorySelect) {
      searchCategorySelect.innerHTML = `<option value="all">All Categories</option>`;
    }

    if (categoriesPillsContainer) {
      categoriesPillsContainer.innerHTML = '';
    }

    (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []).forEach(cat => {
      if (categoriesPillsContainer) {
        const btn = document.createElement('button');
        btn.className = `category-pill-btn ${cat.id === activeCategory ? 'active' : ''}`;
        btn.innerHTML = `<span>${cat.icon}</span> <span>${cat.name}</span>`;
        btn.addEventListener('click', () => {
          selectCategory(cat.id, true);
        });
        categoriesPillsContainer.appendChild(btn);
      }

      if (searchCategorySelect && cat.id !== 'all') {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        searchCategorySelect.appendChild(opt);
      }
    });
  }

  function selectCategory(catId, shouldScroll = false) {
    activeCategory = catId;
    showAllProducts = false; // Reset flag when navigating categories normally
    searchQuery = '';
    if (headerSearchInput) headerSearchInput.value = '';
    if (searchClearBtn) searchClearBtn.classList.remove('active');
    if (searchCategorySelect) searchCategorySelect.value = catId;

    const categoriesHub = document.getElementById('categoriesHubSection');
    const catalogEl = document.getElementById('catalogSection');
    const heroSection = document.querySelector('.hero-showcase-section');
    const welcomeSection = document.querySelector('.welcome-section');
    const catViewCrumb = document.getElementById('catViewCrumb');

    // Sync category pills in the horizontal scroll bar
    document.querySelectorAll('.category-pill-btn').forEach((btn, index) => {
      if (CATEGORIES[index] && CATEGORIES[index].id === catId) {
        btn.classList.add('active');
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        btn.classList.remove('active');
      }
    });

    // Sync active state on category hub cards
    document.querySelectorAll('.cat-hub-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-cat-id') === catId);
    });

    if (catId === 'all') {
      // Home / Categories Hub View: Show Categories Hub, Hide Catalog Products
      if (categoriesHub) categoriesHub.style.display = '';
      if (catalogEl) catalogEl.style.display = 'none';
      if (heroSection) heroSection.style.display = '';
      if (welcomeSection) welcomeSection.style.display = '';
      if (sectionTitle) sectionTitle.textContent = 'All Categories';

      if (shouldScroll && categoriesHub) {
        const headerOffset = 110;
        const elementPosition = categoriesHub.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
      }
      return;
    }

    // Specific category selected: Hide Hero & Welcome, Hide Categories Hub, Show Category Products View
    if (heroSection) heroSection.style.display = 'none';
    if (welcomeSection) welcomeSection.style.display = 'none';
    if (categoriesHub) categoriesHub.style.display = 'none';
    if (catalogEl) catalogEl.style.display = '';

    const found = (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []).find(c => c.id === catId);
    const catName = found ? found.name : 'Category Products';
    if (sectionTitle) {
      sectionTitle.textContent = catName;
    }
    if (catViewCrumb) {
      catViewCrumb.textContent = catName;
    }

    renderProducts();

    // Instantly bring user to top of the category products view so they see products immediately!
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Initialize Categories Hub & Category Card Click Handlers
  function initCategoriesHub() {
    const cards = document.querySelectorAll('.cat-hub-card');
    cards.forEach(card => {
      const catId = card.getAttribute('data-cat-id');

      // Track if this was a scroll gesture (not a tap) so we don't fire click on swipe
      let touchStartX = 0;
      let touchStartY = 0;

      const handler = (e) => {
        e.preventDefault();
        selectCategory(catId, true);
      };

      card.addEventListener('click', handler);

      // iOS Safari fix: use touchend as a click fallback for divs
      card.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      card.addEventListener('touchend', (e) => {
        const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
        // Only treat as tap if finger barely moved (not a scroll)
        if (dx < 10 && dy < 10) {
          e.preventDefault();
          selectCategory(catId, true);
        }
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handler(e);
        }
      });
    });

    // Wire up "← Back to All Categories" button
    const backBtn = document.getElementById('backToCategoriesBtn');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        selectCategory('all', true);
      });
    }
  }

  // HTML Entity escaper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Smart Search Token Matcher (handles multi-word, models like 'iphone 18', typos like 'mxa' -> 'max')
  function matchesSearch(product, query) {
    if (!query || !query.trim()) return true;
    const normalized = query.toLowerCase().trim().replace(/\bmxa\b/g, 'max');
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const target = `${product.name || ''} ${product.brand || ''} ${product.categoryName || ''} ${product.category || ''} ${product.specsSummary || ''}`.toLowerCase();
    return tokens.every(token => target.includes(token));
  }

  // Search keyword highlighter
  function highlightMatch(text, query) {
    if (!query || !query.trim()) return text;
    const cleanQ = query.trim().replace(/\bmxa\b/g, 'max');
    const tokens = cleanQ.split(/\s+/).filter(t => t.length > 1);
    if (tokens.length === 0) return text;
    let result = text;
    for (const token of tokens) {
      const regex = new RegExp(`(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, '<strong>$1</strong>');
    }
    return result;
  }

  // Live Instant Search Dropdown Renderer (Matches user reference image)
  function renderLiveSearchDropdown(query) {
    if (!searchLiveDropdown) return;
    const cleanQ = query ? query.trim() : '';

    if (cleanQ.length === 0) {
      searchLiveDropdown.style.display = 'none';
      searchLiveDropdown.innerHTML = '';
      return;
    }

    const catalog = getCatalog();
    const matches = catalog.filter(p => matchesSearch(p, cleanQ));

    if (matches.length === 0) {
      searchLiveDropdown.innerHTML = `
        <div class="search-drop-empty">
          No tech products found matching "<strong>${escapeHtml(cleanQ)}</strong>"
        </div>
      `;
      searchLiveDropdown.style.display = 'block';
      return;
    }

    const maxItems = 7;
    const displayItems = matches.slice(0, maxItems);

    searchLiveDropdown.innerHTML = `
      ${displayItems.map(p => `
        <div class="search-drop-item" data-search-pid="${p.id}">
          <img class="search-drop-img" src="${p.image}" alt="${escapeHtml(p.name)}" />
          <div class="search-drop-info">
            <span class="search-drop-name">${highlightMatch(escapeHtml(p.name), cleanQ)}</span>
            <span class="search-drop-cat">${escapeHtml(p.categoryName || p.category)} • Official Stock</span>
          </div>
          <span class="search-drop-price">${formatUGX(p.price)}</span>
        </div>
      `).join('')}
      ${matches.length > maxItems ? `
        <div class="search-drop-footer" id="searchDropViewAllBtn">
          View all ${matches.length} matching products →
        </div>
      ` : ''}
    `;

    searchLiveDropdown.style.display = 'block';

    // Click on item -> instantly open full product details
    searchLiveDropdown.querySelectorAll('[data-search-pid]').forEach(item => {
      item.addEventListener('click', () => {
        const pid = item.getAttribute('data-search-pid');
        searchLiveDropdown.style.display = 'none';
        openProductFullscreen(pid);
      });
    });

    // View all button
    document.getElementById('searchDropViewAllBtn')?.addEventListener('click', () => {
      searchLiveDropdown.style.display = 'none';
      searchQuery = cleanQ;
      renderProducts();
      window.scrollTo({ top: productsGrid.offsetTop - 120, behavior: 'smooth' });
    });
  }

  // Filter and Sort Products
  function getFilteredProducts() {
    const list = getCatalog();
    return list.filter(p => {
      if (activeCategory !== 'all' && p.category !== activeCategory) {
        return false;
      }

      if (activeBudget === 'under-500k' && p.price >= 500000) return false;
      if (activeBudget === '500k-2m' && (p.price < 500000 || p.price > 2000000)) return false;
      if (activeBudget === '2m-above' && p.price < 2000000) return false;

      if (searchQuery.trim() !== '') {
        if (!matchesSearch(p, searchQuery)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      return 0; // featured
    });
  }

  // Render Product Cards
  function renderProducts() {
    if (!productsGrid) return;

    // Toggle Big Hero Showcase Banner, Welcome & Categories Hub when searching
    const isSearching = searchQuery.trim().length > 0;
    const heroSection = document.querySelector('.hero-showcase-section');
    const welcomeSection = document.querySelector('.welcome-section');
    const categoriesHub = document.getElementById('categoriesHubSection');
    const catalogEl = document.getElementById('catalogSection');

    if (isSearching) {
      if (heroSection) heroSection.style.display = 'none';
      if (welcomeSection) welcomeSection.style.display = 'none';
      if (categoriesHub) categoriesHub.style.display = 'none';
      if (catalogEl) catalogEl.style.display = '';

      if (sectionTitle) {
        sectionTitle.textContent = `Search results for "${searchQuery.trim()}"`;
      }
    } else {
      if (activeCategory === 'all' && !showAllProducts) {
        if (heroSection) heroSection.style.display = '';
        if (welcomeSection) welcomeSection.style.display = '';
        if (categoriesHub) categoriesHub.style.display = '';
        if (catalogEl) catalogEl.style.display = 'none';
        if (sectionTitle) sectionTitle.textContent = 'All Categories';
        return; // In home all-categories state, the Categories Hub is displayed
      } else {
        if (heroSection) heroSection.style.display = 'none';
        if (welcomeSection) welcomeSection.style.display = 'none';
        if (categoriesHub) categoriesHub.style.display = 'none';
        if (catalogEl) catalogEl.style.display = '';
        if (showAllProducts && activeCategory === 'all') {
          if (sectionTitle) sectionTitle.textContent = 'All Products';
        } else {
          const catObj = (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []).find(c => c.id === activeCategory);
          if (sectionTitle) {
            sectionTitle.textContent = catObj ? catObj.name : 'Category Products';
          }
        }
      }
    }

    const list = getFilteredProducts();

    if (resultsCount) {
      if (isSearching) {
        resultsCount.textContent = `${list.length} item${list.length === 1 ? '' : 's'} found`;
      } else if (showAllProducts && activeCategory === 'all') {
        resultsCount.textContent = `${list.length} product${list.length === 1 ? '' : 's'} available`;
      } else {
        const catObj = (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []).find(c => c.id === activeCategory);
        resultsCount.textContent = `${list.length} product${list.length === 1 ? '' : 's'} in ${catObj ? catObj.name : 'Category'}`;
      }
    }

    if (list.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-products-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">No matching products found</div>
          <div class="empty-subtitle">We regularly stock new items. Inquire directly on WhatsApp for immediate custom orders & fast delivery across Uganda.</div>
          <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:14px;">
            <a href="https://wa.me/256759375151?text=Hello%20AURA%20101%20TECH%20WORLD%2C%20I%20am%20inquiring%20about%20a%20product%20in%20${encodeURIComponent(activeCategory)}" target="_blank" rel="noopener noreferrer" class="welcome-wa-btn" style="padding:10px 18px; font-size:13.5px;">💬 Inquire on WhatsApp</a>
            <button class="empty-reset-btn" id="emptyResetFiltersBtn">← Back to All Categories</button>
          </div>
        </div>
      `;
      document.getElementById('emptyResetFiltersBtn')?.addEventListener('click', () => {
        searchQuery = '';
        activeCategory = 'all';
        activeBudget = 'all';
        if (headerSearchInput) headerSearchInput.value = '';
        budgetPills.forEach(p => p.classList.toggle('active', p.dataset.budget === 'all'));
        selectCategory('all', true);
      });
      return;
    }

    productsGrid.innerHTML = list.map((prod, index) => {
      const waLink = buildWhatsAppProductMessage(prod);
      const isAboveFold = index < 6;
      const loadAttr = isAboveFold ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';

      return `
        <div class="product-card" data-id="${prod.id}">
          <div class="card-image-wrap" data-detail-id="${prod.id}">
            <img class="card-product-img" src="${prod.image}" alt="${prod.name}" ${loadAttr} decoding="async" />
          </div>

          <div class="card-info">
            <div class="card-category-tag">${prod.categoryName || prod.category}</div>
            <h3 class="card-title" data-detail-id="${prod.id}">${prod.name}</h3>
            
            <div class="card-price-wrap">
              <span class="card-price">${formatUGX(prod.price)}</span>
            </div>

            <div class="card-actions-wrap">
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="card-btn-primary" data-wa-order="${prod.id}">
                <span>Order on WhatsApp</span>
              </a>
              <button class="card-btn-secondary" data-detail-id="${prod.id}">
                <span>View details</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listener to track WhatsApp orders
    productsGrid.querySelectorAll('[data-wa-order]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-wa-order');
        const prod = getCatalog().find(p => p.id === pid);
        if (prod) {
          logWhatsAppOrder({
            type: 'Product Order',
            items: prod.name,
            total: prod.price
          });
        }
      });
    });

    productsGrid.querySelectorAll('[data-detail-id]').forEach(el => {
      el.addEventListener('click', () => {
        const pid = el.getAttribute('data-detail-id');
        openProductFullscreen(pid);
      });
    });
    // Apply dynamic background colours to all product cards after rendering
    applyAllCardColors();
  }

  // Add to Cart
  function addToCart(pid, qty = 1) {
    const prod = getCatalog().find(p => p.id === pid);
    if (!prod) return;

    const existing = cart.find(item => item.productId === pid);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ productId: pid, quantity: qty, product: prod });
    }

    saveCart();
    showToast(`Added to cart: ${prod.name}`);
  }

  // Open Full-Screen Product Details with "You May Also Like"
  function openProductFullscreen(pid) {
    const catalog = getCatalog();
    const prod = catalog.find(p => p.id === pid);
    if (!prod || !fullscreenDetailContent) return;

    if (fullscreenTopTitle) {
      fullscreenTopTitle.textContent = prod.name;
    }

    const waLink = buildWhatsAppProductMessage(prod);

    // Build Specs Table
    let specsRows = '';
    if (prod.specs) {
      for (const [key, val] of Object.entries(prod.specs)) {
        specsRows += `<tr><td>${key}</td><td>${val}</td></tr>`;
      }
    } else if (prod.specsSummary) {
      specsRows = `<tr><td>Features</td><td>${prod.specsSummary}</td></tr>`;
    }

    // Colors
    let colorSwatches = '';
    if (prod.colors && prod.colors.length > 0) {
      colorSwatches = `
        <div style="margin-bottom: 16px;">
          <label style="font-size: 12px; font-weight: 700; color: #64748b; display: block; margin-bottom: 6px;">Available Colors:</label>
          <div style="display: flex; gap: 8px;">
            ${prod.colors.map(c => `
              <span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: ${c}; border: 2px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"></span>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Get "You May Also Like" Recommendations (4 items)
    const relatedProducts = catalog.filter(p => p.id !== prod.id).sort(() => 0.5 - Math.random()).slice(0, 4);

    const relatedCardsHtml = relatedProducts.map(rel => {
      return `
        <div class="product-card">
          <div class="card-image-wrap" data-detail-id="${rel.id}">
            <img class="card-product-img" src="${rel.image}" alt="${rel.name}" loading="lazy" />
          </div>
          <div class="card-info" style="padding: 12px;">
            <div class="card-category-tag" style="font-size: 10px;">${rel.categoryName || rel.category}</div>
            <h4 class="card-title" style="font-size: 12.5px; min-height: 32px;" data-detail-id="${rel.id}">${rel.name}</h4>
            <div class="card-price-wrap" style="margin-bottom: 4px;">
              <span class="card-price" style="font-size: 14.5px;">${formatUGX(rel.price)}</span>
            </div>
            <div class="card-actions-wrap" style="gap: 4px;">
              <a href="${buildWhatsAppProductMessage(rel)}" target="_blank" rel="noopener noreferrer" class="card-btn-primary" style="padding: 7px 10px; font-size: 11.5px;" data-rel-wa="${rel.id}">
                <span>WhatsApp Order</span>
              </a>
              <button class="card-btn-secondary" style="padding: 6px 10px; font-size: 11.5px;" data-detail-id="${rel.id}">
                <span>View details</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    fullscreenDetailContent.innerHTML = `
      <div class="fullscreen-hero-grid">
        <div class="fullscreen-media-column">
          <div class="fullscreen-main-img-box">
            <img class="fullscreen-hero-img" src="${prod.image}" alt="${prod.name}" />
          </div>
        </div>

        <div class="fullscreen-info-column">
          <div class="fullscreen-cat-tag">${prod.categoryName || prod.category} • Official AURA 101 Stock</div>
          <h1 class="fullscreen-prod-title">${prod.name}</h1>
          
          <div class="fullscreen-price-box">
            <span class="fullscreen-price">${formatUGX(prod.price)}</span>
          </div>

          <p class="fullscreen-desc-text">${prod.description || 'Authentic premium gadget available with immediate Kampala delivery and nationwide courier.'}</p>

          ${colorSwatches}

          <div class="fullscreen-trust-row">
            <div class="fullscreen-trust-item">
              <span>⚡</span> Same-Day Delivery
            </div>
            <div class="fullscreen-trust-item">
              <span>📦</span> Brand New Sealed
            </div>
            <div class="fullscreen-trust-item">
              <span>💵</span> Cash / Mobile Money
            </div>
          </div>

          ${specsRows ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 14px; font-weight: 800; margin-bottom: 8px; color: #1e293b;">Specifications:</h3>
              <table class="fullscreen-specs-table">${specsRows}</table>
            </div>
          ` : ''}

          <div class="fullscreen-cta-group">
            <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="card-btn-primary" id="fullscreenWaOrderBtn" style="padding: 14px 20px; font-size: 15px; border-radius: 10px;">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
              <span>Order Instantly on WhatsApp</span>
            </a>
            <button class="card-btn-secondary" id="fullscreenAddToCartBtn" style="padding: 12px 20px; font-size: 14px; border-radius: 10px;">
              <span>🛒 Add to Cart</span>
            </button>
          </div>
        </div>
      </div>

      <!-- You May Also Like Section -->
      <section class="related-products-section">
        <div class="related-section-header">
          <h2 class="related-section-title">🔥 You May Also Like</h2>
          <span style="font-size: 13px; font-weight: 600; color: #526077;">Handpicked Tech Recommendations</span>
        </div>
        <div class="related-grid">
          ${relatedCardsHtml}
        </div>
      </section>
    `;

    // Track order clicks in fullscreen view
    document.getElementById('fullscreenWaOrderBtn')?.addEventListener('click', () => {
      logWhatsAppOrder({
        type: 'Direct Product Order',
        items: prod.name,
        total: prod.price
      });
    });

    document.getElementById('fullscreenAddToCartBtn')?.addEventListener('click', () => {
      addToCart(prod.id, 1);
    });

    fullscreenDetailContent.querySelectorAll('[data-rel-wa]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rid = btn.getAttribute('data-rel-wa');
        const relProd = catalog.find(p => p.id === rid);
        if (relProd) {
          logWhatsAppOrder({
            type: 'Product Order',
            items: relProd.name,
            total: relProd.price
          });
        }
      });
    });

    fullscreenDetailContent.querySelectorAll('[data-detail-id]').forEach(el => {
      el.addEventListener('click', () => {
        const nextPid = el.getAttribute('data-detail-id');
        openProductFullscreen(nextPid);
        fullscreenDetailOverlay.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    fullscreenDetailOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeProductFullscreen() {
    fullscreenDetailOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Render Cart Slide-Over
  function renderCartItems() {
    if (!cartDrawerBody) return;

    if (cart.length === 0) {
      cartDrawerBody.innerHTML = `
        <div style="text-align: center; padding: 50px 10px; color: #64748b;">
          <div style="font-size: 44px; margin-bottom: 12px;">🛒</div>
          <div style="font-size: 17px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Your cart is empty</div>
          <p style="font-size: 13.5px;">Add tech products to place your order via WhatsApp.</p>
        </div>
      `;
      if (cartWhatsappCheckoutBtn) {
        cartWhatsappCheckoutBtn.style.opacity = '0.5';
        cartWhatsappCheckoutBtn.style.pointerEvents = 'none';
      }
      return;
    }

    if (cartWhatsappCheckoutBtn) {
      cartWhatsappCheckoutBtn.style.opacity = '1';
      cartWhatsappCheckoutBtn.style.pointerEvents = 'auto';
      cartWhatsappCheckoutBtn.href = buildWhatsAppCartMessage(cart);
    }

    cartDrawerBody.innerHTML = cart.map(item => `
      <div class="cart-item-row">
        <img class="cart-item-img" src="${item.product.image}" alt="${item.product.name}" />
        <div class="cart-item-info">
          <div class="cart-item-name">${item.product.name}</div>
          <div class="cart-item-price">${formatUGX(item.product.price * item.quantity)}</div>
        </div>
        <div class="cart-qty-ctrl">
          <button class="cart-qty-btn" data-cart-minus="${item.productId}">-</button>
          <span style="font-size: 13px; font-weight: 700; min-width: 18px; text-align: center;">${item.quantity}</span>
          <button class="cart-qty-btn" data-cart-plus="${item.productId}">+</button>
          <button style="color: #ef4444; margin-left: 6px; font-size: 14px;" data-cart-delete="${item.productId}" title="Remove">✕</button>
        </div>
      </div>
    `).join('');

    cartDrawerBody.querySelectorAll('[data-cart-minus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-cart-minus');
        const item = cart.find(i => i.productId === pid);
        if (item) {
          if (item.quantity > 1) {
            item.quantity--;
          } else {
            cart = cart.filter(i => i.productId !== pid);
          }
          saveCart();
        }
      });
    });

    cartDrawerBody.querySelectorAll('[data-cart-plus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-cart-plus');
        const item = cart.find(i => i.productId === pid);
        if (item) {
          item.quantity++;
          saveCart();
        }
      });
    });

    cartDrawerBody.querySelectorAll('[data-cart-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-cart-delete');
        cart = cart.filter(i => i.productId !== pid);
        saveCart();
      });
    });
  }

  // ==========================================================================
  // STORE CONFIGURATION & CROSS-PAGE SYNCHRONIZATION
  // ==========================================================================

  function loadCustomProducts() {
    try {
      const savedCustom = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
      customProducts = savedCustom ? JSON.parse(savedCustom) : [];
      const savedDeleted = localStorage.getItem(DELETED_PIDS_KEY);
      deletedProductIds = savedDeleted ? JSON.parse(savedDeleted) : [];
    } catch (e) {
      customProducts = [];
      deletedProductIds = [];
    }
  }

  function loadStoreSettings() {
    try {
      const savedSettings = localStorage.getItem(STORE_SETTINGS_KEY);
      if (savedSettings) {
        const cfg = JSON.parse(savedSettings);
        if (cfg.whatsappNumber && typeof STORE_CONFIG !== 'undefined') {
          STORE_CONFIG.whatsappNumber = cfg.whatsappNumber;
        }
        if (cfg.location && typeof STORE_CONFIG !== 'undefined') {
          STORE_CONFIG.location = cfg.location;
        }
      }
    } catch(err) {}
  }

  // Real-Time Store Synchronization (Updates instantly when owner adds/edits items without page reload)
  try {
    const syncChannel = new BroadcastChannel('aura101_sync');
    syncChannel.onmessage = (msg) => {
      if (msg && msg.data && msg.data.type === 'STORE_UPDATED') {
        loadCustomProducts();
        loadStoreSettings();
        renderProducts();
        updateCartUI();
      }
    };
  } catch(e) {}

  window.addEventListener('storage', (e) => {
    if (e.key === CUSTOM_PRODUCTS_KEY || e.key === DELETED_PIDS_KEY || e.key === 'aura101_sync_timestamp') {
      loadCustomProducts();
      renderProducts();
      updateCartUI();
    } else if (e.key === STORE_SETTINGS_KEY) {
      loadStoreSettings();
      renderProducts();
    }
  });

  // Fast auto-sync poll (1.2s) & window focus check to guarantee instant live updates without reload
  let lastSyncTimestamp = localStorage.getItem('aura101_sync_timestamp') || '0';
  function checkForStoreSync() {
    try {
      const curStamp = localStorage.getItem('aura101_sync_timestamp');
      if (curStamp && curStamp !== lastSyncTimestamp) {
        lastSyncTimestamp = curStamp;
        loadCustomProducts();
        loadStoreSettings();
        renderProducts();
      }
    } catch(e) {}
  }
  setInterval(checkForStoreSync, 1200);
  window.addEventListener('focus', checkForStoreSync);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForStoreSync();
  });

  // Connect to shared backend server to retrieve live products for visitors & friends
  async function initServerCatalog() {
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.products)) {
          isServerOnline = true;
          serverProducts = data.products;
          lastCatalogTimestamp = data.timestamp || 0;
          if (Array.isArray(data.deletedProductIds)) deletedProductIds = data.deletedProductIds;
          if (data.settings) {
            if (data.settings.whatsappNumber && typeof STORE_CONFIG !== 'undefined') {
              STORE_CONFIG.whatsappNumber = data.settings.whatsappNumber;
            }
            if (data.settings.location && typeof STORE_CONFIG !== 'undefined') {
              STORE_CONFIG.location = data.settings.location;
            }
          }
          renderCategoryPills();
          initCategoriesHub();
          renderProducts();
          updateCartUI();
        }
      }
    } catch (e) {
      isServerOnline = false;
    }
  }

  // Periodic poll to fetch new items added by friend or owner in admin portal
  setInterval(async () => {
    if (!isServerOnline) return;
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        if (data && data.timestamp && data.timestamp > lastCatalogTimestamp) {
          lastCatalogTimestamp = data.timestamp;
          serverProducts = data.products || [];
          if (Array.isArray(data.deletedProductIds)) deletedProductIds = data.deletedProductIds;
          renderProducts();
          updateCartUI();
        }
      }
    } catch(e) {}
  }, 2500);

  function renderOwnerDashboard() {
    // Owner Dashboard is hosted independently on admin.html
  }

  function setupOwnerEventListeners() {
    // Storefront is purely customer-facing
  }

  function closeOwnerAuth() {}
  function closeOwnerDashboard() {}

  // ==========================================================================
  // SHOP LISTENERS & INITIALIZATION
  // ==========================================================================

  // Search input listener with live autocomplete dropdown
  if (headerSearchInput) {
    headerSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.classList.toggle('active', searchQuery.length > 0);
      }
      renderProducts();
      renderLiveSearchDropdown(searchQuery);
    });

    headerSearchInput.addEventListener('focus', () => {
      if (headerSearchInput.value.trim().length > 0) {
        renderLiveSearchDropdown(headerSearchInput.value);
      }
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      searchQuery = '';
      headerSearchInput.value = '';
      searchClearBtn.classList.remove('active');
      if (searchLiveDropdown) searchLiveDropdown.style.display = 'none';
      renderProducts();
    });
  }

  if (headerSearchForm) {
    headerSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (searchLiveDropdown) searchLiveDropdown.style.display = 'none';
      if (headerSearchInput) searchQuery = headerSearchInput.value.trim();
      renderProducts();
      // Scroll directly to show the searched items immediately
      if (productsGrid) {
        const topPos = productsGrid.getBoundingClientRect().top + window.scrollY - 130;
        window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
      }
    });
  }

  // Close live search dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (searchLiveDropdown && !e.target.closest('.header-search-wrap')) {
      searchLiveDropdown.style.display = 'none';
    }
  });

  // Escape key closes dropdown
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchLiveDropdown) {
      searchLiveDropdown.style.display = 'none';
    }
  });

  if (searchCategorySelect) {
    searchCategorySelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'all') {
        // When user picks "All Categories" from the search dropdown,
        // show ALL products (not the categories hub home page)
        activeCategory = 'all';
        showAllProducts = true;
        searchQuery = '';
        if (headerSearchInput) headerSearchInput.value = '';

        const heroSection = document.querySelector('.hero-showcase-section');
        const welcomeSection = document.querySelector('.welcome-section');
        const categoriesHub = document.getElementById('categoriesHubSection');
        const catalogEl = document.getElementById('catalogSection');

        if (heroSection) heroSection.style.display = 'none';
        if (welcomeSection) welcomeSection.style.display = 'none';
        if (categoriesHub) categoriesHub.style.display = 'none';
        if (catalogEl) catalogEl.style.display = '';

        if (sectionTitle) sectionTitle.textContent = 'All Products';

        renderProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Sync pills
        document.querySelectorAll('.category-pill-btn').forEach((btn, index) => {
          if (CATEGORIES[index] && CATEGORIES[index].id === 'all') {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      } else {
        showAllProducts = false;
        selectCategory(val, true);
      }
    });
  }

  // Budget Pills
  budgetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      budgetPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeBudget = pill.dataset.budget;
      renderProducts();
    });
  });

  // Sort select
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderProducts();
    });
  }

  // Explore Promo & Hero Showcase Banner
  if (explorePromoBtn) {
    explorePromoBtn.addEventListener('click', () => {
      selectCategory('phones');
      window.scrollTo({ top: productsGrid.offsetTop - 120, behavior: 'smooth' });
    });
  }

  const heroBanner = document.querySelector('.hero-showcase-banner');
  if (heroBanner) {
    heroBanner.style.cursor = 'pointer';
    heroBanner.addEventListener('click', () => {
      selectCategory('phones');
      window.scrollTo({ top: productsGrid.offsetTop - 120, behavior: 'smooth' });
    });
  }

  // ========== Sticky Header & Scroll Animations ==========
  const headerFixedWrap = document.getElementById('headerFixedWrap');
  const mainHeader = document.querySelector('.main-header');

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;

    // Header shrink, frosted glass, and electric glow animation on scroll
    if (scrollPos > 30) {
      headerFixedWrap?.classList.add('scrolled');
      mainHeader?.classList.add('scrolled');
    } else {
      headerFixedWrap?.classList.remove('scrolled');
      mainHeader?.classList.remove('scrolled');
      syncHeaderHeight();
    }

    // Floating Scroll to Top button visibility
    if (scrollPos > 300) {
      floatingScrollTop?.classList.add('visible');
    } else {
      floatingScrollTop?.classList.remove('visible');
    }
  }, { passive: true });

  floatingScrollTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Floating WhatsApp button with tracking
  floatingWhatsapp?.addEventListener('click', () => {
    logWhatsAppOrder({
      type: 'General WhatsApp Chat',
      items: 'Store Availability & Delivery Inquiry',
      total: 0
    });
    const waUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hello ${STORE_CONFIG.name}, I am browsing your online shop and have an inquiry about product availability and delivery.`)}`;
    window.open(waUrl, '_blank');
  });

  // Full-Screen Detail Close listeners
  fullscreenBackBtn?.addEventListener('click', closeProductFullscreen);
  fullscreenCloseBtn?.addEventListener('click', closeProductFullscreen);

  // Cart Drawer Toggles & Checkout Tracking
  openCartBtn?.addEventListener('click', () => cartDrawerOverlay?.classList.add('active'));
  mobileCartBtn?.addEventListener('click', () => cartDrawerOverlay?.classList.add('active'));
  cartDrawerCloseBtn?.addEventListener('click', () => cartDrawerOverlay?.classList.remove('active'));
  cartDrawerOverlay?.addEventListener('click', (e) => {
    if (e.target === cartDrawerOverlay) cartDrawerOverlay.classList.remove('active');
  });

  cartWhatsappCheckoutBtn?.addEventListener('click', () => {
    if (cart.length > 0) {
      const total = cart.reduce((s, i) => s + (i.product.price * i.quantity), 0);
      const summary = cart.map(i => `${i.product.name} (x${i.quantity})`).join(', ');
      logWhatsAppOrder({
        type: 'Cart Multi-Checkout',
        items: summary,
        total: total
      });
    }
  });

  // Mobile categories jump
  mobileCategoriesBtn?.addEventListener('click', () => {
    categoriesPillsContainer?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // URL parameters check (?product=...)
  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const prodParam = params.get('product');
    if (prodParam) {
      const found = getCatalog().find(p => p.id === prodParam);
      if (found) {
        setTimeout(() => openProductFullscreen(found.id), 300);
      }
    }
  }

  // Keyboard accessibility
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProductFullscreen();
      cartDrawerOverlay?.classList.remove('active');
      closeOwnerAuth();
      closeOwnerDashboard();
    }
  });

  // Expose global methods
  window.selectCategory = selectCategory;
  window.openProductFullscreen = openProductFullscreen;
  window.openOwnerPortal = function() { window.location.href = 'admin.html'; };
  window.getCatalog = getCatalog;

  // Dynamically sync fixed header height to body padding-top so content is never tucked underneath
  function syncHeaderHeight() {
    const fixedHeader = document.querySelector('.header-fixed-wrap');
    if (fixedHeader) {
      const h = fixedHeader.offsetHeight;
      if (h > 50) {
        document.body.style.paddingTop = `${h + 4}px`;
      }
    }
  }

  window.addEventListener('resize', syncHeaderHeight, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(syncHeaderHeight, 150));
  // Also sync after all resources (images, fonts) are fully loaded for accurate header measurement
  window.addEventListener('load', () => setTimeout(syncHeaderHeight, 50));

  // Boot Application
  renderCategoryPills();
  initCategoriesHub();
  renderProducts();
  updateCartUI();
  setupOwnerEventListeners();
  checkUrlParams();
  initServerCatalog();
  syncHeaderHeight();
  setTimeout(syncHeaderHeight, 100);
  setTimeout(syncHeaderHeight, 500);

})();