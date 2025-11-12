# 🚀 Triển Khai Nhanh - Hệ Thống Đơn Hàng Mới

## ✅ Cấu Hình Đã Hoàn Tất

Tất cả thông tin đã được cập nhật trong file `order-handler.js`:

```javascript
const MAIN_SHEET_ID = "1XNdGOYAVYa4BdZFEVZicMLbX8nJ3J--2HPJjltD9r-k";
const SHEET_NAME = "DS ĐƠN HÀNG";
const CTV_SHEET_ID = "1axooVOgwVsgwAqCE59afdz6RQOWNV1j4WUGQrBvUHiI";
const CTV_SHEET_NAME = "DS CTV";
```

## 📝 Các Bước Triển Khai (5 phút)

### Bước 1: Mở Google Apps Script
1. Mở file Google Sheets: https://docs.google.com/spreadsheets/d/1XNdGOYAVYa4BdZFEVZicMLbX8nJ3J--2HPJjltD9r-k
2. Click **Extensions** → **Apps Script**

### Bước 2: Copy Code
1. Xóa code mặc định trong Apps Script Editor
2. Copy toàn bộ nội dung file `order-handler.js`
3. Paste vào Apps Script Editor
4. Lưu (Ctrl + S) - Đặt tên project: "Order Handler v2.0"

### Bước 3: Cấp Quyền
1. Click **Run** → Chọn hàm `testScript`
2. Click **Run** (nút ▶️)
3. Popup yêu cầu quyền → Click **Review permissions**
4. Chọn tài khoản Google của bạn
5. Click **Advanced** → **Go to Order Handler v2.0 (unsafe)**
6. Click **Allow**

### Bước 4: Deploy Web App
1. Click **Deploy** → **New deployment**
2. Click icon ⚙️ bên cạnh "Select type"
3. Chọn **Web app**
4. Cấu hình:
   - **Description:** "Order Handler v2.0"
   - **Execute as:** Me (email của bạn)
   - **Who has access:** Anyone
5. Click **Deploy**
6. **QUAN TRỌNG:** Copy URL được tạo ra (dạng: `https://script.google.com/macros/s/.../exec`)

### Bước 5: Cập Nhật Website
Thay URL cũ trong code website bằng URL mới vừa copy:

```javascript
const SCRIPT_URL = "https://script.google.com/macros/s/YOUR_NEW_SCRIPT_ID/exec";
```

### Bước 6: Test
1. Đặt hàng test từ website
2. Kiểm tra sheet "DS ĐƠN HÀNG" có dữ liệu mới
3. Kiểm tra email `yendev96@gmail.com` nhận được thông báo
4. Nếu có mã referral, kiểm tra CTV có nhận email không

## 🎯 Checklist Nhanh

- [ ] Mở Apps Script trong file Google Sheets mới
- [ ] Copy code từ `order-handler.js`
- [ ] Chạy `testScript()` và cấp quyền
- [ ] Deploy Web App
- [ ] Copy URL deployment
- [ ] Cập nhật URL trong website
- [ ] Test đặt hàng

## 🔍 Kiểm Tra Nhanh

### Test 1: Chạy hàm test
```
Apps Script Editor → Chọn hàm "testScript" → Click Run
```
**Kết quả mong đợi:**
- Sheet "DS ĐƠN HÀNG" có 1 dòng test
- Email admin nhận được thông báo

### Test 2: Đặt hàng không có referral
**Kết quả mong đợi:**
- Đơn hàng lưu vào sheet
- Admin nhận email
- CTV KHÔNG nhận email

### Test 3: Đặt hàng có referral
**Kết quả mong đợi:**
- Đơn hàng lưu vào sheet
- Admin nhận email
- CTV nhận email (nếu có email trong file "DS CTV")

## ⚠️ Lưu Ý Quan Trọng

### 1. Quyền Truy Cập File
Apps Script cần quyền truy cập 2 file:
- File "DS ĐƠN HÀNG" (ID: `1XNdGOYAVYa4BdZFEVZicMLbX8nJ3J--2HPJjltD9r-k`)
- File "DS CTV" (ID: `1axooVOgwVsgwAqCE59afdz6RQOWNV1j4WUGQrBvUHiI`)

**Nếu 2 file thuộc cùng 1 tài khoản:** Không cần làm gì thêm

**Nếu 2 file thuộc 2 tài khoản khác nhau:**
1. Share file "DS CTV" cho tài khoản chạy Apps Script
2. Hoặc đặt quyền "Anyone with link can view"

### 2. Cấu Trúc Sheet
Đảm bảo sheet "DS ĐƠN HÀNG" có đúng 12 cột:
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

**Nếu sheet trống:** Script sẽ tự động tạo headers khi có đơn hàng đầu tiên

### 3. File "DS CTV"
Đảm bảo có đúng cấu trúc:
- **Cột D (index 3):** Email CTV
- **Cột I (index 8):** Mã Ref

## 🆘 Xử Lý Lỗi Nhanh

### Lỗi: "You do not have permission"
→ Chưa cấp quyền hoặc file không được share
→ Chạy lại `testScript()` và cấp quyền

### Lỗi: "Cannot find sheet"
→ Tên sheet không đúng
→ Kiểm tra tên sheet phải là "DS ĐƠN HÀNG" và "DS CTV"

### Lỗi: Email không gửi
→ Chưa cấp quyền Gmail
→ Chạy lại `testScript()` và cho phép quyền Gmail

### CTV không nhận email
→ Kiểm tra email CTV có trong cột D của file "DS CTV"
→ Kiểm tra mã referral có khớp không

## 📞 Hỗ Trợ

**Email:** yendev96@gmail.com

**Xem log lỗi:**
1. Apps Script Editor → View → Execution log
2. Tìm dòng có ❌ để xem lỗi chi tiết

---

**Phiên bản:** 2.0  
**Ngày cập nhật:** 12/11/2025  
**Trạng thái:** ✅ Sẵn sàng triển khai
