# 🔍 HƯỚNG DẪN DEBUG VẤN ĐỀ EMAIL

## ❌ Vấn Đề: Không Nhận Được Email Khi Đặt Hàng

### 📋 Các Bước Kiểm Tra

#### 1. Kiểm Tra Log Trong Google Apps Script

1. Mở Google Apps Script Editor
2. Vào **View** → **Executions** (hoặc **Thực thi**)
3. Tìm execution gần nhất khi bạn đặt hàng
4. Click vào để xem log chi tiết

**Tìm các dòng log sau:**
```
📧 Bắt đầu gửi email đến yendev96@gmail.com...
📧 Email quota còn lại: [số]
✅ Đã gửi email thành công đến admin yendev96@gmail.com
```

**Nếu thấy lỗi:**
```
❌ LỖI GỬI EMAIL: [thông báo lỗi]
```

#### 2. Kiểm Tra Quyền Gmail

Google Apps Script cần quyền để gửi email thay bạn.

**Cách cấp quyền:**

1. Trong Apps Script Editor, click **Run** (▶️) ở hàm `testScript`
2. Sẽ có popup yêu cầu quyền
3. Click **Review permissions**
4. Chọn tài khoản Google của bạn
5. Click **Advanced** → **Go to [Project name] (unsafe)**
6. Click **Allow**

#### 3. Kiểm Tra Email Quota

Google Apps Script có giới hạn gửi email:
- **Tài khoản Gmail thường**: 100 email/ngày
- **Google Workspace**: 1500 email/ngày

**Kiểm tra quota:**

Chạy hàm test này trong Apps Script:

```javascript
function checkEmailQuota() {
  const remaining = MailApp.getRemainingDailyQuota();
  Logger.log(`📧 Email quota còn lại hôm nay: ${remaining}`);
  
  if (remaining <= 0) {
    Logger.log(`❌ Đã hết quota! Phải đợi đến ngày mai.`);
  } else {
    Logger.log(`✅ Còn ${remaining} email có thể gửi hôm nay.`);
  }
}
```

#### 4. Kiểm Tra Spam/Junk Folder

Email có thể bị Gmail đánh dấu là spam:

1. Mở Gmail: https://mail.google.com
2. Vào thư mục **Spam** (bên trái)
3. Tìm email từ `noreply@google.com` hoặc từ chính email của bạn
4. Nếu tìm thấy, click **Not spam**

#### 5. Test Gửi Email Trực Tiếp

Chạy hàm test này để kiểm tra gửi email:

```javascript
function testSendEmail() {
  try {
    const testEmail = "yendev96@gmail.com";
    
    Logger.log(`📧 Bắt đầu test gửi email đến ${testEmail}...`);
    
    // Kiểm tra quota
    const quota = MailApp.getRemainingDailyQuota();
    Logger.log(`📧 Quota còn lại: ${quota}`);
    
    if (quota <= 0) {
      Logger.log(`❌ Hết quota!`);
      return;
    }
    
    // Gửi email test
    MailApp.sendEmail({
      to: testEmail,
      subject: "🧪 Test Email - Vòng Dâu Tằm An Nhiên",
      htmlBody: `
        <h2>✅ Email Test Thành Công!</h2>
        <p>Nếu bạn nhận được email này, nghĩa là hệ thống gửi email đang hoạt động bình thường.</p>
        <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      `
    });
    
    Logger.log(`✅ Đã gửi email test thành công!`);
    Logger.log(`📧 Vui lòng kiểm tra hộp thư ${testEmail}`);
    
  } catch (error) {
    Logger.log(`❌ LỖI: ${error.message}`);
    Logger.log(`❌ Stack: ${error.stack}`);
  }
}
```

**Cách chạy:**
1. Copy code trên vào Apps Script Editor
2. Lưu lại (Ctrl+S)
3. Chọn hàm `testSendEmail` từ dropdown
4. Click **Run** (▶️)
5. Xem log và kiểm tra email

#### 6. Kiểm Tra Cấu Hình Email

Đảm bảo email admin đúng trong code:

```javascript
const adminEmail = "yendev96@gmail.com"; // ✅ Đúng
```

#### 7. Kiểm Tra Trigger (Nếu Có)

Nếu bạn đã setup trigger tự động:

1. Trong Apps Script Editor, vào **Triggers** (⏰)
2. Kiểm tra có trigger nào bị lỗi không
3. Nếu có lỗi, xóa và tạo lại trigger

---

## 🔧 Các Giải Pháp Phổ Biến

### Giải Pháp 1: Cấp Lại Quyền

1. Vào Apps Script Editor
2. Chạy hàm `testSendEmail` (code ở trên)
3. Cấp quyền khi được yêu cầu

### Giải Pháp 2: Kiểm Tra Deployment

1. Vào **Deploy** → **Manage deployments**
2. Đảm bảo có deployment **Web app** đang active
3. **Execute as**: Me (email của bạn)
4. **Who has access**: Anyone

### Giải Pháp 3: Redeploy Script

Nếu vẫn không hoạt động:

1. Vào **Deploy** → **Manage deployments**
2. Click ⚙️ → **Archive** deployment cũ
3. Click **New deployment**
4. Chọn **Web app**
5. **Execute as**: Me
6. **Who has access**: Anyone
7. Click **Deploy**
8. Copy URL mới và cập nhật vào Cloudflare Worker

### Giải Pháp 4: Sử Dụng Email Khác

Nếu `yendev96@gmail.com` không nhận được, thử email khác:

```javascript
const adminEmail = "email-khac@gmail.com"; // Thử email khác
```

---

## 📊 Checklist Debug

- [ ] Đã kiểm tra log trong Executions
- [ ] Đã cấp quyền Gmail cho Apps Script
- [ ] Đã kiểm tra email quota (còn > 0)
- [ ] Đã kiểm tra thư mục Spam
- [ ] Đã chạy `testSendEmail()` thành công
- [ ] Đã kiểm tra deployment đang active
- [ ] Đã thử gửi email đến email khác

---

## 🆘 Nếu Vẫn Không Hoạt Động

### Kiểm Tra Lỗi Cụ Thể

Sau khi đặt hàng, vào **Executions** và tìm các thông báo lỗi:

**Lỗi phổ biến:**

1. **"Service invoked too many times"**
   - Nguyên nhân: Vượt quá quota
   - Giải pháp: Đợi 24h hoặc nâng cấp Google Workspace

2. **"Authorization required"**
   - Nguyên nhân: Chưa cấp quyền
   - Giải pháp: Chạy lại và cấp quyền

3. **"Invalid email address"**
   - Nguyên nhân: Email sai format
   - Giải pháp: Kiểm tra lại email trong code

4. **"Quota exceeded"**
   - Nguyên nhân: Đã gửi quá 100 email hôm nay
   - Giải pháp: Đợi đến ngày mai

### Liên Hệ Hỗ Trợ

Nếu đã thử tất cả các bước trên mà vẫn không được:

1. Chụp màn hình log lỗi trong **Executions**
2. Chụp màn hình kết quả chạy `testSendEmail()`
3. Gửi thông tin đến: yendev96@gmail.com

---

## ✅ Sau Khi Sửa Xong

1. **Deploy lại script** (nếu có thay đổi code)
2. **Test đặt hàng** từ website
3. **Kiểm tra log** trong Executions
4. **Kiểm tra email** trong hộp thư

**Thời gian nhận email:** Thường trong vòng 1-2 phút sau khi đặt hàng.

---

## 📝 Ghi Chú

- Email được gửi từ địa chỉ: `noreply@google.com` hoặc email của bạn
- Subject: `🔔 Đơn hàng mới #[Mã đơn] - [Tên khách hàng]`
- Nếu có mã referral, CTV cũng sẽ nhận email

**Cập nhật:** Code đã được cải tiến với log chi tiết hơn để dễ debug!
