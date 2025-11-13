# Cloudflare Worker API - Hệ thống quản lý CTV và Đơn hàng

Worker API này xử lý việc lưu trữ đơn hàng vào cả **Cloudflare D1** và **Google Sheets** đồng thời.

## 🚀 Cấu hình

### 1. Cấu hình Database D1

Database đã có sẵn:
- **Database Name**: `vdt`
- **Database ID**: `19917e57-ced3-4fc3-adad-368a2e989ea7`
- ✅ Bảng `ctv` đã tồn tại
- ✅ Bảng `orders` đã tồn tại

**Không cần chạy schema.sql vì database đã được khởi tạo!**

### 2. Cấu hình Environment Variables

Cập nhật file `wrangler.toml`:

```toml
[vars]
GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec"
SECRET_KEY = "VDT_SECRET_2025_ANHIEN"
```

**Lưu ý**: Thay `YOUR_ACTUAL_SCRIPT_ID` bằng ID thực tế của Google Apps Script.

### 3. Deploy Worker

```bash
# Di chuyển vào thư mục worker
cd worker

# Deploy worker lên Cloudflare
wrangler deploy
```

Worker sẽ được deploy tại: `https://ctv-api.yendev96.workers.dev`

### 4. Lấy URL Google Apps Script

Để lấy URL của Google Apps Script:
1. Mở Google Apps Script: https://script.google.com
2. Mở project `order-handler.js`
3. Click **Deploy** → **Manage deployments**
4. Copy **Web app URL**
5. Cập nhật vào `wrangler.toml`:

```toml
[vars]
GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec"
```

6. Deploy lại worker: `wrangler deploy`

## 📡 API Endpoints

### 1. Tạo đơn hàng mới

**Endpoint**: `POST /api/order/create`

**Request Body**:
```json
{
  "orderId": "VDT001",
  "orderDate": "2024-01-15T10:30:00Z",
  "customer": {
    "name": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "notes": "Giao hàng buổi sáng"
  },
  "cart": [
    {
      "name": "Vòng Dâu Tằm Size M",
      "quantity": 2,
      "weight": "50g",
      "notes": "Màu đỏ"
    }
  ],
  "total": "500000đ",
  "paymentMethod": "cod",
  "referralCode": "CTV123456",
  "referralPartner": "Nguyễn Thị B"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Đơn hàng đã được tạo thành công",
  "orderId": "VDT001",
  "commission": 50000,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Lấy đơn hàng theo mã CTV

**Endpoint**: `GET /api?action=getOrders&referralCode=CTV123456`

### 3. Lấy đơn hàng theo SĐT CTV

**Endpoint**: `GET /api?action=getOrdersByPhone&phone=0123456789`

### 4. Lấy đơn hàng gần đây

**Endpoint**: `GET /api?action=getRecentOrders&limit=10`

### 5. Lấy thống kê dashboard

**Endpoint**: `GET /api?action=getDashboardStats`

### 6. Đăng ký CTV mới

**Endpoint**: `POST /api/submit` hoặc `POST /api/ctv/register`

**Request Body**:
```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "email": "email@example.com",
  "city": "TP.HCM",
  "age": 25,
  "experience": "1 năm",
  "motivation": "Muốn kiếm thêm thu nhập",
  "commissionRate": 0.1
}
```

### 7. Cập nhật commission rate CTV

**Endpoint**: `POST /api/ctv/update-commission`

**Request Body**:
```json
{
  "referralCode": "CTV123456",
  "commissionRate": 0.15
}
```

### 8. Lấy danh sách tất cả CTV

**Endpoint**: `GET /api?action=getAllCTV`

## 🔄 Luồng xử lý đơn hàng

1. **Website gửi đơn hàng** → `POST /api/order/create`
2. **Worker xử lý**:
   - Validate dữ liệu
   - Lấy thông tin CTV từ D1 (commission rate, phone)
   - Tính hoa hồng
   - **Lưu vào D1 Database** ✅
   - **Gửi đến Google Apps Script** → Lưu vào Google Sheets ✅
   - Google Apps Script gửi thông báo Telegram ✅
   - Google Apps Script gửi email thông báo ✅
3. **Trả về response** cho website

## 🧪 Test API

### Test tạo đơn hàng:

```bash
curl -X POST https://ctv-api.yendev96.workers.dev/api/order/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "VDT001",
    "orderDate": "2024-01-15T10:30:00Z",
    "customer": {
      "name": "Nguyễn Văn A",
      "phone": "0123456789",
      "address": "123 Đường ABC, Quận 1, TP.HCM"
    },
    "cart": [
      {
        "name": "Vòng Dâu Tằm Size M",
        "quantity": 2,
        "weight": "50g"
      }
    ],
    "total": "500000đ",
    "paymentMethod": "cod",
    "referralCode": "CTV123456"
  }'
```

### Test lấy đơn hàng:

```bash
curl "https://ctv-api.yendev96.workers.dev/api?action=getOrders&referralCode=CTV123456"
```

## 📊 Cấu trúc Database

### Bảng `ctv`:
- `id`: ID tự động tăng
- `full_name`: Tên đầy đủ
- `phone`: Số điện thoại
- `email`: Email
- `city`: Thành phố
- `referral_code`: Mã giới thiệu (unique)
- `commission_rate`: Tỷ lệ hoa hồng (0.1 = 10%)
- `status`: Trạng thái
- `created_at`: Ngày tạo

### Bảng `orders`:
- `id`: ID tự động tăng
- `order_id`: Mã đơn hàng (unique)
- `order_date`: Ngày đặt hàng
- `customer_name`: Tên khách hàng
- `customer_phone`: SĐT khách hàng
- `address`: Địa chỉ
- `products`: Chi tiết sản phẩm (JSON)
- `total_amount`: Tổng tiền
- `payment_method`: Phương thức thanh toán
- `status`: Trạng thái
- `referral_code`: Mã CTV
- `commission`: Hoa hồng
- `ctv_phone`: SĐT CTV
- `created_at`: Ngày tạo

## 🔧 Troubleshooting

### Lỗi "Failed to insert order into D1"
- Kiểm tra xem database đã được khởi tạo chưa
- Chạy lại: `wrangler d1 execute vdt --file=worker/schema.sql`

### Lỗi "Failed to save to Google Sheets"
- Kiểm tra `GOOGLE_APPS_SCRIPT_URL` trong `wrangler.toml`
- Kiểm tra Google Apps Script đã deploy chưa
- Kiểm tra quyền truy cập của Google Apps Script

### Không nhận được thông báo Telegram
- Kiểm tra `SECRET_KEY` trong `wrangler.toml`
- Kiểm tra cấu hình Telegram Bot trong Google Apps Script

## 📝 Ghi chú

- Worker tự động tính hoa hồng dựa trên `commission_rate` của CTV
- Nếu không có `referralCode`, đơn hàng vẫn được lưu nhưng không có hoa hồng
- Dữ liệu được lưu vào D1 trước, sau đó mới gửi đến Google Sheets
- Nếu Google Sheets lỗi, đơn hàng vẫn được lưu trong D1
