# AURA 101 TECH WORLD - Shopping Web Application
> **Tagline:** *Your Tech, Our Priority.*

A high-performance, mobile-optimized tech shopping web application inspired by reference e-commerce layouts in Kampala, Uganda (with UGX currency, WhatsApp direct ordering, multi-category navigation, and budget filtering).

---

## 🌟 Key Features

1. **Brand Identity & Official Logo**
   - Built around the **AURA 101 TECH WORLD** brand and tagline *"Your Tech, Our Priority."*
   - Includes the uploaded official logo with high-resolution rendering.

2. **Full Categories Catalog (All 15+ requested categories):**
   - 🔌 **Accessories** (Anker 65W GaN Chargers, Apple MagSafe Duo, Cables)
   - 🎒 **Bags (Computer backpacks / carrying cases)** (Tigernu Anti-Theft Waterproof, Dell Pro Briefcase)
   - 📷 **Cameras** (Sony Alpha A6700 4K Mirrorless, DJI Osmo Pocket 3 Creator Combo)
   - 🎮 **Gaming equipments** (Sony PS5 Slim 1TB, Logitech G PRO X 2 LIGHTSPEED)
   - 🧸 **Kids gadgets and Toys** (Kids 10" Color LCD Tablet, Dual-Lens 1080P Kids Camera)
   - 🔊 **Portable speakers** (JBL Charge 5, JBL Boombox 3 Deep Bass)
   - ⌚ **Smart watches** (Apple Watch Ultra 2 Titanium 49mm, Samsung Galaxy Watch 7)
   - 📻 **Sound bars** (JBL Bar 1000 7.1.4 Dolby Atmos, Sony HT-S40R 600W 5.1ch)
   - 📺 **Televisions** (Samsung 65" QLED 4K, LG 55" OLED evo C4 120Hz)
   - 📱 **Tablets** (Apple iPad Pro 11" M4 OLED, Samsung Galaxy Tab S9 Ultra)
   - 💻 **Computers** (MacBook Pro 14" M3 Pro, Dell XPS 15 RTX 4060)
   - 💾 **Hard drives** (Samsung T7 Shield 2TB Rugged SSD, WD My Passport 4TB)
   - 🎧 **Headphones** (Sony WH-1000XM5 ANC, Apple AirPods Max)
   - 🔋 **Power banks** (Anker 737 140W PowerBank, Oraimo 30,000mAh Fast Charge)
   - 📡 **Smart live tvs** (Xiaomi TV Box S 2nd Gen 4K, Apple TV 4K 128GB)
   - 📱 **Popular Phones** (Apple iPhone 18 Pro Burgundy, iPhone 18 Pro Max Burgundy, iPhone 17 Pro Max 256GB/512GB, iPhone 17 Pro Cosmic Orange)

3. **Direct WhatsApp Ordering System (Matching Reference Images):**
   - Clicking **"Order on WhatsApp"** generates a pre-formatted message with:
     - Product Name & Model
     - Selected Specifications
     - Listed price in **UGX** (Ugandan Shillings)
     - Direct product link
     - Unique Lead Reference code (e.g. `AURA-de45f1ca`)
     - Lead Source: `Website`
   - **Cart Multi-Item WhatsApp Checkout**: Bundle multiple items into a single WhatsApp order summary with subtotal calculation.
   - **Settings Gear**: Store owners can change the target WhatsApp phone number directly from the website without writing any code.

4. **Mobile Phone View (Pixel-perfect to Screenshot 5):**
   - 2-column touch-friendly grid on mobile screens
   - Smooth horizontal scrollable category pills
   - "Explore iPhone 18 Series →" highlight banner
   - Trust strip: *"Kampala shop • Warranty where stated • Cash on delivery available"*
   - Budget filters: *Under 500k*, *500k–2m*, *2m & above*
   - Floating dark WhatsApp button on the bottom left
   - Floating Scroll-to-Top button on the bottom right
   - Sticky bottom mobile app navigation (Shop, Saved, Cart, WhatsApp)

---

## 🚀 How to Run & Share the Website

### Option 1: Shared Live Server (For Port Sharing & Multi-Admin)
To share the website with a friend so **both of you see the same products, uploaded images, and both can add products in real-time**:
1. Double-click **`start-server.bat`** (or run `npm start`).
2. Open `http://localhost:3000` (Storefront) or `http://localhost:3000/admin.html` (Admin Portal).
3. Forward port `3000` to share with your friend (see complete step-by-step guide in [HOW_TO_SHARE.md](HOW_TO_SHARE.md)).

### Option 2: Standalone Browser-Only
Double-click `index.html` to open and use the website directly in any web browser without a server.

---

## 📁 File Structure
```
Phone_web/
├── server.js             # Centralized Node.js backend server (syncs catalog, handles uploads)
├── start-server.bat      # One-click Windows launcher for the shared server
├── HOW_TO_SHARE.md       # Step-by-step guide on port forwarding and sharing with friends
├── package.json          # Node project config (run with `npm start`)
├── data/
│   └── store.json        # Central persistent database (products, deletions, orders, settings)
├── index.html            # Main customer storefront (pure shopping experience)
├── admin.html            # Dedicated Store Owner & Executive Admin Portal
├── admin.js              # Admin portal logic (inventory, live orders, settings, server sync)
├── styles.css            # Responsive CSS styling & obsidian theme
├── data.js               # Product catalog, categories, UGX formatting & WhatsApp generators
├── app.js                # Customer storefront logic (search, cart, WhatsApp orders, live sync)
├── generate-assets.js    # Vector asset generator script
└── assets/
    ├── images/
    │   ├── logo.png      # Official AURA 101 TECH WORLD logo
    │   ├── uploads/      # User-uploaded product photos (persisted on server)
    │   └── products/     # Factory product graphics & high-res phone assets
    └── uploaded_refs/    # User-uploaded reference images
```

---

## 🔐 Store Owner & Admin Portal (`admin.html`)
The store owner dashboard is now hosted on its own standalone admin web page:
- **URL**: Open `admin.html` in your web browser.
- **Default Master Password**: `Aura123` (changeable anytime in *Store Config & Security*).
- **Features**:
  - 📊 **Executive Overview & Stats**: Real-time counters for total catalog items, total UGX inventory value, tracked customer WhatsApp inquiries, and estimated pipeline value.
  - ➕ **Add New Product**: Form with category selector, brand, price in UGX, device photo upload with automatic compression, specs summary, description, and real-time interactive preview card.
  - 📦 **Manage Inventory**: Live search, category filtering, real-time product editing modal, and item removal.
  - 💬 **WhatsApp Orders Log**: Real-time log of customer clicks, cart checkouts, and inquiries from `index.html`.
  - ⚙️ **Store Config & Security**: Update WhatsApp routing phone number, delivery notice, and change owner master password.
  - 🔄 **Real-Time Multi-Tab Sync**: Any change made in `admin.html` updates `index.html` instantly via `localStorage`.
