# Vòng Dâu Tằm By Ánh - E-commerce Platform

Website bán hàng vòng dâu tằm với hệ thống CTV (Cộng tác viên) và quản lý đơn hàng tự động.

## 🚀 Tech Stack

- **Frontend**: HTML, TailwindCSS, Alpine.js
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Backup**: Google Sheets (via Apps Script)
- **Hosting**: Cloudflare Pages
- **Notifications**: Telegram Bot

## 📁 Cấu trúc Project

```
.
├── public/                 # Static files (HTML, CSS, JS, Images)
│   ├── assets/
│   │   ├── css/           # TailwindCSS compiled
│   │   ├── js/            # Alpine.js app logic
│   │   └── images/        # Product images
│   ├── data/              # JSON data files
│   ├── _headers           # Cloudflare headers config
│   ├── _routes.json       # Cloudflare routing config
│   └── index.html         # Main page
├── worker/                # Cloudflare Worker (API backend)
│   └── worker.js          # Worker logic (D1 + API)
├── google-apps-script/    # Google Apps Script
│   └── order-handler.js   # Handle orders in Google Sheets
├── src/                   # Source files
│   └── input.css          # TailwindCSS source
├── wrangler.toml          # Cloudflare Worker config
└── package.json           # Dependencies
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm hoặc yarn
- Cloudflare account
- Wrangler CLI

### Setup

1. **Clone repository**
```bash
git clone <repo-url>
cd vdt
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
- Cập nhật `wrangler.toml` với D1 database ID
- Cập nhật Google Apps Script URL

4. **Development**
```bash
# Watch CSS changes
npm run watch

# Build production
npm run build
```

### Deploy

**Deploy Worker:**
```bash
npx wrangler deploy
```

**Deploy Pages:**
```bash
npx wrangler pages deploy public
```

Hoặc push lên Git để auto-deploy (nếu đã cấu hình).

## 🗄️ Database Schema

### Table: `ctv`
```sql
CREATE TABLE ctv (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT,
    age INTEGER,
    experience TEXT,
    motivation TEXT,
    referral_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Mới',
    commission_rate REAL DEFAULT 0.1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `orders`
```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    order_date DATETIME NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address TEXT,
    products TEXT,
    total_amount INTEGER NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'Mới',
    referral_code TEXT,
    commission INTEGER DEFAULT 0,
    ctv_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔗 API Endpoints

### Worker API (`https://ctv-api.yendev96.workers.dev`)

**Create Order:**
```
POST /api/order/create
Content-Type: application/json

{
  "orderId": "DH251113XXX",
  "customer": { "name": "...", "phone": "...", "address": "..." },
  "cart": [...],
  "total": "100.000đ",
  "totalAmount": 100000,
  "referralCode": "CTV123456",
  "paymentMethod": "COD"
}
```

**Get Orders by Referral:**
```
GET /?action=getOrders&referralCode=CTV123456
```

**Get All CTV:**
```
GET /?action=getAllCTV
```

## 🎨 Features

### Customer Features
- ✅ Browse products by categories
- ✅ Quick buy with COD/Bank transfer
- ✅ Shopping cart with discount codes
- ✅ Referral tracking via URL (`?ref=CTV123456`)
- ✅ Order confirmation via Telegram

### CTV (Affiliate) Features
- ✅ Unique referral code
- ✅ Commission tracking
- ✅ Order history by referral code
- ✅ Email notifications for new orders

### Admin Features
- ✅ Order management in Google Sheets
- ✅ CTV management in D1 database
- ✅ Real-time Telegram notifications
- ✅ Commission calculation

## 🔐 Environment Variables

Cấu hình trong `wrangler.toml`:

```toml
[vars]
GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/..."
SECRET_KEY = "YOUR_SECRET_KEY"
```

## 📝 Notes

- Frontend luôn gọi Worker API (không dùng Pages Functions)
- Worker xử lý validation và lưu vào D1
- Google Sheets làm backup và notification
- Commission được tính từ `commission_rate` trong D1

## 🐛 Troubleshooting

### Cache Issues
Nếu thay đổi code không có hiệu lực:
1. Clear Cloudflare cache: Dashboard → Caching → Purge Everything
2. Hard refresh browser: `Ctrl + Shift + R`

### D1 Database
Kiểm tra dữ liệu:
```bash
npx wrangler d1 execute vdt --command "SELECT * FROM orders LIMIT 5"
```

### Worker Logs
Xem logs real-time:
```bash
npx wrangler tail ctv-api --format pretty
```

## 📄 License

Private project - All rights reserved.

## 👤 Author

Yendev96 - yendev96@gmail.com
