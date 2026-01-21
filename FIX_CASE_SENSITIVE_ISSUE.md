# Fix: Case Sensitive Issue - Referral Code

## 🔴 Vấn đề tìm thấy

### Nguyên nhân chính xác:
**Frontend convert referral code sang chữ HOA, nhưng database lưu chữ thường**

### Chi tiết:
1. URL: `?ref=yenadd` (chữ thường)
2. Frontend convert: `yenadd` → `YENADD` (chữ HOA)
3. Gửi lên API: `referralCode: "YENADD"`
4. Worker query database: `WHERE custom_slug = 'YENADD'`
5. Database có: `custom_slug = 'yenadd'` (chữ thường)
6. Kết quả: **KHÔNG TÌM THẤY** → `referral_code = NULL`

### Test xác nhận:
```bash
# Chữ HOA - KHÔNG tìm thấy
curl "https://shop-order-api.yendev96.workers.dev/api/ctv/validate?code=YENADD"
# → {"valid":false,"message":"Mã CTV không tồn tại"}

# Chữ thường - Tìm thấy
curl "https://shop-order-api.yendev96.workers.dev/api/ctv/validate?code=yenadd"
# → {"valid":true,"data":{"name":"Phạm Văn Hùng","referral_code":"CTV100004",...}}
```

## ✅ Giải pháp đã fix

### Fix 1: Bỏ convert chữ HOA trong `handleReferralFromURL()`

**Trước:**
```javascript
const cleanCode = refCode.trim().toUpperCase(); // ❌ Convert sang HOA
```

**Sau:**
```javascript
const cleanCode = refCode.trim(); // ✅ Giữ nguyên case gốc
```

### Fix 2: Cập nhật `getPartnerInfo()` hỗ trợ cả chữ thường

**Trước:**
```javascript
const partner = this.partners[code.toUpperCase()]; // ❌ Chỉ tìm chữ HOA
```

**Sau:**
```javascript
// Thử tìm với code gốc trước, sau đó thử uppercase (tương thích ngược)
let partner = this.partners[code] || this.partners[code.toUpperCase()]; // ✅
```

## 📝 Các thay đổi

### File: `public/assets/js/app.js`

#### 1. Hàm `handleReferralFromURL()` (dòng ~4396)
```javascript
// TRƯỚC
const cleanCode = refCode.trim().toUpperCase();

// SAU
const cleanCode = refCode.trim(); // Giữ nguyên case để hỗ trợ custom_slug
```

#### 2. Hàm `getPartnerInfo()` (dòng ~4555)
```javascript
// TRƯỚC
const partner = this.partners[code.toUpperCase()];

// SAU
let partner = this.partners[code] || this.partners[code.toUpperCase()];
```

## 🧪 Test sau khi fix

### Test 1: Với custom_slug chữ thường
```
1. Truy cập: https://your-domain.com/?ref=yenadd
2. Xem Console:
   ✅ [REFERRAL] Valid code from URL: yenadd  (← Không còn YENADD)
   ✅ [REFERRAL] Saved to localStorage: {code: "yenadd", ...}
3. Đặt hàng
4. Xem Console:
   📦 [QUICK BUY] Order details: {
     referralCode: "yenadd",  (← Chữ thường)
     referralCommission: 1130
   }
5. Kiểm tra database:
   referral_code = "CTV100004" ✅
   commission = 1130 ✅
   commission_rate = 0.01 ✅
   ctv_phone = "0xxxxxxxxx" ✅
```

### Test 2: Với referral_code chữ HOA (tương thích ngược)
```
1. Truy cập: https://your-domain.com/?ref=CTV100004
2. Xem Console:
   ✅ [REFERRAL] Valid code from URL: CTV100004
3. Đặt hàng → Vẫn hoạt động bình thường
```

### Test 3: Với custom_slug chữ hoa (nếu có)
```
1. Truy cập: https://your-domain.com/?ref=ANHSHOP
2. Nếu database có custom_slug = "ANHSHOP" → Hoạt động
3. Nếu database có custom_slug = "anhshop" → Không hoạt động
   → Khuyến nghị: Lưu custom_slug chữ thường trong database
```

## 🎯 Kết quả mong đợi

### Console logs:
```
🔍 [REFERRAL] Starting handleReferralFromURL...
🔍 [REFERRAL] URL params: {refCode: "yenadd"}
✅ [REFERRAL] Valid code from URL: yenadd  ← Chữ thường
✅ [REFERRAL] Saved to localStorage: {code: "yenadd", expiry: ...}
✅ [REFERRAL] Code valid: yenadd

--- Khi đặt hàng ---
✅ [REFERRAL] Already loaded: yenadd
📦 [QUICK BUY] Order details: {
  referralCode: "yenadd",
  referralCommission: 1130,
  currentReferralCode: "yenadd"
}
```

### Database:
```sql
SELECT order_id, referral_code, commission, commission_rate, ctv_phone
FROM orders
WHERE order_id = 'DH260121XXX';

-- Kết quả:
order_id      | referral_code | commission | commission_rate | ctv_phone
--------------|---------------|------------|-----------------|------------
DH260121XXX   | CTV100004     | 1130       | 0.01           | 0972483892
```

## ⚠️ Lưu ý quan trọng

### 1. Case sensitivity trong database
- **custom_slug** nên lưu chữ thường để dễ nhớ: `yenadd`, `anhshop`
- **referral_code** nên lưu chữ HOA theo chuẩn: `CTV100004`
- Worker API sẽ tìm chính xác theo case trong database

### 2. Tương thích ngược
- Code cũ với chữ HOA vẫn hoạt động
- `getPartnerInfo()` thử cả 2 case: gốc và uppercase

### 3. Khuyến nghị
- Khi tạo custom_slug mới, dùng chữ thường: `yenadd`, `anhshop`
- Không dùng chữ HOA trong custom_slug để tránh nhầm lẫn
- Referral_code giữ nguyên format chuẩn: `CTV100004`

## 🚀 Deploy

Sau khi fix frontend, chỉ cần:
1. Clear cache browser (Ctrl + Shift + R)
2. Test lại với URL `?ref=yenadd`
3. Kiểm tra database sau khi đặt hàng

**KHÔNG cần deploy Worker** vì Worker đã đúng, chỉ frontend sai.

## ✅ Hoàn thành

- [x] Fix frontend không convert sang chữ HOA
- [x] Fix getPartnerInfo() hỗ trợ cả 2 case
- [x] Test xác nhận nguyên nhân
- [x] Tài liệu chi tiết

**Trạng thái:** Sẵn sàng để test!
