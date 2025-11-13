# 🔧 SỬA LỖI: DỮ LIỆU KHÔNG LƯU VÀO D1 DATABASE

## ❌ VẤN ĐỀ
Khi deploy lên Cloudflare Pages qua GitHub, đơn hàng không được lưu vào D1 database (mặc dù local hoạt động bình thường).

## ✅ NGUYÊN NHÂN
Code frontend đang gọi API đến Cloudflare Worker (`ctv-api.yendev96.workers.dev`), nhưng Worker này chưa được bind với D1 database khi deploy qua Pages.

## 🚀 GIẢI PHÁP ĐÃ ÁP DỤNG

### 1. Thay đổi code
✅ Đã sửa `public/assets/js/app.js` - thay URL API từ Worker sang Pages Function:
```javascript
// Trước: fetch('https://ctv-api.yendev96.workers.dev/api/order/create')
// Sau:  fetch('/api/order/create')
```

✅ Đã tạo `functions/api/order/create.js` - Pages Function xử lý API

✅ Đã cập nhật `public/_routes.json` - routing cho Functions

### 2. Bạn cần làm gì tiếp theo?

#### Bước 1: Push code lên GitHub
```bash
git add .
git commit -m "Fix: Use Pages Function with D1 binding"
git push origin main
```

#### Bước 2: Cấu hình D1 Binding (QUAN TRỌNG!)

1. Truy cập: https://dash.cloudflare.com
2. Vào **Workers & Pages** → Chọn project của bạn
3. Vào **Settings** → **Functions**
4. Trong **D1 database bindings**, click **Add binding**:
   - Variable name: `DB`
   - D1 database: `vdt`
5. Click **Save**

#### Bước 3: Cấu hình Environment Variables

1. Vào **Settings** → **Environment variables**
2. Tab **Production**, thêm 2 biến:

```
GOOGLE_APPS_SCRIPT_URL = https://script.google.com/macros/s/AKfycbwh4Az3BjmNMan7Ik_FxcsmDSSuUE4lWMBgcPBlsITYN39bWfHztZK9VOS930rrin3dEA/exec

SECRET_KEY = VDT_SECRET_2025_ANHIEN
```

3. Click **Save**

#### Bước 4: Redeploy

**Cách 1: Trigger từ GitHub**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

**Cách 2: Từ Dashboard**
- Vào **Deployments** → Click deployment mới nhất → **Retry deployment**

#### Bước 5: Test

```bash
# Windows
.\test-api.ps1

# Linux/Mac
./test-api.sh

# Hoặc kiểm tra D1 database
npx wrangler d1 execute vdt --command "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5"
```

---

## 📚 TÀI LIỆU CHI TIẾT

- **Hướng dẫn đầy đủ**: Xem file `HUONG-DAN-SUA-LOI.md`
- **Cấu hình D1 Binding**: Xem file `CAU-HINH-D1-BINDING.md`
- **Tóm tắt thay đổi**: Xem file `THAY-DOI-CODE.md`

---

## ⚠️ LƯU Ý

- **D1 binding BẮT BUỘC phải cấu hình trong Dashboard**, không thể cấu hình qua code
- **Phải redeploy sau khi cấu hình** binding và environment variables
- **Variable name phải là `DB`** (viết hoa chính xác)

---

## 🆘 NẾU VẪN KHÔNG HOẠT ĐỘNG

1. Kiểm tra D1 binding: Settings → Functions → D1 database bindings
2. Kiểm tra Environment variables: Settings → Environment variables
3. Xem logs: Deployments → Latest → Functions → Real-time Logs
4. Test API trực tiếp bằng `test-api.ps1` hoặc `test-api.sh`

---

## ✅ CHECKLIST

- [ ] Push code lên GitHub
- [ ] Cấu hình D1 binding (Variable: `DB`, Database: `vdt`)
- [ ] Cấu hình Environment variables (`GOOGLE_APPS_SCRIPT_URL`, `SECRET_KEY`)
- [ ] Redeploy project
- [ ] Test đặt hàng trên production
- [ ] Kiểm tra D1 database có dữ liệu
- [ ] Kiểm tra Google Sheets có dữ liệu

---

**Sau khi hoàn thành checklist, hệ thống sẽ hoạt động bình thường! 🎉**
