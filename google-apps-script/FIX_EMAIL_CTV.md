# 🔧 FIX: Email Không Gửi Cho Cộng Tác Viên (CTV)

## ✅ Tình Huống

- Email admin (yendev96@gmail.com): ✅ Hoạt động
- Email CTV khi có đơn từ referral: ❌ Không gửi

---

## 🎯 BƯỚC 1: Kiểm Tra Email CTV (2 phút)

### 1.1. Chạy Hàm Kiểm Tra

1. Mở Google Apps Script Editor
2. Chọn hàm `checkAllCTVEmails` từ dropdown
3. Click **Run** (▶️)
4. Xem log

### 1.2. Phân Tích Kết Quả

**Log sẽ hiển thị:**

```
🔍 KIỂM TRA EMAIL CỦA TẤT CẢ CTV
📊 Tổng số CTV: 10

📋 DANH SÁCH CTV:

1. ✅ Nguyễn Văn A (CTV843817)
   Email: nguyenvana@gmail.com
   SĐT: 0123456789

2. ❌ Trần Thị B (CTV506835) - KHÔNG CÓ EMAIL
   SĐT: 0987654321

...

📊 THỐNG KÊ:
✅ CTV có email: 5
❌ CTV không có email: 5

⚠️ CẦN BỔ SUNG EMAIL CHO 5 CTV!
```

### 1.3. Kết Luận

**Nếu CTV có ❌ "KHÔNG CÓ EMAIL":**
- Đây là nguyên nhân chính!
- CTV không có email trong sheet → Không thể gửi email
- **Giải pháp:** Thêm email cho CTV (xem Bước 2)

**Nếu CTV có ✅ email:**
- Email đã có trong sheet
- Vấn đề có thể là:
  - Mã referral không khớp
  - Email sai format
  - Email bị spam
- **Giải pháp:** Test với mã referral cụ thể (xem Bước 3)

---

## 📝 BƯỚC 2: Thêm Email Cho CTV (3 phút)

### 2.1. Mở Sheet CTV

1. Mở Google Sheets: https://docs.google.com/spreadsheets/d/1axooVOgwVsgwAqCE59afdz6RQOWNV1j4WUGQrBvUHiI
2. Tìm sheet **"DS CTV"**

### 2.2. Kiểm Tra Cấu Trúc

Sheet phải có các cột:
- **Cột A**: Thời Gian
- **Cột B**: Họ Tên
- **Cột C**: Số Điện Thoại
- **Cột D**: Email ← **QUAN TRỌNG**
- ...
- **Cột I**: Mã Ref

### 2.3. Thêm Email

1. Tìm CTV cần thêm email (dựa vào Mã Ref hoặc Họ Tên)
2. Nhập email vào **Cột D** (Email)
3. Đảm bảo email đúng format: `example@gmail.com`
4. **Lưu** (Ctrl+S)

**Ví dụ:**

| Họ Tên | SĐT | Email | ... | Mã Ref |
|--------|-----|-------|-----|--------|
| Nguyễn Văn A | 0123456789 | nguyenvana@gmail.com | ... | CTV843817 |
| Trần Thị B | 0987654321 | **tranthib@gmail.com** ← Thêm | ... | CTV506835 |

### 2.4. Kiểm Tra Lại

1. Quay lại Apps Script
2. Chạy lại `checkAllCTVEmails`
3. Xem CTV đã có email chưa

---

## 🧪 BƯỚC 3: Test Email CTV (5 phút)

### 3.1. Chuẩn Bị

1. Chọn 1 CTV có email để test
2. Copy **Mã Ref** của CTV đó (ví dụ: `CTV843817`)

### 3.2. Sửa Hàm Test

1. Mở file `order-handler.js`
2. Tìm hàm `testOrderWithReferral`
3. Sửa dòng:
   ```javascript
   const testReferralCode = "CTV843817"; // ← THAY MÃ NÀY
   ```
   Thay `CTV843817` bằng mã CTV bạn muốn test

### 3.3. Chạy Test

1. Lưu file (Ctrl+S)
2. Chọn hàm `testOrderWithReferral` từ dropdown
3. Click **Run** (▶️)
4. Xem log

### 3.4. Phân Tích Log

**Log thành công:**

```
🧪 TEST ĐƠN HÀNG CÓ MÃ REFERRAL (CTV)
🧪 Đang test với mã referral: CTV843817

✅ Tìm thấy CTV:
   - Tên: Nguyễn Văn A
   - SĐT: 0123456789
   - Email: nguyenvana@gmail.com
   - Mã Ref: CTV843817

🧪 Bắt đầu test đơn hàng với mã referral...
🔵 BẮT ĐẦU XỬ LÝ ĐƠN HÀNG: TEST-CTV-...
...
📧 Có mã referral: CTV843817, chuẩn bị gửi email cho CTV...
📧 Bắt đầu tra cứu thông tin CTV cho mã: CTV843817
✅ Tìm thấy CTV: Nguyễn Văn A - Email: nguyenvana@gmail.com
📧 Tìm thấy CTV: Nguyễn Văn A - Email: nguyenvana@gmail.com
📧 Chuẩn bị gửi email đến CTV nguyenvana@gmail.com...
✅ Đã gửi email thành công đến CTV Nguyễn Văn A (nguyenvana@gmail.com)
✅ Bước 5: Đã hoàn thành gửi email
🎉 HOÀN THÀNH XỬ LÝ ĐƠN HÀNG: TEST-CTV-...
```

**Log lỗi - Không tìm thấy CTV:**

```
❌ KHÔNG TÌM THẤY CTV với mã: CTV843817
❌ Vui lòng kiểm tra:
   1. Mã referral có đúng không?
   2. Mã có trong sheet CTV không?
   3. CTV_SHEET_ID và CTV_SHEET_NAME có đúng không?
```

**Giải pháp:**
- Kiểm tra mã referral có đúng không
- Kiểm tra sheet CTV có mã này không
- Kiểm tra cột I (Mã Ref) có dữ liệu không

**Log lỗi - CTV không có email:**

```
✅ Tìm thấy CTV:
   - Tên: Trần Thị B
   - SĐT: 0987654321
   - Email: (TRỐNG - ĐÂY LÀ VẤN ĐỀ!)
   - Mã Ref: CTV506835

❌ CTV KHÔNG CÓ EMAIL!
❌ Vui lòng thêm email cho CTV này trong sheet CTV
```

**Giải pháp:**
- Quay lại Bước 2
- Thêm email cho CTV này

### 3.5. Kiểm Tra Email

**A. Email Admin:**
1. Mở Gmail: yendev96@gmail.com
2. Tìm email: **"🔔 Đơn hàng mới #TEST-CTV-..."**
3. Nếu có → Admin email OK ✅

**B. Email CTV:**
1. Mở email của CTV (hoặc nhờ CTV kiểm tra)
2. Tìm email: **"🎉 Bạn có đơn hàng mới từ link referral #TEST-CTV-..."**
3. Kiểm tra cả **Inbox** và **Spam**
4. Nếu có → CTV email OK ✅

---

## 🔍 BƯỚC 4: Debug Khi Đặt Hàng Thật

### 4.1. Đặt Hàng Test Với Referral

1. Vào website
2. Thêm mã referral vào URL: `?ref=CTV843817`
3. Đặt hàng test

### 4.2. Kiểm Tra Execution Log

1. Vào Apps Script → **View** → **Executions**
2. Refresh (F5)
3. Click vào execution mới nhất
4. Tìm các dòng log:

**Log thành công:**
```
📧 Có mã referral: CTV843817, chuẩn bị gửi email cho CTV...
✅ Đã gửi email thành công đến CTV [Tên] ([Email])
```

**Log không có referral:**
```
ℹ️ Không có mã referral, bỏ qua gửi email cho CTV
```

**Nguyên nhân:**
- Website không gửi `referralCode` trong dữ liệu đơn hàng
- Kiểm tra code frontend (app.js)

**Log không tìm thấy CTV:**
```
⚠️ Không tìm thấy thông tin CTV cho mã referral: CTV843817
```

**Nguyên nhân:**
- Mã referral không có trong sheet CTV
- Mã referral sai format (có khoảng trắng, ký tự đặc biệt)

**Log không có email:**
```
⚠️ CTV [Tên] không có email: {...}
```

**Nguyên nhân:**
- CTV chưa có email trong sheet
- Thêm email cho CTV (Bước 2)

---

## ✅ CHECKLIST HOÀN CHỈNH

### Kiểm Tra Sheet CTV:
- [ ] Đã chạy `checkAllCTVEmails()`
- [ ] Đã xem danh sách CTV có/không có email
- [ ] Đã thêm email cho CTV cần thiết
- [ ] Email đúng format (example@gmail.com)

### Test Email CTV:
- [ ] Đã sửa mã referral trong `testOrderWithReferral()`
- [ ] Đã chạy `testOrderWithReferral()` thành công
- [ ] Thấy log "✅ Đã gửi email thành công đến CTV"
- [ ] CTV nhận được email test (kiểm tra cả Spam)

### Test Đặt Hàng Thật:
- [ ] Đặt hàng với URL có referral (?ref=...)
- [ ] Có execution mới trong Apps Script
- [ ] Thấy log gửi email CTV thành công
- [ ] CTV nhận được email thông báo

---

## 🆘 VẪN KHÔNG HOẠT ĐỘNG?

### Kiểm Tra Cấu Hình

**1. CTV_SHEET_ID đúng chưa?**

Trong `order-handler.js`:
```javascript
const CTV_SHEET_ID = "1axooVOgwVsgwAqCE59afdz6RQOWNV1j4WUGQrBvUHiI";
```

Kiểm tra ID có khớp với URL sheet CTV không:
```
https://docs.google.com/spreadsheets/d/[ID_NÀY]/edit
```

**2. CTV_SHEET_NAME đúng chưa?**

```javascript
const CTV_SHEET_NAME = "DS CTV";
```

Kiểm tra tên sheet có đúng không (phân biệt hoa thường).

**3. Cột Email đúng vị trí chưa?**

Code đang lấy email từ **Cột D (index 3)**:
```javascript
email: row[3] ? row[3].toString().trim() : "",
```

Nếu sheet CTV của bạn khác, cần sửa index.

### Gửi Thông Tin Debug

Nếu vẫn không được, gửi cho tôi:

1. **Screenshot log `checkAllCTVEmails()`**
2. **Screenshot log `testOrderWithReferral()`**
3. **Screenshot sheet CTV** (1-2 dòng mẫu, che thông tin nhạy cảm)
4. **Screenshot execution log** khi đặt hàng thật

---

## 💡 MẸO QUAN TRỌNG

1. **Email CTV phải có trong sheet** - Đây là điều kiện bắt buộc
2. **Mã referral phải khớp chính xác** - Không phân biệt hoa thường
3. **Kiểm tra Spam folder** - Email CTV có thể bị đánh dấu spam
4. **Test với hàm trước** - Đảm bảo hệ thống OK trước khi test thật
5. **Xem log chi tiết** - Log sẽ cho biết chính xác vấn đề ở đâu

---

**Bắt đầu từ Bước 1: Chạy `checkAllCTVEmails()` ngay! 🚀**
