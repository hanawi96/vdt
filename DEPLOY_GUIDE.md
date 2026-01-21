# 🚀 HƯỚNG DẪN DEPLOY CODE

## 📋 Tóm tắt thay đổi cần deploy

Bạn đã thực hiện **3 thay đổi quan trọng** cần deploy:

### 1. ✅ **Chuyển đổi địa chỉ** (vietnamAddress.json → tree.json)
- **File:** `public/assets/js/app.js`, `public/assets/js/app.min.js`
- **Ảnh hưởng:** Frontend (Cloudflare Pages)
- **Mô tả:** Cập nhật nguồn dữ liệu địa chỉ Việt Nam

### 2. ✅ **Hiển thị "Tiền COD: 0đ"** khi chuyển khoản
- **File:** `public/index.html`
- **Ảnh hưởng:** Frontend (Cloudflare Pages)
- **Mô tả:** Thêm badge và dòng thông báo trong 3 modals

### 3. ✅ **Loại bỏ per_product khỏi packaging_details**
- **File:** `worker/shop-worker.js`
- **Ảnh hưởng:** Backend (Cloudflare Workers)
- **Mô tả:** Sửa logic tính chi phí đóng gói

---

## 🎯 Cần deploy 2 phần

### **A. Frontend (Cloudflare Pages)** - HTML, CSS, JS
### **B. Backend (Cloudflare Workers)** - API Worker

---

## 📦 A. DEPLOY FRONTEND (Cloudflare Pages)

### **Bước 1: Build assets (nếu cần)**
```bash
# Build CSS và JS (nếu có thay đổi)
npm run build
```

### **Bước 2: Deploy lên Cloudflare Pages**

#### **Cách 1: Deploy qua Git (Khuyến nghị)**
```bash
# Commit changes
git add .
git commit -m "feat: update address data source, add COD display, fix packaging cost"

# Push to repository
git push origin main
```
→ Cloudflare Pages sẽ tự động deploy khi có commit mới

#### **Cách 2: Deploy thủ công qua Wrangler**
```bash
# Deploy thư mục public
npx wrangler pages deploy public --project-name=vdt-shop
```

---

## 🔧 B. DEPLOY BACKEND (Cloudflare Workers)

### **Bước 1: Kiểm tra Wrangler đã cài chưa**
```bash
npx wrangler --version
```

Nếu chưa có, cài đặt:
```bash
npm install -g wrangler
# hoặc
npm install wrangler --save-dev
```

### **Bước 2: Login vào Cloudflare**
```bash
npx wrangler login
```
→ Trình duyệt sẽ mở, đăng nhập vào tài khoản Cloudflare của bạn

### **Bước 3: Deploy Worker**
```bash
# Deploy worker với config từ wrangler-shop.toml
npx wrangler deploy --config wrangler-shop.toml
```

**Hoặc nếu bạn đã setup script:**
```bash
# Thêm vào package.json
"scripts": {
  "deploy": "wrangler deploy --config wrangler-shop.toml"
}

# Chạy deploy
npm run deploy
```

### **Bước 4: Kiểm tra deploy thành công**
```bash
# Xem logs
npx wrangler tail shop-order-api
```

---

## ✅ KIỂM TRA SAU KHI DEPLOY

### **1. Kiểm tra Frontend**
- ✅ Mở trang web
- ✅ Thêm sản phẩm vào giỏ hàng
- ✅ Mở modal "Thông tin nhận hàng"
- ✅ Chọn Tỉnh/Quận/Xã → Kiểm tra dữ liệu hiển thị đúng
- ✅ Chọn "Chuyển khoản ngân hàng" → Kiểm tra badge "Tiền COD: 0đ" xuất hiện

### **2. Kiểm tra Backend**
- ✅ Tạo đơn hàng mới
- ✅ Kiểm tra database: `packaging_details` không còn `per_product`
- ✅ Kiểm tra `packaging_cost` chỉ tính chi phí đóng gói thực tế

---

## 🔍 TROUBLESHOOTING

### **Lỗi: "wrangler: command not found"**
```bash
# Cài đặt wrangler
npm install -g wrangler
```

### **Lỗi: "Not logged in"**
```bash
# Login lại
npx wrangler login
```

### **Lỗi: "Failed to publish"**
```bash
# Kiểm tra config
npx wrangler whoami
npx wrangler deploy --config wrangler-shop.toml --dry-run
```

### **Frontend không cập nhật**
```bash
# Clear cache Cloudflare
# Vào Cloudflare Dashboard → Caching → Purge Everything
```

### **Worker không cập nhật**
```bash
# Force deploy
npx wrangler deploy --config wrangler-shop.toml --force
```

---

## 📝 LỆNH DEPLOY NHANH

### **Deploy tất cả (Frontend + Backend)**
```bash
# 1. Build frontend
npm run build

# 2. Commit & push (nếu dùng Git auto-deploy)
git add .
git commit -m "feat: update address, COD display, packaging cost"
git push origin main

# 3. Deploy worker
npx wrangler deploy --config wrangler-shop.toml

# 4. Kiểm tra
npx wrangler tail shop-order-api
```

### **Deploy chỉ Worker (Backend)**
```bash
npx wrangler deploy --config wrangler-shop.toml
```

### **Deploy chỉ Frontend (nếu không dùng Git)**
```bash
npm run build
npx wrangler pages deploy public --project-name=vdt-shop
```

---

## 🎯 KHUYẾN NGHỊ

### **Setup CI/CD tự động**
Thêm vào `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npx wrangler deploy --config wrangler-shop.toml
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### **Thêm script vào package.json**
```json
{
  "scripts": {
    "build": "npm run build-css && npm run build-js",
    "deploy:worker": "wrangler deploy --config wrangler-shop.toml",
    "deploy:pages": "wrangler pages deploy public --project-name=vdt-shop",
    "deploy": "npm run build && npm run deploy:worker && npm run deploy:pages"
  }
}
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Backup trước khi deploy:**
   - Export database nếu cần
   - Commit code lên Git

2. **Test trên môi trường dev trước:**
   ```bash
   npx wrangler dev --config wrangler-shop.toml
   ```

3. **Kiểm tra logs sau deploy:**
   ```bash
   npx wrangler tail shop-order-api
   ```

4. **Rollback nếu có lỗi:**
   ```bash
   # Rollback worker về version trước
   npx wrangler rollback shop-order-api
   ```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra logs: `npx wrangler tail shop-order-api`
2. Xem status: `npx wrangler deployments list`
3. Kiểm tra config: `npx wrangler whoami`

---

**Chúc bạn deploy thành công!** 🚀
