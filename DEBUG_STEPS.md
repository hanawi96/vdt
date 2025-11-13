# 🔍 HƯỚNG DẪN DEBUG - Tìm lỗi thông minh

## Vấn đề hiện tại:
1. ❌ Referral code bị trống trong Google Sheets
2. ❌ Dữ liệu không được lưu vào D1

## Các bước kiểm tra (theo thứ tự ưu tiên):

### BƯỚC 1: Kiểm tra Worker có nhận được request không

```powershell
# Mở file test-order-api.html trong browser
start test-order-api.html

# Hoặc
explorer test-order-api.html
```

**Trong browser:**
1. Nhấn nút "1️⃣ Test Worker Health" → Xem Worker có hoạt động không
2. Nhấn nút "2️⃣ Test Create Order" → Tạo đơn hàng test
3. Xem kết quả trong output

**Kết quả mong đợi:**
- ✅ Worker Status: 200
- ✅ Response: `{"success": true, "orderId": "TEST...", "commission": 15800}`

**Nếu lỗi:**
- ❌ Worker không phản hồi → Worker chưa deploy hoặc URL sai
- ❌ CORS error → Kiểm tra CORS headers trong Worker
- ❌ 500 error → Có lỗi trong Worker code

---

### BƯỚC 2: Kiểm tra D1 Database

```powershell
# Xem đơn hàng trong D1
npx wrangler d1 execute vdt --command "SELECT * FROM orders ORDER BY created_at DESC LIMIT 3"

# Đếm số đơn hàng
npx wrangler d1 execute vdt --command "SELECT COUNT(*) as total FROM orders"

# Xem CTV
npx wrangler d1 execute vdt --command "SELECT referral_code, full_name, commission_rate FROM ctv LIMIT 5"
```

**Kết quả mong đợi:**
- ✅ Có đơn hàng trong D1
- ✅ `referral_code` không NULL
- ✅ `commission` > 0

**Nếu không có dữ liệu:**
- ❌ Worker không lưu được vào D1
- ❌ D1 binding chưa được cấu hình
- ❌ SQL query bị lỗi

---

### BƯỚC 3: Xem Worker Logs Real-time

```powershell
# Mở terminal mới và chạy
npx wrangler tail ctv-api --format pretty
```

**Sau đó đặt hàng trên website và xem logs:**

**Logs mong đợi:**
```
✅ Saved order to D1: VDT20241113001
📤 Sending to Google Sheets: {...}
✅ Saved order to Google Sheets
```

**Nếu thấy lỗi:**
- ❌ `Failed to insert order into D1` → SQL query lỗi
- ❌ `D1 is not defined` → D1 binding chưa được cấu hình
- ❌ `referral_code không tồn tại` → CTV không có trong database

---

### BƯỚC 4: Kiểm tra Frontend gửi dữ liệu đúng không

**Mở browser console (F12) khi đặt hàng:**

```javascript
// Xem dữ liệu gửi đi
console.log('Order Data:', orderDetails);
```

**Kiểm tra:**
- ✅ `referralCode` có giá trị (ví dụ: "CTV843817")
- ✅ `totalAmount` là số (ví dụ: 158000)
- ✅ `customer.name`, `customer.phone` có giá trị

**Nếu referralCode bị trống:**
- ❌ `validateReferralCode()` trả về false
- ❌ `this.referralCode` bị undefined
- ❌ URL không có `?ref=CTV843817`

---

### BƯỚC 5: Test trực tiếp Worker API

```powershell
# Test bằng curl (PowerShell)
$body = @{
    orderId = "TEST$(Get-Date -Format 'yyyyMMddHHmmss')"
    orderDate = (Get-Date).ToUniversalTime().ToString('o')
    customer = @{
        name = "Test Customer"
        phone = "0123456789"
        address = "Test Address"
    }
    cart = @(
        @{
            name = "Test Product"
            price = "100.000đ"
            quantity = 1
            weight = 10
        }
    )
    total = "100.000đ"
    totalAmount = 100000
    paymentMethod = "COD"
    referralCode = "CTV843817"
    telegramNotification = "VDT_SECRET_2025_ANHIEN"
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://ctv-api.yendev96.workers.dev/api/order/create" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "orderId": "TEST20241113...",
  "commission": 10000
}
```

---

## 🎯 Chẩn đoán nhanh

### Nếu Worker không nhận được request:
→ Kiểm tra URL trong `app.js`: `https://ctv-api.yendev96.workers.dev`
→ Kiểm tra Worker có deploy chưa: `npx wrangler deployments list --name ctv-api`

### Nếu Worker nhận được nhưng không lưu D1:
→ Kiểm tra D1 binding trong `wrangler.toml`
→ Deploy lại Worker: `cd worker && npx wrangler deploy`

### Nếu referralCode bị trống:
→ Kiểm tra URL có `?ref=CTV843817` không
→ Kiểm tra `validateReferralCode()` trong `app.js`
→ Kiểm tra `this.referralCode` có giá trị không

### Nếu commission = 0:
→ Kiểm tra CTV có trong D1 không
→ Kiểm tra `commission_rate` trong bảng `ctv`
→ Kiểm tra Worker có query D1 đúng không

---

## 📝 Checklist Debug

- [ ] Mở `test-order-api.html` và test Worker
- [ ] Kiểm tra D1 có dữ liệu không
- [ ] Xem Worker logs real-time
- [ ] Kiểm tra browser console khi đặt hàng
- [ ] Test trực tiếp Worker API bằng curl
- [ ] Kiểm tra Google Sheets có nhận được dữ liệu không
- [ ] So sánh dữ liệu giữa D1 và Google Sheets

---

## 🚀 Giải pháp nhanh

**Nếu cần fix ngay:**

1. Deploy lại Worker:
```powershell
cd worker
npx wrangler deploy
cd ..
```

2. Build lại frontend:
```powershell
npm run build
```

3. Test lại bằng `test-order-api.html`

4. Nếu vẫn lỗi, gửi cho tôi:
   - Screenshot output từ `test-order-api.html`
   - Worker logs từ `npx wrangler tail ctv-api`
   - Browser console logs khi đặt hàng
