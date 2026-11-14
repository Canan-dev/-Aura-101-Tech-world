# 🌐 How to Share Your Store with Your Friend (Live Port Sharing Guide)

## 🔍 Why Couldn't Your Friend See the Products Before?
Your website was initially storing added and deleted products inside **browser `localStorage`**.
- Browser `localStorage` is **private to your specific computer and browser profile**.
- When you shared your port previously, your friend's browser loaded the website files with an empty `localStorage`.
- As a result, your friend saw the factory default products (including ones you deleted), could **not** see the new products or photos you added, and any products they added were trapped inside their own browser.

---

## 🚀 How It Works Now (Centralized Shared Server)
We built a centralized Node.js server (`server.js`) that persists everything in a shared database file:
`data/store.json` and saves photo uploads to `assets/images/uploads/`.

Now:
- ✅ **Both you and your friend see the exact same live catalog.**
- ✅ **When you or your friend adds a product in `admin.html`, it is saved directly to the server.**
- ✅ **Uploaded images are saved as real image files on the server, so your friend can see them too.**
- ✅ **When either of you deletes an old product, it is removed for everyone.**
- ✅ **The customer storefront (`index.html`) updates automatically in real-time.**

---

## ⚡ Step 1: Start the Server on Your Computer

You have two easy ways to start the server:

### Option A: Double-Click (Easiest)
Simply double-click the **`start-server.bat`** file in your `Phone_web` folder.

### Option B: Terminal
Open a terminal in the `Phone_web` folder and run:
```bash
npm start
# or
node server.js
```

You will see:
```text
=============================================================
🚀 AURA 101 TECH WORLD - SHARED SERVER RUNNING
=============================================================
📡 Local Storefront:   http://localhost:3000/
🔐 Admin Control:     http://localhost:3000/admin.html
💾 Data Storage:      .../data/store.json
📸 Image Uploads:     .../assets/images/uploads
=============================================================
```

---

## 🔗 Step 2: Share with Your Friend

### Method 1: VS Code Port Forwarding (Recommended)
1. Open VS Code.
2. In the bottom panel, click the **"PORTS"** tab (next to Terminal / Output).
3. Click **"Forward a Port"** and type **`3000`**.
4. Right-click on port 3000 and set **Port Visibility** to **Public**.
5. Copy the **Forwarded Address** (e.g. `https://xxxx-3000.inc1.devtunnels.ms`).
6. Send the links to your friend:
   - **Customer Storefront:** `https://xxxx-3000.inc1.devtunnels.ms/`
   - **Admin Management Portal:** `https://xxxx-3000.inc1.devtunnels.ms/admin.html`

---

### Method 2: Same Wi-Fi Network (Local IP)
If you and your friend are on the same Wi-Fi network:
1. Open PowerShell and run: `ipconfig`
2. Find your **IPv4 Address** (e.g., `192.168.1.15`).
3. Send these links to your friend:
   - **Customer Storefront:** `http://192.168.1.15:3000/`
   - **Admin Portal:** `http://192.168.1.15:3000/admin.html`

---

### Method 3: Cloudflare Tunnel / Ngrok (Public Worldwide Link)
If you are on different networks and not using VS Code:
```bash
npx localtunnel --port 3000
```
This gives you a public URL that anyone in the world can open on their phone or computer!

---

## 👥 How You and Your Friend Manage Products Together
1. Both of you open `admin.html`.
2. Enter the Master Password: **`Aura123`**.
3. Notice the green badge at the top: **`🟢 Shared Server Active (Live Port Sync)`**.
4. Go to **"➕ Add New Product"**:
   - Fill in the title, price in UGX, and category.
   - Choose a photo from your computer/phone.
   - Click **"🚀 Publish Product to Live Store"**.
5. **Instant Sync:** Within 2 seconds, the new product appears on your friend's screen and on the live customer storefront (`index.html`) automatically!

---

## 🔄 What About Products You Added Before?
Don't worry! We built an **Auto-Sync** feature:
1. The moment you open `http://localhost:3000/admin.html`, the system automatically detects any products previously saved in your browser's local storage and uploads them to the server database.
2. You can also manually trigger this anytime in **Settings (`⚙️ Store Config`)** by clicking:
   **"🔄 Upload My Browser Products to Server"**.
