const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'assets', 'images', 'products');
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// Function to generate clean vector tech graphics
function createTechSvg(title, subtitle, iconType, bgGradient, mainColor, accentColor) {
  let iconSvg = '';

  switch (iconType) {
    case 'laptop':
      iconSvg = `
        <rect x="70" y="80" width="180" height="115" rx="10" fill="#1e293b" stroke="${mainColor}" stroke-width="4"/>
        <rect x="80" y="90" width="160" height="95" rx="6" fill="#0f172a"/>
        <!-- screen glow -->
        <circle cx="160" cy="135" r="30" fill="${accentColor}" opacity="0.25"/>
        <path d="M140 135 L155 120 L165 130 L180 115" stroke="${accentColor}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <!-- keyboard base -->
        <path d="M40 195 L280 195 L260 215 L60 215 Z" fill="#334155" stroke="${mainColor}" stroke-width="2"/>
        <rect x="135" y="200" width="50" height="8" rx="3" fill="#64748b"/>
      `;
      break;
    case 'camera':
      iconSvg = `
        <rect x="70" y="90" width="180" height="120" rx="16" fill="#1e293b" stroke="${mainColor}" stroke-width="4"/>
        <rect x="90" y="70" width="50" height="20" rx="4" fill="#334155"/>
        <circle cx="160" cy="150" r="45" fill="#0f172a" stroke="${accentColor}" stroke-width="6"/>
        <circle cx="160" cy="150" r="30" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
        <circle cx="170" cy="140" r="8" fill="#ffffff" opacity="0.4"/>
        <circle cx="215" cy="115" r="8" fill="#ef4444"/>
      `;
      break;
    case 'watch':
      iconSvg = `
        <!-- watch strap -->
        <path d="M125 40 L195 40 L190 90 L130 90 Z" fill="#334155"/>
        <path d="M130 210 L190 210 L195 260 L125 260 Z" fill="#334155"/>
        <!-- watch case -->
        <rect x="110" y="80" width="100" height="135" rx="30" fill="#0f172a" stroke="${mainColor}" stroke-width="5"/>
        <rect x="120" y="90" width="80" height="115" rx="22" fill="#18181b"/>
        <!-- digital dial ring -->
        <circle cx="160" cy="147" r="32" fill="none" stroke="${accentColor}" stroke-width="4" stroke-dasharray="140 40"/>
        <text x="160" y="152" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">10:45</text>
        <!-- digital crown -->
        <rect x="212" y="115" width="6" height="24" rx="3" fill="${accentColor}"/>
      `;
      break;
    case 'headphones':
      iconSvg = `
        <!-- headband -->
        <path d="M85 160 C85 85, 235 85, 235 160" fill="none" stroke="${mainColor}" stroke-width="12" stroke-linecap="round"/>
        <path d="M100 130 C120 95, 200 95, 220 130" fill="none" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
        <!-- earcups -->
        <rect x="65" y="145" width="35" height="75" rx="16" fill="#1e293b" stroke="${accentColor}" stroke-width="3"/>
        <rect x="220" y="145" width="35" height="75" rx="16" fill="#1e293b" stroke="${accentColor}" stroke-width="3"/>
        <circle cx="82" cy="182" r="10" fill="${accentColor}" opacity="0.5"/>
        <circle cx="237" cy="182" r="10" fill="${accentColor}" opacity="0.5"/>
      `;
      break;
    case 'gaming':
      iconSvg = `
        <!-- controller body -->
        <path d="M75 140 C75 100, 110 90, 160 90 C210 90, 245 100, 245 140 C245 185, 225 220, 205 210 C185 200, 175 180, 160 180 C145 180, 135 200, 115 210 C95 220, 75 185, 75 140 Z" fill="#1e293b" stroke="${mainColor}" stroke-width="4"/>
        <!-- d-pad -->
        <path d="M105 130 L115 130 L115 120 L125 120 L125 130 L135 130 L135 140 L125 140 L125 150 L115 150 L115 140 L105 140 Z" fill="#64748b"/>
        <!-- action buttons -->
        <circle cx="195" cy="125" r="5" fill="#38bdf8"/>
        <circle cx="205" cy="135" r="5" fill="#f43f5e"/>
        <circle cx="185" cy="135" r="5" fill="#22c55e"/>
        <circle cx="195" cy="145" r="5" fill="#eab308"/>
        <!-- analog sticks -->
        <circle cx="130" cy="165" r="14" fill="#0f172a" stroke="${accentColor}" stroke-width="3"/>
        <circle cx="190" cy="165" r="14" fill="#0f172a" stroke="${accentColor}" stroke-width="3"/>
      `;
      break;
    case 'speaker':
      iconSvg = `
        <!-- cylinder body -->
        <rect x="70" y="110" width="180" height="95" rx="45" fill="#1e293b" stroke="${mainColor}" stroke-width="4"/>
        <!-- speaker mesh lines -->
        <line x1="110" y1="120" x2="110" y2="195" stroke="#334155" stroke-width="3"/>
        <line x1="130" y1="115" x2="130" y2="200" stroke="#334155" stroke-width="3"/>
        <line x1="150" y1="112" x2="150" y2="203" stroke="#334155" stroke-width="3"/>
        <line x1="170" y1="112" x2="170" y2="203" stroke="#334155" stroke-width="3"/>
        <line x1="190" y1="115" x2="190" y2="200" stroke="#334155" stroke-width="3"/>
        <line x1="210" y1="120" x2="210" y2="195" stroke="#334155" stroke-width="3"/>
        <!-- central logo plaque -->
        <rect x="135" y="142" width="50" height="28" rx="6" fill="${accentColor}"/>
        <text x="160" y="161" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="900" text-anchor="middle">BASS</text>
      `;
      break;
    case 'tv':
      iconSvg = `
        <!-- screen frame -->
        <rect x="50" y="70" width="220" height="140" rx="8" fill="#0f172a" stroke="${mainColor}" stroke-width="4"/>
        <rect x="58" y="78" width="204" height="124" rx="4" fill="#1e1e24"/>
        <!-- screen art / vibrant 4k colors -->
        <path d="M58 170 Q120 110, 180 140 T262 130 L262 202 L58 202 Z" fill="${accentColor}" opacity="0.6"/>
        <circle cx="190" cy="115" r="24" fill="#f59e0b" opacity="0.7"/>
        <text x="75" y="102" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold" opacity="0.8">4K ULTRA HD</text>
        <!-- stand legs -->
        <path d="M85 210 L75 230" stroke="${mainColor}" stroke-width="5" stroke-linecap="round"/>
        <path d="M235 210 L245 230" stroke="${mainColor}" stroke-width="5" stroke-linecap="round"/>
      `;
      break;
    case 'soundbar':
      iconSvg = `
        <!-- long bar -->
        <rect x="40" y="130" width="240" height="40" rx="8" fill="#1e293b" stroke="${mainColor}" stroke-width="3"/>
        <line x1="50" y1="150" x2="270" y2="150" stroke="#334155" stroke-width="2" stroke-dasharray="6 4"/>
        <!-- subwoofer -->
        <rect x="80" y="80" width="60" height="90" rx="6" fill="#0f172a" stroke="${accentColor}" stroke-width="3"/>
        <circle cx="110" cy="120" r="18" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <!-- dolby badge -->
        <rect x="220" y="138" width="50" height="22" rx="4" fill="#000000"/>
        <text x="245" y="153" fill="${accentColor}" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle">ATMOS</text>
      `;
      break;
    case 'tablet':
      iconSvg = `
        <rect x="75" y="60" width="170" height="200" rx="16" fill="#0f172a" stroke="${mainColor}" stroke-width="4"/>
        <rect x="85" y="70" width="150" height="180" rx="10" fill="#1e293b"/>
        <!-- wallpaper colorful gradient -->
        <circle cx="160" cy="150" r="45" fill="${accentColor}" opacity="0.3"/>
        <path d="M100 210 C130 160, 180 180, 220 130" stroke="${accentColor}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <!-- stylus pencil -->
        <path d="M245 90 L260 210" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>
      `;
      break;
    case 'harddrive':
      iconSvg = `
        <!-- rugged ssd drive -->
        <rect x="85" y="80" width="150" height="160" rx="18" fill="#1e293b" stroke="${mainColor}" stroke-width="5"/>
        <rect x="95" y="90" width="130" height="140" rx="12" fill="#0f172a"/>
        <!-- rubber bumper ridges -->
        <line x1="90" y1="110" x2="90" y2="210" stroke="${accentColor}" stroke-width="6" stroke-linecap="round"/>
        <line x1="230" y1="110" x2="230" y2="210" stroke="${accentColor}" stroke-width="6" stroke-linecap="round"/>
        <text x="160" y="145" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="900" text-anchor="middle">2TB</text>
        <text x="160" y="170" fill="${accentColor}" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">NVMe SSD 1050MB/s</text>
        <circle cx="160" cy="205" r="4" fill="#22c55e"/>
      `;
      break;
    case 'powerbank':
      iconSvg = `
        <rect x="95" y="65" width="130" height="190" rx="18" fill="#1e293b" stroke="${mainColor}" stroke-width="4"/>
        <!-- led display -->
        <rect x="120" y="85" width="80" height="35" rx="6" fill="#000000" stroke="${accentColor}" stroke-width="1.5"/>
        <text x="160" y="108" fill="${accentColor}" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle">100%</text>
        <!-- lightning bolt -->
        <path d="M165 140 L145 170 L160 170 L155 200 L180 165 L165 165 Z" fill="#eab308"/>
        <!-- port indicator -->
        <rect x="135" y="225" width="50" height="10" rx="3" fill="#64748b"/>
      `;
      break;
    case 'bag':
      iconSvg = `
        <!-- backpack body -->
        <path d="M100 80 Q160 50, 220 80 L235 220 Q160 240, 85 220 Z" fill="#1e293b" stroke="${mainColor}" stroke-width="4"/>
        <!-- top handle -->
        <path d="M135 65 Q160 45, 185 65" fill="none" stroke="${accentColor}" stroke-width="5" stroke-linecap="round"/>
        <!-- front pocket -->
        <path d="M105 135 L215 135 L210 205 Q160 220, 110 205 Z" fill="#0f172a" stroke="#475569" stroke-width="2"/>
        <!-- zipper accent -->
        <line x1="120" y1="135" x2="200" y2="135" stroke="${accentColor}" stroke-width="3"/>
        <text x="160" y="175" fill="#94a3b8" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">WATERPROOF TECH</text>
      `;
      break;
    case 'kids':
      iconSvg = `
        <!-- colorful kids camera / tablet -->
        <rect x="70" y="80" width="180" height="140" rx="28" fill="#f43f5e" stroke="${mainColor}" stroke-width="4"/>
        <rect x="90" y="95" width="140" height="100" rx="14" fill="#fef08a"/>
        <!-- cartoon smiley face -->
        <circle cx="130" cy="135" r="6" fill="#1e293b"/>
        <circle cx="190" cy="135" r="6" fill="#1e293b"/>
        <path d="M140 160 Q160 180, 180 160" fill="none" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
        <!-- cute ears -->
        <circle cx="90" cy="75" r="18" fill="#38bdf8"/>
        <circle cx="230" cy="75" r="18" fill="#38bdf8"/>
      `;
      break;
    case 'accessories':
      iconSvg = `
        <!-- charger adapter -->
        <rect x="80" y="90" width="85" height="95" rx="12" fill="#ffffff" stroke="${mainColor}" stroke-width="3"/>
        <rect x="105" y="185" width="12" height="25" fill="#94a3b8"/>
        <rect x="130" y="185" width="12" height="25" fill="#94a3b8"/>
        <!-- braided cable coil -->
        <circle cx="205" cy="140" r="45" fill="none" stroke="${accentColor}" stroke-width="6"/>
        <circle cx="205" cy="140" r="28" fill="none" stroke="#64748b" stroke-width="5"/>
        <rect x="195" y="125" width="20" height="30" rx="4" fill="#0f172a"/>
        <text x="122" y="140" fill="#0284c7" font-family="sans-serif" font-size="12" font-weight="900" text-anchor="middle">65W</text>
      `;
      break;
    case 'smarttvbox':
      iconSvg = `
        <!-- sleek streaming box -->
        <rect x="65" y="120" width="130" height="60" rx="12" fill="#111827" stroke="${mainColor}" stroke-width="3"/>
        <circle cx="85" cy="150" r="4" fill="#22c55e"/>
        <text x="135" y="155" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold">TV 4K PRO</text>
        <!-- remote control -->
        <rect x="215" y="70" width="45" height="150" rx="16" fill="#1f2937" stroke="${accentColor}" stroke-width="2"/>
        <circle cx="237" cy="110" r="14" fill="#374151" stroke="#9ca3af" stroke-width="2"/>
        <circle cx="237" cy="110" r="5" fill="${accentColor}"/>
        <rect x="225" y="140" width="24" height="6" rx="2" fill="#ef4444"/>
        <rect x="225" y="155" width="24" height="6" rx="2" fill="#3b82f6"/>
        <rect x="225" y="170" width="24" height="6" rx="2" fill="#10b981"/>
      `;
      break;
    default:
      iconSvg = `
        <rect x="80" y="80" width="160" height="140" rx="20" fill="#1e293b" stroke="${mainColor}" stroke-width="4"/>
        <circle cx="160" cy="150" r="40" fill="${accentColor}" opacity="0.3"/>
      `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 300" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradient[0]}"/>
      <stop offset="100%" stop-color="${bgGradient[1]}"/>
    </linearGradient>
    <radialGradient id="spotlight" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.35"/>
    </radialGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="320" height="300" rx="20" fill="url(#bgGrad)"/>
  <rect width="320" height="300" rx="20" fill="url(#spotlight)"/>

  <!-- Decorative Tech Grid Lines -->
  <circle cx="160" cy="150" r="110" fill="none" stroke="${accentColor}" stroke-opacity="0.15" stroke-dasharray="4 6"/>
  <circle cx="160" cy="150" r="135" fill="none" stroke="${mainColor}" stroke-opacity="0.1"/>

  <!-- Tech Gadget Vector Art -->
  <g filter="url(#cardShadow)">
    ${iconSvg}
  </g>

  <!-- Title Pill at Bottom -->
  <rect x="25" y="246" width="270" height="38" rx="10" fill="#0f172a" fill-opacity="0.85" stroke="#334155" stroke-width="1"/>
  <text x="160" y="264" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" text-anchor="middle">${title}</text>
  <text x="160" y="278" fill="${accentColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" text-anchor="middle">${subtitle}</text>
</svg>`;
}

// Generate graphics for all categories
const items = [
  // 1. Accessories
  { id: 'anker-65w-gan-charger', title: 'Anker 65W GaN Fast Charger', sub: '3-Port High Speed PD', icon: 'accessories', bg: ['#042f2e', '#0f172a'], main: '#0d9488', acc: '#2dd4bf' },
  { id: 'apple-magsafe-duo', title: 'Apple MagSafe Fast Wireless', sub: 'iPhone & Watch Ready', icon: 'accessories', bg: ['#1e1b4b', '#0f172a'], main: '#6366f1', acc: '#818cf8' },
  
  // 2. Bags
  { id: 'tigernu-anti-theft-backpack', title: 'Tigernu Anti-Theft Backpack', sub: 'Waterproof 15.6" Laptop Case', icon: 'bag', bg: ['#18181b', '#09090b'], main: '#52525b', acc: '#38bdf8' },
  { id: 'dell-pro-briefcase-16', title: 'Dell Pro 16" Executive Briefcase', sub: 'Shock-Resistant Padding', icon: 'bag', bg: ['#172554', '#0f172a'], main: '#2563eb', acc: '#60a5fa' },
  
  // 3. Cameras
  { id: 'sony-alpha-a6700', title: 'Sony Alpha A6700 4K Mirrorless', sub: 'AI Autofocus + 4K 120p', icon: 'camera', bg: ['#2e1065', '#0f172a'], main: '#9333ea', acc: '#c084fc' },
  { id: 'dji-osmo-pocket-3', title: 'DJI Osmo Pocket 3 Creator Kit', sub: '1-Inch CMOS 4K/120fps Vlog', icon: 'camera', bg: ['#14532d', '#0f172a'], main: '#16a34a', acc: '#4ade80' },
  
  // 4. Gaming equipments
  { id: 'playstation-5-slim-1tb', title: 'Sony PlayStation 5 Slim 1TB', sub: 'DualSense Wireless Included', icon: 'gaming', bg: ['#1e1b4b', '#020617'], main: '#3b82f6', acc: '#60a5fa' },
  { id: 'logitech-g-pro-x-headset', title: 'Logitech G PRO X 2 Gaming', sub: 'LIGHTSPEED Wireless 50mm', icon: 'gaming', bg: ['#312e81', '#0f172a'], main: '#4f46e5', acc: '#a5b4fc' },
  
  // 5. Kids gadgets and Toys
  { id: 'kids-lcd-drawing-tablet', title: 'Kids 10" Color LCD Tablet', sub: 'Eye-Safe Smart Doodle Pad', icon: 'kids', bg: ['#701a75', '#1e1b4b'], main: '#d946ef', acc: '#f0abfc' },
  { id: 'kids-hd-digital-camera', title: 'Kids Dual-Lens 1080P Camera', sub: 'Shockproof with Games & Print', icon: 'kids', bg: ['#831843', '#0f172a'], main: '#ec4899', acc: '#f472b6' },
  
  // 6. Portable speakers
  { id: 'jbl-charge-5', title: 'JBL Charge 5 Waterproof Speaker', sub: '20H Playtime + Powerbank', icon: 'speaker', bg: ['#1e3a5f', '#0b1329'], main: '#0284c7', acc: '#38bdf8' },
  { id: 'jbl-boombox-3', title: 'JBL Boombox 3 Deep Monster Bass', sub: 'IP67 Dust & Waterproof', icon: 'speaker', bg: ['#064e3b', '#022c22'], main: '#059669', acc: '#34d399' },
  
  // 7. Smart watches
  { id: 'apple-watch-ultra-2', title: 'Apple Watch Ultra 2 Titanium', sub: '49mm GPS + Cellular LTE', icon: 'watch', bg: ['#1c1917', '#0c0a09'], main: '#f97316', acc: '#fb923c' },
  { id: 'samsung-galaxy-watch-7', title: 'Samsung Galaxy Watch 7 44mm', sub: 'BioActive Sensor & Sapphire', icon: 'watch', bg: ['#0c4a6e', '#082f49'], main: '#0284c7', acc: '#38bdf8' },
  
  // 8. Sound bars
  { id: 'jbl-bar-1000-dolby-atmos', title: 'JBL Bar 1000 7.1.4 Dolby Atmos', sub: 'Wireless Detachable Surrounds', icon: 'soundbar', bg: ['#1e293b', '#090d16'], main: '#0284c7', acc: '#38bdf8' },
  { id: 'sony-ht-s40r-surround', title: 'Sony HT-S40R 600W 5.1ch', sub: 'Wireless Rear Speakers & Sub', icon: 'soundbar', bg: ['#3f3f46', '#18181b'], main: '#71717a', acc: '#a1a1aa' },
  
  // 9. Televisions
  { id: 'samsung-65-qled-4k', title: 'Samsung 65" QLED 4K Smart TV', sub: 'Quantum HDR & Tizen OS', icon: 'tv', bg: ['#0f172a', '#020617'], main: '#2563eb', acc: '#60a5fa' },
  { id: 'lg-55-oled-c4-120hz', title: 'LG 55" OLED C4 120Hz Gaming', sub: 'Self-Lit Pixels & Dolby Vision', icon: 'tv', bg: ['#18181b', '#030712'], main: '#e11d48', acc: '#fb7185' },
  
  // 10. Tablets
  { id: 'apple-ipad-pro-11-m4', title: 'Apple iPad Pro 11" M4 OLED', sub: 'Ultra Retina XDR & 256GB', icon: 'tablet', bg: ['#1e1b4b', '#030712'], main: '#6366f1', acc: '#a5b4fc' },
  { id: 'samsung-galaxy-tab-s9', title: 'Samsung Galaxy Tab S9 Ultra', sub: '14.6" Dynamic AMOLED 2X', icon: 'tablet', bg: ['#0f172a', '#042f2e'], main: '#0d9488', acc: '#2dd4bf' },
  
  // 11. Computers
  { id: 'macbook-pro-14-m3-pro', title: 'Apple MacBook Pro 14" M3 Pro', sub: '18GB RAM / 512GB SSD Space Black', icon: 'laptop', bg: ['#111827', '#030712'], main: '#64748b', acc: '#94a3b8' },
  { id: 'dell-xps-15-core-i7', title: 'Dell XPS 15 Intel Core i7', sub: '32GB RAM / 1TB SSD RTX 4060', icon: 'laptop', bg: ['#082f49', '#020617'], main: '#0284c7', acc: '#38bdf8' },
  
  // 12. Hard drives
  { id: 'samsung-t7-shield-2tb', title: 'Samsung T7 Shield 2TB SSD', sub: 'Rugged IP65 Drop-Proof 1050MB/s', icon: 'harddrive', bg: ['#064e3b', '#022c22'], main: '#059669', acc: '#34d399' },
  { id: 'wd-my-passport-4tb', title: 'WD My Passport 4TB External', sub: 'Hardware Encryption USB 3.2', icon: 'harddrive', bg: ['#1e293b', '#090d16'], main: '#3b82f6', acc: '#60a5fa' },
  
  // 13. Headphones
  { id: 'sony-wh-1000xm5', title: 'Sony WH-1000XM5 ANC Headset', sub: 'Industry Leading Noise Cancel', icon: 'headphones', bg: ['#18181b', '#09090b'], main: '#71717a', acc: '#a1a1aa' },
  { id: 'apple-airpods-max', title: 'Apple AirPods Max Space Gray', sub: 'Spatial Audio + Dynamic Head Tracking', icon: 'headphones', bg: ['#1e1b4b', '#030712'], main: '#6366f1', acc: '#a5b4fc' },
  
  // 14. Power banks
  { id: 'anker-737-powerbank-140w', title: 'Anker 737 Power Bank 24,000mAh', sub: '140W Two-Way Ultra Fast Charge', icon: 'powerbank', bg: ['#042f2e', '#021817'], main: '#0d9488', acc: '#2dd4bf' },
  { id: 'oraimo-30000mah-powerbank', title: 'Oraimo 30,000mAh PowerBank', sub: '22.5W Fast Charge 3-Outputs', icon: 'powerbank', bg: ['#14532d', '#052e16'], main: '#16a34a', acc: '#4ade80' },
  
  // 15. Smart live tvs
  { id: 'xiaomi-tv-box-s-4k', title: 'Xiaomi TV Box S 2nd Gen 4K', sub: 'Google TV, Dolby Vision & Atmos', icon: 'smarttvbox', bg: ['#1e293b', '#0b0f19'], main: '#f97316', acc: '#fb923c' },
  { id: 'apple-tv-4k-128gb', title: 'Apple TV 4K 128GB Wi-Fi+Ethernet', sub: 'A15 Bionic & Siri Remote', icon: 'smarttvbox', bg: ['#0f172a', '#020617'], main: '#38bdf8', acc: '#7dd3fc' }
];

items.forEach(item => {
  const svg = createTechSvg(item.title, item.sub, item.icon, item.bg, item.main, item.acc);
  fs.writeFileSync(path.join(imgDir, `${item.id}.svg`), svg);
  console.log(`Generated: ${item.id}.svg`);
});

console.log('Successfully generated all category product visual assets!');
