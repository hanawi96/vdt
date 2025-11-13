# ✅ ĐÃ SỬA: HỖ TRỢ TEST LOCAL VÀ PRODUCTION

## 🎉 VẤN ĐỀ ĐÃ ĐƯỢC GIẢI QUYẾT

Tôi đã thêm **tự động phát hiện môi trường** vào code, giờ bạn có thể:

- ✅ **Test local** với Live Server → Tự động dùng Worker API
- ✅ **Test production** → Tự động dùng Pages Function API

## 🔧 THAY ĐỔI ĐÃ ÁP DỤNG

### 1. Thêm Helper Function

Đã thêm function `getApiUrl()` vào `app.js`:

```javascript
getApiUrl(endpoint) {
  // Nếu đang ở local development
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.port === '5500';
  
  if (isLocal) {
    // Local: Dùng Worker URL
    return `https://ctv-api.yendev96.workers.dev${endpoint}`;
  } else {
    // Production: Dùng Pages Function
    return endpoint;
  }
}
```

### 2. Cập nhật 3 chỗ gọi API

Tất cả các chỗ gọi API đã được cập nhật:

```javascript
// Trước:
const res = await fetch('/api/order/create', { ... });

// Sau:
const apiUrl = this.getApiUrl('/api/order/create');
const res = await fetch(apiUrl, { ... });
```

## 🚀 BÂY GIỜ BẠN CÓ THỂ

### ✅ Test Local (Ngay lập tức)

1. Mở Live Server như bình thường
2. Test đặt hàng → Sẽ tự động gọi Worker API
3. Dữ liệu sẽ được lưu vào D1 (nếu Worker đã được deploy và bind)

### ✅ Deploy Production

1. Push code lên GitHub:
```bash
git add .
git commit -m "Add auto environment detection for API calls"
git push origin main
```

2. Cấu hình D1 Binding trong Cloudflare Dashboard (nếu chưa làm)

3. Test trên production → Sẽ tự động dùng Pages Function

## 📋 CHECKLIST

### Để Local hoạt động:

- [x] Code đã được sửa (tự động phát hiện môi trường)
- [ ] Cloudflare Worker đã được deploy: `npx wrangler deploy` (từ thư mục `worker/`)
- [ ] Worker đã được bind với D1 database trong Dashboard

### Để Production hoạt động:

- [ ] Push code lên GitHub
- [ ] Cấu hình D1 Binding trong Pages Dashboard
- [ ] Cấu hình Environment Variables
- [ ] Redeploy Pages

## 🧪 TEST NGAY

### Test Local:

1. Mở Live Server
2. Mở Console (F12)
3. Đặt 1 đơn hàng test
4. Xem console log → Sẽ thấy gọi đến `https://ctv-api.yendev96.workers.dev/api/order/create`

### Test Production:

1. Truy cập `https://shopvd.store`
2. Mở Console (F12)
3. Đặt 1 đơn hàng test
4. Xem console log → Sẽ thấy gọi đến `/api/order/create` (relative URL)

## ⚠️ LƯU Ý

### Nếu Worker chưa được deploy:

Local sẽ báo lỗi CORS hoặc 404. Giải pháp:

```bash
# Di chuyển vào thư mục worker
cd worker

# Deploy worker
npx wrangler deploy

# Quay lại thư mục gốc
cd ..
```

### Nếu muốn test local với Pages Function:

Dùng Wrangler Pages Dev thay vì Live Server:

```bash
npx wrangler pages dev public --binding DB=vdt
```

Sau đó truy cập `http://localhost:8788`

## 🎯 TÓM TẮT

**Giờ đây code của bạn thông minh hơn:**

- 🏠 **Local** (`localhost`, `127.0.0.1`, port `5500`) → Dùng Worker API
- 🌐 **Production** (domain thật) → Dùng Pages Function API

**Không cần thay đổi code khi chuyển giữa local và production!** 🎉

---

## 📞 NẾU VẪN GẶP LỖI

### Lỗi: "Failed to fetch" ở local

**Nguyên nhân**: Worker chưa được deploy hoặc CORS

**Giải pháp**:
```bash
cd worker
npx wrangler deploy
```

### Lỗi: "405 Method Not Allowed" ở production

**Nguyên nhân**: Pages Function chưa được deploy hoặc D1 binding chưa cấu hình

**Giải pháp**: Làm theo `CAU-HINH-D1-BINDING.md`

---

**Bây giờ bạn có thể test local thoải mái rồi! 🚀**
