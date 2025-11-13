# Phân tích Quy trình Đặt hàng - Từ Đầu đến Cuối

## ✅ Kiến trúc Hiện tại (Đã Fix)

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Alpine.js)                                   │
│  - 3 cách đặt hàng:                                     │
│    1. Quick Buy COD                                     │
│    2. Quick Buy Transfer                                │
│    3. Checkout từ giỏ hàng                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ POST /api/order/create
                     │ URL: https://ctv-api.yendev96.workers.dev
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Worker                                      │
│  - Validate dữ liệu                                     │
│  - Kiểm tra referral code trong D1                      │
│  - Tính commission từ commission_rate                   │
│  - Lưu vào D1 database                                  │
│  - Gửi đến Google Sheets (backup)                       │
└─────────────────────────────────────────────────────────┘
```

## 📊 Cấu trúc Dữ liệu Gửi từ Frontend

### Dữ liệu gửi đi (orderDetails):

```javascript
{
  orderId: "VDT20241113001",           // Mã đơn hàng unique
  orderDate: "2024-11-13T10:30:00Z",   // ISO timestamp
  
  customer: {
    name: "Nguyễn Văn A",
    phone: "0123456789",
    email: "email@example.com",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    notes: "Ghi chú của khách"
  },
  
  cart: [
    {
      name: "Vòng Dâu Tằm Trơn",
      price: "89.000đ",                // String có format
      quantity: 2,
      weight: 15,
      notes: "Khắc tên: Bé Minh"
    }
  ],
  
  subtotal: "178.000đ",                // String có format
  shipping: "Miễn phí",                // String
  discount: "-20.000đ (FREESHIP)",     // String
  total: "158.000đ",                   // String có format (hiển thị)
  totalAmount: 158000,                 // ✅ Number (để tính toán)
  
  paymentMethod: "Thanh toán khi nhận hàng (COD)",
  
  referralCode: "CTV843817",           // Mã CTV (nếu có)
  referralPartner: "Nguyen Van A",     // Tên CTV (chỉ hiển thị)
  referralCommission: 15800,           // Commission tính sẵn (chỉ tham khảo)
  
  telegramNotification: "VDT_SECRET_2025_ANHIEN"
}
```

## 🔄 Quy trình Xử lý trong Worker

### Bước 1: Validate dữ liệu

```javascript
// Kiểm tra orderId
if (!data.orderId) → Error 400

// Kiểm tra customer
if (!data.customer.name || !data.customer.phone) → Error 400

// Kiểm tra cart
if (!data.cart || data.cart.length === 0) → Error 400
```

### Bước 2: Parse totalAmount

```javascript
const totalAmount = data.total || data.totalAmount || 0;
const totalAmountNumber = typeof totalAmount === 'string'
    ? parseInt(totalAmount.replace(/[^\d]/g, ''))  // "158.000đ" → 158000
    : totalAmount;                                  // 158000 → 158000
```

**✅ Đã fix**: Thêm `totalAmount` (number) vào orderDetails để không cần parse string

### Bước 3: Validate Referral Code

```javascript
if (data.referralCode && data.referralCode.trim() !== '') {
    // Query D1 database
    const ctvData = await env.DB.prepare(`
        SELECT referral_code, commission_rate, phone 
        FROM ctv 
        WHERE referral_code = ?
    `).bind(data.referralCode.trim()).first();
    
    if (ctvData) {
        validReferralCode = ctvData.referral_code;  // "CTV843817"
        ctvPhone = ctvData.phone;                   // "0123456789"
        commissionRate = ctvData.commission_rate;   // 0.1 (10%)
        finalCommission = totalAmountNumber * commissionRate; // 158000 * 0.1 = 15800
    } else {
        // Referral code không tồn tại → không tính commission
        validReferralCode = null;
        finalCommission = 0;
    }
}
```

**✅ Logic đúng**: Commission được tính từ D1, không dùng giá trị từ frontend

### Bước 4: Lưu vào D1 Database

```javascript
const productsJson = JSON.stringify(data.cart);

await env.DB.prepare(`
    INSERT INTO orders (
        order_id, order_date, customer_name, customer_phone, 
        address, products, total_amount, payment_method, 
        status, referral_code, commission, ctv_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).bind(
    data.orderId,                    // "VDT20241113001"
    orderDate,                       // "2024-11-13T10:30:00Z"
    data.customer.name,              // "Nguyễn Văn A"
    data.customer.phone,             // "0123456789"
    data.customer.address || '',     // "123 Đường ABC..."
    productsJson,                    // '[{"name":"Vòng..."}]'
    totalAmountNumber,               // 158000 (INTEGER)
    data.paymentMethod || 'cod',     // "Thanh toán khi nhận hàng (COD)"
    data.status || 'Mới',            // "Mới"
    validReferralCode,               // "CTV843817" hoặc NULL
    finalCommission,                 // 15800 (INTEGER)
    ctvPhone || null                 // "0123456789" hoặc NULL
).run();
```

**✅ Dữ liệu khớp**: Tất cả fields được map đúng

### Bước 5: Gửi đến Google Sheets (Backup)

```javascript
const sheetsData = {
    orderId: data.orderId,
    orderDate: data.orderDate || new Date().toISOString(),
    customer: {
        name: data.customer.name,
        phone: data.customer.phone,
        address: data.customer.address || '',
        notes: data.customer.notes || ''
    },
    cart: data.cart,
    total: data.total || `${totalAmountNumber.toLocaleString('vi-VN')}đ`,
    paymentMethod: data.paymentMethod || 'cod',
    referralCode: validReferralCode || '',
    referralCommission: finalCommission || 0,
    referralPartner: data.referralPartner || '',
    telegramNotification: env.SECRET_KEY || 'VDT_SECRET_2025_ANHIEN'
};

await fetch(googleScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sheetsData)
});
```

## ✅ Các Lỗi Đã Fix

### 1. ❌ Duplicate `telegramNotification`
**Trước**: Có 2 dòng `telegramNotification` trong orderDetails
**Sau**: Chỉ giữ 1 dòng ở cuối

### 2. ❌ Thiếu `totalAmount` (number)
**Trước**: Chỉ có `total` (string format "158.000đ")
**Sau**: Thêm `totalAmount: 158000` (number) để Worker không cần parse

### 3. ✅ Routing đã đúng
**Local & Production**: Đều gọi `https://ctv-api.yendev96.workers.dev/api/order/create`

## 🎯 Kết luận

### ✅ Những gì ĐÚNG:

1. **Routing**: Frontend luôn gọi Worker URL
2. **Validation**: Worker validate referral code từ D1
3. **Commission**: Tính từ `commission_rate` trong D1, không tin frontend
4. **Data mapping**: Tất cả fields được map đúng vào D1
5. **Backup**: Dữ liệu được gửi đến Google Sheets
6. **Error handling**: Có try-catch và fallback

### ✅ Những gì ĐÃ FIX:

1. Xóa duplicate `telegramNotification`
2. Thêm `totalAmount` (number) để tránh parse string
3. Xóa Pages Functions không cần thiết
4. Đơn giản hóa routing

### 📝 Checklist Deploy:

- [x] Code đã được fix
- [x] Build thành công
- [ ] Commit và push lên Git
- [ ] Test trên production
- [ ] Kiểm tra D1 database có dữ liệu

### 🧪 Cách Test:

```powershell
# 1. Deploy
git add .
git commit -m "Fix: Order data structure and routing"
git push

# 2. Đặt hàng thử nghiệm trên website

# 3. Kiểm tra D1
npx wrangler d1 execute vdt --command "SELECT order_id, customer_name, total_amount, referral_code, commission FROM orders ORDER BY created_at DESC LIMIT 5"

# 4. Kiểm tra logs
# Vào Cloudflare Dashboard → Workers → ctv-api → Logs
# Tìm dòng: ✅ Saved order to D1
```

## 🎉 Kết quả Mong đợi:

Khi đặt hàng với referral code `CTV843817`:
- ✅ Đơn hàng được lưu vào D1 với `order_id`, `customer_name`, `total_amount`
- ✅ `referral_code` = "CTV843817"
- ✅ `commission` = total_amount * commission_rate (từ D1)
- ✅ `ctv_phone` = phone của CTV
- ✅ Dữ liệu được gửi đến Google Sheets
- ✅ Telegram notification được gửi
