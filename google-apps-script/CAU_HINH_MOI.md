# 🔧 Hướng Dẫn Cấu Hình Lại Hệ Thống

## 📋 Thông Tin Đã Cập Nhật

### ✅ File Google Sheets Mới
- **ID File:** `1XNdGOYAVYa4BdZFEVZicMLbX8nJ3J--2HPJjltD9r-k`
- **Tên Sheet Đơn Hàng:** `DS ĐƠN HÀNG` (đã đổi từ "Đơn Hàng")

### ✅ Thông Tin Đã Xác Nhận

1. **File "DS CTV" (Danh sách CTV)**
   - ID file: `1axooVOgwVsgwAqCE59afdz6RQOWNV1j4WUGQrBvUHiI`
   - Tên sheet: `DS CTV` (đã đổi từ "DS REF")

2. **Email Admin**
   - Email: `yendev96@gmail.com` (giữ nguyên)

3. **Telegram Bot**
   - Bot Token: `7585519498:AAFHt6QMqI-zfVVnbQW1E_fxzQ1kNUsiEQU` (giữ nguyên)
   - Chat ID: `5816975483` (giữ nguyên)

## 🚀 Các Bước Triển Khai

### Bước 1: Tạo Google Apps Script Mới

1. Mở file Google Sheets mới: `1XNdGOYAVYa4BdZFEVZicMLbX8nJ3J--2HPJjltD9r-k`
2. Click **Extensions** → **Apps Script**
3. Xóa code mặc định
4. Copy toàn bộ code từ file `order-handler.js`
5. Paste vào Apps Script Editor
6. Lưu lại (Ctrl + S)

### Bước 2: Cấp Quyền Truy Cập

Script cần quyền truy cập:
- ✅ Google Sheets (đọc/ghi)
- ✅ Gmail (gửi email)
- ✅ External requests (gọi Telegram API)

**Lưu ý:** Vì file Google Sheets mới thuộc mail mới, bạn cần:
1. Chạy hàm `testScript()` lần đầu
2. Cho phép quyền truy cập khi được yêu cầu
3. Chọn tài khoản mail mới
4. Click "Advanced" → "Go to [Project Name] (unsafe)" → "Allow"

### Bước 3: Deploy Web App

1. Click **Deploy** → **New deployment**
2. Click icon ⚙️ → Chọn **Web app**
3. Cấu hình:
   - **Description:** "Order Handler v2.0"
   - **Execute as:** Me (mail mới của bạn)
   - **Who has access:** Anyone
4. Click **Deploy**
5. Copy **Web app URL** (dạng: `https://script.google.com/macros/s/.../exec`)

### Bước 4: Cập Nhật Website

Thay URL cũ bằng URL mới trong code website:

```javascript
// Thay đổi URL này
const SCRIPT_URL = "https://script.google.com/macros/s/NEW_SCRIPT_ID/exec";

async function submitOrder(orderData) {
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData)
  });
}
```

### Bước 5: Test Hệ Thống

#### Test 1: Chạy hàm test
```javascript
// Trong Apps Script Editor
// Chọn hàm: testScript
// Click Run
```

Kiểm tra:
- ✅ Sheet "DS ĐƠN HÀNG" có dữ liệu test
- ✅ Email admin nhận được thông báo
- ✅ Telegram nhận được thông báo (nếu có)

#### Test 2: Đặt hàng thật từ website
1. Đặt hàng không có referral → Chỉ admin nhận email
2. Đặt hàng có referral → Admin + CTV nhận email

## 🔍 Kiểm Tra Cấu Hình

### Trong file `order-handler.js`:

```javascript
// Tất cả đã được cấu hình đúng:
const MAIN_SHEET_ID = "1XNdGOYAVYa4BdZFEVZicMLbX8nJ3J--2HPJjltD9r-k"; ✅
const SHEET_NAME = "DS ĐƠN HÀNG"; ✅
const CTV_SHEET_ID = "1axooVOgwVsgwAqCE59afdz6RQOWNV1j4WUGQrBvUHiI"; ✅
const CTV_SHEET_NAME = "DS CTV"; ✅
```

### Trong hàm `sendEmailNotification()`:

```javascript
const adminEmail = "yendev96@gmail.com"; ✅ // Đã cấu hình
```

## ⚠️ Lưu Ý Quan Trọng

### 1. Quyền Truy Cập File
Đảm bảo Apps Script có quyền truy cập cả 2 file:
- ✅ File "DS ĐƠN HÀNG" (file chính - ID: `1XNdGOYAVYa4BdZFEVZicMLbX8nJ3J--2HPJjltD9r-k`)
- ✅ File "DS CTV" (file CTV - ID: `1axooVOgwVsgwAqCE59afdz6RQOWNV1j4WUGQrBvUHiI`)

Nếu 2 file thuộc 2 tài khoản khác nhau:
- Phải share file cho nhau
- Hoặc đặt quyền "Anyone with link can view"

### 2. Cấu Trúc Sheet Phải Giống Cũ

Sheet "DS ĐƠN HÀNG" phải có các cột:
1. Mã Đơn Hàng
2. Ngày Đặt
3. Tên Khách Hàng
4. Số Điện Thoại
5. Địa Chỉ
6. Chi Tiết Sản Phẩm
7. 💰 TỔNG KHÁCH PHẢI TRẢ
8. Phương Thức Thanh Toán
9. Ghi Chú
10. Mã Referral
11. Hoa Hồng
12. SĐT CTV

### 3. Migration Dữ Liệu Cũ (Nếu Cần)

Nếu muốn chuyển dữ liệu từ file cũ sang file mới:
1. Mở file cũ
2. Copy toàn bộ sheet "Đơn Hàng"
3. Paste vào sheet "DS ĐƠN HÀNG" của file mới
4. Kiểm tra format và headers

## 📞 Checklist Hoàn Thành

- [ ] Cập nhật ID file Google Sheets mới
- [ ] Cập nhật tên sheet mới
- [ ] Xác nhận thông tin file "DS REF"
- [ ] Cập nhật email admin mới
- [ ] Tạo Apps Script mới trong file mới
- [ ] Cấp quyền truy cập
- [ ] Deploy Web App
- [ ] Cập nhật URL trong website
- [ ] Test hàm `testScript()`
- [ ] Test đặt hàng thật từ website
- [ ] Kiểm tra email admin
- [ ] Kiểm tra email CTV (nếu có referral)
- [ ] Kiểm tra Telegram notification

## 🆘 Nếu Gặp Lỗi

### Lỗi: "Exception: You do not have permission to call SpreadsheetApp.openById"

**Nguyên nhân:** Apps Script không có quyền truy cập file

**Giải pháp:**
1. Share file Google Sheets cho email đang chạy Apps Script
2. Hoặc đổi quyền file thành "Anyone with link can edit"

### Lỗi: "Cannot find sheet DS ĐƠN HÀNG" hoặc "Cannot find sheet DS CTV"

**Nguyên nhân:** Tên sheet không khớp

**Giải pháp:**
1. Kiểm tra tên sheet trong Google Sheets
2. Cập nhật biến `SHEET_NAME` hoặc `CTV_SHEET_NAME` trong code
3. Lưu ý: Phân biệt hoa thường và dấu cách
4. Đảm bảo:
   - Sheet đơn hàng tên: "DS ĐƠN HÀNG"
   - Sheet CTV tên: "DS CTV"

### Lỗi: Email không gửi được

**Nguyên nhân:** Chưa cấp quyền Gmail

**Giải pháp:**
1. Chạy lại hàm `testScript()`
2. Cho phép quyền Gmail khi được yêu cầu

---

## 📊 Tóm Tắt Cấu Hình Hoàn Chỉnh

```javascript
// File: order-handler.js
// Tất cả thông tin đã được cập nhật đầy đủ

const MAIN_SHEET_ID = "1XNdGOYAVYa4BdZFEVZicMLbX8nJ3J--2HPJjltD9r-k";
const SHEET_NAME = "DS ĐƠN HÀNG";
const CTV_SHEET_ID = "1axooVOgwVsgwAqCE59afdz6RQOWNV1j4WUGQrBvUHiI";
const CTV_SHEET_NAME = "DS CTV";
const ADMIN_EMAIL = "yendev96@gmail.com";
const TELEGRAM_BOT_TOKEN = "7585519498:AAFHt6QMqI-zfVVnbQW1E_fxzQ1kNUsiEQU";
const TELEGRAM_CHAT_ID = "5816975483";
```

**Trạng thái:** ✅ Sẵn sàng triển khai!

**Cần hỗ trợ thêm?** Liên hệ: yendev96@gmail.com
