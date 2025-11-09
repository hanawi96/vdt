# 🚀 Hướng Dẫn Deploy Nhanh

## ✅ Đã sửa lỗi MIME type

Lỗi "MIME type ('text/html') is not a supported stylesheet" đã được khắc phục bằng cách:
1. Tách riêng API endpoint `/api/order` 
2. Static files (CSS, JS) được serve trực tiếp bởi Cloudflare Pages
3. Thêm headers đúng cho CSS/JS files

## 📝 Các bước deploy

### Bước 1: Push code lên GitHub
```bash
git add .
git commit -m "Fix MIME type and API routing"
git push
```

### Bước 2: Cấu hình Cloudflare Pages

1. **Vào Cloudflare Dashboard** → **Pages**
2. **Chọn project** của bạn (hoặc tạo mới)
3. **Build settings**:
   - Build command: (để trống)
   - Build output directory: `public`

4. **Environment Variables** (Settings → Environment variables):
   - Thêm biến: `GOOGLE_SCRIPT_URL` = URL Google Apps Script của bạn

5. **Deploy** → Cloudflare sẽ tự động build và deploy

### Bước 3: Kiểm tra

1. Mở website: `https://shopvd.store`
2. Bấm F12 → Console
3. Không còn lỗi MIME type ✅
4. Thử đặt hàng để test

## 🔧 Cấu trúc mới

```
├── public/              # Static files (HTML, CSS, JS, images)
│   ├── index.html
│   ├── assets/
│   │   ├── css/        # CSS files với MIME type đúng
│   │   └── js/         # JS files với MIME type đúng
│   └── _headers        # Cấu hình headers cho static files
│
├── functions/           # Cloudflare Pages Functions
│   └── api/
│       └── order.js    # API endpoint xử lý đơn hàng
│
└── worker/             # (Backup - không dùng nữa)
    └── worker.js
```

## 🎯 Routing

- `https://shopvd.store/` → Trang chủ (static)
- `https://shopvd.store/assets/*` → CSS, JS, images (static)
- `https://shopvd.store/api/order` → API xử lý đơn hàng (function)

## ⚠️ Lưu ý

- **Không cần** deploy worker riêng nữa
- **Không cần** file `wrangler.toml` (đã tạo sẵn cho backup)
- Cloudflare Pages Functions tự động xử lý routing
- Nhớ set biến `GOOGLE_SCRIPT_URL` trong Cloudflare Dashboard

## 🐛 Nếu vẫn lỗi

1. **Xóa cache**: Ctrl + Shift + Delete
2. **Purge cache Cloudflare**: Dashboard → Caching → Purge Everything
3. **Kiểm tra logs**: Dashboard → Pages → Functions → Logs
4. **Redeploy**: Pages → Deployments → Retry deployment

## 📞 Cần hỗ trợ?

Kiểm tra file `DEPLOY.md` để xem hướng dẫn chi tiết hơn.
