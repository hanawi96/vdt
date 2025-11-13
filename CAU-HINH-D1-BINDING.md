# HƯỚNG DẪN CẤU HÌNH D1 BINDING CHO CLOUDFLARE PAGES

## ⚠️ QUAN TRỌNG

Sau khi push code lên GitHub, bạn **BẮT BUỘC** phải cấu hình D1 binding trong Cloudflare Dashboard để dữ liệu được lưu vào database.

---

## 📋 CÁC BƯỚC CẤU HÌNH

### Bước 1: Truy cập Cloudflare Dashboard

1. Đăng nhập vào: https://dash.cloudflare.com
2. Chọn account của bạn
3. Vào **Workers & Pages** từ menu bên trái

### Bước 2: Chọn Pages Project

1. Trong danh sách **Workers & Pages**, tìm và click vào project của bạn (ví dụ: `vdt` hoặc tên repository GitHub)
2. Đảm bảo bạn đang ở tab **Settings**

### Bước 3: Cấu hình D1 Database Binding

1. Trong menu bên trái của Settings, chọn **Functions**
2. Scroll xuống phần **D1 database bindings**
3. Click nút **Add binding**

4. Điền thông tin:
   - **Variable name**: `DB` (phải viết hoa chính xác như vậy)
   - **D1 database**: Chọn `vdt` từ dropdown

5. Click **Save**

### Bước 4: Cấu hình Environment Variables

1. Vẫn trong **Settings**, chọn **Environment variables** từ menu bên trái
2. Trong tab **Production**, click **Add variable**

3. Thêm 2 biến sau:

   **Biến 1:**
   - **Variable name**: `GOOGLE_APPS_SCRIPT_URL`
   - **Value**: `https://script.google.com/macros/s/AKfycbwh4Az3BjmNMan7Ik_FxcsmDSSuUE4lWMBgcPBlsITYN39bWfHztZK9VOS930rrin3dEA/exec`
   - Click **Add variable**

   **Biến 2:**
   - **Variable name**: `SECRET_KEY`
   - **Value**: `VDT_SECRET_2025_ANHIEN`
   - Click **Add variable**

4. Click **Save** để lưu tất cả biến

### Bước 5: Redeploy Project

Sau khi cấu hình xong, bạn cần redeploy để áp dụng thay đổi:

**Cách 1: Trigger từ GitHub**
```bash
# Tạo commit mới để trigger deployment
git commit --allow-empty -m "Trigger redeploy after D1 binding"
git push origin main
```

**Cách 2: Redeploy từ Dashboard**
1. Vào tab **Deployments**
2. Tìm deployment mới nhất
3. Click vào menu 3 chấm (⋮)
4. Chọn **Retry deployment**

---

## ✅ KIỂM TRA CẤU HÌNH

### 1. Kiểm tra D1 Binding

Trong **Settings** → **Functions** → **D1 database bindings**, bạn phải thấy:

```
Variable name: DB
D1 database: vdt (19917e57-ced3-4fc3-adad-368a2e989ea7)
```

### 2. Kiểm tra Environment Variables

Trong **Settings** → **Environment variables** → **Production**, bạn phải thấy:

```
GOOGLE_APPS_SCRIPT_URL = https://script.google.com/macros/s/...
SECRET_KEY = VDT_SECRET_2025_ANHIEN
```

### 3. Test API Endpoint

Sau khi deploy xong, test API bằng cách:

1. Mở website production của bạn
2. Thử đặt một đơn hàng test
3. Kiểm tra D1 database xem có dữ liệu không:

```bash
# Chạy lệnh này từ terminal
npx wrangler d1 execute vdt --command "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5"
```

### 4. Xem Logs

Để xem logs của Pages Function:

1. Vào **Deployments** tab
2. Click vào deployment mới nhất
3. Click **View details**
4. Chọn tab **Functions**
5. Xem **Real-time Logs**

---

## 🔧 TROUBLESHOOTING

### Lỗi: "DB is not defined"

**Nguyên nhân**: D1 binding chưa được cấu hình hoặc chưa được áp dụng

**Giải pháp**:
1. Kiểm tra lại D1 binding trong Settings → Functions
2. Đảm bảo Variable name là `DB` (viết hoa)
3. Redeploy project

### Lỗi: "Failed to insert order into D1"

**Nguyên nhân**: Schema database chưa đúng hoặc thiếu bảng

**Giải pháp**:
```bash
# Kiểm tra schema
npx wrangler d1 execute vdt --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'"

# Nếu thiếu bảng, tạo lại
npx wrangler d1 execute vdt --file=worker/schema.sql
```

### Lỗi: "GOOGLE_APPS_SCRIPT_URL is not defined"

**Nguyên nhân**: Environment variable chưa được set

**Giải pháp**:
1. Vào Settings → Environment variables
2. Thêm biến `GOOGLE_APPS_SCRIPT_URL`
3. Redeploy

### Dữ liệu không xuất hiện trong Google Sheets

**Nguyên nhân**: Google Apps Script URL sai hoặc script có lỗi

**Giải pháp**:
1. Kiểm tra URL trong Environment variables
2. Test Google Apps Script trực tiếp
3. Xem logs của Pages Function để biết lỗi cụ thể

---

## 📊 KIỂM TRA DỮ LIỆU TRONG D1

### Xem tất cả đơn hàng

```bash
npx wrangler d1 execute vdt --command "SELECT * FROM orders ORDER BY created_at DESC LIMIT 10"
```

### Xem đơn hàng theo referral code

```bash
npx wrangler d1 execute vdt --command "SELECT * FROM orders WHERE referral_code IS NOT NULL"
```

### Xem thống kê

```bash
npx wrangler d1 execute vdt --command "SELECT COUNT(*) as total_orders, SUM(total_amount) as total_revenue FROM orders"
```

### Xem CTV

```bash
npx wrangler d1 execute vdt --command "SELECT * FROM ctv ORDER BY created_at DESC"
```

---

## 🎯 CHECKLIST HOÀN THÀNH

Đánh dấu ✅ khi hoàn thành:

- [ ] D1 binding đã được cấu hình (Variable name: `DB`, Database: `vdt`)
- [ ] Environment variable `GOOGLE_APPS_SCRIPT_URL` đã được set
- [ ] Environment variable `SECRET_KEY` đã được set
- [ ] Project đã được redeploy sau khi cấu hình
- [ ] Test đặt hàng thành công trên production
- [ ] Dữ liệu xuất hiện trong D1 database
- [ ] Dữ liệu xuất hiện trong Google Sheets
- [ ] Logs không có lỗi

---

## 📞 LƯU Ý

- **D1 binding chỉ có hiệu lực sau khi redeploy**
- **Environment variables cũng cần redeploy để áp dụng**
- **Mỗi lần thay đổi binding hoặc variables, phải redeploy**
- **Local development không cần cấu hình này** (dùng wrangler.toml)

---

## 🔗 TÀI LIỆU THAM KHẢO

- Cloudflare Pages Functions: https://developers.cloudflare.com/pages/functions/
- D1 Database: https://developers.cloudflare.com/d1/
- Bindings: https://developers.cloudflare.com/pages/functions/bindings/
