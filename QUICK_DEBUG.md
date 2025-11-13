# ⚡ DEBUG NHANH - 3 Bước

## 🎯 Mục tiêu
Tìm lỗi tại sao:
1. Referral code bị trống trong Google Sheets
2. Dữ liệu không lưu vào D1

---

## ✅ BƯỚC 1: Test Worker (2 phút)

**Mở file test:**
```powershell
start test-order-api.html
```

**Trong browser, nhấn các nút theo thứ tự:**
1. `1️⃣ Test Worker Health` → Xem Worker có sống không
2. `2️⃣ Test Create Order` → Tạo đơn test với referral code
3. `3️⃣ Check D1 Orders` → Xem D1 có dữ liệu không

**Kết quả:**
- ✅ Nếu tất cả đều xanh → Hệ thống OK, vấn đề ở frontend
- ❌ Nếu có đỏ → Ghi lại lỗi và chuyển sang bước 2

---

## ✅ BƯỚC 2: Kiểm tra D1 (1 phút)

```powershell
# Xem đơn hàng mới nhất
npx wrangler d1 execute vdt --command "SELECT order_id, referral_code, commission FROM orders ORDER BY created_at DESC LIMIT 3"
```

**Kết quả:**
- ✅ Có dữ liệu + referral_code không NULL → D1 OK
- ❌ Không có dữ liệu → Worker không lưu được D1
- ❌ referral_code NULL → CTV không tồn tại trong D1

---

## ✅ BƯỚC 3: Xem Worker Logs (Real-time)

**Terminal 1 - Xem logs:**
```powershell
npx wrangler tail ctv-api --format pretty
```

**Terminal 2 - Đặt hàng test:**
Vào website và đặt 1 đơn hàng với referral code

**Xem logs, tìm:**
- ✅ `✅ Saved order to D1` → D1 OK
- ✅ `✅ Saved order to Google Sheets` → Sheets OK
- ❌ `⚠️ Referral code không tồn tại` → CTV chưa có trong D1
- ❌ `Failed to insert` → SQL lỗi

---

## 🔥 Giải pháp Nhanh

### Nếu Worker chưa deploy:
```powershell
cd worker
npx wrangler deploy
cd ..
```

### Nếu CTV chưa có trong D1:
```powershell
# Thêm CTV test
npx wrangler d1 execute vdt --command "INSERT INTO ctv (full_name, phone, referral_code, commission_rate) VALUES ('Test CTV', '0123456789', 'CTV843817', 0.1)"
```

### Nếu frontend chưa build:
```powershell
npm run build
```

---

## 📊 Kết quả mong đợi

**Test Order API:**
```
✅ Worker đang hoạt động! Status: 200
✅ Đơn hàng đã được tạo thành công!
📝 Order ID: TEST1699...
💵 Commission: 15000
✅ Tìm thấy 1 đơn hàng
```

**D1 Query:**
```
order_id          | referral_code | commission
TEST1699...       | CTV843817     | 15000
```

**Worker Logs:**
```
✅ Saved order to D1: TEST1699...
📤 Sending to Google Sheets
✅ Saved order to Google Sheets
```

---

## 🆘 Nếu vẫn lỗi

Gửi cho tôi 3 thứ này:
1. Screenshot từ `test-order-api.html` (sau khi nhấn Test Create Order)
2. Output từ: `npx wrangler d1 execute vdt --command "SELECT * FROM orders LIMIT 1"`
3. Worker logs khi đặt hàng (từ `npx wrangler tail ctv-api`)
