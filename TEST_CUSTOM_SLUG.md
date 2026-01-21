# Test Custom Slug Feature

## Tổng quan
Hệ thống đã được cập nhật để hỗ trợ cả `referral_code` (CTV001) và `custom_slug` (anhshop).

## Các thay đổi đã thực hiện

### 1. Worker API (worker/shop-worker.js)

#### ✅ Cập nhật hàm `getCtvInfo()`
- Tìm kiếm theo thứ tự: `referral_code` → `custom_slug`
- Trả về đầy đủ thông tin CTV
- Lọc CTV có status != 'Từ chối'
- Logging chi tiết để debug

#### ✅ Cập nhật logic lưu order
- Phân biệt `referralCodeInput` (mã khách nhập) vs `referralCodeActual` (mã gốc từ DB)
- Luôn lưu `referral_code` gốc vào database, không phải custom_slug
- Validation: chỉ lưu khi tìm thấy CTV hợp lệ

#### ✅ Thêm endpoint `/api/ctv/validate`
- GET request với query param `?code=xxx`
- Trả về thông tin CTV nếu hợp lệ
- Hỗ trợ realtime validation từ frontend

### 2. Frontend (public/assets/js/app.js)

#### ✅ Cập nhật `validateReferralCode()`
- Chấp nhận format linh hoạt: chữ, số, gạch ngang, gạch dưới
- Tối thiểu 3 ký tự
- Regex: `/^[a-zA-Z0-9_-]{3,}$/`

#### ✅ Thêm `validateCtvFromAPI()`
- Gọi API `/api/ctv/validate` để validate realtime
- Trả về thông tin CTV (tên, commission_rate, matched_by)
- Có thể dùng để hiển thị tên CTV khi khách nhập mã

#### ✅ Cập nhật `getPartnerInfo()`
- Hỗ trợ cả `commission` (%) và `commission_rate` (0.1 = 10%)
- Fallback mặc định: 10%

## Cách test

### Test Case 1: Link với referral_code chuẩn
```
URL: https://your-domain.com/?ref=CTV001
Kết quả mong đợi:
- Tìm thấy CTV theo referral_code
- Lưu vào DB: referral_code = "CTV001"
- Log: matched_by = "referral_code"
```

### Test Case 2: Link với custom_slug
```
URL: https://your-domain.com/?ref=anhshop
Kết quả mong đợi:
- Không tìm thấy theo referral_code
- Tìm thấy theo custom_slug
- Lưu vào DB: referral_code = "CTV001" (mã gốc của CTV có slug "anhshop")
- Log: matched_by = "custom_slug"
```

### Test Case 3: Mã không tồn tại
```
URL: https://your-domain.com/?ref=invalid123
Kết quả mong đợi:
- Không tìm thấy CTV
- Không lưu referral_code vào order
- Log warning: "Invalid referral code"
```

### Test Case 4: API Validate
```javascript
// Trong browser console
const result = await Alpine.store('shop').validateCtvFromAPI('anhshop');
console.log(result);

// Kết quả mong đợi:
{
  valid: true,
  name: "Anh Shop",
  referral_code: "CTV001",
  custom_slug: "anhshop",
  commission_rate: 0.12,
  matched_by: "custom_slug"
}
```

## Kiểm tra trong database

### Trước khi đặt hàng
```sql
-- Kiểm tra CTV có custom_slug
SELECT id, full_name, referral_code, custom_slug, commission_rate, status
FROM ctv
WHERE custom_slug = 'anhshop' OR referral_code = 'CTV001';
```

### Sau khi đặt hàng
```sql
-- Kiểm tra order đã lưu đúng referral_code gốc chưa
SELECT order_id, customer_name, referral_code, commission, commission_rate, ctv_phone
FROM orders
WHERE order_id = 'VDT-xxx'
ORDER BY created_at_unix DESC
LIMIT 1;
```

## Lưu ý quan trọng

1. **Database luôn lưu referral_code gốc**, không phải custom_slug
2. **Thứ tự ưu tiên**: referral_code → custom_slug
3. **Validation thực sự ở backend**, frontend chỉ validate format cơ bản
4. **Commission_rate** từ database là số thập phân (0.12 = 12%)
5. **Status CTV** phải khác 'Từ chối' mới được tính hoa hồng

## Debug

### Xem log trong Worker
```bash
# Trong Cloudflare Dashboard > Workers > Logs
# Hoặc dùng wrangler tail
wrangler tail --env production
```

### Xem log trong Browser Console

#### 1. Kiểm tra trạng thái referral hiện tại
```javascript
// Mở Console (F12) và gõ:
Alpine.store('shop').showReferralStatus();

// Output mẫu:
// ═══════════════════════════════════════
// 📊 [REFERRAL STATUS]
// ═══════════════════════════════════════
// Current code: CTV001
// Stored data: {
//   code: "CTV001",
//   expiry: "28/01/2025, 10:30:00",
//   daysRemaining: "6.8 days",
//   isExpired: false
// }
// Partner info: { name: "CTV", commission: 10 }
// Commission rate: 10%
// Test commission (200k): 20,000đ
// ═══════════════════════════════════════
```

#### 2. Test validate API với mã cụ thể
```javascript
// Test với referral_code
await Alpine.store('shop').testApiValidation('CTV001');

// Test với custom_slug
await Alpine.store('shop').testApiValidation('anhshop');

// Output mẫu khi thành công:
// ═══════════════════════════════════════
// 🧪 [TEST API VALIDATION]
// ═══════════════════════════════════════
// Testing code: anhshop
// 🔍 [REFERRAL API] Validating code from API: anhshop
// 🔍 [REFERRAL API] Calling: https://shop-order-api.yendev96.workers.dev/api/ctv/validate?code=anhshop
// 🔍 [REFERRAL API] Response: {success: true, valid: true, data: {...}}
// ✅ [REFERRAL API] Valid CTV: {
//   name: "Anh Shop",
//   code: "CTV001",
//   slug: "anhshop",
//   matched_by: "custom_slug"
// }
// Result: {
//   valid: true,
//   name: "Anh Shop",
//   referral_code: "CTV001",
//   custom_slug: "anhshop",
//   commission_rate: 0.12,
//   matched_by: "custom_slug"
// }
// ═══════════════════════════════════════
```

#### 3. Set mã test thủ công
```javascript
// Set mã CTV để test
Alpine.store('shop').setTestReferral('CTV001');

// Hoặc set custom slug
Alpine.store('shop').setTestReferral('anhshop');

// Output mẫu:
// ═══════════════════════════════════════
// 🧪 [SET TEST REFERRAL]
// ═══════════════════════════════════════
// Setting code: anhshop
// 🔍 [REFERRAL] Validating code: anhshop
// ✅ [REFERRAL] Valid format
// ✅ Saved to localStorage
// ✅ Code set successfully
// Partner info: { name: "CTV", commission: 10 }
// ═══════════════════════════════════════
```

#### 4. Test URL parsing
```javascript
// Kiểm tra URL hiện tại
Alpine.store('shop').testUrlParsing();

// Output mẫu:
// ═══════════════════════════════════════
// 🧪 [TEST URL PARSING]
// ═══════════════════════════════════════
// Current URL: https://your-domain.com/?ref=anhshop
// URL params: { ref: "anhshop" }
// ref param: anhshop
// ═══════════════════════════════════════
```

#### 5. Xem localStorage trực tiếp
```javascript
// Xem dữ liệu referral
console.log(JSON.parse(localStorage.getItem('referralData')));

// Output mẫu:
// {
//   code: "CTV001",
//   expiry: 1738051800000
// }
```

#### 6. Theo dõi log realtime khi load trang
Khi bạn truy cập link có `?ref=xxx`, console sẽ tự động hiển thị:

```
🔍 [REFERRAL] Starting handleReferralFromURL...
🔍 [REFERRAL] URL params: { refCode: "anhshop" }
✅ [REFERRAL] Valid code from URL: ANHSHOP
✅ [REFERRAL] Saved to localStorage: { code: "ANHSHOP", expiry: 1738051800000 }
✅ [REFERRAL] Cleaned URL
🔍 [REFERRAL] Revalidating after data load...
🔍 [REFERRAL] Current code: ANHSHOP
🔍 [REFERRAL] Validating code: ANHSHOP
✅ [REFERRAL] Valid format
✅ [REFERRAL] Code valid: ANHSHOP
```

### Các hàm debug có sẵn

| Hàm | Mô tả | Cách dùng |
|-----|-------|-----------|
| `showReferralStatus()` | Hiển thị trạng thái referral hiện tại | `Alpine.store('shop').showReferralStatus()` |
| `testApiValidation(code)` | Test validate mã qua API | `await Alpine.store('shop').testApiValidation('anhshop')` |
| `setTestReferral(code)` | Set mã test thủ công | `Alpine.store('shop').setTestReferral('CTV001')` |
| `testUrlParsing()` | Kiểm tra URL params | `Alpine.store('shop').testUrlParsing()` |
| `validateCtvFromAPI(code)` | Validate và lấy thông tin CTV | `await Alpine.store('shop').validateCtvFromAPI('anhshop')` |

### Log Symbols

- 🔍 = Đang kiểm tra/debug
- ✅ = Thành công
- ❌ = Lỗi
- ⚠️ = Cảnh báo
- ℹ️ = Thông tin
- 📊 = Trạng thái
- 🧪 = Test/Debug function
- 💰 = Tính toán tiền/hoa hồng

## Các bước tiếp theo (nếu cần)

1. **UI hiển thị tên CTV**: Thêm badge hiển thị "Bạn đang được hỗ trợ bởi: [Tên CTV]"
2. **Thống kê**: Tracking xem link nào được dùng nhiều hơn (code vs slug)
3. **QR Code**: Tạo QR code cho từng CTV với custom_slug
4. **Short URL**: Tạo link rút gọn dạng `shop.com/ctv/anhshop`

## Hoàn thành ✅

- [x] Bước 1: Cập nhật Worker API - getCtvInfo hỗ trợ custom_slug
- [x] Bước 2: Thêm endpoint /api/ctv/validate
- [x] Bước 3: Cập nhật Frontend validation
- [x] Bước 4: Tài liệu test

**Trạng thái**: Sẵn sàng để test và deploy!
