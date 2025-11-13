# 🚀 BẮT ĐẦU NHANH

## ✅ Đã hoàn thành

- ✅ Worker đã được cập nhật để xử lý đơn hàng
- ✅ Lưu đồng thời vào D1 và Google Sheets
- ✅ Tự động tính hoa hồng từ CTV
- ✅ Database D1 đã có sẵn (vdt)

## 📋 Các bước tiếp theo

### Bước 1: Cập nhật Google Apps Script URL

Mở file `wrangler.toml` và thay đổi:

```toml
[vars]
GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec"
```

**Cách lấy URL**:
1. Mở https://script.google.com
2. Mở project `order-handler.js`
3. Click **Deploy** → **Manage deployments**
4. Copy **Web app URL**

### Bước 2: Deploy Worker

```bash
cd worker
wrangler deploy
```

### Bước 3: Test API

**Windows**:
```powershell
.\test-api.ps1
```

**Linux/Mac**:
```bash
bash test-api.sh
```

### Bước 4: Cập nhật Website

Thay đổi URL API trong website từ:
```javascript
const apiUrl = "https://script.google.com/macros/s/.../exec";
```

Thành:
```javascript
const apiUrl = "https://ctv-api.yendev96.workers.dev/api/order/create";
```

## 📚 Tài liệu

- **HUONG-DAN-DEPLOY.md** - Hướng dẫn chi tiết từng bước
- **README.md** - Tài liệu API đầy đủ
- **CHANGELOG.md** - Các thay đổi và cải tiến

## 🧪 Test nhanh

```bash
curl -X POST https://ctv-api.yendev96.workers.dev/api/order/create \
  -H "Content-Type: application/json" \
  -d @test-order.json
```

## ❓ Cần trợ giúp?

Xem file **HUONG-DAN-DEPLOY.md** để biết chi tiết!
