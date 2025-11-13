# Hướng dẫn Deploy lên Cloudflare Pages

## Vấn đề hiện tại
Khi deploy lên Cloudflare Pages, đơn hàng không được lưu vào D1 database vì Pages Function chưa được bind với D1.

## Giải pháp

### Bước 1: Cấu hình D1 Binding trên Cloudflare Dashboard

1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Chọn **Pages** → chọn project của bạn
3. Vào **Settings** → **Functions**
4. Tìm phần **D1 database bindings**
5. Click **Add binding**:
   - **Variable name**: `DB`
   - **D1 database**: chọn `vdt`
6. Click **Save**

### Bước 2: Cấu hình Environment Variables

Vào **Settings** → **Environment variables** và thêm:

- `GOOGLE_APPS_SCRIPT_URL`: URL của Google Apps Script
- `SECRET_KEY`: `VDT_SECRET_2025_ANHIEN`

### Bước 3: Redeploy

Sau khi cấu hình xong, redeploy project:

```bash
# Commit changes
git add .
git commit -m "Fix D1 binding for Pages Function"
git push

# Hoặc deploy trực tiếp
npx wrangler pages deploy public
```

### Bước 4: Kiểm tra

1. Mở website trên Cloudflare Pages
2. Đặt một đơn hàng thử nghiệm
3. Kiểm tra D1 database:

```bash
npx wrangler d1 execute vdt --command "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5"
```

## Cấu trúc API Endpoints

- `/api/order` - Endpoint chính (Pages Function)
- `/api/order/create` - Endpoint tương thích (redirect đến /api/order)
- Worker URL: `https://ctv-api.yendev96.workers.dev/api/order/create` (dùng cho local dev)

## Kiểm tra logs

Xem logs trên Cloudflare Dashboard:
1. Pages project → **Deployments**
2. Click vào deployment mới nhất
3. Click **View logs** để xem console.log

## Troubleshooting

### Nếu vẫn không lưu được vào D1:

1. Kiểm tra D1 binding đã được thêm chưa
2. Kiểm tra logs có thông báo `✅ Đã lưu đơn hàng vào D1` không
3. Nếu thấy `⚠️ D1 database không khả dụng`, nghĩa là binding chưa được cấu hình đúng

### Kiểm tra D1 database:

```bash
# Xem tất cả đơn hàng
npx wrangler d1 execute vdt --command "SELECT * FROM orders"

# Xem đơn hàng mới nhất
npx wrangler d1 execute vdt --command "SELECT * FROM orders ORDER BY created_at DESC LIMIT 10"

# Đếm số đơn hàng
npx wrangler d1 execute vdt --command "SELECT COUNT(*) as total FROM orders"
```
