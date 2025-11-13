# 🚀 DEPLOY NGAY - Fix Production Issue

## Các thay đổi đã thực hiện:

### 1. ✅ Xóa toàn bộ Pages Functions
- Xóa thư mục `functions/` để đảm bảo không có Pages Function nào chặn request

### 2. ✅ Sửa Worker gửi referralCode từ frontend
- Worker bây giờ gửi `data.referralCode` (từ frontend) thay vì `validReferralCode` (đã validate)
- Google Sheets sẽ luôn nhận được referralCode, dù CTV có trong D1 hay không

### 3. ✅ Tạo file test production
- `public/test-production.html` - Tool test trên production

---

## 📦 Các bước deploy:

### Bước 1: Commit changes

```bash
git add .
git commit -m "Fix: Remove Pages Functions, always send referralCode to Google Sheets"
git push
```

### Bước 2: Đợi auto deploy (nếu có)
- Cloudflare Pages sẽ tự động deploy khi push lên Git
- Hoặc deploy thủ công:

```bash
npx wrangler pages deploy public
```

### Bước 3: Clear cache

**Trên Cloudflare Dashboard:**
1. Vào Pages project → Settings
2. Tìm "Purge Cache" hoặc "Clear Cache"
3. Click để xóa cache

**Trên browser:**
- Nhấn `Ctrl + Shift + R` (Windows) hoặc `Cmd + Shift + R` (Mac)
- Hoặc mở DevTools (F12) → Network tab → Check "Disable cache"

### Bước 4: Test trên production

**Cách 1: Dùng file test**
1. Truy cập: `https://your-site.pages.dev/test-production.html`
2. Nhấn các nút test
3. Xem kết quả

**Cách 2: Đặt hàng thật**
1. Truy cập website: `https://your-site.pages.dev`
2. Thêm `?ref=CTV009726` vào URL
3. Đặt hàng
4. Kiểm tra Google Sheets và D1

---

## 🔍 Kiểm tra kết quả:

### Kiểm tra D1:
```bash
npx wrangler d1 execute vdt --command "SELECT order_id, referral_code, commission FROM orders ORDER BY created_at DESC LIMIT 3"
```

### Kiểm tra Google Sheets:
- Mở Google Sheets
- Xem cột "Mã Referral" có giá trị không

---

## ✅ Kết quả mong đợi:

### Trên Production:
- ✅ Frontend gọi: `https://ctv-api.yendev96.workers.dev/api/order/create`
- ✅ Worker lưu vào D1 (nếu CTV tồn tại → có commission)
- ✅ Worker gửi đến Google Sheets (luôn có referralCode)
- ✅ Google Sheets hiển thị referralCode đầy đủ

### Logs mong đợi:
```
✅ Saved order to D1: DH251113XXX
📤 Sending to Google Sheets: { referralCode: 'CTV009726', ... }
✅ Saved order to Google Sheets
```

---

## 🆘 Nếu vẫn lỗi:

### Vấn đề 1: ReferralCode vẫn trống trong Google Sheets
→ Kiểm tra Worker logs: `npx wrangler tail ctv-api`
→ Xem có log `📤 Sending to Google Sheets` với referralCode không

### Vấn đề 2: Không lưu vào D1
→ Kiểm tra có log `✅ Saved order to D1` không
→ Nếu không có → Worker không được gọi hoặc có lỗi

### Vấn đề 3: Worker không được gọi
→ Kiểm tra browser console (F12) → Network tab
→ Xem request có gọi đến `ctv-api.yendev96.workers.dev` không
→ Nếu không → Frontend vẫn đang load file JS cũ (cache)

---

## 🎯 Quick Fix nếu cache không clear:

### Thêm version vào file JS:

Sửa `public/index.html`:
```html
<!-- Thay đổi từ -->
<script src="./assets/js/app.min.js"></script>

<!-- Thành -->
<script src="./assets/js/app.min.js?v=2"></script>
```

Rồi commit và deploy lại.
