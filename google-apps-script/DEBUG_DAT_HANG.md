# 🔍 DEBUG: Email Test OK Nhưng Đặt Hàng Không Gửi Email

## ✅ Tình Huống

- Email test (`testSendEmail()`) gửi thành công ✅
- Đặt hàng từ website thành công (có trong sheet) ✅
- **NHƯNG không nhận được email thông báo đơn hàng** ❌

## 🎯 Nguyên Nhân Có Thể

1. **Lỗi xảy ra trước khi đến bước gửi email**
2. **Lỗi trong hàm sendEmailNotification bị catch im lặng**
3. **Dữ liệu đơn hàng không đầy đủ**
4. **Lỗi khi format email HTML**

---

## 📋 BƯỚC 1: Xem Execution Log Chi Tiết

### Cách xem log:

1. Mở Google Apps Script Editor
2. Vào **View** → **Executions** (hoặc **Thực thi**)
3. Tìm execution **GẦN NHẤT** (khi bạn vừa đặt hàng)
4. Click vào execution đó để xem log chi tiết

### Tìm các dòng log sau:

```
🔵 BẮT ĐẦU XỬ LÝ ĐƠN HÀNG: VDT...
🔵 Bước 1: Khởi tạo sheet...
✅ Bước 1: Sheet đã sẵn sàng
🔵 Bước 2: Validate dữ liệu...
✅ Bước 2: Dữ liệu hợp lệ
🔵 Bước 3: Thêm đơn hàng vào sheet...
✅ Bước 3: Đã thêm vào sheet thành công
🔵 Bước 4: Kiểm tra gửi Telegram...
🔵 Bước 5: GỬI EMAIL THÔNG BÁO...
📧 Bắt đầu gửi email đến yendev96@gmail.com...
📧 Email quota còn lại: [số]
✅ Đã gửi email thành công đến admin yendev96@gmail.com
✅ Bước 5: Đã hoàn thành gửi email
🎉 HOÀN THÀNH XỬ LÝ ĐƠN HÀNG: VDT...
```

---

## 🔍 PHÂN TÍCH LOG

### Trường Hợp 1: Dừng ở Bước 3 hoặc trước đó

**Log:**
```
🔵 Bước 3: Thêm đơn hàng vào sheet...
❌ LỖI XỬ LÝ ĐƠN HÀNG: [thông báo lỗi]
```

**Nguyên nhân:** Lỗi khi thêm vào sheet, chưa đến bước gửi email

**Giải pháp:**
- Kiểm tra quyền truy cập Google Sheets
- Kiểm tra MAIN_SHEET_ID đúng chưa
- Kiểm tra dữ liệu đơn hàng có đầy đủ không

### Trường Hợp 2: Có "Bước 5" nhưng không có "Đã gửi email thành công"

**Log:**
```
🔵 Bước 5: GỬI EMAIL THÔNG BÁO...
📧 Bắt đầu gửi email đến yendev96@gmail.com...
❌ LỖI GỬI EMAIL: [thông báo lỗi]
✅ Bước 5: Đã hoàn thành gửi email  ← Vẫn hiện "hoàn thành" vì catch error
```

**Nguyên nhân:** Lỗi khi gửi email (quota, quyền, format HTML, v.v.)

**Giải pháp:** Xem phần "Xử Lý Lỗi Email" bên dưới

### Trường Hợp 3: Có "Đã gửi email thành công" nhưng không nhận được

**Log:**
```
✅ Đã gửi email thành công đến admin yendev96@gmail.com
```

**Nguyên nhân:** Email đã gửi nhưng bị Gmail chặn/spam

**Giải pháp:**
1. Kiểm tra thư mục **Spam** trong Gmail
2. Kiểm tra thư mục **All Mail**
3. Tìm kiếm email từ `noreply@google.com`

### Trường Hợp 4: Không thấy log "Bước 5" nào cả

**Log:**
```
🔵 Bước 4: Kiểm tra gửi Telegram...
🎉 HOÀN THÀNH XỬ LÝ ĐƠN HÀNG: VDT...
```

**Nguyên nhân:** Code bị sửa đổi hoặc không deploy đúng

**Giải pháp:**
1. Kiểm tra code có hàm `sendEmailNotification` không
2. Redeploy script (xem bên dưới)

---

## 🔧 XỬ LÝ LỖI EMAIL

### Lỗi: "Service invoked too many times"

**Nghĩa là:** Đã gửi quá 100 email hôm nay

**Giải pháp:**
```javascript
// Chạy hàm này để kiểm tra quota
function checkEmailQuota() {
  const remaining = MailApp.getRemainingDailyQuota();
  Logger.log(`📧 Email quota còn lại: ${remaining}`);
}
```

Nếu quota = 0, đợi đến ngày mai hoặc nâng cấp Google Workspace.

### Lỗi: "Invalid email address"

**Nghĩa là:** Email trong dữ liệu đơn hàng sai format

**Giải pháp:**
- Kiểm tra `orderData.customer.email` (nếu có)
- Đảm bảo adminEmail = "yendev96@gmail.com" đúng

### Lỗi: "Exception: Unexpected error while getting the method or property"

**Nghĩa là:** Lỗi khi format HTML email (thiếu dữ liệu)

**Giải pháp:**
- Kiểm tra `orderData.cart` có dữ liệu không
- Kiểm tra `orderData.customer` có đầy đủ không

---

## 🔄 REDEPLOY SCRIPT (Nếu Cần)

Nếu code đã cập nhật nhưng vẫn không hoạt động:

### Bước 1: Archive Deployment Cũ

1. Vào **Deploy** → **Manage deployments**
2. Click ⚙️ bên cạnh deployment hiện tại
3. Click **Archive**

### Bước 2: Tạo Deployment Mới

1. Click **New deployment**
2. Click ⚙️ → Chọn **Web app**
3. **Description**: `Fix email notification v2`
4. **Execute as**: Me (email của bạn)
5. **Who has access**: Anyone
6. Click **Deploy**

### Bước 3: Cập Nhật URL Trong Cloudflare Worker

1. Copy **Web app URL** mới
2. Mở Cloudflare Dashboard
3. Vào **Workers & Pages** → Chọn worker của bạn
4. Vào **Settings** → **Variables**
5. Cập nhật `GOOGLE_SCRIPT_URL` với URL mới
6. Click **Save**

### Bước 4: Test Lại

1. Đặt hàng test từ website
2. Kiểm tra Execution log
3. Kiểm tra email

---

## 🧪 TEST ĐƠN HÀNG GIẢ LẬP

Để test mà không cần đặt hàng từ website:

```javascript
function testOrderWithEmail() {
  const testOrderData = {
    orderId: "TEST-" + Date.now(),
    orderDate: new Date().toISOString(),
    customer: {
      name: "Nguyễn Văn Test",
      phone: "0123456789",
      address: "123 Test Street, Test City",
      notes: "Đơn hàng test",
      email: "test@example.com"
    },
    cart: [
      {
        name: "Vòng Dâu Tằm Test",
        quantity: 1,
        price: "150.000đ",
        weight: "12kg",
        notes: "Test product"
      }
    ],
    total: "171.000đ",
    paymentMethod: "cod",
    telegramNotification: SECRET_KEY // Để gửi cả Telegram
  };

  Logger.log("🧪 Bắt đầu test đơn hàng giả lập...");
  
  const result = handleOrderFromWebsite(testOrderData);
  
  Logger.log("🧪 Kết quả test:");
  Logger.log(JSON.stringify(result));
  
  Logger.log("🧪 Kiểm tra email trong hộp thư yendev96@gmail.com");
}
```

**Cách chạy:**
1. Copy code trên vào Apps Script Editor
2. Chọn `testOrderWithEmail` từ dropdown
3. Click **Run**
4. Xem log và kiểm tra email

---

## ✅ CHECKLIST DEBUG

- [ ] Đã xem Execution log khi đặt hàng
- [ ] Thấy log "🔵 Bước 5: GỬI EMAIL THÔNG BÁO..."
- [ ] Thấy log "✅ Đã gửi email thành công"
- [ ] Đã kiểm tra thư mục Spam
- [ ] Đã kiểm tra email quota > 0
- [ ] Đã chạy `testOrderWithEmail()` thành công
- [ ] Đã redeploy script (nếu cần)

---

## 📞 Vẫn Không Hoạt Động?

Nếu đã thử tất cả các bước trên:

1. **Chụp màn hình Execution log đầy đủ** (từ đầu đến cuối)
2. **Chụp màn hình kết quả chạy `testOrderWithEmail()`**
3. **Chụp màn hình Google Sheets** (có đơn hàng test không)
4. Gửi thông tin đến: yendev96@gmail.com

---

## 💡 MẸO

- Log chi tiết giúp debug nhanh hơn
- Test với đơn hàng giả lập trước khi test thật
- Luôn kiểm tra Execution log sau mỗi lần đặt hàng
- Email có thể mất 1-2 phút để đến hộp thư

**Cập nhật:** Code đã được thêm log chi tiết ở mọi bước!
