# Fix: Referral không được tính ở đơn thứ 2

## Vấn đề đã fix

### Nguyên nhân
- `referralCode` chỉ tồn tại trong memory (không persist)
- Sau khi đặt đơn 1, nếu component re-init hoặc user làm gì đó → `referralCode` bị mất
- `referralData` vẫn còn trong localStorage nhưng không được load lại vào memory

### Giải pháp đã implement
**Load lại referral từ localStorage trước mỗi lần submit order**

## Các thay đổi

### 1. Thêm logging vào `handleOrderSuccess()`
```javascript
handleOrderSuccess() {
  console.log('🎉 [ORDER] Order success!');
  console.log('🔍 [ORDER] Current referralCode:', this.referralCode);
  console.log('🔍 [ORDER] localStorage referralData:', localStorage.getItem('referralData'));
  
  // ... existing code
  
  console.log('✅ [ORDER] Success modal opened, referralCode preserved:', this.referralCode);
}
```

### 2. Thêm reload referral vào `quickBuySubmit()`
```javascript
async quickBuySubmit() {
  // Đảm bảo referral code được load từ localStorage trước khi submit
  if (!this.referralCode || this.referralCode.trim() === '') {
    console.log('🔄 [REFERRAL] Reloading from localStorage before Quick Buy submit...');
    this.loadStoredReferral();
    console.log('🔄 [REFERRAL] After reload:', this.referralCode);
  } else {
    console.log('✅ [REFERRAL] Already loaded:', this.referralCode);
  }
  
  // ... rest of code
}
```

### 3. Thêm reload referral vào `confirmAndSubmitOrder()`
```javascript
async confirmAndSubmitOrder() {
  // Đảm bảo referral code được load từ localStorage trước khi submit
  if (!this.referralCode || this.referralCode.trim() === '') {
    console.log('🔄 [REFERRAL] Reloading from localStorage before Checkout submit...');
    this.loadStoredReferral();
    console.log('🔄 [REFERRAL] After reload:', this.referralCode);
  } else {
    console.log('✅ [REFERRAL] Already loaded:', this.referralCode);
  }
  
  // ... rest of code
}
```

### 4. Thêm logging vào Quick Buy order details
```javascript
console.log('📦 [QUICK BUY] Order details:', {
  orderId: orderDetails.orderId,
  referralCode: orderDetails.referralCode,
  referralPartner: orderDetails.referralPartner,
  referralCommission: orderDetails.referralCommission,
  currentReferralCode: this.referralCode,
  isValid: this.validateReferralCode(this.referralCode)
});
```

## Cách test

### Test Case 1: Đặt 2 đơn liên tiếp

1. **Đơn 1:**
   - Truy cập: `https://your-domain.com/?ref=yenadd`
   - Thêm sản phẩm, Quick Buy
   - Xem Console:
     ```
     ✅ [REFERRAL] Already loaded: YENADD
     📦 [QUICK BUY] Order details: {
       referralCode: "YENADD",
       referralCommission: 1200
     }
     🎉 [ORDER] Order success!
     🔍 [ORDER] Current referralCode: YENADD
     ✅ [ORDER] Success modal opened, referralCode preserved: YENADD
     ```

2. **Đơn 2:**
   - Đóng Success Modal
   - Thêm sản phẩm khác, Quick Buy
   - Xem Console:
     ```
     ✅ [REFERRAL] Already loaded: YENADD
     📦 [QUICK BUY] Order details: {
       referralCode: "YENADD",
       referralCommission: 1500
     }
     ```

3. **Kiểm tra database:**
   ```sql
   SELECT order_id, referral_code, commission, commission_rate, ctv_phone
   FROM orders
   ORDER BY created_at_unix DESC
   LIMIT 2;
   ```
   
   Cả 2 đơn đều phải có:
   - ✅ `referral_code = "CTV100004"`
   - ✅ `commission > 0`
   - ✅ `commission_rate = 0.01`
   - ✅ `ctv_phone = "0xxxxxxxxx"`

### Test Case 2: Đặt đơn sau khi reload trang

1. Truy cập: `https://your-domain.com/?ref=yenadd`
2. Đặt đơn 1 → Thành công
3. **Reload trang (F5)**
4. Đặt đơn 2
5. Xem Console:
   ```
   🔄 [REFERRAL] Reloading from localStorage before Quick Buy submit...
   🔄 [REFERRAL] After reload: YENADD
   📦 [QUICK BUY] Order details: {
     referralCode: "YENADD",
     referralCommission: 1500
   }
   ```

### Test Case 3: Đặt đơn sau khi đóng/mở tab

1. Truy cập: `https://your-domain.com/?ref=yenadd`
2. Đặt đơn 1 → Thành công
3. **Mở tab mới** với cùng domain
4. Đặt đơn 2
5. Kiểm tra Console và database

## Kết quả mong đợi

### Console logs khi thành công:
```
🔍 [REFERRAL] Starting handleReferralFromURL...
✅ [REFERRAL] Valid code from URL: YENADD
✅ [REFERRAL] Saved to localStorage
✅ [REFERRAL] Code valid: YENADD

--- Đơn 1 ---
✅ [REFERRAL] Already loaded: YENADD
📦 [QUICK BUY] Order details: { referralCode: "YENADD", ... }
🎉 [ORDER] Order success!
✅ [ORDER] Success modal opened, referralCode preserved: YENADD

--- Đơn 2 (nếu referralCode bị mất) ---
🔄 [REFERRAL] Reloading from localStorage before Quick Buy submit...
🔄 [REFERRAL] After reload: YENADD
📦 [QUICK BUY] Order details: { referralCode: "YENADD", ... }

--- Đơn 2 (nếu referralCode vẫn còn) ---
✅ [REFERRAL] Already loaded: YENADD
📦 [QUICK BUY] Order details: { referralCode: "YENADD", ... }
```

### Database:
```
order_id        | referral_code | commission | commission_rate | ctv_phone
----------------|---------------|------------|-----------------|------------
VDT-20250116-02 | CTV100004     | 1500       | 0.01           | 0972483892
VDT-20250116-01 | CTV100004     | 1200       | 0.01           | 0972483892
```

## Lưu ý

1. **Expiry vẫn hoạt động:** Referral code vẫn hết hạn sau 7 ngày
2. **Không ảnh hưởng đến logic cũ:** Chỉ thêm reload nếu cần
3. **Performance:** Chỉ load từ localStorage khi `referralCode` rỗng
4. **Logging đầy đủ:** Dễ debug nếu có vấn đề

## Hoàn thành ✅

- [x] Thêm reload referral vào Quick Buy
- [x] Thêm reload referral vào Checkout
- [x] Thêm logging chi tiết
- [x] Tài liệu test

**Trạng thái:** Sẵn sàng để test!
