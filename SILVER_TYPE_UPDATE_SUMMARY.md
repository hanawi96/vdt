# Cập nhật trường silverType cho danh mục bi_charm_bac

## Tóm tắt thay đổi

Đã thêm trường `silverType` vào tất cả sản phẩm trong danh mục "bi_charm_bac" để phân biệt giữa bạc S999 và S925.

## Chi tiết thay đổi

### 1. Cập nhật dữ liệu sản phẩm (public/data/products.json)

#### Sản phẩm bạc S999 (bạc ta):
- `bi_charm_bac_001` - Bi bạc ta 3ly trơn (3mm)
- `bi_charm_bac_002` - Bi bạc ta 4ly khía (4mm) 
- `bi_charm_bac_003` - Bi bạc ta 5ly khía (5mm)
- `bi_charm_bac_004` - Charm rồng bạc ta
- `bi_charm_bac_005` - Charm rắn bạc ta
- `bi_charm_bac_006` - Thẻ 4 lá khắc tên bé (2 mặt)
- `bi_charm_bac_007` - Thẻ 4 lá khắc tên bé (2 mặt)
- `bi_charm_bac_013` - Thẻ tròn khắc tên bé (2 mặt)

**Trường được thêm:** `"silverType": "s999"`

#### Sản phẩm bạc S925:
- `bi_charm_bac_008` - Charm cỏ 4 lá bạc S925 (13.3x11.6x2mm)
- `bi_charm_bac_009` - Charm cỏ 4 lá 2 bạc S925 (Size 8*10,9mm)
- `bi_charm_bac_010` - Charm thánh giá xỏ ngang (Size 9.3x7.3x4mm)
- `bi_charm_bac_011` - Charm hoa sen xỏ ngang S925 (Size 2x10mm)
- `bi_charm_bac_0111` - Charm cúc họa mi S925 (Size 2x10mm)
- `bi_charm_bac_0112` - Charm hoa sen treo S925 (Size 2x10mm)
- `bi_charm_bac_0113` - Charm ngôi sao treo S925 (Size 2x10mm)

**Trường được thêm:** `"silverType": "s925"`

### 2. Cập nhật logic hiển thị (public/assets/js/app.js)

Cập nhật hàm `getSilverType()`:

```javascript
// Lấy loại bạc của sản phẩm
getSilverType(product) {
  if (!product || !product.hasSilver) return null;
  
  // Sử dụng trường silverType nếu có, mặc định là S999
  return product.silverType ? product.silverType.toUpperCase() : 'S999';
},
```

### 3. Hiển thị trên giao diện

Badge bạc sẽ hiển thị:
- **"BẠC S999"** cho các sản phẩm bạc ta
- **"BẠC S925"** cho các sản phẩm bạc S925

## Cách sử dụng

Bây giờ bạn có thể:

1. **Phân biệt sản phẩm theo loại bạc** trong code:
```javascript
if (product.silverType === 's999') {
  // Xử lý cho bạc S999
} else if (product.silverType === 's925') {
  // Xử lý cho bạc S925
}
```

2. **Lọc sản phẩm theo loại bạc**:
```javascript
const s999Products = products.filter(p => p.silverType === 's999');
const s925Products = products.filter(p => p.silverType === 's925');
```

3. **Hiển thị thông tin loại bạc** trên giao diện người dùng

## File test

Đã tạo file `test-silver-types.html` để kiểm tra việc hiển thị loại bạc.

## Lưu ý

- Tất cả sản phẩm trong danh mục `bi_charm_bac` đều có trường `hasSilver: true`
- Trường `silverType` được lưu dưới dạng chữ thường ("s999", "s925")
- Hàm `getSilverType()` sẽ tự động chuyển thành chữ hoa khi hiển thị
- Nếu sản phẩm không có trường `silverType`, mặc định sẽ hiển thị "S999"