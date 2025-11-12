# ⚡ FIX NHANH: Email CTV Không Gửi (3 phút)

## 🎯 Làm Ngay 3 Bước

### Bước 1: Kiểm Tra Email CTV (1 phút)

1. Mở Google Apps Script Editor
2. Chọn hàm `checkAllCTVEmails`
3. Click **Run** (▶️)
4. Xem log

**Tìm dòng:**
```
❌ [Tên CTV] ([Mã]) - KHÔNG CÓ EMAIL
```

**Nếu có dòng này** → Đây là vấn đề! Làm Bước 2.

---

### Bước 2: Thêm Email Cho CTV (1 phút)

1. Mở sheet CTV: https://docs.google.com/spreadsheets/d/1axooVOgwVsgwAqCE59afdz6RQOWNV1j4WUGQrBvUHiI
2. Tìm sheet **"DS CTV"**
3. Tìm CTV không có email (dựa vào Mã Ref)
4. Nhập email vào **Cột D** (Email)
5. Lưu (Ctrl+S)

**Ví dụ:**

| Họ Tên | SĐT | Email | ... | Mã Ref |
|--------|-----|-------|-----|--------|
| Trần Thị B | 0987654321 | **tranthib@gmail.com** ← Thêm | ... | CTV506835 |

---

### Bước 3: Test Email CTV (1 phút)

1. Quay lại Apps Script
2. Mở file `order-handler.js`
3. Tìm hàm `testOrderWithReferral`
4. Sửa dòng:
   ```javascript
   const testReferralCode = "CTV843817"; // ← Thay bằng mã CTV có email
   ```
5. Lưu (Ctrl+S)
6. Chọn `testOrderWithReferral` từ dropdown
7. Click **Run** (▶️)

**Tìm dòng log:**
```
✅ Đã gửi email thành công đến CTV [Tên] ([Email])
```

**Nếu thấy dòng này** → Thành công! ✅

**Kiểm tra email CTV:**
- Mở email của CTV
- Tìm: **"🎉 Bạn có đơn hàng mới từ link referral #TEST-CTV-..."**
- Kiểm tra cả **Spam**

---

## ✅ Hoàn Tất!

Nếu test thành công:
- Email CTV đã hoạt động ✅
- Khi có đơn hàng thật từ referral, CTV sẽ nhận email

---

## ❌ Nếu Vẫn Lỗi

### Lỗi: "Không tìm thấy CTV"

**Nguyên nhân:** Mã referral sai hoặc không có trong sheet

**Giải pháp:**
1. Chạy `checkAllCTVEmails()` để xem danh sách mã
2. Copy mã chính xác từ log
3. Paste vào `testOrderWithReferral`

### Lỗi: "CTV không có email"

**Nguyên nhân:** Chưa thêm email hoặc email trống

**Giải pháp:**
1. Mở sheet CTV
2. Kiểm tra **Cột D** có email không
3. Nếu trống, thêm email
4. Lưu và test lại

### Lỗi: "Email quota hết"

**Nguyên nhân:** Đã gửi quá 100 email hôm nay

**Giải pháp:**
- Đợi đến ngày mai (quota reset lúc 0h)
- Hoặc nâng cấp Google Workspace

---

## 📋 Checklist Nhanh

- [ ] Chạy `checkAllCTVEmails()` - Xem CTV nào thiếu email
- [ ] Thêm email cho CTV trong sheet CTV (Cột D)
- [ ] Sửa mã referral trong `testOrderWithReferral()`
- [ ] Chạy `testOrderWithReferral()` - Xem log thành công
- [ ] Kiểm tra email CTV nhận được (cả Spam)

---

## 💡 Lưu Ý

- **Email CTV bắt buộc phải có trong sheet** - Không có email = không gửi được
- **Mã referral phải khớp chính xác** - Kiểm tra kỹ mã trong sheet
- **Kiểm tra Spam** - Email CTV có thể bị Gmail đánh dấu spam lần đầu

---

**Tổng thời gian: 3 phút để fix hoàn toàn! 🚀**

**Chi tiết đầy đủ:** Xem file `FIX_EMAIL_CTV.md`
