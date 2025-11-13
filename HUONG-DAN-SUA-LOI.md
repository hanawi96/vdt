# HƯỚNG DẪN SỬA LỖI - DỮ LIỆU KHÔNG LƯU VÀO D1 DATABASE

## 🔴 VẤN ĐỀ

Khi deploy lên Cloudflare Pages qua GitHub, đơn hàng không được lưu vào D1 database mặc dù local hoạt động bình thường.

## 🔍 NGUYÊN NHÂN

1. **Code frontend đang gọi API đến Cloudflare Worker** (`ctv-api.yendev96.workers.dev`)
2. **Cloudflare Worker chưa được deploy hoặc chưa bind đúng với D1 database**
3. **Cloudflare Pages chỉ deploy static files và Pages Functions**, KHÔNG deploy Worker

## ✅ GIẢI PHÁP (CHỌN 1 TRONG 2)

---

## GIẢI PHÁP 1: SỬ DỤNG CLOUDFLARE WORKER (KHUYẾN NGHỊ)

### Bước 1: Deploy Cloudflare Worker với D1 binding

```bash
# Di chuyển vào thư mục worker
cd worker

# Deploy worker lên Cloudflare
npx wrangler deploy

# Kiểm tra worker đã được deploy
npx wrangler deployments list
```

### Bước 2: Kiểm tra D1 binding trong Cloudflare Dashboard

1. Truy cập: https://dash.cloudflare.com
2. Vào **Workers & Pages** → Chọn worker `ctv-api`
3. Vào tab **Settings** → **Variables**
4. Kiểm tra **D1 Database Bindings**:
   - Variable name: `DB`
   - Database: `vdt` (ID: `19917e57-ced3-4fc3-adad-368a2e989ea7`)

### Bước 3: Kiểm tra Environment Variables

Trong **Settings** → **Variables**, đảm bảo có:

```
GOOGLE_APPS_SCRIPT_URL = https://script.google.com/macros/s/AKfycbwh4Az3BjmNMan7Ik_FxcsmDSSuUE4lWMBgcPBlsITYN39bWfHztZK9VOS930rrin3dEA/exec
SECRET_KEY = VDT_SECRET_2025_ANHIEN
```

### Bước 4: Test Worker API

```bash
# Test tạo đơn hàng
curl -X POST https://ctv-api.yendev96.workers.dev/api/order/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST001",
    "customer": {
      "name": "Test User",
      "phone": "0123456789",
      "address": "Test Address"
    },
    "cart": [
      {
        "name": "Test Product",
        "price": "100000đ",
        "quantity": 1
      }
    ],
    "total": 100000,
    "paymentMethod": "cod"
  }'
```

### Bước 5: Kiểm tra logs

```bash
# Xem logs của worker
npx wrangler tail ctv-api
```

---

## GIẢI PHÁP 2: SỬ DỤNG PAGES FUNCTION VỚI D1

Nếu muốn sử dụng Cloudflare Pages Function thay vì Worker:

### Bước 1: Tạo Pages Function mới với D1 binding

Tạo file `functions/api/order/create.js`:

```javascript
// Cloudflare Pages Function with D1 Database
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    // Validate
    if (!data.orderId || !data.customer || !data.cart) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Thiếu thông tin đơn hàng'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Tính tổng tiền
    const totalAmount = data.total || 0;

    // Validate referral code
    let validReferralCode = null;
    let finalCommission = 0;
    let ctvPhone = null;

    if (data.referralCode && data.referralCode.trim() !== '') {
      const ctvData = await env.DB.prepare(`
        SELECT referral_code, commission_rate, phone FROM ctv WHERE referral_code = ?
      `).bind(data.referralCode.trim()).first();

      if (ctvData) {
        validReferralCode = ctvData.referral_code;
        ctvPhone = ctvData.phone;
        const commissionRate = ctvData.commission_rate || 0.1;
        finalCommission = totalAmount * commissionRate;
      }
    }

    // Format products
    const productsJson = JSON.stringify(data.cart);

    // Lưu vào D1 Database
    const result = await env.DB.prepare(`
      INSERT INTO orders (
        order_id, order_date, customer_name, customer_phone,
        address, products, total_amount, payment_method,
        status, referral_code, commission, ctv_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.orderId,
      data.orderDate || new Date().toISOString(),
      data.customer.name,
      data.customer.phone,
      data.customer.address || '',
      productsJson,
      totalAmount,
      data.paymentMethod || 'cod',
      data.status || 'Mới',
      validReferralCode,
      finalCommission,
      ctvPhone || null
    ).run();

    if (!result.success) {
      throw new Error('Failed to insert order into D1');
    }

    console.log('✅ Saved order to D1:', data.orderId);

    // Gửi đến Google Sheets
    try {
      const googleScriptUrl = env.GOOGLE_APPS_SCRIPT_URL;
      if (googleScriptUrl) {
        await fetch(googleScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
    } catch (sheetsError) {
      console.error('⚠️ Google Sheets error:', sheetsError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Đơn hàng đã được tạo thành công',
      orderId: data.orderId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}
```

### Bước 2: Bind D1 trong Cloudflare Pages Dashboard

1. Truy cập: https://dash.cloudflare.com
2. Vào **Workers & Pages** → Chọn Pages project của bạn
3. Vào tab **Settings** → **Functions**
4. Trong **D1 database bindings**, thêm:
   - Variable name: `DB`
   - D1 database: `vdt`

### Bước 3: Cập nhật URL API trong frontend

Sửa file `public/assets/js/app.js`:

```javascript
// Thay đổi từ:
const res = await fetch('https://ctv-api.yendev96.workers.dev/api/order/create', {

// Thành:
const res = await fetch('/api/order/create', {
```

Tìm và thay thế TẤT CẢ các chỗ gọi API worker thành relative URL `/api/...`

### Bước 4: Deploy lại

```bash
git add .
git commit -m "Fix: Use Pages Function with D1 binding"
git push origin main
```

---

## 🧪 KIỂM TRA SAU KHI SỬA

### 1. Kiểm tra D1 database có dữ liệu

```bash
# Xem dữ liệu trong bảng orders
npx wrangler d1 execute vdt --command "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5"

# Xem dữ liệu trong bảng ctv
npx wrangler d1 execute vdt --command "SELECT * FROM ctv ORDER BY created_at DESC LIMIT 5"
```

### 2. Kiểm tra logs

**Nếu dùng Worker:**
```bash
npx wrangler tail ctv-api
```

**Nếu dùng Pages:**
- Vào Cloudflare Dashboard → Pages → Chọn project → Functions → Logs

### 3. Test trên production

1. Truy cập website production
2. Tạo đơn hàng thử nghiệm
3. Kiểm tra D1 database xem có dữ liệu không
4. Kiểm tra Google Sheets xem có dữ liệu không

---

## 📝 LƯU Ý QUAN TRỌNG

1. **Không thể dùng cả Worker và Pages Function cùng lúc** cho cùng một endpoint
2. **D1 binding phải được cấu hình trong Cloudflare Dashboard**, không tự động từ `wrangler.toml`
3. **Environment variables** cũng phải được set trong Dashboard
4. **Sau khi thay đổi binding**, cần deploy lại để áp dụng

---

## 🆘 NẾU VẪN KHÔNG HOẠT ĐỘNG

1. Kiểm tra logs trong Cloudflare Dashboard
2. Kiểm tra D1 binding đã được set đúng chưa
3. Kiểm tra environment variables
4. Test API endpoint trực tiếp bằng curl/Postman
5. Kiểm tra network tab trong browser để xem response từ API

---

## 📞 HỖ TRỢ

Nếu cần hỗ trợ thêm, vui lòng cung cấp:
- Screenshot của D1 bindings trong Dashboard
- Logs từ Cloudflare
- Network response từ browser DevTools
