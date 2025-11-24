# Hướng dẫn Debug Discount Amount Issue

## Vấn đề
Khi đặt hàng với mã giảm 15K, giá trị lưu vào database là `1500015` thay vì `15000`

## Các bước debug

### 1. Đặt đơn hàng test
- Vào website và đặt một đơn hàng
- Chọn mã giảm giá VDT15K (giảm 15.000đ)
- Hoàn tất đơn hàng

### 2. Xem logs của Worker
```bash
wrangler tail --config wrangler-shop.toml
```

Hoặc xem logs trên Cloudflare Dashboard:
- Vào https://dash.cloudflare.com
- Chọn Workers & Pages
- Chọn worker `shop-order-api`
- Vào tab "Logs"

### 3. Tìm các log debug
Tìm các dòng log có prefix:
- `🔍 DEBUG discount parsing` - Kiểm tra cách parse discount từ frontend
- `🔍 DEBUG totalAmount parsing` - Kiểm tra cách parse total amount
- `🔍 DEBUG finalTotalAmount` - Kiểm tra giá trị final
- `🔍 DEBUG BEFORE conversion` - Giá trị TRƯỚC khi convert
- `🔍 DEBUG AFTER Number() conversion` - Giá trị SAU khi convert
- `🔍 DEBUG CALCULATION` - Phép tính cộng
- `🔍 DEBUG VALUES BEING INSERTED` - Giá trị được insert vào DB

### 4. Phân tích logs

#### Kiểm tra Step 1: Parse discount từ frontend
```
🔍 DEBUG discount parsing - Step 1: {
  discountStr: "-15.000đ (VDT15K)",
  discountStrType: "string",
  rawValue: "-15.000đ (VDT15K)"
}
```
- `discountStr` phải là string
- Format: "-15.000đ (VDT15K)"

#### Kiểm tra Step 2: Extract số
```
🔍 DEBUG discount parsing - Step 2: {
  extracted: "15000",
  extractedType: "string"
}
```
- `extracted` phải là "15000" (string)

#### Kiểm tra Step 3: Parse sang số
```
🔍 DEBUG discount parsing - Step 3: {
  discountAmount: 15000,
  discountAmountType: "number"
}
```
- `discountAmount` phải là 15000 (number)
- `discountAmountType` phải là "number"

#### Kiểm tra finalTotalAmount
```
🔍 DEBUG finalTotalAmount: {
  finalTotalAmount: 285000,
  finalTotalAmountType: "number"
}
```
- `finalTotalAmount` phải là number
- Nếu là string → BUG ở đây!

#### Kiểm tra phép tính
```
🔍 DEBUG CALCULATION: {
  calculation: "285000 + 15000 = 300000",
  orderAmountBeforeDiscount: 300000,
  orderAmountBeforeDiscountType: "number"
}
```
- Nếu kết quả là "28500015" → BUG: đang cộng string
- Nếu kết quả là 300000 → OK

### 5. Các trường hợp lỗi có thể xảy ra

#### Case 1: discountAmount là string
```
discountAmount: "15000"  // ❌ SAI
discountAmount: 15000    // ✅ ĐÚNG
```

#### Case 2: finalTotalAmount là string
```
finalTotalAmount: "285000"  // ❌ SAI
finalTotalAmount: 285000    // ✅ ĐÚNG
```

#### Case 3: Phép cộng string
```
"285000" + "15000" = "28500015"  // ❌ SAI
285000 + 15000 = 300000          // ✅ ĐÚNG
```

### 6. Kiểm tra database
```bash
wrangler d1 execute vdt --remote --command "SELECT order_id, discount_code, discount_amount, order_amount FROM discount_usage ORDER BY id DESC LIMIT 1"
```

Kết quả mong đợi:
```
order_id    | discount_code | discount_amount | order_amount
------------|---------------|-----------------|-------------
DH251124XXX | VDT15K        | 15000          | 300000
```

## Giải pháp dựa trên logs

### Nếu discountAmount là string
→ Sửa phần parse discount

### Nếu finalTotalAmount là string
→ Sửa phần parse totalAmount

### Nếu cả 2 đều là number nhưng vẫn bị lỗi
→ Kiểm tra lại phần bind values trong SQL

## Gửi logs cho dev
Sau khi có logs, gửi toàn bộ logs có prefix `🔍 DEBUG` để phân tích chính xác.
