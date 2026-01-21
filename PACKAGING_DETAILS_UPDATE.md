# ✅ ĐÃ HOÀN TẤT: Loại bỏ per_product config khỏi packaging_details

## 📋 Vấn đề
Hiện tại khi đặt đơn hàng, hệ thống đang lưu config này vào cột `packaging_details`:
```json
{
  "per_product": {
    "red_string": 1000,
    "labor_cost": 8000
  },
  ...
}
```

**Vấn đề:** `red_string` (chỉ đỏ) và `labor_cost` (công lao động) đã được tính vào **giá vốn (COGS)** rồi, không nên nằm trong **chi phí đóng gói** nữa.

## 🎯 Giải pháp

### **Trước khi sửa:**
```javascript
const packagingDetails = {
    per_product: {
        red_string: costConfig.red_string || 1000,      // ❌ Không còn cần
        labor_cost: costConfig.labor_cost || 8000       // ❌ Không còn cần
    },
    per_order: {
        bag_zip: costConfig.bag_zip || 200,
        bag_red: costConfig.bag_red || 850,
        box_shipping: costConfig.box_shipping || 950,
        thank_card: costConfig.thank_card || 1000,
        paper_print: costConfig.paper_print || 150
    },
    total_products: totalProducts,
    per_product_cost: (costConfig.red_string || 1000) + (costConfig.labor_cost || 8000), // ❌ Không còn cần
    per_order_cost: 3150,
    total_cost: 0
};

// Tính tổng chi phí đóng gói
packagingDetails.total_cost = (packagingDetails.per_product_cost * totalProducts) + packagingDetails.per_order_cost;
// ❌ SAI: Đang tính cả red_string và labor_cost vào packaging cost
```

### **Sau khi sửa:**
```javascript
const packagingDetails = {
    // ✅ Đã loại bỏ per_product
    per_order: {
        bag_zip: costConfig.bag_zip || 200,
        bag_red: costConfig.bag_red || 850,
        box_shipping: costConfig.box_shipping || 950,
        thank_card: costConfig.thank_card || 1000,
        paper_print: costConfig.paper_print || 150
    },
    total_products: totalProducts,
    // ✅ Đã loại bỏ per_product_cost
    per_order_cost: 3150,
    total_cost: 0
};

// Tính tổng chi phí đóng gói (chỉ tính per_order_cost)
packagingDetails.total_cost = packagingDetails.per_order_cost;
// ✅ ĐÚNG: Chỉ tính chi phí đóng gói thực tế (túi, hộp, thiệp...)
```

## 📊 So sánh chi phí

### **Ví dụ: Đơn hàng 3 sản phẩm**

#### **Trước khi sửa (SAI):**
```
Per product cost: 1.000đ (chỉ đỏ) + 8.000đ (công) = 9.000đ
Per order cost: 3.150đ (túi + hộp + thiệp...)

Packaging cost = (9.000đ × 3 sp) + 3.150đ = 30.150đ ❌ SAI
```

#### **Sau khi sửa (ĐÚNG):**
```
Per order cost: 3.150đ (túi + hộp + thiệp...)

Packaging cost = 3.150đ ✅ ĐÚNG
```

**Tiết kiệm:** 27.000đ không bị tính nhầm vào packaging cost!

## 🔧 File đã cập nhật

### **worker/shop-worker.js**

**Dòng 274-297:** Cập nhật cấu trúc `packagingDetails`
- ❌ Loại bỏ: `per_product` object
- ❌ Loại bỏ: `per_product_cost` field
- ✅ Giữ lại: `per_order` object (chi phí đóng gói thực tế)
- ✅ Cập nhật: Logic tính `total_cost`

**Thêm comment giải thích:**
```javascript
// NOTE: red_string và labor_cost đã được tính vào giá vốn (COGS), 
// không còn nằm trong chi phí đóng gói
```

## 📝 Cấu trúc packaging_details mới

```json
{
  "per_order": {
    "bag_zip": 200,        // Túi zip
    "bag_red": 850,        // Túi đỏ
    "box_shipping": 950,   // Hộp vận chuyển
    "thank_card": 1000,    // Thiệp cảm ơn
    "paper_print": 150     // Giấy in
  },
  "total_products": 3,
  "per_order_cost": 3150,
  "total_cost": 3150
}
```

## 💡 Lý do thay đổi

### **1. Phân loại chi phí đúng**
- **COGS (Cost of Goods Sold):** Giá vốn hàng bán
  - ✅ Nguyên liệu (hạt dâu tằm, charm, dây...)
  - ✅ Chỉ đỏ (red_string)
  - ✅ Công lao động (labor_cost)

- **Packaging Cost:** Chi phí đóng gói
  - ✅ Túi zip, túi đỏ
  - ✅ Hộp vận chuyển
  - ✅ Thiệp cảm ơn
  - ✅ Giấy in

### **2. Tính toán lợi nhuận chính xác**
```
Doanh thu = Giá bán
COGS = Giá vốn (bao gồm red_string + labor_cost)
Packaging Cost = Chi phí đóng gói (túi, hộp, thiệp...)
Shipping Cost = Chi phí vận chuyển
Tax = Thuế

Lợi nhuận = Doanh thu - COGS - Packaging Cost - Shipping Cost - Tax
```

### **3. Báo cáo tài chính chính xác**
- Giúp phân tích chi phí theo từng loại
- Dễ dàng tối ưu hóa chi phí
- Báo cáo lợi nhuận chính xác hơn

## ⚠️ Lưu ý

### **Dữ liệu cũ**
- Các đơn hàng đã tạo trước đây vẫn có `per_product` trong `packaging_details`
- Không ảnh hưởng đến dữ liệu cũ
- Chỉ áp dụng cho đơn hàng mới từ bây giờ

### **API /api/config**
- Vẫn trả về `red_string` và `labor_cost` trong response
- Frontend có thể cần các giá trị này để tính toán hoặc hiển thị
- Chỉ thay đổi cách lưu vào database

## ✅ Kết quả

✅ **Loại bỏ thành công** `per_product` config khỏi `packaging_details`
✅ **Chi phí đóng gói** giờ chỉ tính các chi phí thực tế (túi, hộp, thiệp...)
✅ **Giá vốn (COGS)** và **Chi phí đóng gói** được phân tách rõ ràng
✅ **Tính toán lợi nhuận** chính xác hơn
✅ **Báo cáo tài chính** minh bạch hơn

---

**Hoàn thành:** ✅ Đã cập nhật thành công logic tính chi phí đóng gói!
