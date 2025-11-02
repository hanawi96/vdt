# Cập nhật Modal Quick Buy - Thay thế Chi tiết đơn hàng bằng Tổng kết đơn hàng

## Tóm tắt thay đổi

Đã thay thế phần "Chi tiết đơn hàng" trong modal Quick Buy bằng box "Tổng kết đơn hàng" từ modal giỏ hàng để có giao diện nhất quán và chuyên nghiệp hơn.

## Chi tiết thay đổi

### 1. Phần đã xóa bỏ (Chi tiết đơn hàng cũ):
- Header với icon clipboard và tiêu đề "Chi tiết đơn hàng"
- Danh sách chi tiết từng sản phẩm với hình ảnh, tên, số lượng, cân nặng
- Hiển thị sản phẩm bán kèm với các ưu đãi riêng lẻ
- Tính toán phức tạp với nhiều điều kiện khác nhau
- Tổng cộng đơn giản ở cuối

### 2. Phần đã thêm mới (Tổng kết đơn hàng):
- Header với icon calculator và tiêu đề "Tổng kết đơn hàng"
- Box tổng kết gọn gàng với background trắng
- Các dòng tính toán rõ ràng:
  - **Tạm tính**: Sử dụng `quickBuySubtotal`
  - **Phí vận chuyển**: Sử dụng `SHIPPING_FEE`
  - **Ưu đãi Freeship**: Hiển thị khi có addon túi dâu tằm hoặc bó dâu tằm
  - **Giảm giá (Móc chìa khóa)**: Hiển thị khi có addon móc chìa khóa
  - **Tổng cộng**: Với background gradient và icon tiền

### 3. Logic tính toán được đơn giản hóa:

#### Ưu đãi Freeship:
```html
<template x-if="quickBuySelectedAddons.some(addon => addon.id === 'addon_tui_dau_tam' || addon.id === 'addon_bo_dau_tam_7_canh' || addon.id === 'addon_bo_dau_tam_9_canh')">
    <div class="flex justify-between items-center py-1">
        <span class="text-green-600 font-medium">- Ưu đãi Freeship:</span>
        <span class="font-semibold text-green-600" x-text="'-' + formatCurrency(SHIPPING_FEE)"></span>
    </div>
</template>
```

#### Giảm giá Móc chìa khóa:
```html
<template x-if="quickBuySelectedAddons.some(addon => addon.id === 'addon_moc_chia_khoa')">
    <div class="flex justify-between items-center py-1">
        <span class="text-green-600 font-medium">- Giảm giá (Móc chìa khóa):</span>
        <span class="font-semibold text-green-600">-5.000đ</span>
    </div>
</template>
```

## Lợi ích của thay đổi

### 1. **Giao diện nhất quán**:
- Cùng style với modal checkout
- Cùng cách hiển thị tổng kết
- Cùng màu sắc và typography

### 2. **Đơn giản hóa**:
- Bớt phức tạp trong hiển thị chi tiết
- Tập trung vào tổng kết quan trọng
- Dễ hiểu hơn cho người dùng

### 3. **Dễ bảo trì**:
- Ít code trùng lặp
- Logic tính toán đơn giản hơn
- Dễ cập nhật khi có thay đổi

### 4. **Trải nghiệm người dùng tốt hơn**:
- Thông tin quan trọng được làm nổi bật
- Không bị phân tán bởi quá nhiều chi tiết
- Tổng cộng được hiển thị rõ ràng

## Các biến JavaScript được sử dụng

- `quickBuySubtotal`: Tổng tiền sản phẩm trước thuế và phí
- `SHIPPING_FEE`: Phí vận chuyển cố định
- `quickBuySelectedAddons`: Mảng các addon được chọn
- `quickBuyTotal`: Tổng cộng cuối cùng
- `formatCurrency()`: Hàm format tiền tệ

## Lưu ý kỹ thuật

- Đã xóa bỏ hoàn toàn phần code cũ để tránh conflict
- Sử dụng cùng class CSS với modal checkout
- Giữ nguyên cấu trúc responsive
- Tương thích với tất cả các tính năng hiện có

## Kiểm tra

- ✅ Không có lỗi syntax
- ✅ Giao diện nhất quán với modal checkout  
- ✅ Logic tính toán đúng
- ✅ Responsive trên mobile và desktop
- ✅ Tương thích với các addon hiện có