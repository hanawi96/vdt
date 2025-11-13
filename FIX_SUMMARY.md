# Tóm tắt Fix: Lưu đơn hàng vào D1 trên Cloudflare Pages

## Vấn đề
Khi deploy lên Cloudflare Pages, đơn hàng không được lưu vào D1 database vì:
1. Pages Function (`/api/order`) chỉ gửi dữ liệu đến Google Sheets
2. D1 binding chưa được cấu hình cho Pages Function

## Các thay đổi đã thực hiện

### 1. Sửa `functions/api/order.js`
- ✅ Thêm logic lưu vào D1 database
- ✅ Validate referral code từ D1
- ✅ Tính commission dựa trên commission_rate trong D1
- ✅ Vẫn giữ logic gửi đến Google Sheets (backup)
- ✅ Xử lý lỗi gracefully (nếu D1 không khả dụng, vẫn lưu được vào Sheets)

### 2. Tạo `functions/api/order/create.js`
- ✅ Endpoint mới để tương thích với frontend
- ✅ Redirect logic đến `/api/order`

### 3. Tạo `functions/_middleware.js`
- ✅ Log để debug D1 binding
- ✅ Giúp kiểm tra xem D1 có khả dụng không

### 4. Tạo các file hướng dẫn
- ✅ `DEPLOY_GUIDE.md` - Hướng dẫn deploy và cấu hình
- ✅ `test-d1.ps1` - Script test D1 trên Windows
- ✅ `test-d1.sh` - Script test D1 trên Linux/Mac

## Các bước tiếp theo (BẮT BUỘC)

### Bước 1: Cấu hình D1 Binding trên Cloudflare Dashboard

**QUAN TRỌNG**: Đây là bước quan trọng nhất!

1. Vào https://dash.cloudflare.com
2. Chọn **Pages** → chọn project của bạn
3. Vào **Settings** → **Functions**
4. Tìm **D1 database bindings**
5. Click **Add binding**:
   - Variable name: `DB`
   - D1 database: chọn `vdt`
6. Click **Save**

### Bước 2: Deploy code mới

```bash
git add .
git commit -m "Fix: Add D1 support to Pages Function"
git push
```

Hoặc deploy trực tiếp:

```bash
npx wrangler pages deploy public
```

### Bước 3: Test

1. Đặt một đơn hàng thử nghiệm trên website
2. Kiểm tra D1 database:

```powershell
# Windows
.\test-d1.ps1

# Hoặc
npx wrangler d1 execute vdt --command "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5"
```

3. Kiểm tra logs trên Cloudflare Dashboard:
   - Pages → Deployments → View logs
   - Tìm dòng `✅ Đã lưu đơn hàng vào D1`

## Cách hoạt động

### Local Development
```
Frontend → Worker (https://ctv-api.yendev96.workers.dev/api/order/create) → D1 ✅
```

### Production (Cloudflare Pages)
```
Frontend → Pages Function (/api/order/create) → D1 ✅ + Google Sheets ✅
```

## Troubleshooting

### Nếu vẫn không lưu được vào D1:

1. **Kiểm tra D1 binding**:
   - Vào Pages Settings → Functions → D1 database bindings
   - Đảm bảo có binding `DB` → `vdt`

2. **Kiểm tra logs**:
   - Nếu thấy `⚠️ D1 database không khả dụng` → binding chưa được cấu hình
   - Nếu thấy `✅ Đã lưu đơn hàng vào D1` → thành công!

3. **Kiểm tra D1 database**:
   ```powershell
   npx wrangler d1 execute vdt --command "SELECT COUNT(*) FROM orders"
   ```

4. **Test endpoint trực tiếp**:
   ```powershell
   curl -X POST https://your-site.pages.dev/api/order/create `
     -H "Content-Type: application/json" `
     -d '{"orderId":"TEST001","customer":{"name":"Test","phone":"0123456789"},"cart":[],"total":100000}'
   ```

## Lưu ý

- Code đã được thiết kế để hoạt động ngay cả khi D1 không khả dụng (fallback to Google Sheets)
- Referral code validation chỉ hoạt động khi D1 khả dụng
- Commission calculation dựa trên `commission_rate` trong bảng `ctv` của D1
