# 🔧 FIX LỖI MIME TYPE - HƯỚNG DẪN CHI TIẾT

## ❌ Vấn đề hiện tại
```
Refused to apply style from 'https://shopvd.store/assets/css/styles.min.css' 
because its MIME type ('text/html') is not a supported stylesheet MIME type
```

## 🎯 Nguyên nhân
Bạn có **Worker cũ** đang chạy trên domain `shopvd.store` và nó đang chặn TẤT CẢ requests, kể cả CSS/JS files.

## ✅ GIẢI PHÁP - Làm theo thứ tự

### Bước 1: XÓA Worker cũ trong Cloudflare Dashboard

1. Đăng nhập **Cloudflare Dashboard**
2. Vào **Workers & Pages**
3. Tìm worker có tên `shopvd-worker` hoặc `hidden-bonus-76d2`
4. Click vào worker đó
5. Vào tab **Settings** → **Delete** → Xác nhận xóa

**QUAN TRỌNG**: Phải xóa worker cũ trước khi deploy lại!

---

### Bước 2: Kiểm tra cấu hình Cloudflare Pages

1. Vào **Workers & Pages**
2. Tìm project Pages của bạn (có thể tên là `shopvd` hoặc tương tự)
3. Click vào project
4. Kiểm tra:
   - **Settings** → **Build configuration**:
     - Build command: (để trống)
     - Build output directory: `public`
     - Root directory: `/`

---

### Bước 3: Set Environment Variable

1. Trong project Pages, vào **Settings** → **Environment variables**
2. Click **Add variable**
3. Thêm:
   - **Variable name**: `GOOGLE_SCRIPT_URL`
   - **Value**: (URL Google Apps Script của bạn)
   - **Environment**: Production (và Preview nếu cần)
4. Click **Save**

---

### Bước 4: Kiểm tra Custom Domain

1. Vào **Custom domains** trong project Pages
2. Đảm bảo `shopvd.store` được add vào đây
3. Nếu chưa có, click **Set up a custom domain** và add `shopvd.store`

---

### Bước 5: Push code mới lên GitHub

```bash
git add .
git commit -m "Fix MIME type - Use Cloudflare Pages Functions only"
git push origin main
```

Cloudflare Pages sẽ tự động:
- Detect thay đổi từ GitHub
- Build và deploy
- File `functions/api/order.js` sẽ tự động trở thành API endpoint

---

### Bước 6: Purge Cache

1. Trong Cloudflare Dashboard
2. Vào domain `shopvd.store` (trong **Websites**)
3. Vào **Caching** → **Configuration**
4. Click **Purge Everything**
5. Xác nhận

---

### Bước 7: Test

1. Mở trình duyệt **Incognito/Private** (Ctrl + Shift + N)
2. Truy cập `https://shopvd.store`
3. Bấm **F12** → **Console**
4. Kiểm tra:
   - ✅ Không còn lỗi MIME type
   - ✅ CSS load thành công
   - ✅ Website hiển thị đúng

5. Test đặt hàng:
   - Thêm sản phẩm vào giỏ
   - Điền thông tin
   - Đặt hàng
   - Kiểm tra có nhận được thông báo thành công không

---

## 🔍 Kiểm tra routing

Sau khi deploy, routing sẽ như sau:

```
https://shopvd.store/
  ↓
  ├── /                          → index.html (static)
  ├── /assets/css/styles.min.css → CSS file (static, MIME: text/css)
  ├── /assets/js/app.js          → JS file (static, MIME: application/javascript)
  ├── /assets/images/*           → Images (static)
  └── /api/order                 → Cloudflare Pages Function (API)
```

---

## 🐛 Nếu vẫn lỗi

### Lỗi 1: Vẫn báo MIME type sai
**Nguyên nhân**: Worker cũ chưa bị xóa hoặc cache chưa clear

**Giải pháp**:
1. Xóa worker cũ (Bước 1)
2. Purge cache (Bước 6)
3. Xóa cache trình duyệt: Ctrl + Shift + Delete
4. Thử lại trong Incognito mode

### Lỗi 2: API không hoạt động
**Nguyên nhân**: Chưa set `GOOGLE_SCRIPT_URL`

**Giải pháp**:
1. Set environment variable (Bước 3)
2. Redeploy: Pages → Deployments → Retry deployment

### Lỗi 3: 404 Not Found cho /api/order
**Nguyên nhân**: File `functions/api/order.js` chưa được deploy

**Giải pháp**:
1. Kiểm tra file tồn tại: `functions/api/order.js`
2. Push lại code
3. Xem logs: Pages → Functions → Logs

---

## 📋 Checklist

- [ ] Đã xóa Worker cũ
- [ ] Đã set `GOOGLE_SCRIPT_URL` trong Environment Variables
- [ ] Đã add custom domain `shopvd.store` vào Pages
- [ ] Đã push code mới lên GitHub
- [ ] Đã purge cache Cloudflare
- [ ] Đã xóa cache trình duyệt
- [ ] Đã test trong Incognito mode
- [ ] Website hiển thị đúng, không lỗi MIME type
- [ ] API đặt hàng hoạt động

---

## 📞 Cần hỗ trợ thêm?

Nếu làm theo tất cả các bước trên mà vẫn lỗi, hãy:
1. Chụp screenshot lỗi trong Console (F12)
2. Chụp screenshot cấu hình Pages trong Cloudflare Dashboard
3. Kiểm tra logs: Pages → Functions → Logs
