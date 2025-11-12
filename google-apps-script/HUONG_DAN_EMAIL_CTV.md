# Hướng Dẫn Gửi Email Cho Cộng Tác Viên

## 📋 Tổng Quan

Hệ thống đã được cập nhật để tự động gửi email thông báo cho cộng tác viên khi có đơn hàng từ link referral của họ.

## ✨ Tính Năng Mới

### 1. Gửi Email Tự Động
- **Admin (yendev96@gmail.com)**: Vẫn nhận email cho TẤT CẢ đơn hàng
- **Cộng Tác Viên**: Chỉ nhận email khi có đơn hàng từ link referral của họ

### 2. Nội Dung Email Cho CTV
Email gửi cho CTV bao gồm:
- ✅ Thông tin đơn hàng (mã đơn, thời gian, tổng tiền)
- ✅ Thông tin khách hàng (tên, SĐT, địa chỉ)
- ✅ Chi tiết sản phẩm
- ✅ **Hoa hồng của CTV** (nếu có)
- ✅ Lời cảm ơn và thông báo thanh toán

## 🔧 Cách Hoạt Động

### Luồng Xử Lý
```
Khách hàng đặt hàng với mã referral
    ↓
Hệ thống lưu đơn hàng vào sheet "Đơn Hàng"
    ↓
Tìm kiếm CTV trong sheet "DS REF" theo mã referral
    ↓
Gửi email cho Admin (luôn luôn)
    ↓
Gửi email cho CTV (nếu tìm thấy email)
```

### Cấu Trúc File "DS CTV"
Hệ thống đọc các cột sau từ file "DS CTV":
- **Cột A (index 0)**: Thời Gian
- **Cột B (index 1)**: Họ Tên
- **Cột C (index 2)**: Số Điện Thoại
- **Cột D (index 3)**: Email ⭐ (QUAN TRỌNG)
- **Cột I (index 8)**: Mã Ref ⭐ (QUAN TRỌNG)

## 📝 Yêu Cầu

### 1. File "DS CTV" Phải Có
- ✅ Cột **Email** (cột D) chứa email của CTV
- ✅ Cột **Mã Ref** (cột I) chứa mã referral
- ✅ Dữ liệu phải chính xác và không để trống

### 2. Đơn Hàng Phải Có
- ✅ Mã referral (`orderData.referralCode`)
- ✅ Hoa hồng (`orderData.referralCommission`) - tùy chọn

## 🚀 Cách Triển Khai

### Bước 1: Cập Nhật Code
1. Mở Google Apps Script của bạn
2. Copy toàn bộ nội dung file `order-handler.js` đã được cập nhật
3. Paste vào Google Apps Script Editor
4. Lưu lại (Ctrl + S)

### Bước 2: Kiểm Tra Cấu Hình
Đảm bảo các biến sau đã được cấu hình đúng:
```javascript
const CTV_SHEET_ID = "1axooVOgwVsgwAqCE59afdz6RQOWNV1j4WUGQrBvUHiI";
const CTV_SHEET_NAME = "DS CTV";
```

### Bước 3: Test Thử
Tạo một đơn hàng test với:
- Mã referral hợp lệ (có trong file "DS CTV")
- Email CTV phải có trong cột D của file "DS CTV"

## 📧 Mẫu Email Gửi Cho CTV

### Subject
```
🎉 Bạn có đơn hàng mới từ link referral #VDT001
```

### Nội dung
- Header màu xanh lá với lời chúc mừng
- Thông tin đơn hàng chi tiết
- Thông tin khách hàng
- Chi tiết sản phẩm
- **Highlight hoa hồng** (nếu có) với màu xanh lá nổi bật
- Lời cảm ơn và thông báo thanh toán

## 🔍 Kiểm Tra Log

Sau khi có đơn hàng, kiểm tra log trong Google Apps Script:
```
View → Execution log
```

Các log quan trọng:
- ✅ `Tìm thấy CTV: [tên] - Email: [email]`
- ✅ `Đã gửi email thông báo đơn hàng [mã] đến CTV [tên] ([email])`
- ⚠️ `Không tìm thấy email CTV cho mã referral: [mã]`

## ❓ Xử Lý Lỗi

### Trường hợp 1: CTV không nhận được email
**Nguyên nhân:**
- Email CTV không có trong cột D của file "DS CTV"
- Mã referral không khớp
- Email bị vào spam

**Giải pháp:**
1. Kiểm tra cột Email trong file "DS CTV"
2. Kiểm tra mã referral có đúng không
3. Yêu cầu CTV kiểm tra thư mục spam

### Trường hợp 2: Admin không nhận được email
**Nguyên nhân:**
- Lỗi hệ thống Google Apps Script
- Email admin sai

**Giải pháp:**
1. Kiểm tra biến `adminEmail` trong code
2. Kiểm tra log để xem lỗi cụ thể

### Trường hợp 3: Không tìm thấy CTV
**Nguyên nhân:**
- Mã referral không có trong file "DS CTV"
- Cột "Mã Ref" bị trống

**Giải pháp:**
1. Kiểm tra file "DS CTV" có mã referral chưa
2. Đảm bảo mã referral ở cột I (cột thứ 9)

## 📊 Thống Kê

Hệ thống sẽ log các thông tin sau:
- Số lượng email gửi thành công
- Số lượng CTV được thông báo
- Số lượng đơn hàng có referral
- Tổng hoa hồng đã gửi

## 🎯 Lưu Ý Quan Trọng

1. **Email CTV phải chính xác** - Kiểm tra kỹ trước khi thêm vào file "DS CTV"
2. **Mã referral phải unique** - Mỗi CTV có một mã riêng
3. **Hoa hồng tự động tính** - Đảm bảo logic tính hoa hồng đúng
4. **Admin luôn nhận email** - Để theo dõi tất cả đơn hàng

## 🔄 Cập Nhật Sau Này

Nếu cần thay đổi:
- Template email → Sửa hàm `createCTVEmailHtmlBody()`
- Logic tìm CTV → Sửa hàm `getCTVInfoByReferralCode()`
- Cột trong file "DS CTV" → Cập nhật index trong code

## 📞 Hỗ Trợ

Nếu có vấn đề, liên hệ:
- Email: yendev96@gmail.com
- Kiểm tra log trong Google Apps Script
- Xem file `fix-telegram-spam.js` nếu có lỗi webhook

---

**Phiên bản:** 2.0  
**Ngày cập nhật:** 11/11/2025  
**Tác giả:** Yendev96
