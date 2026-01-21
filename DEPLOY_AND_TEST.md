# Deploy Worker và Test với Logging Chi Tiết

## Đã thêm logging vào:

### 1. Worker - Phần parse referral (createOrder)
```javascript
console.log('🔍 [WORKER] Parsing referral info:', {
    referralCodeInput: referralCodeInput,
    hasInput: !!referralCodeInput,
    inputTrimmed: referralCodeInput?.trim(),
    inputLength: referralCodeInput?.length
});

console.log('🔍 [WORKER] Calling getCtvInfo with:', referralCodeInput.trim());
console.log('🔍 [WORKER] getCtvInfo result:', ctvInfo);
```

### 2. Worker - Hàm getCtvInfo
```javascript
console.log('🔍 [getCtvInfo] Called with:', referralCode);
console.log('🔍 [getCtvInfo] Clean code:', cleanCode);
console.log('🔍 [getCtvInfo] Step 1: Searching by referral_code...');
console.log('🔍 [getCtvInfo] Step 1 result:', { rowCount, rows });
console.log('🔍 [getCtvInfo] Step 2: Searching by custom_slug...');
console.log('🔍 [getCtvInfo] Step 2 result:', { rowCount, rows });
console.log('✅ [getCtvInfo] Found CTV:', { ... });
```

## Deploy Worker

```bash
# Deploy worker với logging mới
npx wrangler deploy --config wrangler-shop.toml
```

## Xem logs realtime

```bash
# Mở terminal và chạy
npx wrangler tail --config wrangler-shop.toml

# Hoặc xem trong Cloudflare Dashboard
# Workers > shop-order-api > Logs
```

## Test và debug

### Bước 1: Clear cache frontend
```
Ctrl + Shift + R (hoặc Cmd + Shift + R trên Mac)
```

### Bước 2: Truy cập với referral
```
https://your-domain.com/?ref=yenadd
```

### Bước 3: Đặt hàng và xem logs

#### Frontend Console sẽ hiển thị:
```
🔍 [REFERRAL] Starting handleReferralFromURL...
🔍 [REFERRAL] URL params: {refCode: "yenadd"}
✅ [REFERRAL] Valid code from URL: yenadd
✅ [REFERRAL] Saved to localStorage
...
📦 [QUICK BUY] Order details: {
  referralCode: "yenadd",
  referralCommission: 1130
}
```

#### Worker Logs (wrangler tail) sẽ hiển thị:
```
🔍 [WORKER] Parsing referral info: {
  referralCodeInput: "yenadd",
  hasInput: true,
  inputTrimmed: "yenadd",
  inputLength: 6
}
🔍 [WORKER] Calling getCtvInfo with: yenadd
🔍 [getCtvInfo] Called with: yenadd
🔍 [getCtvInfo] Clean code: yenadd
🔍 [getCtvInfo] Step 1: Searching by referral_code...
🔍 [getCtvInfo] Step 1 result: {rowCount: 0, rows: []}
🔍 [getCtvInfo] Step 2: Searching by custom_slug...
🔍 [getCtvInfo] Step 2 result: {rowCount: 1, rows: [{...}]}
✅ [getCtvInfo] Found CTV: {
  id: xxx,
  name: "Phạm Văn Hùng",
  referral_code: "CTV100004",
  custom_slug: "yenadd",
  commission_rate: 0.01,
  status: "Mới",
  matched_by: "custom_slug"
}
🔍 [WORKER] getCtvInfo result: {...}
✅ [WORKER] CTV validated: {
  input: "yenadd",
  actual_code: "CTV100004",
  name: "Phạm Văn Hùng",
  commission_rate: 0.01,
  commission_amount: 1130,
  ctv_phone: "0972483892"
}
```

## Các trường hợp có thể xảy ra

### Case 1: Frontend gửi sai (rỗng hoặc undefined)
```
🔍 [WORKER] Parsing referral info: {
  referralCodeInput: null,  ← Vấn đề ở đây
  hasInput: false
}
ℹ️ [WORKER] No referral code provided or empty
```
**Nguyên nhân:** Frontend không gửi referralCode
**Fix:** Kiểm tra frontend

### Case 2: Worker nhận đúng nhưng không tìm thấy CTV
```
🔍 [WORKER] Parsing referral info: {
  referralCodeInput: "yenadd",
  hasInput: true
}
🔍 [getCtvInfo] Step 1 result: {rowCount: 0}
🔍 [getCtvInfo] Step 2 result: {rowCount: 0}  ← Không tìm thấy
⚠️ [getCtvInfo] CTV not found for code: yenadd
⚠️ [WORKER] Invalid referral code - CTV not found: yenadd
```
**Nguyên nhân:** Database không có CTV với custom_slug = "yenadd"
**Fix:** Kiểm tra database

### Case 3: Tìm thấy nhưng status = "Từ chối"
```
🔍 [getCtvInfo] Step 2 result: {rowCount: 0}  ← Bị filter bởi status
⚠️ [getCtvInfo] CTV not found for code: yenadd
```
**Nguyên nhân:** CTV có status = "Từ chối"
**Fix:** Cập nhật status trong database

### Case 4: Thành công
```
✅ [getCtvInfo] Found CTV: {
  name: "Phạm Văn Hùng",
  referral_code: "CTV100004",
  custom_slug: "yenadd",
  commission_rate: 0.01,
  status: "Mới"
}
✅ [WORKER] CTV validated: {
  commission_amount: 1130,
  ctv_phone: "0972483892"
}
```
**Kết quả:** Database sẽ có đầy đủ thông tin

## Kiểm tra database sau khi đặt hàng

```sql
SELECT 
    order_id,
    referral_code,
    commission,
    commission_rate,
    ctv_phone,
    total_amount,
    created_at_unix
FROM orders
ORDER BY created_at_unix DESC
LIMIT 1;
```

## Troubleshooting

### Nếu vẫn NULL sau khi deploy:

1. **Kiểm tra Worker đã deploy chưa:**
   ```bash
   curl "https://shop-order-api.yendev96.workers.dev/api/ctv/validate?code=yenadd"
   ```
   Phải trả về: `{"valid":true,"data":{...}}`

2. **Kiểm tra Frontend gửi đúng chưa:**
   - Xem Console log: `📦 [QUICK BUY] Order details`
   - `referralCode` phải có giá trị

3. **Xem Worker logs:**
   ```bash
   npx wrangler tail --config wrangler-shop.toml
   ```
   - Tìm log `🔍 [WORKER] Parsing referral info`
   - Xem `referralCodeInput` có giá trị không

4. **Kiểm tra database:**
   ```sql
   SELECT * FROM ctv WHERE custom_slug = 'yenadd';
   ```
   - Phải có 1 row
   - `status` phải khác "Từ chối"

## Kết luận

Với logging chi tiết này, bạn sẽ biết chính xác:
- Frontend có gửi referralCode không
- Worker có nhận được không
- Database có tìm thấy CTV không
- Tại sao không tìm thấy (nếu có)

Deploy và test ngay, paste logs cho tôi xem!
