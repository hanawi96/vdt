# Sửa lỗi hiển thị phí ship sai

## Vấn đề
Phần hiển thị phí ship ở modal quickbuy, modal giỏ hàng và modal xác nhận thông tin đang bị hiển thị nhầm. Dữ liệu đang lấy ở `default_shipping_cost` (25.000đ) nhưng thực tế phải lấy ở `customer_shipping_fee` (28.000đ).

## Nguyên nhân
- Trong database có 2 trường:
  - `default_shipping_cost` (25.000đ): Chi phí ship thực tế của shop
  - `customer_shipping_fee` (28.000đ): Phí ship khách hàng phải trả
- Code đang lấy sai trường `default_shipping_cost` thay vì `customer_shipping_fee`

## Giải pháp

### 1. Sửa file `worker/shop-worker.js`

#### Dòng 862 - Hàm getConfig()
**Trước:**
```javascript
const config = {
    shipping_fee: costConfig.default_shipping_cost,
    tax_rate: costConfig.tax_rate || 0.015,
```

**Sau:**
```javascript
const config = {
    shipping_fee: costConfig.customer_shipping_fee,
    tax_rate: costConfig.tax_rate || 0.015,
```

#### Dòng 99-110 - Hàm xử lý đơn hàng
**Trước:**
```javascript
const costConfig = await getCostConfig(env);
const defaultShippingCost = costConfig.default_shipping_cost; // Phí ship từ database

// Parse shipping fee từ frontend (chỉ để check miễn phí hay không)
const shippingFeeStr = data.shipping || '0đ';
const isFreeShipping = typeof shippingFeeStr === 'string' && shippingFeeStr.includes('Miễn phí');

// Phí ship khách trả = default_shipping_cost (trừ khi miễn phí)
const shippingFee = isFreeShipping ? 0 : defaultShippingCost;

// Chi phí ship thực tế của shop (có thể khác với phí khách trả)
const actualShippingCost = defaultShippingCost;
```

**Sau:**
```javascript
const costConfig = await getCostConfig(env);
const customerShippingFee = costConfig.customer_shipping_fee; // Phí ship khách hàng trả
const defaultShippingCost = costConfig.default_shipping_cost; // Chi phí ship thực tế của shop

// Parse shipping fee từ frontend (chỉ để check miễn phí hay không)
const shippingFeeStr = data.shipping || '0đ';
const isFreeShipping = typeof shippingFeeStr === 'string' && shippingFeeStr.includes('Miễn phí');

// Phí ship khách trả = customer_shipping_fee (trừ khi miễn phí)
const shippingFee = isFreeShipping ? 0 : customerShippingFee;

// Chi phí ship thực tế của shop (dùng cho tính toán lợi nhuận)
const actualShippingCost = defaultShippingCost;
```

### 2. Sửa file `public/assets/js/app.js`

Cập nhật giá trị `shippingFee` trong combo data từ 30.000đ thành 28.000đ và điều chỉnh các giá trị liên quan:

#### Combo Vòng Trơn + Túi
- `shippingFee`: 30000 → 28000
- `totalWithoutCombo`: 158000 → 156000
- `savings`: 38000 → 36000

#### Combo 7 Bi Bạc + Túi
- `shippingFee`: 30000 → 28000
- `totalWithoutCombo`: 288000 → 286000
- `savings`: 58000 → 56000

#### Combo 9 Bi Bạc + Túi
- `shippingFee`: 30000 → 28000
- `totalWithoutCombo`: 358000 → 356000
- `savings`: 68000 → 66000

#### Combo Vòng Co Giãn + Túi
- `shippingFee`: 30000 → 28000
- `totalWithoutCombo`: 158000 → 156000
- `savings`: 49000 → 47000

## Kết quả
- Phí ship hiển thị ở tất cả các modal (quickbuy, giỏ hàng, xác nhận thông tin) giờ đây sẽ hiển thị đúng 28.000đ
- Các tính toán giá trong combo detail cũng được cập nhật chính xác
- Chi phí ship thực tế của shop (25.000đ) vẫn được giữ nguyên để tính toán lợi nhuận
- File `app.min.js` đã được rebuild để áp dụng các thay đổi

## Lưu ý quan trọng
Sau khi sửa file `app.js`, cần chạy lệnh sau để rebuild file minified:
```bash
npm run build-js
```

Hoặc rebuild toàn bộ (CSS + JS):
```bash
npm run build
```

## Kết quả kiểm tra chi tiết

### ✅ Đã sửa xong

**1. Database (Cloudflare D1)**
- ✅ Có đúng 2 trường:
  - `customer_shipping_fee`: 28.000đ (phí ship khách hàng trả)
  - `default_shipping_cost`: 25.000đ (chi phí ship thực tế của shop)

**2. Worker API**
- ✅ Đã sửa hàm `getConfig()` để trả về `customer_shipping_fee`
- ✅ Đã deploy worker với config đúng (wrangler-shop.toml)
- ✅ API đang trả về: `{"shipping_fee": 28000}`

**3. Frontend**
- ✅ Code đã đúng, nhận `shipping_fee` từ API
- ⚠️ Cần clear cache trình duyệt để thấy thay đổi

### 🔧 Cách clear cache để thấy phí ship mới (28.000đ)

**Cách 1: Hard Refresh (Nhanh nhất)**
- Windows/Linux: `Ctrl + F5` hoặc `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Cách 2: Clear Cache**
1. Nhấn `Ctrl + Shift + Delete` (Windows) hoặc `Cmd + Shift + Delete` (Mac)
2. Chọn "Cached images and files"
3. Chọn "All time"
4. Nhấn "Clear data"

**Cách 3: Incognito/Private Mode**
- Mở cửa sổ ẩn danh để test ngay

### 📊 Xác nhận API đang hoạt động đúng

```bash
# Test API config
curl https://shop-order-api.yendev96.workers.dev/api/config

# Kết quả mong đợi:
{
  "success": true,
  "data": {
    "shipping_fee": 28000,  # ✅ Đúng!
    "tax_rate": 0.015,
    ...
  }
}
```

## Ngày sửa
25/11/2025

## Tóm tắt thay đổi
- ✅ Worker API đã được sửa và deploy thành công
- ✅ Phí vận chuyển hiện tại: **28.000đ** (đúng với database)
- ⚠️ Người dùng cần clear cache trình duyệt để thấy thay đổi
