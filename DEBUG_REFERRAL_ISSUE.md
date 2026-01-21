# Debug: Referral không được tính ở đơn thứ 2

## Vấn đề
- Đơn 1: Có referral code → Hoa hồng được tính ✅
- Đơn 2: Không có referral code → Hoa hồng = 0 ❌

## Các nguyên nhân có thể

### 1. referralCode bị mất trong memory
- `referralCode` KHÔNG dùng `Alpine.$persist()`
- Chỉ tồn tại trong memory, không lưu vào localStorage
- Khi component re-init → mất

### 2. localStorage vẫn còn nhưng không load lại
- `referralData` vẫn trong localStorage
- Nhưng `referralCode` trong memory = ''
- Cần load lại từ localStorage

## Cách test

### Test 1: Kiểm tra localStorage
Sau khi đặt đơn 1, mở Console và chạy:

```javascript
// Xem referralData trong localStorage
console.log(JSON.parse(localStorage.getItem('referralData')));

// Xem referralCode trong memory
console.log(Alpine.store('shop').referralCode);
```

**Kết quả mong đợi:**
- localStorage có `referralData` với code hợp lệ
- `referralCode` trong memory cũng có giá trị

**Nếu khác:**
- localStorage có nhưng memory rỗng → Cần load lại từ localStorage

### Test 2: Xem log khi đặt đơn 2

Mở Console trước khi đặt đơn 2, bạn sẽ thấy:

```
📦 [QUICK BUY] Order details: {
  orderId: "VDT-xxx",
  referralCode: "",           // ← Nếu rỗng = vấn đề
  referralPartner: "",
  referralCommission: 0,
  currentReferralCode: "",    // ← Kiểm tra giá trị này
  isValid: false
}
```

**Nếu `currentReferralCode` rỗng:**
- referralCode đã bị mất trong memory
- Cần load lại từ localStorage

### Test 3: Kiểm tra sau khi đóng Success Modal

Sau khi đặt đơn 1 thành công:

```javascript
// Xem log
// 🎉 [ORDER] Order success!
// 🔍 [ORDER] Current referralCode: YENADD
// 🔍 [ORDER] localStorage referralData: {"code":"YENADD","expiry":...}
// ✅ [ORDER] Success modal opened, referralCode preserved: YENADD

// Đóng modal và kiểm tra lại
Alpine.store('shop').referralCode
// Nếu vẫn có giá trị → OK
// Nếu rỗng → Bị mất khi đóng modal
```

### Test 4: Kiểm tra khi reload trang

1. Đặt đơn 1 với referral
2. Reload trang (F5)
3. Kiểm tra:

```javascript
// Xem referralCode sau reload
console.log(Alpine.store('shop').referralCode);

// Xem localStorage
console.log(localStorage.getItem('referralData'));
```

**Nếu localStorage còn nhưng referralCode rỗng:**
- Hàm `loadStoredReferral()` không được gọi
- Hoặc bị gọi nhưng không set vào `this.referralCode`

## Giải pháp

### Giải pháp 1: Persist referralCode (Recommended)

Thêm `Alpine.$persist()` cho `referralCode`:

```javascript
// Trong Alpine.data('shop')
referralCode: Alpine.$persist('').as('referralCode'),
```

**Ưu điểm:**
- Tự động sync với localStorage
- Không cần load thủ công
- Đơn giản nhất

**Nhược điểm:**
- Không có expiry tự động (cần xử lý riêng)

### Giải pháp 2: Load lại từ localStorage mỗi lần submit

Thêm vào đầu hàm `quickBuySubmit()`:

```javascript
async quickBuySubmit() {
  // Load lại referral từ localStorage nếu memory rỗng
  if (!this.referralCode || this.referralCode.trim() === '') {
    console.log('🔄 [REFERRAL] Reloading from localStorage...');
    this.loadStoredReferral();
  }
  
  // ... rest of code
}
```

**Ưu điểm:**
- Đảm bảo luôn có referral khi submit
- Giữ nguyên logic expiry

**Nhược điểm:**
- Phải thêm vào mỗi hàm submit (quickBuy, checkout, combo)

### Giải pháp 3: Watch và sync

Thêm watcher để sync referralCode với localStorage:

```javascript
// Trong init()
this.$watch('referralCode', (newValue) => {
  if (newValue && newValue.trim()) {
    // Cập nhật localStorage khi referralCode thay đổi
    const referralData = JSON.parse(localStorage.getItem('referralData') || '{}');
    if (referralData.code !== newValue) {
      referralData.code = newValue;
      localStorage.setItem('referralData', JSON.stringify(referralData));
    }
  }
});
```

## Khuyến nghị

**Dùng Giải pháp 2** (Load lại trước khi submit) vì:
- ✅ Đơn giản, dễ implement
- ✅ Không ảnh hưởng đến logic hiện tại
- ✅ Đảm bảo referral luôn được load khi cần
- ✅ Giữ nguyên expiry logic

## Implement Giải pháp 2

Tôi sẽ thêm code vào các hàm submit order:
1. `quickBuySubmit()`
2. `submitOrder()` (checkout)
3. `buyCombo()` (nếu có)

Mỗi hàm sẽ có đoạn code này ở đầu:

```javascript
// Đảm bảo referral code được load từ localStorage
if (!this.referralCode || this.referralCode.trim() === '') {
  console.log('🔄 [REFERRAL] Reloading from localStorage before submit...');
  this.loadStoredReferral();
}
```

Bạn muốn tôi implement ngay không?
