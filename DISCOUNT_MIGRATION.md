# Migration: Chuyển đổi Mã Giảm Giá từ JSON sang Database D1

## Tổng quan
Đã chuyển đổi thành công hệ thống mã giảm giá từ file `public/data/discounts.json` sang database D1 của Cloudflare.

## Ngày thực hiện
24/11/2025

## Các thay đổi

### 1. Worker API (worker/shop-worker.js)

#### Endpoint mới
- **URL**: `GET /api/discounts`
- **Mô tả**: Lấy danh sách mã giảm giá từ database D1
- **Response format**: 
```json
{
  "success": true,
  "data": [
    {
      "code": "GIAM2K",
      "title": "Giảm 2.000đ",
      "description": "Giảm ngay 2.000đ cho mọi đơn hàng.",
      "type": "fixed",
      "value": 2000,
      "minOrder": 20000,
      "minItems": 0,
      "expiry": "31/12/2025",
      "active": true,
      "visible": true
    }
  ],
  "count": 17
}
```

#### Functions mới
- `getDiscounts(env, corsHeaders)`: Query mã giảm giá từ D1
- `formatExpiryDate(dateString)`: Chuyển đổi format ngày từ YYYY-MM-DD sang DD/MM/YYYY

#### Logic xử lý
- Chỉ lấy các mã đang active (`active = 1`)
- Chỉ lấy các mã chưa hết hạn (`expiry_date >= DATE('now')`)
- Sắp xếp theo priority giảm dần
- Map type: `free_shipping` → `shipping`, `fixed_amount` → `fixed`
- Xử lý value cho gift type (object) và các type khác (number)

### 2. Frontend (public/assets/js/app.js)

#### Thay đổi trong hàm loadData()
```javascript
// CŨ
const [prodRes, infoRes, discountRes, sharedRes] = await Promise.all([
  fetch(productsApiUrl),
  fetch('./data/shop-info.json'),
  fetch('./data/discounts.json'),  // ❌ File JSON
  fetch('./data/shared-details.json')
]);

// MỚI
const discountsApiUrl = this.getApiUrl('/api/discounts');
const [prodRes, infoRes, discountRes, sharedRes] = await Promise.all([
  fetch(productsApiUrl),
  fetch('./data/shop-info.json'),
  fetch(discountsApiUrl),  // ✅ API từ D1
  fetch('./data/shared-details.json')
]);
```

#### Xử lý response
```javascript
const discountsData = await discountRes.json();
if (!discountsData.success) {
  throw new Error(discountsData.error || 'Lỗi tải mã giảm giá từ database');
}
this.availableDiscounts = discountsData.data;
```

## Database Schema

### Bảng: discounts
```sql
CREATE TABLE discounts (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,  -- 'fixed', 'percentage', 'gift', 'free_shipping'
  discount_value INTEGER DEFAULT 0,
  gift_product_id TEXT,
  gift_product_name TEXT,
  min_order_amount INTEGER DEFAULT 0,
  min_items INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  visible BOOLEAN DEFAULT 1,
  expiry_date DATETIME NOT NULL,
  priority INTEGER DEFAULT 0,
  -- ... các trường khác
);
```

## Testing

### Test API endpoint
```bash
curl https://shop-order-api.yendev96.workers.dev/api/discounts
```

### Kết quả
- ✅ API trả về 17 mã giảm giá
- ✅ Format dữ liệu tương thích 100% với code frontend
- ✅ Không có breaking changes
- ✅ Hệ thống hoạt động bình thường

## Lợi ích

### 1. Quản lý tập trung
- Tất cả mã giảm giá được quản lý trong database
- Dễ dàng thêm/sửa/xóa qua SQL hoặc admin panel

### 2. Real-time updates
- Thay đổi trong database được phản ánh ngay lập tức
- Không cần deploy lại frontend/worker

### 3. Tính năng nâng cao
- Có thể thêm tracking usage (bảng `discount_usage`)
- Có thể thêm auto rules (bảng `discount_auto_rules`)
- Có thể giới hạn số lần sử dụng
- Có thể giới hạn theo khách hàng

### 4. Bảo mật
- Dữ liệu được lưu trữ an toàn trong D1
- Có thể kiểm soát access qua Worker

## Các bước tiếp theo (Optional)

### 1. Xóa file JSON cũ (sau khi test kỹ)
```bash
# Backup trước
cp public/data/discounts.json public/data/discounts.json.backup

# Xóa file cũ
rm public/data/discounts.json
```

### 2. Thêm tính năng tracking usage
- Ghi lại mỗi lần mã được sử dụng vào bảng `discount_usage`
- Cập nhật `usage_count` trong bảng `discounts`

### 3. Thêm admin panel
- Tạo UI để quản lý mã giảm giá
- CRUD operations cho discounts

### 4. Thêm validation nâng cao
- Kiểm tra số lần sử dụng tối đa
- Kiểm tra khách hàng có được phép dùng mã không
- Kiểm tra sản phẩm áp dụng

## Rollback (nếu cần)

Nếu cần quay lại dùng file JSON:

1. Restore file JSON:
```bash
cp public/data/discounts.json.backup public/data/discounts.json
```

2. Revert code trong `app.js`:
```javascript
// Đổi lại thành
fetch('./data/discounts.json')
```

3. Deploy lại worker (nếu cần)

## Notes

- File JSON cũ vẫn còn tại `public/data/discounts.json` (chưa xóa)
- Có thể giữ file JSON như backup
- Logic xử lý discount trong frontend không thay đổi
- Tất cả function hiện tại vẫn hoạt động bình thường

## Contact

Nếu có vấn đề, liên hệ dev team.
