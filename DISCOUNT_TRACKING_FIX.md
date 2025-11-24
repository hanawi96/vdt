# Fix: Lưu thông tin mã giảm giá khi đặt hàng

## Vấn đề
Khi đặt hàng, hệ thống KHÔNG lưu thông tin mã giảm giá vào:
1. Bảng `orders` (cột `discount_code` và `discount_amount`)
2. Bảng `discount_usage` (tracking việc sử dụng mã)

## Nguyên nhân
Trong function `createOrder()` của worker:
- Câu INSERT INTO orders thiếu 2 cột: `discount_code` và `discount_amount`
- Không có logic để lưu vào bảng `discount_usage`
- Không có logic để cập nhật `usage_count` trong bảng `discounts`

## Giải pháp đã thực hiện

### 1. Parse discount code từ data
```javascript
// Parse discount code từ data.discount
// Format: "-10.000đ (GG10K)" hoặc "Không có"
let discountCode = null;
if (discountStr && discountStr !== 'Không có' && discountStr.includes('(') && discountStr.includes(')')) {
    const match = discountStr.match(/\(([^)]+)\)/);
    if (match) {
        discountCode = match[1]; // Lấy mã trong ngoặc
    }
}
```

### 2. Thêm 2 cột vào câu INSERT orders
```javascript
INSERT INTO orders (
    ...,
    discount_code, discount_amount  // ✅ Thêm 2 cột này
) VALUES (?, ?, ..., ?, ?)
```

Bind values:
```javascript
.bind(
    ...,
    discountCode,    // Mã giảm giá (VD: "GG10K")
    discountAmount   // Số tiền giảm (VD: 10000)
)
```

### 3. Lưu vào bảng discount_usage
```javascript
// 3. Lưu thông tin sử dụng mã giảm giá vào bảng discount_usage (nếu có)
if (discountCode && discountAmount > 0) {
    try {
        // Lấy discount_id từ bảng discounts
        const discountInfo = await env.DB.prepare(`
            SELECT id FROM discounts WHERE code = ? LIMIT 1
        `).bind(discountCode).first();

        if (discountInfo) {
            // Lưu vào bảng discount_usage
            await env.DB.prepare(`
                INSERT INTO discount_usage (
                    discount_id, discount_code, order_id, 
                    customer_name, customer_phone, 
                    order_amount, discount_amount, 
                    used_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
                discountInfo.id,
                discountCode,
                data.orderId,
                data.customer.name,
                data.customer.phone,
                finalTotalAmount + discountAmount, // Order amount TRƯỚC khi giảm giá
                discountAmount
            ).run();

            // Cập nhật usage_count và total_discount_amount trong bảng discounts
            await env.DB.prepare(`
                UPDATE discounts 
                SET usage_count = usage_count + 1,
                    total_discount_amount = total_discount_amount + ?
                WHERE id = ?
            `).bind(discountAmount, discountInfo.id).run();

            console.log('✅ Saved discount usage:', discountCode, 'for order:', data.orderId);
        }
    } catch (discountError) {
        console.error('⚠️ Error saving discount usage:', discountError);
        // Không throw error để không ảnh hưởng đến việc tạo đơn hàng
    }
}
```

## Kết quả

### Bảng orders
Các đơn hàng mới sẽ có đầy đủ thông tin:
```
order_id        | discount_code | discount_amount | total_amount
----------------|---------------|-----------------|-------------
DH251124ABC     | GG10K         | 10000          | 89000
DH251124XYZ     | VDT15K        | 15000          | 285000
```

### Bảng discount_usage
Mỗi lần sử dụng mã sẽ được ghi lại:
```
id | discount_id | discount_code | order_id    | customer_name | order_amount | discount_amount | used_at
---|-------------|---------------|-------------|---------------|--------------|-----------------|--------------------
18 | 7           | GG10K         | DH251124ABC | Nguyễn Văn A  | 99000        | 10000          | 2025-11-24 10:30:00
```

### Bảng discounts
Tự động cập nhật số lần sử dụng:
```
id | code  | usage_count | total_discount_amount
---|-------|-------------|----------------------
7  | GG10K | 18          | 180000
```

## Testing

### 1. Kiểm tra bảng orders
```bash
wrangler d1 execute vdt --remote --command "SELECT order_id, discount_code, discount_amount, total_amount FROM orders ORDER BY id DESC LIMIT 5"
```

### 2. Kiểm tra bảng discount_usage
```bash
wrangler d1 execute vdt --remote --command "SELECT * FROM discount_usage ORDER BY id DESC LIMIT 5"
```

### 3. Kiểm tra bảng discounts
```bash
wrangler d1 execute vdt --remote --command "SELECT code, usage_count, total_discount_amount FROM discounts WHERE usage_count > 0"
```

## Lợi ích

### 1. Tracking chính xác
- Biết được mã nào được sử dụng bao nhiêu lần
- Biết được tổng số tiền đã giảm cho mỗi mã
- Biết được khách hàng nào đã sử dụng mã nào

### 2. Báo cáo & Phân tích
- Thống kê hiệu quả của từng mã giảm giá
- Phân tích hành vi khách hàng
- Tối ưu chiến lược marketing

### 3. Kiểm soát
- Có thể giới hạn số lần sử dụng mã
- Có thể giới hạn số lần sử dụng mã cho mỗi khách hàng
- Phát hiện abuse/fraud

### 4. Tích hợp tương lai
- Có thể tạo dashboard quản lý mã giảm giá
- Có thể tạo API để check mã đã được sử dụng bao nhiêu lần
- Có thể tự động disable mã khi đạt giới hạn

## Notes

- Logic parse discount code từ format: "-10.000đ (GG10K)"
- Nếu không có mã giảm giá, `discount_code = null` và `discount_amount = 0`
- Error khi lưu discount_usage không ảnh hưởng đến việc tạo đơn hàng
- Các đơn hàng cũ vẫn giữ nguyên `discount_code = null`

## Deploy

Worker đã được deploy với version ID: `48a48fac-45e0-46f5-b44c-187de5f90b67`

Ngày deploy: 24/11/2025
