# Fix: Bug discount_amount = 1500015 thay vì 15000

## Vấn đề
Khi đặt hàng với mã giảm giá VDT15K (giảm 15.000đ), giá trị lưu vào database là:
- `discount_amount = 1500015` ❌ (sai)
- Thay vì: `discount_amount = 15000` ✅ (đúng)

## Nguyên nhân
Trong function `createOrder()`, khi parse discount từ string:
```javascript
// Input: "-15.000đ (VDT15K)"
const extracted = discountStr.replace(/[^\d]/g, '');
// Output: "1500015" ❌ (lấy cả số "15" trong "VDT15K")
```

Regex `/[^\d]/g` lấy **TẤT CẢ** các chữ số trong string, bao gồm:
- "15000" từ "-15.000đ"
- "15" từ "VDT15K"
- Kết quả: "15000" + "15" = "1500015"

## Giải pháp
Chỉ lấy phần số **TRƯỚC** dấu ngoặc `(`:

```javascript
// Chỉ lấy phần số TRƯỚC dấu ngoặc (
// VD: "-15.000đ (VDT15K)" → lấy "-15.000đ" → "15000"
const beforeParenthesis = discountStr.split('(')[0].trim();
const extracted = beforeParenthesis.replace(/[^\d]/g, '');
// Output: "15000" ✅ (chỉ lấy số từ phần trước ngoặc)
```

## Code thay đổi

### Trước (SAI):
```javascript
let discountAmount = 0;
if (typeof discountStr === 'string' && discountStr.startsWith('-')) {
    const extracted = discountStr.replace(/[^\d]/g, '');
    discountAmount = parseInt(extracted, 10) || 0;
}
```

### Sau (ĐÚNG):
```javascript
let discountAmount = 0;
if (typeof discountStr === 'string' && discountStr.startsWith('-')) {
    // Chỉ lấy phần số TRƯỚC dấu ngoặc (
    const beforeParenthesis = discountStr.split('(')[0].trim();
    const extracted = beforeParenthesis.replace(/[^\d]/g, '');
    discountAmount = parseInt(extracted, 10) || 0;
}
```

## Test kết quả

### Test case
```javascript
{
  discount: "-15.000đ (VDT15K)",
  totalAmount: 184000
}
```

### Kết quả TRƯỚC fix:
```
orders table:
  discount_code: "VDT15K"
  discount_amount: 1500015  ❌
  total_amount: -1301015   ❌ (âm!)

discount_usage table:
  discount_amount: 1500015  ❌
  order_amount: 199000
```

### Kết quả SAU fix:
```
orders table:
  discount_code: "VDT15K"
  discount_amount: 15000    ✅
  total_amount: 184000      ✅

discount_usage table:
  discount_amount: 15000    ✅
  order_amount: 199000      ✅
```

## Các test cases khác

### Test 1: Mã giảm 10K
```
Input: "-10.000đ (GG10K)"
Before: "1000010" ❌
After: "10000" ✅
```

### Test 2: Mã giảm 2K
```
Input: "-2.000đ (GIAM2K)"
Before: "20002" ❌
After: "2000" ✅
```

### Test 3: Mã giảm 30K
```
Input: "-30.000đ (GG30K)"
Before: "3000030" ❌
After: "30000" ✅
```

### Test 4: Không có mã giảm giá
```
Input: "Không có"
Before: 0 ✅
After: 0 ✅
```

## Deploy
Worker đã được deploy với version ID: `a2b6d93d-fee1-4660-bcf8-e1639c9c6b14`

Ngày fix: 24/11/2025

## Verification
Chạy test script:
```bash
node test-discount-order.js
```

Kiểm tra database:
```bash
wrangler d1 execute vdt --remote --command "SELECT order_id, discount_code, discount_amount FROM orders ORDER BY id DESC LIMIT 1"
```

## Notes
- Bug này chỉ ảnh hưởng đến các đơn hàng có mã giảm giá
- Các đơn hàng cũ đã bị lưu sai cần được fix thủ công (nếu cần)
- Các đơn hàng mới từ bây giờ sẽ được lưu đúng
