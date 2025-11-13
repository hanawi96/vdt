# 🔄 Hướng dẫn Clear Cache cho Custom Domain

## 🎯 Vấn đề:

- **Domain Cloudflare** (*.pages.dev): ✅ Hoạt động OK
- **Custom Domain** (shopvd.store): ❌ Vẫn dùng code cũ (cache)

---

## ✅ Giải pháp 1: Purge Cache trên Cloudflare (Khuyến nghị)

### Bước 1: Vào Cloudflare Dashboard

1. Đăng nhập: https://dash.cloudflare.com
2. Chọn domain: **shopvd.store**

### Bước 2: Purge Cache

**Option A: Purge Everything (Nhanh nhất)**
1. Vào **Caching** → **Configuration**
2. Click **Purge Everything**
3. Confirm

**Option B: Purge by URL (Chính xác hơn)**
1. Vào **Caching** → **Configuration**
2. Click **Custom Purge** → **Purge by URL**
3. Nhập các URL:
   ```
   https://shopvd.store/
   https://shopvd.store/assets/js/app.js
   https://shopvd.store/assets/js/config.js
   https://shopvd.store/index.html
   ```
4. Click **Purge**

### Bước 3: Test

1. Mở browser **Incognito/Private mode**
2. Truy cập: `https://shopvd.store`
3. Nhấn F12 → Network tab
4. Reload trang
5. Kiểm tra file `app.js` có `?v=2` không

---

## ✅ Giải pháp 2: Thêm Cache-Control Headers (Đã làm)

**Đã sửa:**
- ✅ Thêm `?v=2` vào file JS trong `index.html`
- ✅ Giảm cache time từ 1 năm xuống 1 giờ trong `_headers`

**Kết quả:**
- Browser sẽ check version mới mỗi giờ
- Khi thay đổi code, tăng version lên `?v=3`, `?v=4`...

---

## ✅ Giải pháp 3: Clear Browser Cache

### Chrome/Edge:
1. Nhấn `Ctrl + Shift + Delete`
2. Chọn "Cached images and files"
3. Click "Clear data"

### Hoặc Hard Refresh:
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Hoặc dùng Incognito:
- Windows: `Ctrl + Shift + N`
- Mac: `Cmd + Shift + N`

---

## 🔍 Cách kiểm tra cache đã clear chưa:

### Bước 1: Mở DevTools (F12)

### Bước 2: Vào Network tab
- Check "Disable cache"
- Reload trang

### Bước 3: Kiểm tra file app.js
- Tìm file `app.js?v=2`
- Click vào file
- Xem nội dung có dòng này không:
  ```javascript
  return `https://ctv-api.yendev96.workers.dev${endpoint}`;
  ```

### Bước 4: Test đặt hàng
- Thêm `?ref=CTV009726` vào URL
- Đặt hàng
- Kiểm tra Google Sheets và D1

---

## 📊 So sánh:

| Domain | Cache Status | Hoạt động |
|--------|--------------|-----------|
| *.pages.dev | Mới | ✅ OK |
| shopvd.store (trước) | Cũ | ❌ Lỗi |
| shopvd.store (sau purge) | Mới | ✅ OK |

---

## 🚀 Deploy và Clear Cache:

```bash
# 1. Build code mới
npm run build

# 2. Commit và push
git add .
git commit -m "Fix: Add cache busting version to JS files"
git push

# 3. Đợi auto deploy (hoặc deploy thủ công)
npx wrangler pages deploy public

# 4. Purge cache trên Cloudflare Dashboard
# (Làm thủ công theo hướng dẫn trên)

# 5. Test trên custom domain
# https://shopvd.store/?ref=CTV009726
```

---

## 🆘 Troubleshooting:

### Vấn đề 1: Sau khi purge vẫn lỗi
→ Clear browser cache (Ctrl + Shift + Delete)
→ Hoặc dùng Incognito mode

### Vấn đề 2: File JS không có ?v=2
→ Kiểm tra `index.html` đã commit chưa
→ Kiểm tra Pages đã deploy chưa

### Vấn đề 3: Vẫn gọi Pages Function thay vì Worker
→ Kiểm tra thư mục `functions/` đã bị xóa chưa
→ Kiểm tra `_routes.json`:
```json
{
  "version": 1,
  "include": [],
  "exclude": ["/*"]
}
```

---

## 💡 Tips:

### 1. Development mode
Khi đang dev, set cache = 0:
```
Cache-Control: no-cache, no-store, must-revalidate
```

### 2. Production mode
Sau khi stable, tăng cache lên:
```
Cache-Control: public, max-age=86400, must-revalidate
```

### 3. Version strategy
Mỗi lần deploy, tăng version:
- v1 → v2 →