# ⚡ LÀM NGAY BÂY GIỜ - FIX EMAIL ĐẶT HÀNG

## 🎯 Tình Huống

✅ Email test gửi thành công  
✅ Đơn hàng lưu vào sheet thành công  
❌ **NHƯNG không nhận email khi đặt hàng**

---

## 🚀 BƯỚC 1: Cập Nhật Code (2 phút)

### 1.1. Mở Google Apps Script Editor

1. Vào: https://script.google.com
2. Mở project **Vòng Dâu Tằm An Nhiên**
3. Mở file `order-handler.js`

### 1.2. Copy Code Mới

Code đã được cập nhật với log chi tiết. Bạn cần:

1. **Lưu file** (Ctrl+S hoặc File → Save)
2. Đảm bảo không có lỗi syntax (xem góc dưới bên phải)

---

## 🧪 BƯỚC 2: Test Đơn Hàng Giả Lập (3 phút)

### 2.1. Chạy Hàm Test

1. Trong Apps Script Editor
2. Chọn hàm `testOrderWithEmail` từ dropdown
3. Click **Run** (▶️)
4. Đợi 10-20 giây

### 2.2. Xem Log

1. Click **View** → **Logs** (hoặc Ctrl+Enter)
2. Tìm các dòng log:

```
🧪 BẮT ĐẦU TEST ĐƠN HÀNG GIẢ LẬP
🔵 BẮT ĐẦU XỬ LÝ ĐƠN HÀNG: TEST-...
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
🎉 HOÀN THÀNH XỬ LÝ ĐƠN HÀNG: TEST-...
🧪 TEST HOÀN TẤT!
```

### 2.3. Kiểm Tra Kết Quả

**A. Kiểm tra Google Sheets:**
1. Mở sheet "DS ĐƠN HÀNG"
2. Tìm đơn hàng có mã bắt đầu bằng `TEST-`
3. Nếu có → Sheet OK ✅

**B. Kiểm tra Email:**
1. Mở Gmail: https://mail.google.com
2. Tìm email với subject: **"🔔 Đơn hàng mới #TEST-..."**
3. Nếu không thấy trong Inbox, kiểm tra **Spam**
4. Nếu có → Email OK ✅

**C. Kiểm tra Telegram:**
1. Mở Telegram
2. Tìm thông báo đơn hàng test
3. Nếu có → Telegram OK ✅

---

## 🔍 BƯỚC 3: Phân Tích Kết Quả

### ✅ Trường Hợp 1: Test Thành Công (Nhận Được Email)

**Nghĩa là:** Hệ thống hoạt động bình thường!

**Vấn đề có thể là:**
- Đơn hàng từ website không đến Google Apps Script
- URL deployment sai trong Cloudflare Worker

**Giải pháp:**

1. **Kiểm tra URL Deployment:**
   - Trong Apps Script, vào **Deploy** → **Manage deployments**
   - Copy **Web app URL**
   - Mở Cloudflare Dashboard
   - Vào **Workers & Pages** → Worker của bạn
   - Vào **Settings** → **Variables**
   - Kiểm tra `GOOGLE_SCRIPT_URL` có đúng URL không
   - Nếu sai, cập nhật và **Save**

2. **Test đặt hàng từ website:**
   - Đặt hàng test từ website
   - Vào Apps Script → **View** → **Executions**
   - Xem có execution mới không
   - Nếu không có → URL sai hoặc Worker không gọi được

### ❌ Trường Hợp 2: Test Thất Bại (Không Nhận Email)

**Xem log để biết dừng ở bước nào:**

#### A. Dừng ở "Bước 5" - Có lỗi gửi email

**Log:**
```
🔵 Bước 5: GỬI EMAIL THÔNG BÁO...
❌ LỖI GỬI EMAIL: [thông báo lỗi]
```

**Các lỗi phổ biến:**

1. **"Service invoked too many times"**
   - Hết quota email (100/ngày)
   - Chạy `checkEmailQuota()` để kiểm tra
   - Đợi đến ngày mai

2. **"Invalid email address"**
   - Email sai format
   - Kiểm tra: `const adminEmail = "yendev96@gmail.com";`

3. **"Exception: Unexpected error"**
   - Lỗi format HTML
   - Kiểm tra dữ liệu `orderData.cart` có đầy đủ không

#### B. Dừng trước "Bước 5"

**Log:**
```
🔵 Bước 3: Thêm đơn hàng vào sheet...
❌ LỖI XỬ LÝ ĐƠN HÀNG: [thông báo lỗi]
```

**Nguyên nhân:** Lỗi khi thêm vào sheet

**Giải pháp:**
- Kiểm tra quyền truy cập Google Sheets
- Kiểm tra `MAIN_SHEET_ID` đúng chưa

---

## 🔄 BƯỚC 4: Redeploy (Nếu Cần)

Nếu test thành công nhưng đặt hàng thật vẫn không gửi email:

### 4.1. Archive Deployment Cũ

1. Vào **Deploy** → **Manage deployments**
2. Click ⚙️ → **Archive**

### 4.2. Tạo Deployment Mới

1. Click **New deployment**
2. Click ⚙️ → Chọn **Web app**
3. **Description**: `Fix email v2 - $(new Date())`
4. **Execute as**: Me
5. **Who has access**: Anyone
6. Click **Deploy**
7. **Copy URL mới**

### 4.3. Cập Nhật Cloudflare Worker

1. Mở Cloudflare Dashboard
2. Vào **Workers & Pages** → Worker của bạn
3. Vào **Settings** → **Variables**
4. Cập nhật `GOOGLE_SCRIPT_URL` = URL mới
5. Click **Save**

### 4.4. Test Lại

1. Đặt hàng test từ website
2. Kiểm tra Executions có log mới không
3. Kiểm tra email

---

## 📊 CHECKLIST HOÀN CHỈNH

### Test Đơn Hàng Giả Lập:
- [ ] Đã chạy `testOrderWithEmail()` thành công
- [ ] Thấy log "✅ Đã gửi email thành công"
- [ ] Nhận được email test trong Gmail
- [ ] Đơn hàng test có trong Google Sheets

### Kiểm Tra Deployment:
- [ ] Đã copy URL deployment từ Apps Script
- [ ] Đã kiểm tra `GOOGLE_SCRIPT_URL` trong Worker
- [ ] URL trong Worker khớp với URL deployment

### Test Đặt Hàng Thật:
- [ ] Đặt hàng test từ website
- [ ] Có execution mới trong Apps Script
- [ ] Thấy log "✅ Đã gửi email thành công"
- [ ] Nhận được email trong Gmail

---

## 🆘 VẪN KHÔNG HOẠT ĐỘNG?

### Xem Execution Log Chi Tiết

Sau khi đặt hàng từ website:

1. Vào **View** → **Executions**
2. Click vào execution **GẦN NHẤT**
3. Chụp màn hình **TOÀN BỘ LOG**
4. Tìm dòng có ❌ (lỗi)

### Gửi Thông Tin Debug

Gửi đến yendev96@gmail.com:

1. **Screenshot Execution log đầy đủ**
2. **Screenshot kết quả chạy `testOrderWithEmail()`**
3. **Screenshot Google Sheets** (có đơn test không)
4. **Screenshot Cloudflare Worker Variables** (GOOGLE_SCRIPT_URL)

---

## 💡 MẸO QUAN TRỌNG

1. **Luôn xem Execution log** sau mỗi lần đặt hàng
2. **Test với đơn giả lập trước** để đảm bảo code OK
3. **Kiểm tra Spam folder** nếu không thấy email
4. **Email có thể mất 1-2 phút** để đến hộp thư
5. **Quota reset lúc 0h** nếu hết quota

---

## ⏱️ Thời Gian Ước Tính

- Cập nhật code: **2 phút**
- Test đơn giả lập: **3 phút**
- Phân tích log: **2 phút**
- Redeploy (nếu cần): **3 phút**

**TỔNG: 10 phút** để fix hoàn toàn!

---

**Bắt đầu ngay từ Bước 1! 🚀**
