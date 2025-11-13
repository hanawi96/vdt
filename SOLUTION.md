# Giải pháp Tối ưu: Worker-Only Backend

## Vấn đề ban đầu
- Local: Gọi Worker → Lưu D1 ✅
- Production: Gọi Pages Function → Không lưu D1 ❌

## Giải pháp Tối ưu (Đã áp dụng)

**Luôn dùng Worker cho tất cả API calls, cả local và production**

### Kiến trúc mới:

```
┌─────────────────────────────────────────────┐
│  Cloudflare Pages (Static Files Only)      │
│  - HTML, CSS, JS, Images                    │
│  - Không có Functions                       │
└─────────────────┬───────────────────────────┘
                  │
                  │ API Calls
                  ▼
┌─────────────────────────────────────────────┐
│  Cloudflare Worker                          │
│  https://ctv-api.yendev96.workers.dev      │
│  - Xử lý tất cả API requests                │
│  - Full access đến D1 database              │
│  - Gửi đến Google Sheets (backup)           │
└─────────────────────────────────────────────┘
```

### Thay đổi đã thực hiện:

1. **Sửa `app.js`**: 
   ```javascript
   getApiUrl(endpoint) {
     // LUÔN dùng Worker URL
     return `https://ctv-api.yendev96.workers.dev${endpoint}`;
   }
   ```

2. **Xóa Pages Functions**:
   - ❌ `functions/api/order.js`
   - ❌ `functions/api/order/create.js`
   - ❌ `functions/_middleware.js`

3. **Cập nhật `_routes.json`**:
   ```json
   {
     "version": 1,
     "include": [],
     "exclude": ["/*"]
   }
   ```
   → Pages chỉ serve static files, không xử lý API

## Ưu điểm:

✅ **Đơn giản**: Chỉ 1 backend duy nhất (Worker)
✅ **Nhất quán**: Cùng logic cho local và production
✅ **Reliable**: Worker có full D1 support
✅ **Dễ maintain**: Không duplicate code
✅ **Performance**: Worker nhanh hơn Pages Functions

## Cách hoạt động:

### Local Development:
```
Browser → Worker (ctv-api.yendev96.workers.dev) → D1 ✅
```

### Production:
```
Browser → Worker (ctv-api.yendev96.workers.dev) → D1 ✅
```

## Deploy:

```bash
# 1. Deploy Worker (nếu có thay đổi)
cd worker
npx wrangler deploy

# 2. Deploy Pages (static files only)
npx wrangler pages deploy public

# Hoặc push lên Git (auto deploy)
git add .
git commit -m "Optimize: Use Worker-only backend"
git push
```

## Test:

```powershell
# Kiểm tra D1
npx wrangler d1 execute vdt --command "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5"

# Test Worker endpoint trực tiếp
curl -X POST https://ctv-api.yendev96.workers.dev/api/order/create `
  -H "Content-Type: application/json" `
  -d '{"orderId":"TEST001","customer":{"name":"Test","phone":"0123456789"},"cart":[],"total":100000}'
```

## Lưu ý:

- Worker URL `ctv-api.yendev96.workers.dev` phải được deploy và hoạt động
- CORS đã được cấu hình trong Worker
- Không cần cấu hình D1 binding cho Pages nữa (vì Pages không xử lý API)
- Worker đã có sẵn logic lưu D1 + Google Sheets

## Kết luận:

Đây là giải pháp **đơn giản nhất, hiệu quả nhất, dễ maintain nhất**. 
Không cần phức tạp hóa với Pages Functions.
