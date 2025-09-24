# ⚡ Quick Start - 5 Phút Có Landing Page

## 🎯 Bạn cần gì?

1. **1 ảnh sản phẩm** (< 300KB)
2. **Google account** (để lưu đơn hàng)
3. **Hosting** (Netlify miễn phí)

## 🚀 Bước 1: Chuẩn bị ảnh (1 phút)

1. Chụp/tìm ảnh túi dâu tằm đẹp
2. Resize về 800x600px
3. Nén tại [TinyPNG](https://tinypng.com) 
4. Đặt tên: `tui-dau-tam-hero.jpg`
5. Copy vào thư mục `assets/images/`

## 📊 Bước 2: Thiết lập Google Sheets (2 phút)

1. Vào [Google Sheets](https://sheets.google.com)
2. Tạo sheet mới, đặt tên "Đơn hàng túi dâu tằm"
3. Vào [Google Apps Script](https://script.google.com)
4. Tạo project mới
5. Copy code từ `google-apps-script/order-handler.js`
6. Thay `SPREADSHEET_ID` và `ADMIN_EMAIL`
7. Deploy as Web App
8. Copy URL được tạo

## 🔧 Bước 3: Cập nhật Landing Page (1 phút)

1. Mở file `index.html`
2. Tìm dòng:
```javascript
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```
3. Thay `YOUR_SCRIPT_ID` bằng URL từ bước 2

## 🌐 Bước 4: Deploy (1 phút)

### Cách 1: Netlify (Khuyến nghị)
1. Vào [netlify.com](https://netlify.com)
2. Kéo thả file `index.html` + thư mục `assets`
3. Đợi 30 giây → Có URL live!

### Cách 2: Hosting khác
- Upload file `index.html` + thư mục `assets`
- Không cần build, config gì cả

## ✅ Bước 5: Test (30 giây)

1. Mở URL vừa deploy
2. Điền form đặt hàng
3. Submit
4. Kiểm tra Google Sheets có dữ liệu
5. Check email có thông báo

## 🎉 Xong!

**Bạn đã có landing page hoàn chỉnh trong 5 phút!**

### Kết quả:
- ⚡ Loading < 1 giây
- 📱 Perfect mobile
- 🤖 Tự động lưu đơn hàng
- 📧 Email thông báo
- 💰 Ready cho ads

## 🔧 Tùy chỉnh nhanh

### Thay đổi giá:
```html
<!-- Tìm trong index.html -->
<div class="price">Chỉ 299.000đ - Miễn phí vận chuyển</div>
```

### Thay đổi hotline:
```html
<!-- Thêm vào hero section -->
<p>📞 Hotline: 0123.456.789</p>
```

### Thay đổi màu chủ đạo:
```css
/* Tìm trong <style> tag */
background: linear-gradient(135deg, #FFC1CC, #E8B4B8);
/* Thay #FFC1CC và #E8B4B8 bằng màu bạn muốn */
```

## 📈 Chạy Ads

### Facebook Ads:
- Objective: Conversions
- Pixel: Track "Purchase" event
- Audience: Mẹ bỉm sữa 25-40 tuổi

### Google Ads:
- Campaign: Search + Display
- Keywords: "túi dâu tằm", "phòng giữ vía"
- Landing page experience: High quality score

### TikTok Ads:
- Video + landing page
- Target: Young mothers
- Creative: Baby sleeping peacefully

## 🎯 Tips tối ưu conversion

1. **Headline test**: A/B test different titles
2. **Price test**: Test 299k vs 399k vs 249k
3. **CTA test**: "Đặt hàng ngay" vs "Mua ngay" vs "Đăng ký"
4. **Image test**: Different product angles
5. **Form test**: 3 fields vs 4 fields vs 5 fields

## 📊 Tracking

### UTM Parameters:
```
?utm_source=facebook&utm_medium=cpc&utm_campaign=tui-dau-tam
```

### Conversion tracking:
- Google Analytics: Goal setup
- Facebook Pixel: Purchase event
- Google Ads: Conversion action

---

**Chúc bạn bán hàng thành công! 🚀💰**
