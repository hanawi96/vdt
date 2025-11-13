# 🚀 HƯỚNG DẪN DEPLOY CLOUDFLARE WORKER

## Bước 1: Chuẩn bị

### 1.1. Cài đặt Wrangler CLI (nếu chưa có)

```bash
npm install -g wrangler
```

### 1.2. Đăng nhập Cloudflare

```bash
wrangler login
```

Trình duyệt sẽ mở ra, đăng nhập vào tài khoản Cloudflare của bạn.

## Bước 2: Cấu hình Google Apps Script URL

### 2.1. Lấy URL Google Apps Script

1. Truy cập: https://script.google.com
2. Mở project có file `order-handler.js`
3. Click **Deploy** (góc trên bên phải)
4. Chọn **Manage deployments**
5. Copy **Web app URL** (dạng: `https://script.google.com/macros/s/AKfycby.../exec`)

### 2.2. Cập nhật wrangler.toml

Mở file `wrangler.toml` và thay thế URL:

```toml
[vars]
GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec"
SECRET_KEY = "VDT_SECRET_2025_ANHIEN"
```

**Lưu ý**: Thay `YOUR_ACTUAL_SCRIPT_ID` bằng URL thực tế bạn vừa copy.

## Bước 3: Deploy Worker

### 3.1. Di chuyển vào thư mục worker

```bash
cd worker
```

### 3.2. Deploy

```bash
wrangler deploy
```

Kết quả sẽ hiển thị:

```
✨ Successfully published your Worker!
 https://ctv-api.yendev96.workers.dev
```

## Bước 4: Test API

### 4.1. Test bằng curl (Linux/Mac)

```bash
# Test tạo đơn hàng
curl -X POST https://ctv-api.yendev96.workers.dev/api/order/create \
  -H "Content-Type: application/json" \
  -d @test-order.json
```

### 4.2. Test bằng PowerShell (Windows)

```powershell
# Test tạo đơn hàng
$body = Get-Content test-order.json -Raw
Invoke-RestMethod -Uri "https://ctv-api.yendev96.workers.dev/api/order/create" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### 4.3. Test bằng Postman

1. Mở Postman
2. Tạo request mới:
   - Method: `POST`
   - URL: `https://ctv-api.yendev96.workers.dev/api/order/create`
   - Headers: `Content-Type: application/json`
   - Body: Copy nội dung từ `test-order.json`
3. Click **Send**

## Bước 5: Tích hợp vào Website

### 5.1. Cập nhật URL trong website

Tìm file JavaScript xử lý đặt hàng trong website và cập nhật URL:

```javascript
// Thay đổi từ:
const apiUrl = "https://script.google.com/macros/s/.../exec";

// Thành:
const apiUrl = "https://ctv-api.yendev96.workers.dev/api/order/create";
```

### 5.2. Cập nhật request body

Đảm bảo request body có đúng format:

```javascript
const orderData = {
  orderId: "VDT" + Date.now(),
  orderDate: new Date().toISOString(),
  customer: {
    name: customerName,
    phone: customerPhone,
    address: customerAddress,
    notes: customerNotes
  },
  cart: cartItems, // Array of products
  total: totalAmount, // Ví dụ: "750000đ"
  paymentMethod: "cod", // hoặc "bank_transfer"
  referralCode: referralCode, // Mã CTV (nếu có)
  referralPartner: partnerName // Tên CTV (nếu có)
};

// Gửi request
fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('✅ Đơn hàng đã được tạo:', data.orderId);
    console.log('💰 Hoa hồng:', data.commission);
  } else {
    console.error('❌ Lỗi:', data.error);
  }
})
.catch(error => {
  console.error('❌ Lỗi kết nối:', error);
});
```

## Bước 6: Kiểm tra kết quả

### 6.1. Kiểm tra D1 Database

```bash
# Xem danh sách đơn hàng trong D1
wrangler d1 execute vdt --command "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5"
```

### 6.2. Kiểm tra Google Sheets

1. Mở Google Sheets: https://docs.google.com/spreadsheets/d/1XNdGOYAVYa4BdZFEVZicMLbX8nJ3J--2HPJjltD9r-k
2. Kiểm tra sheet "DS ĐƠN HÀNG"
3. Đơn hàng mới sẽ xuất hiện ở dòng cuối

### 6.3. Kiểm tra Telegram

- Nếu cấu hình đúng, bạn sẽ nhận được thông báo trên Telegram
- Kiểm tra chat với bot Telegram

## Bước 7: Xem Logs (nếu có lỗi)

### 7.1. Xem logs realtime

```bash
wrangler tail
```

### 7.2. Xem logs trên Cloudflare Dashboard

1. Truy cập: https://dash.cloudflare.com
2. Chọn **Workers & Pages**
3. Click vào worker `ctv-api`
4. Chọn tab **Logs**

## 🔧 Troubleshooting

### Lỗi: "Failed to insert order into D1"

**Nguyên nhân**: Database chưa được bind đúng

**Giải pháp**:
```bash
# Kiểm tra binding
wrangler d1 list

# Kiểm tra database ID
wrangler d1 info vdt
```

### Lỗi: "Failed to save to Google Sheets"

**Nguyên nhân**: URL Google Apps Script sai hoặc chưa deploy

**Giải pháp**:
1. Kiểm tra lại URL trong `wrangler.toml`
2. Đảm bảo Google Apps Script đã deploy với quyền "Anyone"
3. Test trực tiếp URL bằng Postman

### Lỗi: "CORS error"

**Nguyên nhân**: Website gọi từ domain khác

**Giải pháp**: Worker đã có CORS headers, kiểm tra lại request từ website

### Không nhận được thông báo Telegram

**Nguyên nhân**: `SECRET_KEY` không khớp

**Giải pháp**: Đảm bảo `SECRET_KEY` trong `wrangler.toml` khớp với Google Apps Script

## 📊 Monitoring

### Xem số lượng request

```bash
wrangler metrics
```

### Xem chi tiết worker

```bash
wrangler status
```

## 🔄 Update Worker

Khi có thay đổi code:

```bash
# 1. Sửa code trong worker.js
# 2. Deploy lại
wrangler deploy

# 3. Kiểm tra version mới
curl https://ctv-api.yendev96.workers.dev/api?action=getDashboardStats
```

## 📝 Ghi chú quan trọng

1. ✅ Database D1 đã có sẵn, không cần tạo lại
2. ✅ Bảng `ctv` và `orders` đã tồn tại
3. ✅ Worker tự động tính hoa hồng dựa trên `commission_rate` của CTV
4. ✅ Dữ liệu được lưu vào D1 trước, sau đó mới gửi đến Google Sheets
5. ✅ Nếu Google Sheets lỗi, đơn hàng vẫn được lưu trong D1

## 🎉 Hoàn tất!

Worker của bạn đã sẵn sàng xử lý đơn hàng và lưu vào cả D1 và Google Sheets!

**URL API**: https://ctv-api.yendev96.workers.dev
