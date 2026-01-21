# Hướng dẫn Deploy Worker

## Đã sửa gì?

### Vấn đề:
- Khi đặt hàng từ Quick Buy với referral code, chỉ có `commission` được lưu
- `referral_code`, `commission_rate`, `ctv_phone` đều NULL

### Nguyên nhân:
- Worker đang dùng `commission` từ frontend (không đáng tin cậy)
- Không validate CTV có tồn tại trong database
- Không tính lại commission từ database

### Đã fix:
1. ✅ Bỏ qua `referralCommission` từ frontend
2. ✅ Validate CTV qua `getCtvInfo()` (hỗ trợ cả custom_slug)
3. ✅ Tính commission từ database: `finalTotalAmount × commission_rate`
4. ✅ Chỉ lưu khi CTV hợp lệ, nếu không → set tất cả về NULL/0

## Deploy Worker

### Bước 1: Deploy
```bash
# Deploy worker lên Cloudflare
npx wrangler deploy --config wrangler-shop.toml
```

### Bước 2: Kiểm tra deploy thành công
```bash
# Xem logs realtime
npx wrangler tail --config wrangler-shop.toml
```

### Bước 3: Test API validate
Mở browser và truy cập:
```
https://shop-order-api.yendev96.workers.dev/api/ctv/validate?code=yenadd
```

Kết quả mong đợi:
```json
{
  "success": true,
  "valid": true,
  "data": {
    "name": "Phạm Văn Hùng",
    "referral_code": "CTV100004",
    "custom_slug": "yenadd",
    "commission_rate": 0.01,
    "matched_by": "custom_slug"
  }
}
```

## Test sau khi deploy

### Test 1: Đặt hàng với custom_slug
1. Truy cập: `https://your-domain.com/?ref=yenadd`
2. Thêm sản phẩm vào giỏ
3. Quick Buy hoặc Checkout
4. Kiểm tra database:

```sql
SELECT 
    order_id, 
    customer_name, 
    referral_code,      -- Phải là "CTV100004" (không phải "yenadd")
    commission,         -- Phải > 0
    commission_rate,    -- Phải là 0.01
    ctv_phone,          -- Phải có số điện thoại
    total_amount
FROM orders
ORDER BY created_at_unix DESC
LIMIT 1;
```

Kết quả mong đợi:
- ✅ `referral_code = "CTV100004"`
- ✅ `commission = total_amount × 0.01`
- ✅ `commission_rate = 0.01`
- ✅ `ctv_phone = "0xxxxxxxxx"`

### Test 2: Đặt hàng với referral_code gốc
1. Truy cập: `https://your-domain.com/?ref=CTV100004`
2. Đặt hàng
3. Kiểm tra database (kết quả giống Test 1)

### Test 3: Đặt hàng với mã không tồn tại
1. Truy cập: `https://your-domain.com/?ref=invalid123`
2. Đặt hàng
3. Kiểm tra database:

Kết quả mong đợi:
- ✅ `referral_code = NULL`
- ✅ `commission = 0`
- ✅ `commission_rate = 0`
- ✅ `ctv_phone = NULL`

## Xem logs trong Worker

Sau khi đặt hàng, xem logs để debug:

```bash
npx wrangler tail --config wrangler-shop.toml
```

Logs mong đợi khi thành công:
```
✅ CTV validated: {
  input: "yenadd",
  actual_code: "CTV100004",
  name: "Phạm Văn Hùng",
  commission_rate: 0.01,
  commission_amount: 1200
}
💰 Order financials: {
  ...
  commission: 1200,
  referralCode: "CTV100004",
  referralInput: "yenadd"
}
✅ Saved order to Turso: VDT-xxx with x items
```

Logs khi mã không hợp lệ:
```
⚠️ Invalid referral code: invalid123
💰 Order financials: {
  ...
  commission: 0,
  referralCode: null,
  referralInput: "invalid123"
}
```

## Troubleshooting

### Lỗi: "Method not allowed"
- Worker chưa được deploy
- Chạy: `npx wrangler deploy --config wrangler-shop.toml`

### Lỗi: "CTV not found"
- Kiểm tra database có CTV với custom_slug đó không
- Query: `SELECT * FROM ctv WHERE custom_slug = 'yenadd' OR referral_code = 'CTV100004'`

### Commission vẫn NULL
- Xem logs worker: `npx wrangler tail`
- Kiểm tra `commission_rate` trong database có đúng không
- Đảm bảo `status != 'Từ chối'`

## Hoàn thành ✅

Sau khi deploy và test thành công, hệ thống sẽ:
- ✅ Hỗ trợ cả `referral_code` và `custom_slug`
- ✅ Validate CTV từ database
- ✅ Tính commission chính xác từ `commission_rate`
- ✅ Lưu đầy đủ thông tin CTV vào orders
- ✅ Tracking được link nào được dùng (matched_by)
