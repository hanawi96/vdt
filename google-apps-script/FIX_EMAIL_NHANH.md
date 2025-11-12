# ⚡ FIX NHANH: KHÔNG NHẬN ĐƯỢC EMAIL

## 🎯 Làm Ngay 3 Bước Này (5 phút)

### Bước 1: Mở Google Apps Script Editor

1. Vào: https://script.google.com
2. Mở project **Vòng Dâu Tằm An Nhiên**
3. Mở file `order-handler.js`

### Bước 2: Chạy Hàm Test Email

1. Tìm hàm `testSendEmail` trong code (đã được thêm vào cuối file)
2. Chọn `testSendEmail` từ dropdown ở thanh công cụ
3. Click nút **Run** (▶️)
4. **QUAN TRỌNG**: Nếu có popup yêu cầu quyền:
   - Click **Review permissions**
   - Chọn tài khoản Google của bạn
   - Click **Advanced** → **Go to [Project name] (unsafe)**
   - Click **Allow**

### Bước 3: Kiểm Tra Kết Quả

**Xem Log:**
1. Click **View** → **Logs** (hoặc Ctrl+Enter)
2. Tìm dòng:
   ```
   ✅ ĐÃ GỬI EMAIL TEST THÀNH CÔNG!
   ```

**Kiểm Tra Email:**
1. Mở Gmail: https://mail.google.com
2. Tìm email với subject: **"🧪 Test Email - Vòng Dâu Tằm An Nhiên"**
3. Nếu không thấy trong Inbox, kiểm tra thư mục **Spam**

---

## ✅ Nếu Nhận Được Email Test

**Nghĩa là:** Hệ thống email hoạt động bình thường!

**Vấn đề có thể là:**
1. Đơn hàng không được gửi đến Google Apps Script
2. Có lỗi trong quá trình xử lý đơn hàng

**Kiểm tra tiếp:**

1. **Xem Execution Log:**
   - Vào **View** → **Executions**
   - Tìm execution gần nhất (khi bạn đặt hàng)
   - Click vào để xem log chi tiết
   - Tìm dòng: `📧 Đã gửi email thành công đến admin yendev96@gmail.com`

2. **Nếu không thấy execution nào:**
   - Nghĩa là đơn hàng không đến Google Apps Script
   - Kiểm tra Cloudflare Worker
   - Kiểm tra URL deployment trong Worker

---

## ❌ Nếu KHÔNG Nhận Được Email Test

### Lỗi 1: "Service invoked too many times"

**Nguyên nhân:** Đã gửi quá 100 email hôm nay

**Giải pháp:**
- Đợi đến ngày mai (quota reset lúc 0h)
- Hoặc nâng cấp Google Workspace (1500 email/ngày)

### Lỗi 2: "Authorization required"

**Nguyên nhân:** Chưa cấp quyền cho Apps Script

**Giải pháp:**
1. Chạy lại hàm `testSendEmail`
2. Cấp quyền khi được yêu cầu (xem Bước 2 ở trên)

### Lỗi 3: "Invalid email address"

**Nguyên nhân:** Email sai format

**Giải pháp:**
1. Kiểm tra dòng: `const adminEmail = "yendev96@gmail.com";`
2. Đảm bảo email đúng format

### Lỗi 4: Không có lỗi nhưng vẫn không nhận email

**Giải pháp:**

1. **Kiểm tra Spam:**
   - Mở Gmail
   - Vào thư mục **Spam**
   - Tìm email từ `noreply@google.com`
   - Click **Not spam**

2. **Thử email khác:**
   ```javascript
   const testEmail = "email-khac@gmail.com"; // Thay đổi
   ```

3. **Redeploy script:**
   - Vào **Deploy** → **Manage deployments**
   - Click ⚙️ → **Archive** deployment cũ
   - Tạo **New deployment**
   - Copy URL mới và cập nhật vào Worker

---

## 🔍 Debug Chi Tiết

### Kiểm Tra Email Quota

Chạy hàm `checkEmailQuota`:

1. Chọn `checkEmailQuota` từ dropdown
2. Click **Run**
3. Xem log:
   ```
   📧 Email quota còn lại hôm nay: 100
   ```

**Nếu quota = 0:** Đợi đến ngày mai

**Nếu quota > 0:** Email quota OK, vấn đề ở chỗ khác

### Xem Log Chi Tiết

Sau khi đặt hàng:

1. Vào **View** → **Executions**
2. Click vào execution gần nhất
3. Tìm các dòng log:

**Log thành công:**
```
📧 Bắt đầu gửi email đến yendev96@gmail.com...
📧 Email quota còn lại: 100
✅ Đã gửi email thành công đến admin yendev96@gmail.com
```

**Log lỗi:**
```
❌ LỖI GỬI EMAIL: [thông báo lỗi]
```

---

## 📞 Cần Hỗ Trợ?

Nếu đã thử tất cả các bước trên mà vẫn không được:

1. Chụp màn hình log trong **Executions**
2. Chụp màn hình kết quả chạy `testSendEmail()`
3. Gửi thông tin đến: yendev96@gmail.com

---

## 📝 Checklist Nhanh

- [ ] Đã chạy `testSendEmail()` thành công
- [ ] Đã nhận được email test trong Gmail
- [ ] Đã kiểm tra thư mục Spam
- [ ] Đã cấp quyền Gmail cho Apps Script
- [ ] Đã kiểm tra email quota > 0
- [ ] Đã xem log trong Executions khi đặt hàng

**Nếu tất cả đều OK:** Hệ thống email hoạt động bình thường! 🎉
