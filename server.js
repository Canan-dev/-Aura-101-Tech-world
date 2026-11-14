// ==========================================================================
// AURA 101 TECH WORLD - Centralized Shared Application & Inventory Server
// ==========================================================================
// Powered by pure Node.js (Zero external dependencies required).
// Persists all product additions, edits, deletions, image uploads,
// and WhatsApp inquiries to `data/store.json`.
// Enables real-time catalog synchronization when sharing a port.
// ==========================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const UPLOADS_DIR = path.join(ROOT_DIR, 'assets', 'images', 'uploads');

// Ensure necessary directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// MIME Types mapping
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

// Permanently excluded legacy products
const PERMANENTLY_EXCLUDED = [
  'apple-magsafe-duo',
  'iphone-18-pro-max-burgundy',
  'iphone-18-pro-burgundy',
  'iphone-18-pro-max-512gb',
  'iphone-18-pro-max-1tb',
  'iphone-18-pro-512gb',
  'iphone-duo-512gb'
];

let storeState = null;

function syncToDataJs(state) {
  try {
    let existingCategories = [];
    try {
      const dataModule = require(path.join(ROOT_DIR, 'data.js'));
      if (Array.isArray(dataModule.CATEGORIES)) {
        existingCategories = dataModule.CATEGORIES;
      }
    } catch(e) {}

    const cfg = {
      name: "AURA 101 TECH WORLD",
      tagline: "Your Tech, Our Priority.",
      whatsappNumber: (state.settings && state.settings.whatsappNumber) || "256759375151",
      displayPhone: "+256 759 375 151",
      location: (state.settings && state.settings.location) || "Kampala, Uganda • Countrywide Delivery",
      currency: "UGX",
      exchangeRateNotice: "Online Store • Fast delivery across Kampala & all regions of Uganda • WhatsApp Orders",
      trustBullets: "Genuine Tech • Fast Delivery across Uganda • Cash on delivery / Mobile Money available • 100% Original Products"
    };

    const content = `// AURA 101 TECH WORLD - Product Catalog Data
// Currency: UGX (Ugandan Shilling)
// Automatically synchronized by AURA 101 Server

const STORE_CONFIG = ${JSON.stringify(cfg, null, 2)};
if (typeof window !== 'undefined') window.STORE_CONFIG = STORE_CONFIG;

const CATEGORIES = ${JSON.stringify(existingCategories, null, 2)};

const PRODUCTS = ${JSON.stringify(state.products, null, 2)};

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
    fs.writeFileSync(path.join(ROOT_DIR, 'data.js'), content, 'utf8');
  } catch (err) {
    console.warn('Warning: Could not auto-sync to data.js:', err.message);
  }
}

function saveStore(state) {
  try {
    state.lastUpdated = Date.now();
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), 'utf8');
    storeState = state;
    syncToDataJs(state);
    return true;
  } catch (e) {
    console.error('Error saving store.json:', e);
    return false;
  }
}

// Initialize store from data.js if store.json does not exist
function initStore() {
  if (fs.existsSync(STORE_FILE)) {
    try {
      const content = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.products)) {
        return parsed;
      }
    } catch (e) {
      console.error('Warning: Could not read existing store.json, re-initializing...', e);
    }
  }

  // Fallback to data.js
  let defaultProducts = [];
  try {
    const dataModule = require(path.join(ROOT_DIR, 'data.js'));
    if (dataModule && Array.isArray(dataModule.PRODUCTS)) {
      defaultProducts = dataModule.PRODUCTS.filter(
        p => p && p.id && !PERMANENTLY_EXCLUDED.includes(p.id)
      );
    }
  } catch (err) {
    console.error('Could not load data.js products:', err);
  }

  const initialStore = {
    version: 1,
    lastUpdated: Date.now(),
    products: defaultProducts,
    deletedProductIds: [...PERMANENTLY_EXCLUDED],
    orders: [
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
      }
    ],
    settings: {
      whatsappNumber: '256759375151',
      location: 'Kampala, Uganda • Countrywide Delivery',
      ownerPassword: 'Aura123'
    }
  };

  saveStore(initialStore);
  return initialStore;
}

storeState = initStore();

// Convert Base64 Data URL to saved image file
function saveBase64Image(dataUrl, prefix = 'prod') {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
  if (!dataUrl.startsWith('data:image/')) return dataUrl;

  const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!matches || matches.length < 3) return dataUrl;

  let ext = matches[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  if (ext === 'svg+xml') ext = 'svg';

  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  fs.writeFileSync(filePath, buffer);
  return `assets/images/uploads/${filename}`;
}

// Read body helper
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // 25MB max size limit for high-res photos
      if (body.length > 25 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', err => reject(err));
  });
}

// CORS & JSON response helpers
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // ------------------------------------------------------------------------
  // API ROUTING
  // ------------------------------------------------------------------------

  // 1. GET /api/status
  if (pathname === '/api/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      online: true,
      timestamp: storeState.lastUpdated,
      productsCount: storeState.products.length
    });
  }

  // 2. GET /api/catalog or /api/products
  if ((pathname === '/api/catalog' || pathname === '/api/products') && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      timestamp: storeState.lastUpdated,
      products: storeState.products,
      deletedProductIds: storeState.deletedProductIds,
      orders: storeState.orders,
      settings: storeState.settings
    });
  }

  // 3. POST /api/products (Add new product)
  if (pathname === '/api/products' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      if (!data || !data.name || typeof data.price === 'undefined') {
        return sendJson(res, 400, { success: false, error: 'Product name and price are required' });
      }

      // Handle image if base64 Data URL
      if (data.image && data.image.startsWith('data:image/')) {
        data.image = saveBase64Image(data.image, 'prod');
      }

      const newProduct = {
        id: data.id || ('aura-custom-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)),
        name: data.name.trim(),
        category: data.category || 'phones',
        categoryName: data.categoryName || 'Tech Products',
        brand: data.brand || 'Original',
        price: parseInt(data.price, 10) || 0,
        badge: data.badge || 'New Arrival',
        image: data.image || 'assets/images/logo.png',
        specsSummary: data.specsSummary || '',
        description: data.description || '',
        rating: data.rating || 5.0,
        inStock: typeof data.inStock !== 'undefined' ? data.inStock : true,
        colors: data.colors || [],
        specs: data.specs || {}
      };

      // Add to beginning of catalog
      storeState.products.unshift(newProduct);

      // If it was in deletedProductIds, remove it
      storeState.deletedProductIds = storeState.deletedProductIds.filter(id => id !== newProduct.id);

      saveStore(storeState);
      return sendJson(res, 201, { success: true, product: newProduct });
    } catch (err) {
      console.error('Error adding product:', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 4. PUT /api/products/:id (Edit product)
  if (pathname.startsWith('/api/products/') && req.method === 'PUT') {
    try {
      const pid = pathname.replace('/api/products/', '').trim();
      const data = await readJsonBody(req);

      // Handle image if base64 Data URL
      if (data.image && data.image.startsWith('data:image/')) {
        data.image = saveBase64Image(data.image, 'prod');
      }

      const idx = storeState.products.findIndex(p => p.id === pid);
      if (idx === -1) {
        // If not found in current products, append as new
        const updated = Object.assign({ id: pid }, data);
        storeState.products.unshift(updated);
        saveStore(storeState);
        return sendJson(res, 200, { success: true, product: updated });
      }

      const existing = storeState.products[idx];
      const updatedProduct = Object.assign({}, existing, data, { id: pid });
      storeState.products[idx] = updatedProduct;

      saveStore(storeState);
      return sendJson(res, 200, { success: true, product: updatedProduct });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 5. DELETE /api/products/:id (Delete product)
  if (pathname.startsWith('/api/products/') && req.method === 'DELETE') {
    try {
      const pid = pathname.replace('/api/products/', '').trim();
      storeState.products = storeState.products.filter(p => p.id !== pid);
      if (!storeState.deletedProductIds.includes(pid)) {
        storeState.deletedProductIds.push(pid);
      }
      saveStore(storeState);
      return sendJson(res, 200, { success: true, id: pid });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 6. POST /api/sync (Sync client localStorage to shared server store)
  if (pathname === '/api/sync' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      let changed = false;

      // Sync deleted IDs
      if (Array.isArray(data.deletedProductIds)) {
        data.deletedProductIds.forEach(id => {
          if (!storeState.deletedProductIds.includes(id)) {
            storeState.deletedProductIds.push(id);
            changed = true;
          }
          const prevLen = storeState.products.length;
          storeState.products = storeState.products.filter(p => p.id !== id);
          if (storeState.products.length !== prevLen) {
            changed = true;
          }
        });
      }

      // Sync custom products from client
      if (Array.isArray(data.customProducts)) {
        data.customProducts.forEach(clientProd => {
          if (!clientProd || !clientProd.id) return;
          if (storeState.deletedProductIds.includes(clientProd.id)) return;

          // Convert any base64 image
          if (clientProd.image && clientProd.image.startsWith('data:image/')) {
            clientProd.image = saveBase64Image(clientProd.image, 'sync');
          }

          const existingIdx = storeState.products.findIndex(p => p.id === clientProd.id);
          if (existingIdx >= 0) {
            storeState.products[existingIdx] = Object.assign({}, storeState.products[existingIdx], clientProd);
            changed = true;
          } else {
            storeState.products.unshift(clientProd);
            changed = true;
          }
        });
      }

      // Sync settings if provided
      if (data.settings && typeof data.settings === 'object') {
        storeState.settings = Object.assign({}, storeState.settings, data.settings);
        changed = true;
      }

      if (changed) {
        saveStore(storeState);
      }

      return sendJson(res, 200, {
        success: true,
        timestamp: storeState.lastUpdated,
        productsCount: storeState.products.length,
        products: storeState.products
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 7. Orders endpoints
  if (pathname === '/api/orders' && req.method === 'GET') {
    return sendJson(res, 200, { success: true, orders: storeState.orders || [] });
  }

  if (pathname === '/api/orders' && req.method === 'POST') {
    try {
      const order = await readJsonBody(req);
      if (!Array.isArray(storeState.orders)) storeState.orders = [];
      storeState.orders.unshift(order);
      if (storeState.orders.length > 100) storeState.orders = storeState.orders.slice(0, 100);
      saveStore(storeState);
      return sendJson(res, 201, { success: true, order });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/orders' && req.method === 'DELETE') {
    storeState.orders = [];
    saveStore(storeState);
    return sendJson(res, 200, { success: true });
  }

  // 8. Settings endpoints
  if (pathname === '/api/settings' && req.method === 'POST') {
    try {
      const settings = await readJsonBody(req);
      storeState.settings = Object.assign({}, storeState.settings, settings);
      saveStore(storeState);
      return sendJson(res, 200, { success: true, settings: storeState.settings });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ------------------------------------------------------------------------
  // STATIC FILE SERVING
  // ------------------------------------------------------------------------
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(path.join(ROOT_DIR, pathname));
  if (!safePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access denied');
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>404 - Not Found</h2>
          <p>The requested URL <code>${pathname}</code> was not found on this server.</p>
          <a href="/" style="color: #0284c7;">Return to Storefront</a>
        </div>
      `);
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // HTML, JS, and CSS should never be aggressively cached so updates are instantly reflected
    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    };
    if (ext === '.html' || ext === '.js' || ext === '.css') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    res.writeHead(200, headers);
    fs.createReadStream(safePath).pipe(res);
  });
});

// Start server with automatic port retry if preferred port is taken/restricted
function startServer(preferredPort) {
  server.listen(preferredPort, '0.0.0.0', () => {
    console.log('\n=============================================================');
    console.log('🚀 AURA 101 TECH WORLD - SHARED SERVER RUNNING');
    console.log('=============================================================');
    console.log(`📡 Local Storefront:   http://localhost:${preferredPort}/`);
    console.log(`🔐 Admin Control:     http://localhost:${preferredPort}/admin.html`);
    console.log(`💾 Data Storage:      ${STORE_FILE}`);
    console.log(`📸 Image Uploads:     ${UPLOADS_DIR}`);
    console.log('=============================================================');
    console.log('🌐 SHARING WITH YOUR FRIEND:');
    console.log(`1. VS Code: Forward port ${preferredPort} in Ports tab.`);
    console.log(`2. Local Network: Share http://<YOUR_COMPUTER_IP>:${preferredPort}/`);
    console.log('3. Both you and your friend will now see the SAME products,');
    console.log('   add new products in admin.html, and see updates in real time!');
    console.log('=============================================================\n');
  });

  server.on('error', (err) => {
    if ((err.code === 'EADDRINUSE' || err.code === 'EACCES') && preferredPort < 3010) {
      console.warn(`Port ${preferredPort} is busy or restricted, trying port ${preferredPort + 1}...`);
      server.removeAllListeners('error');
      startServer(preferredPort + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
