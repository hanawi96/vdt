# Hướng Dẫn Deploy Lên Cloudflare Pages

## Vấn đề đã sửa
- ✅ Sửa lỗi MIME type cho CSS/JS files
- ✅ Worker chỉ xử lý API endpoint `/api/order`
- ✅ Static files được serve trực tiếp bởi Cloudflare Pages

## Cách Deploy

### 1. Push code lên GitHub
```bash
git add .
git commit -m "Fix MIME type issue and update worker routing"
git push origin main
```

### 2. Cấu hình Cloudflare Pages

#### A. Tạo Pages Project (nếu chưa có)
1. Đăng nhập vào Cloudflare Dashboard
2. Vào **Pages** → **Create a project**
3. Chọn repository GitHub của bạn
4. Cấu hình build:
   - **Build command**: (để trống)
   - **Build output directory**: `public`
   - **Root directory**: `/`

#### B. Thêm Worker Function
1. Trong project Pages, vào tab **Functions**
2. Tạo file `functions/api/order.js` với nội dung từ `worker/worker.js`

**HOẶC** deploy worker riêng:

```bash
# Cài đặt Wrangler CLI
npm install -g wrangler

# Login vào Cloudflare
wrangler login

# Deploy worker
wrangler deploy worker/worker.js --name shopvd-api
```

#### C. Set Environment Variables
Trong Cloudflare Pages Dashboard:
1. Vào **Settings** → **Environment variables**
2. Thêm biến:
   - **Name**: `GOOGLE_SCRIPT_URL`
   - **Value**: URL của Google Apps Script của bạn

### 3. Cấu hình Custom Domain (nếu có)
1. Vào **Custom domains**
2. Thêm domain `shopvd.store`
3. Cập nhật DNS records theo hướng dẫn

## Kiểm tra sau khi deploy

1. Truy cập website: `https://shopvd.store`
2. Mở DevTools (F12) → Console
3. Kiểm tra không còn lỗi MIME type
4. Thử đặt hàng để test API endpoint

## Cấu trúc routing

- `/` → Static files (HTML, CSS, JS, images)
- `/assets/*` → Static assets với cache headers
- `/api/order` → Worker xử lý đơn hàng

## Troubleshooting

### Nếu vẫn còn lỗi MIME type:
1. Xóa cache trình duyệt (Ctrl + Shift + Delete)
2. Purge cache trong Cloudflare Dashboard
3. Kiểm tra file `public/_headers` đã được deploy chưa

### Nếu API không hoạt động:
1. Kiểm tra Environment Variables đã set chưa
2. Xem logs trong Cloudflare Dashboard → Workers → Logs
3. Kiểm tra CORS headers trong worker

## Lưu ý quan trọng

- File `wrangler.toml` chỉ dùng nếu deploy worker riêng
- Nếu dùng Cloudflare Pages Functions, không cần `wrangler.toml`
- Nhớ set `GOOGLE_SCRIPT_URL` trong Environment Variables
