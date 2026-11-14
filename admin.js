// ==========================================================================
// AURA 101 TECH WORLD - Dedicated Store Owner & Admin Application Engine
// ==========================================================================

(function() {
  'use strict';

  // LocalStorage & SessionStorage Keys (Shared with Storefront)
  const CUSTOM_PRODUCTS_KEY = 'aura101_custom_products_v2';
  const DELETED_PIDS_KEY = 'aura101_deleted_pids_v2';
  const ORDERS_TRACKER_KEY = 'aura101_orders_tracker_v2';
  const OWNER_AUTH_SESSION_KEY = 'aura101_owner_auth_session';
  const STORE_SETTINGS_KEY = 'aura101_owner_settings_v2';
  const OWNER_PASS_KEY = 'aura101_owner_pass_v1';
  const DEFAULT_WA_NUMBER = "256759375151";

  // State Variables
  let customProducts = [];
  let deletedProductIds = [];
  let ordersLog = [];
  let ownerPassword = 'Aura123';
  let isServerOnline = false;
  let serverProducts = [];
  let lastCatalogTimestamp = 0;

  // Server Status Badge Helper
  function updateServerBadge(online) {
    const badge = document.getElementById('serverStatusBadge');
    const mBadge = document.getElementById('mobileServerStatusBadge');
    if (badge) {
      if (online) {
        badge.textContent = '🟢 Shared Server Active (Live Port Sync)';
        badge.style.background = 'rgba(34, 197, 94, 0.15)';
        badge.style.borderColor = 'rgba(34, 197, 94, 0.35)';
        badge.style.color = '#4ade80';
      } else {
        badge.textContent = '💾 Browser-Only (Local Storage)';
        badge.style.background = 'rgba(148, 163, 184, 0.15)';
        badge.style.borderColor = 'rgba(148, 163, 184, 0.35)';
        badge.style.color = '#94a3b8';
      }
    }
    if (mBadge) {
      if (online) {
        mBadge.textContent = '🟢 Server Active';
        mBadge.style.color = '#4ade80';
      } else {
        mBadge.textContent = '💾 Browser-Only';
        mBadge.style.color = '#94a3b8';
      }
    }
  }

  // Permanently Excluded Products (Legacy / Out of Stock)
  const PERMANENTLY_EXCLUDED = [
    'apple-magsafe-duo',
    'iphone-18-pro-max-burgundy',
    'iphone-18-pro-burgundy',
    'iphone-18-pro-max-512gb',
    'iphone-18-pro-512gb'
  ];

  // Load Initial State
  function loadState() {
    try {
      ownerPassword = localStorage.getItem(OWNER_PASS_KEY) || 'Aura123';
    } catch(e) {
      ownerPassword = 'Aura123';
    }

    try {
      const savedCustom = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
      customProducts = savedCustom ? JSON.parse(savedCustom) : [];
    } catch(e) {
      customProducts = [];
    }

    try {
      const savedDeleted = localStorage.getItem(DELETED_PIDS_KEY);
      deletedProductIds = savedDeleted ? JSON.parse(savedDeleted) : [];
    } catch(e) {
      deletedProductIds = [];
    }

    try {
      const savedOrders = localStorage.getItem(ORDERS_TRACKER_KEY);
      if (savedOrders) {
        ordersLog = JSON.parse(savedOrders);
      } else {
        // Sample realistic orders so dashboard demonstrates tracking utility immediately
        ordersLog = [
          {
            id: 'AURA-8492',
            timestamp: 'Nov 8, 11:42 AM',
            type: 'Direct Product Order',
            items: 'Apple iPhone 17 Pro Max 256GB',
            total: 5950000,
            ref: 'WA-IP17-8492'
          },
          {
            id: 'AURA-7120',
            timestamp: 'Nov 8, 10:15 AM',
            type: 'Cart Multi-Checkout',
            items: 'Sony WH-1000XM5 (x1), Anker 65W GaN Charger (x1)',
            total: 1870000,
            ref: 'CART-7120'
          },
          {
            id: 'AURA-6395',
            timestamp: 'Nov 7, 04:30 PM',
            type: 'General WhatsApp Chat',
            items: 'Store Availability & Delivery Inquiry',
            total: 0,
            ref: 'INQ-6395'
          }
        ];
        try { localStorage.setItem(ORDERS_TRACKER_KEY, JSON.stringify(ordersLog)); } catch (e) {}
      }
    } catch(e) {
      ordersLog = [];
    }

    // Load store configuration
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
    } catch(e) {}
  }

  // Get Aggregated Catalog (Uses live server catalog when connected, falls back to localStorage)
  function getCatalog() {
    if (isServerOnline && Array.isArray(serverProducts) && serverProducts.length > 0) {
      return [...serverProducts];
    }

    const baseProducts = (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []).filter(
      p => !PERMANENTLY_EXCLUDED.includes(p.id) && !deletedProductIds.includes(p.id)
    );

    const merged = [...customProducts];
    baseProducts.forEach(bp => {
      if (!merged.some(p => p.id === bp.id)) {
        merged.push(bp);
      }
    });

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

  function saveCustomProducts() {
    try {
      localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(customProducts));
      localStorage.setItem(DELETED_PIDS_KEY, JSON.stringify(deletedProductIds));
      const stamp = Date.now().toString();
      localStorage.setItem('aura101_sync_timestamp', stamp);

      // Broadcast instant live update to all storefront tabs
      try {
        const bc = new BroadcastChannel('aura101_sync');
        bc.postMessage({ type: 'STORE_UPDATED', timestamp: stamp });
        bc.close();
      } catch (e) {}

      // If connected to server, sync state to persistent store.json
      if (isServerOnline) {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customProducts, deletedProductIds })
        }).catch(err => console.warn('Background sync error:', err));
      }
    } catch (e) {
      console.error('Failed to save products:', e);
    }
  }

  // Connect to live server and auto-sync any local browser additions
  async function initServerSync() {
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.products)) {
          isServerOnline = true;
          lastCatalogTimestamp = data.timestamp || 0;
          serverProducts = data.products;
          deletedProductIds = data.deletedProductIds || [];
          if (Array.isArray(data.orders)) ordersLog = data.orders;
          if (data.settings) {
            if (data.settings.whatsappNumber && typeof STORE_CONFIG !== 'undefined') {
              STORE_CONFIG.whatsappNumber = data.settings.whatsappNumber;
              if (activeWhatsAppPill) activeWhatsAppPill.textContent = data.settings.whatsappNumber;
            }
            if (data.settings.location && typeof STORE_CONFIG !== 'undefined') {
              STORE_CONFIG.location = data.settings.location;
            }
            if (data.settings.ownerPassword) {
              ownerPassword = data.settings.ownerPassword;
            }
          }

          // Check if local browser has custom products not yet saved to server
          const localCustomStr = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
          const localDeletedStr = localStorage.getItem(DELETED_PIDS_KEY);
          let localCustom = [];
          let localDeleted = [];
          try { localCustom = localCustomStr ? JSON.parse(localCustomStr) : []; } catch(e) {}
          try { localDeleted = localDeletedStr ? JSON.parse(localDeletedStr) : []; } catch(e) {}

          const serverIds = new Set(serverProducts.map(p => p.id));
          const unsyncedCustom = localCustom.filter(p => p && p.id && !serverIds.has(p.id));
          const unsyncedDeleted = localDeleted.filter(id => !deletedProductIds.includes(id));

          if (unsyncedCustom.length > 0 || unsyncedDeleted.length > 0) {
            console.log(`Auto-uploading ${unsyncedCustom.length} local items to shared server...`);
            try {
              const syncRes = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customProducts: localCustom,
                  deletedProductIds: localDeleted
                })
              });
              if (syncRes.ok) {
                const syncData = await syncRes.json();
                if (syncData && syncData.products) {
                  serverProducts = syncData.products;
                  lastCatalogTimestamp = syncData.timestamp;
                }
                showToast(`🚀 Auto-synced ${unsyncedCustom.length} browser items to shared server!`);
              }
            } catch(e) {
              console.warn('Auto-sync error:', e);
            }
          }

          updateServerBadge(true);
          renderDashboard();
          return true;
        }
      }
    } catch (e) {
      console.log('Server not reachable, running in offline/localStorage mode');
    }
    isServerOnline = false;
    updateServerBadge(false);
    return false;
  }

  // Check Authentication
  function isOwnerAuthenticated() {
    try {
      return sessionStorage.getItem(OWNER_AUTH_SESSION_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function setOwnerAuthenticated(auth) {
    try {
      if (auth) {
        sessionStorage.setItem(OWNER_AUTH_SESSION_KEY, 'true');
      } else {
        sessionStorage.removeItem(OWNER_AUTH_SESSION_KEY);
      }
    } catch (e) {}
  }

  // Toast Notification
  function showToast(msg) {
    const toast = document.getElementById('adminToast');
    const toastText = document.getElementById('adminToastText');
    if (!toast || !toastText) return;
    toastText.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 3200);
  }

  // DOM Elements - Admin Views
  const adminLoginView = document.getElementById('adminLoginView');
  const adminDashboardView = document.getElementById('adminDashboardView');

  // Login Form Elements
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminPasswordInput = document.getElementById('adminPasswordInput');
  const toggleAdminPasswordBtn = document.getElementById('toggleAdminPasswordBtn');
  const adminLoginError = document.getElementById('adminLoginError');

  // Top Bar Actions
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const adminRefreshBtn = document.getElementById('adminRefreshBtn');
  const activeWhatsAppPill = document.getElementById('activeWhatsAppPill');

  // Tabs
  const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
  const adminTabPanes = document.querySelectorAll('.admin-tab-pane');

  // Metrics
  const metricTotalProducts = document.getElementById('metricTotalProducts');
  const metricTotalValue = document.getElementById('metricTotalValue');
  const metricTotalInquiries = document.getElementById('metricTotalInquiries');
  const metricPipelineValue = document.getElementById('metricPipelineValue');
  const adminTotalProductsCount = document.getElementById('adminTotalProductsCount');
  const adminOrdersCount = document.getElementById('adminOrdersCount');
  const adminRecentInquiriesList = document.getElementById('adminRecentInquiriesList');

  // Add Item Elements
  const adminAddProductForm = document.getElementById('adminAddProductForm');
  const newProdName = document.getElementById('newProdName');
  const newProdCategory = document.getElementById('newProdCategory');
  const newProdBrand = document.getElementById('newProdBrand');
  const newProdPrice = document.getElementById('newProdPrice');
  const newProdBadge = document.getElementById('newProdBadge');
  const newProdImage = document.getElementById('newProdImage');
  const newProdFileInput = document.getElementById('newProdFileInput');
  const newProdSpecs = document.getElementById('newProdSpecs');
  const newProdDesc = document.getElementById('newProdDesc');
  const resetAddProductBtn = document.getElementById('resetAddProductBtn');

  // Live Preview Elements
  const prevCardBadge = document.getElementById('prevCardBadge');
  const prevCardImg = document.getElementById('prevCardImg');
  const prevCardCategory = document.getElementById('prevCardCategory');
  const prevCardTitle = document.getElementById('prevCardTitle');
  const prevCardPrice = document.getElementById('prevCardPrice');
  const prevCardBackdrop = document.getElementById('prevCardBackdrop');

  // Manage Catalog Elements
  const adminProductsTableBody = document.getElementById('adminProductsTableBody');
  const adminCatalogSearch = document.getElementById('adminCatalogSearch');
  const adminCatalogCatFilter = document.getElementById('adminCatalogCatFilter');

  // Orders Elements
  const adminOrdersTableBody = document.getElementById('adminOrdersTableBody');
  const clearOrdersLogBtn = document.getElementById('clearOrdersLogBtn');

  // Settings Elements
  const adminSettingsForm = document.getElementById('adminSettingsForm');
  const cfgWhatsappNumber = document.getElementById('cfgWhatsappNumber');
  const cfgStoreLocation = document.getElementById('cfgStoreLocation');
  const cfgCurrentPassword = document.getElementById('cfgCurrentPassword');
  const cfgNewPassword = document.getElementById('cfgNewPassword');
  const cfgConfirmPassword = document.getElementById('cfgConfirmPassword');
  const cfgPwdMsg = document.getElementById('cfgPwdMsg');
  const testWhatsAppBtn = document.getElementById('testWhatsAppBtn');

  // Edit Product Modal
  const adminEditModal = document.getElementById('adminEditModal');
  const closeAdminEditBtn = document.getElementById('closeAdminEditBtn');
  const cancelAdminEditBtn = document.getElementById('cancelAdminEditBtn');
  const adminEditProductForm = document.getElementById('adminEditProductForm');
  const editProdId = document.getElementById('editProdId');
  const editProdName = document.getElementById('editProdName');
  const editProdCategory = document.getElementById('editProdCategory');
  const editProdBrand = document.getElementById('editProdBrand');
  const editProdPrice = document.getElementById('editProdPrice');
  const editProdBadge = document.getElementById('editProdBadge');
  const editProdImage = document.getElementById('editProdImage');
  const editProdFileInput = document.getElementById('editProdFileInput');
  const editProdImgPreview = document.getElementById('editProdImgPreview');
  const editProdSpecs = document.getElementById('editProdSpecs');
  const editProdDesc = document.getElementById('editProdDesc');

  // Quick Action Buttons
  const quickAddProductBtn = document.getElementById('quickAddProductBtn');
  const quickManageCatalogBtn = document.getElementById('quickManageCatalogBtn');
  const viewAllOrdersBtn = document.getElementById('viewAllOrdersBtn');

  // Render Authentication View State
  function syncViewState() {
    if (isOwnerAuthenticated()) {
      if (adminLoginView) adminLoginView.style.display = 'none';
      if (adminDashboardView) adminDashboardView.style.display = 'flex';
      renderDashboard();
    } else {
      if (adminLoginView) adminLoginView.style.display = 'flex';
      if (adminDashboardView) adminDashboardView.style.display = 'none';
      if (adminPasswordInput) {
        adminPasswordInput.value = '';
        setTimeout(() => adminPasswordInput.focus(), 100);
      }
      if (adminLoginError) adminLoginError.textContent = '';
    }
  }

  // Populate Category Dropdowns
  function populateCategoryDropdowns() {
    if (typeof CATEGORIES === 'undefined') return;
    const cats = CATEGORIES.filter(c => c.id !== 'all');

    if (newProdCategory && newProdCategory.options.length <= 1) {
      newProdCategory.innerHTML = cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    }

    if (adminCatalogCatFilter && adminCatalogCatFilter.options.length <= 1) {
      adminCatalogCatFilter.innerHTML = `<option value="all">All Categories</option>` +
        cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    }
  }

  // Render Dashboard
  function renderDashboard() {
    loadState();
    const catalog = getCatalog();
    const totalCount = catalog.length;
    const totalInventoryValue = catalog.reduce((sum, p) => sum + (p.price || 0), 0);
    const totalInquiriesCount = ordersLog.length;
    const totalPipelineValue = ordersLog.reduce((sum, o) => sum + (o.total || 0), 0);

    // Update Counters
    if (metricTotalProducts) metricTotalProducts.textContent = totalCount;
    if (metricTotalValue) metricTotalValue.textContent = typeof formatUGX === 'function' ? formatUGX(totalInventoryValue) : `UGX ${totalInventoryValue.toLocaleString()}`;
    if (metricTotalInquiries) metricTotalInquiries.textContent = totalInquiriesCount;
    if (metricPipelineValue) metricPipelineValue.textContent = typeof formatUGX === 'function' ? formatUGX(totalPipelineValue) : `UGX ${totalPipelineValue.toLocaleString()}`;
    if (adminTotalProductsCount) adminTotalProductsCount.textContent = totalCount;
    if (adminOrdersCount) adminOrdersCount.textContent = totalInquiriesCount;

    // Active WhatsApp in Topbar & Mobile Status Strip
    const waNumber = (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.whatsappNumber) || DEFAULT_WA_NUMBER;
    if (activeWhatsAppPill) {
      activeWhatsAppPill.textContent = waNumber;
    }
    const mobileActiveWhatsApp = document.getElementById('mobileActiveWhatsApp');
    if (mobileActiveWhatsApp) {
      mobileActiveWhatsApp.textContent = waNumber;
    }

    // Populate Settings Inputs
    if (cfgWhatsappNumber) cfgWhatsappNumber.value = waNumber;
    if (cfgStoreLocation) cfgStoreLocation.value = (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.location) || 'Kampala, Uganda • Countrywide Delivery';

    // Render Recent Inquiries
    renderRecentInquiries();

    // Render Manage Products Table
    renderProductsTable();

    // Render Orders Log Table
    renderOrdersTable();

    // Populate category dropdowns
    populateCategoryDropdowns();
  }

  // Render Recent Inquiries List in Overview
  function renderRecentInquiries() {
    if (!adminRecentInquiriesList) return;
    if (ordersLog.length === 0) {
      adminRecentInquiriesList.innerHTML = `
        <div style="text-align: center; padding: 24px; color: #64748b; font-size: 13px;">
          No customer inquiries logged yet. WhatsApp clicks on the storefront will appear here automatically!
        </div>
      `;
      return;
    }

    adminRecentInquiriesList.innerHTML = ordersLog.slice(0, 5).map(o => {
      let badgeClass = 'order';
      if (o.type && o.type.includes('Cart')) badgeClass = 'cart';
      if (o.type && (o.type.includes('Chat') || o.type.includes('Inquiry'))) badgeClass = 'inq';

      const priceDisplay = o.total > 0 ? (typeof formatUGX === 'function' ? formatUGX(o.total) : `UGX ${o.total.toLocaleString()}`) : 'Customer Chat';

      return `
        <div class="owner-recent-item">
          <div class="recent-top-row">
            <span class="recent-badge ${badgeClass}">${o.type || 'Inquiry'}</span>
            <span class="recent-item-price">${priceDisplay}</span>
          </div>
          <div class="recent-item-name">${o.items}</div>
          <div class="recent-item-sub">⏱️ ${o.timestamp} • Ref: ${o.id || o.ref}</div>
        </div>
      `;
    }).join('');
  }

  // Render Products Table
  function renderProductsTable() {
    if (!adminProductsTableBody) return;
    const catalog = getCatalog();
    const query = (adminCatalogSearch?.value || '').toLowerCase().trim();
    const catFilter = adminCatalogCatFilter?.value || 'all';

    const filtered = catalog.filter(p => {
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (query !== '') {
        const inName = p.name ? p.name.toLowerCase().includes(query) : false;
        const inBrand = p.brand ? p.brand.toLowerCase().includes(query) : false;
        if (!inName && !inBrand) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      adminProductsTableBody.innerHTML = `
        <tr><td colspan="7" style="text-align: center; padding: 28px; color: #64748b; font-size: 13.5px;">No products match the filter.</td></tr>
      `;
      return;
    }

    adminProductsTableBody.innerHTML = filtered.map(p => {
      const isCustom = p.id.startsWith('aura-custom-') || customProducts.some(cp => cp.id === p.id);
      const priceText = typeof formatUGX === 'function' ? formatUGX(p.price) : `UGX ${p.price.toLocaleString()}`;
      return `
        <tr>
          <td>
            <div class="owner-table-prod-cell">
              <img src="${p.image}" alt="${p.name}" class="owner-table-thumb" onerror="this.src='assets/images/logo.png'" />
              <div>
                <strong style="font-size: 13.5px; color: #ffffff;">${p.name}</strong>
                <div style="font-size: 11.5px; color: #94a3b8;">${p.specsSummary || 'Standard retail unit'}</div>
              </div>
            </div>
          </td>
          <td><span style="color: #cbd5e1;">${p.categoryName || p.category}</span></td>
          <td>${p.brand || 'Original'}</td>
          <td style="color: #4ade80; font-weight: 800;">${priceText}</td>
          <td><span style="color: #22c55e; font-weight: 700;">🟢 Active</span></td>
          <td><span class="${isCustom ? 'owner-badge-custom' : 'owner-badge-default'}">${isCustom ? 'Owner Added' : 'Factory'}</span></td>
          <td>
            <div style="display: flex; gap: 8px;">
              <button class="owner-action-edit-btn" data-edit-pid="${p.id}" title="Edit product details">
                ✏️ Edit
              </button>
              <button class="owner-action-del-btn" data-del-pid="${p.id}" title="Remove this item from store">
                🗑️ Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Edit Listeners
    adminProductsTableBody.querySelectorAll('[data-edit-pid]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-edit-pid');
        openEditModal(pid);
      });
    });

    // Attach Delete Listeners
    adminProductsTableBody.querySelectorAll('[data-del-pid]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pid = btn.getAttribute('data-del-pid');
        if (confirm('Are you sure you want to remove this item from the live store?')) {
          if (isServerOnline) {
            try {
              await fetch(`/api/products/${encodeURIComponent(pid)}`, { method: 'DELETE' });
              serverProducts = serverProducts.filter(p => p.id !== pid);
            } catch(e) {
              console.warn('Failed to delete on server:', e);
            }
          }
          customProducts = customProducts.filter(p => p.id !== pid);
          if (!deletedProductIds.includes(pid)) {
            deletedProductIds.push(pid);
          }
          saveCustomProducts();
          renderDashboard();
          showToast('Product removed from live store.');
        }
      });
    });
  }

  // Render Orders Log Table
  function renderOrdersTable() {
    if (!adminOrdersTableBody) return;
    if (ordersLog.length === 0) {
      adminOrdersTableBody.innerHTML = `
        <tr><td colspan="6" style="text-align: center; padding: 24px; color: #64748b;">No customer leads or WhatsApp checkouts logged yet.</td></tr>
      `;
      return;
    }

    const waNumber = (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.whatsappNumber) || DEFAULT_WA_NUMBER;

    adminOrdersTableBody.innerHTML = ordersLog.map(o => {
      const priceText = o.total > 0 ? (typeof formatUGX === 'function' ? formatUGX(o.total) : `UGX ${o.total.toLocaleString()}`) : 'Customer Chat';
      return `
        <tr>
          <td><strong>${o.id || o.ref}</strong></td>
          <td style="color: #94a3b8; font-size: 12px;">${o.timestamp}</td>
          <td><span class="owner-badge-custom">${o.type || 'WhatsApp'}</span></td>
          <td>${o.items}</td>
          <td style="color: #4ade80; font-weight: 700;">${priceText}</td>
          <td>
            <a href="https://wa.me/${waNumber}?text=${encodeURIComponent(`AURA 101 Order Follow-up ${o.id || o.ref}: ${o.items}`)}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-weight: 600; text-decoration: underline;">
              Open WhatsApp
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Image Upload Helper with Canvas Compression
  // Optimizes uploaded photos cleanly so the pure image covers the card area edge-to-edge
  function handleImageFileUpload(file, targetInput, previewImg, isEdit = false) {
    if (!file) return;
    showToast('⏳ Processing photo...');
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const maxDim = 900;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.90);

        if (targetInput) targetInput.value = compressedDataUrl;
        if (previewImg) previewImg.src = compressedDataUrl;
        if (!isEdit) updateLivePreview();
        showToast('📷 Photo loaded & ready!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Live Card Preview in Add Product Tab
  function updateLivePreview() {
    if (!prevCardTitle) return;
    const name = newProdName?.value.trim() || 'Samsung Galaxy S25 Ultra 512GB';
    const priceVal = parseInt(newProdPrice?.value, 10) || 4500000;
    const badge = newProdBadge?.value || 'Hot Deal';
    const catId = newProdCategory?.value || 'phones';
    const imgUrl = newProdImage?.value.trim() || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80';

    const catObj = typeof CATEGORIES !== 'undefined' ? CATEGORIES.find(c => c.id === catId) : null;
    const catName = catObj ? catObj.name : 'Tech Products';

    prevCardTitle.textContent = name;
    prevCardPrice.textContent = typeof formatUGX === 'function' ? formatUGX(priceVal) : `UGX ${priceVal.toLocaleString()}`;
    if (prevCardBadge) prevCardBadge.textContent = badge;
    if (prevCardCategory) prevCardCategory.textContent = catName;
    if (prevCardImg) prevCardImg.src = imgUrl;
    if (prevCardBackdrop) prevCardBackdrop.style.backgroundImage = `url('${imgUrl}')`;
  }

  // Open Edit Product Modal
  function openEditModal(pid) {
    const catalog = getCatalog();
    const prod = catalog.find(p => p.id === pid);
    if (!prod) return;

    if (editProdCategory && typeof CATEGORIES !== 'undefined') {
      editProdCategory.innerHTML = '';
      CATEGORIES.filter(c => c.id !== 'all').forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.icon} ${c.name}`;
        if (c.id === prod.category) opt.selected = true;
        editProdCategory.appendChild(opt);
      });
    }

    if (editProdId) editProdId.value = prod.id;
    if (editProdName) editProdName.value = prod.name || '';
    if (editProdBrand) editProdBrand.value = prod.brand || '';
    if (editProdPrice) editProdPrice.value = prod.price || 0;
    if (editProdBadge) editProdBadge.value = prod.badge || 'Hot Deal';
    if (editProdImage) editProdImage.value = prod.image || '';
    if (editProdSpecs) editProdSpecs.value = prod.specsSummary || (prod.specs ? Object.entries(prod.specs).map(([k,v]) => `${k}: ${v}`).join(' • ') : '');
    if (editProdDesc) editProdDesc.value = prod.description || '';
    if (editProdImgPreview) editProdImgPreview.src = prod.image || 'assets/images/logo.png';

    adminEditModal?.classList.add('active');
  }

  function closeEditModal() {
    adminEditModal?.classList.remove('active');
  }

  // Setup Event Listeners
  function initEventListeners() {
    // 1. Login Form Submit
    adminLoginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = adminPasswordInput.value.trim();
      loadState(); // Ensure fresh password check

      if (entered === ownerPassword || entered.toLowerCase() === ownerPassword.toLowerCase()) {
        setOwnerAuthenticated(true);
        if (adminLoginError) adminLoginError.textContent = '';
        showToast('🔓 Welcome, Store Owner! Admin Portal Unlocked.');
        syncViewState();
      } else {
        if (adminLoginError) {
          adminLoginError.textContent = '❌ Incorrect master password. Please verify and try again.';
          adminPasswordInput.classList.add('shake');
          setTimeout(() => adminPasswordInput.classList.remove('shake'), 400);
        }
      }
    });

    // Toggle Login Password Visibility
    toggleAdminPasswordBtn?.addEventListener('click', () => {
      if (!adminPasswordInput) return;
      const isPwd = adminPasswordInput.type === 'password';
      adminPasswordInput.type = isPwd ? 'text' : 'password';
      toggleAdminPasswordBtn.textContent = isPwd ? '🙈' : '👁️';
    });

    // 2. Logout Button
    adminLogoutBtn?.addEventListener('click', () => {
      if (confirm('Lock admin dashboard and logout?')) {
        setOwnerAuthenticated(false);
        syncViewState();
        showToast('🔒 Admin session locked successfully.');
      }
    });

    // 3. Refresh / Sync Button
    adminRefreshBtn?.addEventListener('click', () => {
      renderDashboard();
      showToast('🔄 Store catalog & analytics synchronized.');
    });

    // 4. Tab Navigation
    adminTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        adminTabBtns.forEach(b => b.classList.remove('active'));
        adminTabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`pane-${tab}`)?.classList.add('active');

        if (tab === 'manage-items') renderProductsTable();
      });
    });

    // 5. Quick Actions
    quickAddProductBtn?.addEventListener('click', () => {
      document.querySelector('.admin-tab-btn[data-tab="add-item"]')?.click();
    });

    quickManageCatalogBtn?.addEventListener('click', () => {
      document.querySelector('.admin-tab-btn[data-tab="manage-items"]')?.click();
    });

    viewAllOrdersBtn?.addEventListener('click', () => {
      document.querySelector('.admin-tab-btn[data-tab="orders-log"]')?.click();
    });

    // 6. Add Product File Input & Live Preview
    newProdFileInput?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleImageFileUpload(file, newProdImage, prevCardImg, false);
    });

    [newProdName, newProdPrice, newProdCategory, newProdBadge, newProdImage].forEach(input => {
      input?.addEventListener('input', updateLivePreview);
      input?.addEventListener('change', updateLivePreview);
    });

    // Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (newProdImage) {
          newProdImage.value = btn.dataset.img;
          updateLivePreview();
        }
      });
    });

    resetAddProductBtn?.addEventListener('click', () => {
      setTimeout(updateLivePreview, 100);
    });

    // 7. Add Product Form Submit
    adminAddProductForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = newProdName.value.trim();
      const priceVal = parseInt(newProdPrice.value, 10);
      const catId = newProdCategory.value;
      const brand = newProdBrand.value.trim() || 'Genuine Tech';
      const badge = newProdBadge.value;
      const image = newProdImage.value.trim() || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80';
      const specsSummary = newProdSpecs.value.trim();
      const description = newProdDesc.value.trim() || `${name} - Authentic premium product available with fast delivery across Kampala and all regions of Uganda.`;

      const catObj = typeof CATEGORIES !== 'undefined' ? CATEGORIES.find(c => c.id === catId) : null;
      const categoryName = catObj ? catObj.name : 'Tech Products';

      let newProduct = {
        id: 'aura-custom-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        name: name,
        category: catId,
        categoryName: categoryName,
        brand: brand,
        price: priceVal,
        badge: badge,
        image: image,
        specsSummary: specsSummary,
        description: description,
        rating: 5.0,
        inStock: true
      };

      if (isServerOnline) {
        showToast('⏳ Publishing to shared server...');
        try {
          const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.product) {
              newProduct = data.product;
              serverProducts.unshift(newProduct);
              lastCatalogTimestamp = Date.now();
            }
          }
        } catch(err) {
          console.warn('Failed to publish to server:', err);
        }
      }

      customProducts.unshift(newProduct);
      saveCustomProducts();
      renderDashboard();

      showToast(`🎉 Published to Live Store: ${name}`);

      adminAddProductForm.reset();
      updateLivePreview();

      // Switch to Manage Items
      const manageTab = document.querySelector('.admin-tab-btn[data-tab="manage-items"]');
      manageTab?.click();
    });

    // 8. Manage Products Filters
    adminCatalogSearch?.addEventListener('input', renderProductsTable);
    adminCatalogCatFilter?.addEventListener('change', renderProductsTable);

    // 9. Edit Product Modal Listeners
    closeAdminEditBtn?.addEventListener('click', closeEditModal);
    cancelAdminEditBtn?.addEventListener('click', closeEditModal);
    adminEditModal?.addEventListener('click', (e) => {
      if (e.target === adminEditModal) closeEditModal();
    });

    editProdFileInput?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleImageFileUpload(file, editProdImage, editProdImgPreview, true);
    });

    editProdImage?.addEventListener('input', () => {
      if (editProdImgPreview) editProdImgPreview.src = editProdImage.value.trim() || 'assets/images/logo.png';
    });

    adminEditProductForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pid = editProdId.value;
      const name = editProdName.value.trim();
      const catId = editProdCategory.value;
      const brand = editProdBrand.value.trim() || 'Genuine Tech';
      const priceVal = parseInt(editProdPrice.value, 10);
      const badge = editProdBadge.value;
      const image = editProdImage.value.trim() || 'assets/images/logo.png';
      const specsSummary = editProdSpecs.value.trim();
      const description = editProdDesc.value.trim();

      const catObj = typeof CATEGORIES !== 'undefined' ? CATEGORIES.find(c => c.id === catId) : null;
      const categoryName = catObj ? catObj.name : 'Tech Products';

      let updatedProduct = {
        id: pid,
        name: name,
        category: catId,
        categoryName: categoryName,
        brand: brand,
        price: priceVal,
        badge: badge,
        image: image,
        specsSummary: specsSummary,
        description: description,
        rating: 5.0,
        inStock: true
      };

      if (isServerOnline) {
        try {
          const res = await fetch(`/api/products/${encodeURIComponent(pid)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct)
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.product) {
              updatedProduct = data.product;
              const sIdx = serverProducts.findIndex(p => p.id === pid);
              if (sIdx >= 0) {
                serverProducts[sIdx] = updatedProduct;
              } else {
                serverProducts.unshift(updatedProduct);
              }
              lastCatalogTimestamp = Date.now();
            }
          }
        } catch(err) {
          console.warn('Failed to update product on server:', err);
        }
      }

      const existingIdx = customProducts.findIndex(p => p.id === pid);
      if (existingIdx >= 0) {
        customProducts[existingIdx] = updatedProduct;
      } else {
        customProducts.push(updatedProduct);
      }

      saveCustomProducts();
      renderDashboard();
      closeEditModal();
      showToast(`✅ Saved changes to "${name}"!`);
    });

    // 10. Clear Orders Log
    clearOrdersLogBtn?.addEventListener('click', async () => {
      if (confirm('Clear all tracked customer WhatsApp inquiries?')) {
        if (isServerOnline) {
          try { await fetch('/api/orders', { method: 'DELETE' }); } catch(e) {}
        }
        ordersLog = [];
        try { localStorage.setItem(ORDERS_TRACKER_KEY, JSON.stringify(ordersLog)); } catch (e) {}
        renderDashboard();
        showToast('Orders log cleared.');
      }
    });

    // 11. Settings Form
    document.querySelectorAll('.cfg-pwd-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const inp = document.getElementById(targetId);
        if (!inp) return;
        inp.type = inp.type === 'password' ? 'text' : 'password';
        btn.textContent = inp.type === 'password' ? '👁️' : '🙈';
      });
    });

    // Generate complete data.js code from current active catalog
    function generateDataJsContent() {
      const currentCatalog = getCatalog();
      const cfg = {
        name: (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.name) || "AURA 101 TECH WORLD",
        tagline: (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.tagline) || "Your Tech, Our Priority.",
        whatsappNumber: (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.whatsappNumber) || DEFAULT_WA_NUMBER,
        displayPhone: (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.displayPhone) || "+256 759 375 151",
        location: (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.location) || "Kampala, Uganda • Countrywide Delivery",
        currency: "UGX",
        exchangeRateNotice: "Online Store • Fast delivery across Kampala & all regions of Uganda • WhatsApp Orders",
        trustBullets: "Genuine Tech • Fast Delivery across Uganda • Cash on delivery / Mobile Money available • 100% Original Products"
      };

      const cats = typeof CATEGORIES !== 'undefined' ? CATEGORIES : [];

      return `// AURA 101 TECH WORLD - Product Catalog Data
// Currency: UGX (Ugandan Shilling)
// Updated from Admin Control Center

const STORE_CONFIG = ${JSON.stringify(cfg, null, 2)};
if (typeof window !== 'undefined') window.STORE_CONFIG = STORE_CONFIG;

const CATEGORIES = ${JSON.stringify(cats, null, 2)};

const PRODUCTS = ${JSON.stringify(currentCatalog, null, 2)};

// Format UGX Currency
function formatUGX(amount) {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  return "UGX " + amount.toLocaleString('en-US');
}

// Generate Lead Reference
function generateLeadRef() {
  const chars = '0123456789abcdef';
  let ref = 'AURA-';
  for (let i = 0; i < 8; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
}

// Build WhatsApp Product Message
function buildWhatsAppProductMessage(product, selectedSpecs = {}) {
  const ref = generateLeadRef();
  const phone = STORE_CONFIG.whatsappNumber;
  const priceFormatted = formatUGX(product.price);
  
  let specsText = '';
  if (selectedSpecs.color) specsText += \`[Color: \${selectedSpecs.color}]\`;
  if (selectedSpecs.storage) specsText += \` [Storage: \${selectedSpecs.storage}]\`;

  const baseUrl = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && (!window.location.href || !window.location.href.startsWith('file:'))) 
    ? \`\${window.location.origin}\${window.location.pathname}\` 
    : 'https://aura101techworld.com/';

  const message = \`Hello \${STORE_CONFIG.name}, I would like to order \${product.name}\${specsText ? ' – ' + specsText : ''}. Listed price: \${priceFormatted}. Please confirm availability, the final total and delivery options.
Product link: \${baseUrl}?product=\${product.id}
Lead reference: \${ref}
Lead source: Website\`;

  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(message)}\`;
}

// Build WhatsApp Cart Message
function buildWhatsAppCartMessage(cartItems, customerNote = '') {
  const ref = generateLeadRef();
  const phone = STORE_CONFIG.whatsappNumber;
  
  let total = 0;
  let itemsList = '';
  
  cartItems.forEach((item, index) => {
    const itemTotal = item.product.price * item.quantity;
    total += itemTotal;
    itemsList += \`\${index + 1}. \${item.product.name} (x\${item.quantity}) - \${formatUGX(itemTotal)}\\n\`;
  });

  const message = \`Hello \${STORE_CONFIG.name}, I would like to order the following items from my cart:

\${itemsList}
Total Amount: \${formatUGX(total)}
Delivery: Nationwide Delivery / Kampala Pickup
\${customerNote ? 'Note: ' + customerNote + '\\n' : ''}Lead reference: \${ref}
Lead source: Website Cart Checkout
Please confirm item availability and payment details. Thank you!\`;

  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(message)}\`;
}

if (typeof window !== 'undefined') {
  window.STORE_CONFIG = STORE_CONFIG;
  window.CATEGORIES = CATEGORIES;
  window.PRODUCTS = PRODUCTS;
  window.formatUGX = formatUGX;
  window.buildWhatsAppProductMessage = buildWhatsAppProductMessage;
  window.buildWhatsAppCartMessage = buildWhatsAppCartMessage;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    STORE_CONFIG, 
    CATEGORIES, 
    PRODUCTS, 
    formatUGX, 
    buildWhatsAppProductMessage, 
    buildWhatsAppCartMessage 
  };
}
`;
    }

    // 1. Download updated data.js
    const downloadDataJsBtn = document.getElementById('downloadDataJsBtn');
    downloadDataJsBtn?.addEventListener('click', () => {
      try {
        const content = generateDataJsContent();
        const blob = new Blob([content], { type: 'application/javascript;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (syncLocalStatus) {
          syncLocalStatus.textContent = '✅ Downloaded data.js! Save/replace it in your Phone_web folder so npx serve loads it immediately!';
          syncLocalStatus.style.color = '#4ade80';
        }
        showToast('📥 Downloaded data.js file!');
      } catch(e) {
        showToast('❌ Export failed: ' + e.message);
      }
    });

    // 2. Copy data.js code to clipboard
    const copyDataJsBtn = document.getElementById('copyDataJsBtn');
    copyDataJsBtn?.addEventListener('click', async () => {
      try {
        const content = generateDataJsContent();
        await navigator.clipboard.writeText(content);
        if (syncLocalStatus) {
          syncLocalStatus.textContent = '✅ Copied data.js code to clipboard! You can paste it into data.js in VS Code.';
          syncLocalStatus.style.color = '#4ade80';
        }
        showToast('📋 Copied data.js to clipboard!');
      } catch(e) {
        showToast('❌ Copy failed: ' + e.message);
      }
    });

    // Manual Upload Browser Products to Server
    const syncLocalToServerBtn = document.getElementById('syncLocalToServerBtn');
    const syncLocalStatus = document.getElementById('syncLocalStatus');
    syncLocalToServerBtn?.addEventListener('click', async () => {
      if (!isServerOnline) {
        if (syncLocalStatus) {
          syncLocalStatus.textContent = '❌ Server not reachable. Run: node server.js';
          syncLocalStatus.style.color = '#f87171';
        }
        showToast('❌ Server is not reachable.');
        return;
      }
      try {
        if (syncLocalStatus) {
          syncLocalStatus.textContent = '⏳ Uploading to shared server...';
          syncLocalStatus.style.color = '#38bdf8';
        }
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customProducts,
            deletedProductIds,
            settings: {
              whatsappNumber: (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.whatsappNumber) || DEFAULT_WA_NUMBER,
              location: (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.location) || ''
            }
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.products) {
            serverProducts = data.products;
            lastCatalogTimestamp = data.timestamp || Date.now();
          }
          renderDashboard();
          if (syncLocalStatus) {
            syncLocalStatus.textContent = `✅ Synced ${data.productsCount || 0} products to shared server!`;
            syncLocalStatus.style.color = '#4ade80';
          }
          showToast(`🚀 All browser products uploaded to server!`);
        }
      } catch (err) {
        if (syncLocalStatus) {
          syncLocalStatus.textContent = '❌ Error: ' + err.message;
          syncLocalStatus.style.color = '#f87171';
        }
      }
    });

    adminSettingsForm?.addEventListener('submit', (e) => {
      e.preventDefault();

      // WhatsApp Number
      const rawNum = cfgWhatsappNumber.value.trim().replace(/[^0-9]/g, '');
      const num = rawNum.length >= 9 ? rawNum : DEFAULT_WA_NUMBER;
      if (typeof STORE_CONFIG !== 'undefined') {
        STORE_CONFIG.whatsappNumber = num;
      }
      if (cfgWhatsappNumber) cfgWhatsappNumber.value = num;

      // Delivery Location
      const loc = cfgStoreLocation.value.trim();
      if (loc && typeof STORE_CONFIG !== 'undefined') {
        STORE_CONFIG.location = loc;
      }

      // Password Change
      const curPwd = cfgCurrentPassword ? cfgCurrentPassword.value : '';
      const newPwd = cfgNewPassword ? cfgNewPassword.value : '';
      const conPwd = cfgConfirmPassword ? cfgConfirmPassword.value : '';
      let pwdMessage = '';
      let pwdOk = true;

      if (newPwd || conPwd || curPwd) {
        if (!curPwd) {
          pwdMessage = '❌ Please enter your current password to change it.';
          pwdOk = false;
        } else if (curPwd !== ownerPassword) {
          pwdMessage = '❌ Current password is incorrect.';
          pwdOk = false;
        } else if (!newPwd) {
          pwdMessage = '❌ Please enter a new password.';
          pwdOk = false;
        } else if (newPwd.length < 4) {
          pwdMessage = '❌ New password must be at least 4 characters.';
          pwdOk = false;
        } else if (newPwd !== conPwd) {
          pwdMessage = '❌ New passwords do not match.';
          pwdOk = false;
        } else {
          ownerPassword = newPwd;
          try { localStorage.setItem(OWNER_PASS_KEY, newPwd); } catch(err) {}
          pwdMessage = '✅ Password changed successfully!';
          if (cfgCurrentPassword) cfgCurrentPassword.value = '';
          if (cfgNewPassword) cfgNewPassword.value = '';
          if (cfgConfirmPassword) cfgConfirmPassword.value = '';
        }
      }

      if (cfgPwdMsg) {
        cfgPwdMsg.textContent = pwdMessage;
        cfgPwdMsg.style.color = pwdOk && pwdMessage ? '#4ade80' : '#f87171';
      }

      if (!pwdOk) return;

      // Sync settings to server
      if (isServerOnline) {
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            whatsappNumber: num,
            location: loc,
            ownerPassword: ownerPassword
          })
        }).catch(err => console.warn('Server settings sync error:', err));
      }

      // Save settings to localStorage & broadcast
      try {
        localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify({
          whatsappNumber: num,
          location: loc
        }));
        const stamp = Date.now().toString();
        localStorage.setItem('aura101_sync_timestamp', stamp);
        try {
          const bc = new BroadcastChannel('aura101_sync');
          bc.postMessage({ type: 'STORE_UPDATED', timestamp: stamp });
          bc.close();
        } catch (e) {}
      } catch (err) {}

      renderDashboard();
      showToast('✅ Store settings & WhatsApp configuration saved!');
    });

    testWhatsAppBtn?.addEventListener('click', () => {
      const waNumber = (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.whatsappNumber) || DEFAULT_WA_NUMBER;
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello ${STORE_CONFIG.name}, testing store WhatsApp order connection from Admin Portal.`)}`;
      window.open(waUrl, '_blank');
    });

    // 12. Storage Event Listener (Instant Multi-Tab Sync with Storefront)
    window.addEventListener('storage', (e) => {
      if ([CUSTOM_PRODUCTS_KEY, DELETED_PIDS_KEY, ORDERS_TRACKER_KEY, STORE_SETTINGS_KEY].includes(e.key)) {
        renderDashboard();
      }
    });

    // ESC closes edit modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeEditModal();
    });

    // Periodic Server Polling (every 2.5s) to receive products added by friend
    setInterval(async () => {
      if (!isServerOnline) return;
      try {
        const res = await fetch('/api/catalog');
        if (res.ok) {
          const data = await res.json();
          if (data && data.timestamp && data.timestamp > lastCatalogTimestamp) {
            lastCatalogTimestamp = data.timestamp;
            serverProducts = data.products || [];
            deletedProductIds = data.deletedProductIds || [];
            if (Array.isArray(data.orders)) ordersLog = data.orders;
            renderDashboard();
          }
        }
      } catch (e) {}
    }, 2500);
  }

  // Initialize
  loadState();
  initEventListeners();
  syncViewState();
  initServerSync();

})();
