# 📝 CHANGELOG - Cập nhật Worker xử lý đơn hàng

## Ngày: 13/01/2025

### ✨ Tính năng mới

#### 1. Xử lý đơn hàng đồng thời vào D1 và Google Sheets

**Trước đây**:
- Đơn hàng chỉ được lưu vào Google Sheets
- Worker chỉ xử lý CTV, không xử lý đơn hàng

**Bây giờ**:
- ✅ Đơn hàng được lưu vào **Cloudflare D1** (database chính)
- ✅ Đồng thời gửi đến **Google Sheets** (backup + thông báo)
- ✅ Tự động tính hoa hồng dựa trên `commission_rate` của CTV
- ✅ Tự động lấy SĐT CTV từ database

#### 2. API Endpoint mới: `/api/order/create`

**Request**:
```json
{
  "orderId": "VDT001",
  "orderDate": "2025-01-13T14:30:00+07:00",
  "customer": {
    "name": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC",
    "notes": "Giao buổi sáng"
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
  "referralCode": "CTV123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Đơn hàng đã được tạo thành công",
  "orderId": "VDT001",
  "commission": 50000,
  "timestamp": "2025-01-13T07:30:00.000Z"
}
```

### 🔧 Cải tiến

#### 1. Validation dữ liệu đầu vào
- Kiểm tra `orderId` bắt buộc
- Kiểm tra thông tin khách hàng (name, phone)
- Kiểm tra giỏ hàng không rỗng

#### 2. Tự động tính hoa hồng
- Lấy `commission_rate` từ bảng `ctv` theo `referralCode`
- Tính hoa hồng: `total_amount * commission_rate`
- Lưu vào cột `commission` trong bảng `orders`

#### 3. Tự động lấy SĐT CTV
- Lấy `phone` từ bảng `ctv` theo `referralCode`
- Lưu vào cột `ctv_phone` trong bảng `orders`

#### 4. Xử lý lỗi tốt hơn
- Nếu D1 lỗi → Trả về lỗi ngay
- Nếu Google Sheets lỗi → Vẫn trả về success (vì D1 đã lưu)
- Log chi tiết để debug

### 📁 File mới

1. **worker/schema.sql** - Schema database (tham khảo)
2. **worker/README.md** - Hướng dẫn API đầy đủ
3. **worker/HUONG-DAN-DEPLOY.md** - Hướng dẫn deploy chi tiết
4. **worker/test-order.json** - Dữ liệu test mẫu
5. **worker/test-api.sh** - Script test cho Linux/Mac
6. **worker/test-api.ps1** - Script test cho Windows
7. **worker/CHANGELOG.md** - File này

### 🔄 File đã cập nhật

1. **worker/worker.js**
   - Cập nhật function `createOrder()` để lưu vào cả D1 và Google Sheets
   - Thêm validation dữ liệu
   - Tự động tính hoa hồng và lấy SĐT CTV

2. **wrangler.toml**
   - Thêm binding D1 database
   - Thêm environment variables

### 🗄️ Database Schema

#### Bảng `ctv` (đã có sẵn):
```sql
CREATE TABLE ctv (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT,
    age TEXT,
    experience TEXT,
    motivation TEXT,
    referral_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Mới',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    commission_rate REAL DEFAULT 0.1
);
```

#### Bảng `orders` (đã có sẵn):
```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    order_date TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    address TEXT,
    products TEXT,
    total_amount REAL DEFAULT 0,
    payment_method TEXT,
    status TEXT,
    referral_code TEXT,
    commission REAL DEFAULT 0,
    ctv_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_code) REFERENCES ctv(referral_code)
);
```

### 🚀 Cách deploy

```bash
# 1. Cập nhật GOOGLE_APPS_SCRIPT_URL trong wrangler.toml
# 2. Deploy worker
cd worker
wrangler deploy
```

### 🧪 Cách test

**Linux/Mac**:
```bash
bash test-api.sh
```

**Windows**:
```powershell
.\test-api.ps1
```

**Manual test**:
```bash
curl -X POST https://ctv-api.yendev96.workers.dev/api/order/create \
  -H "Content-Type: application/json" \
  -d @test-order.json
```

### 📊 Luồng xử lý đơn hàng

```
Website
   ↓
   POST /api/order/create
   ↓
Cloudflare Worker
   ↓
   ├─→ Validate dữ liệu
   ├─→ Lấy commission_rate từ bảng ctv
   ├─→ Tính hoa hồng
   ├─→ Lưu vào D1 Database ✅
   ↓
   ├─→ Gửi đến Google Apps Script
   │   ↓
   │   ├─→ Lưu vào Google Sheets ✅
   │   ├─→ Gửi thông báo Telegram ✅
   │   └─→ Gửi email thông báo ✅
   ↓
Trả về response cho website
```

### ⚠️ Lưu ý quan trọng

1. **Database đã có sẵn** - Không cần chạy schema.sql
2. **D1 là nguồn dữ liệu chính** - Google Sheets là backup
3. **Nếu Google Sheets lỗi** - Đơn hàng vẫn được lưu trong D1
4. **Commission rate** - Được lấy từ bảng `ctv`, mặc định 10%
5. **CORS** - Đã được cấu hình cho phép tất cả domain

### 🔮 Kế hoạch tương lai

- [ ] Thêm webhook để đồng bộ ngược từ Google Sheets về D1
- [ ] Thêm API cập nhật trạng thái đơn hàng
- [ ] Thêm API xóa/hủy đơn hàng
- [ ] Thêm authentication cho API
- [ ] Thêm rate limiting
- [ ] Thêm caching với Cloudflare KV

### 📞 Hỗ trợ

Nếu có vấn đề, kiểm tra:
1. Logs: `wrangler tail`
2. Database: `wrangler d1 execute vdt --command "SELECT * FROM orders LIMIT 5"`
3. Google Sheets: Kiểm tra sheet "DS ĐƠN HÀNG"
4. Telegram: Kiểm tra có nhận được thông báo không

---

**Tác giả**: Yendev96  
**Ngày cập nhật**: 13/01/2025  
**Version**: 2.0.0
