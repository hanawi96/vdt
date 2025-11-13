# ✅ Deployment Checklist

## 📋 Trước khi Deploy

- [x] Code đã được clean up (xóa test files)
- [x] Build production: `npm run build`
- [x] Worker đã deploy: `npx wrangler deploy`
- [x] Test local: Đặt hàng với referral code
- [x] Commit changes: `git commit -m "..."`

## 🚀 Deploy Steps

### 1. Push to Git
```bash
git push origin master
```

### 2. Cloudflare Pages sẽ auto-deploy
- Hoặc deploy thủ công: `npx wrangler pages deploy public`

### 3. Clear Cache
**Cloudflare Dashboard:**
- Pages project → Settings → Purge Cache

**Custom Domain (shopvd.store):**
- Dashboard → Domain → Caching → Purge Everything

### 4. Test Production
- Truy cập: `https://shopvd.store`
- Thêm `?ref=CTV009726` vào URL
- Đặt hàng test
- Kiểm tra Google Sheets và D1

## ✅ Verification

### Kiểm tra D1:
```bash
npx wrangler d1 execute vdt --command "SELECT order_id, referral_code, commission FROM orders ORDER BY created_at DESC LIMIT 3"
```

### Kiểm tra Worker Logs:
```bash
npx wrangler tail ctv-api --format pretty
```

### Kiểm tra Google Sheets:
- Mở sheet "DS ĐƠN HÀNG"
- Xem cột "Mã Referral" có giá trị
- Xem cột "Hoa Hồng" có giá trị (nếu CTV tồn tại)

## 🎯 Expected Results

### ✅ Cloudflare Pages Domain (*.pages.dev)
- Frontend load đúng
- Gọi Worker API: `https://ctv-api.yendev96.workers.dev`
- Lưu vào D1 thành công
- Google Sheets có referralCode

### ✅ Custom Domain (shopvd.store)
- Frontend load đúng (sau khi clear cache)
- Gọi Worker API: `https://ctv-api.yendev96.workers.dev`
- Lưu vào D1 thành công
- Google Sheets có referralCode

## 🔧 Cache Control

### File đã cấu hình cache:
- `public/_headers`: JS cache 1 giờ (thay vì 1 năm)
- `public/index.html`: JS files có `?v=2` để bypass cache

### Nếu cần force update:
Tăng version trong `public/index.html`:
```html
<script src="./assets/js/app.js?v=3"></script>
```

## 📝 Changes Summary

### Fixed:
1. ✅ ReferralCode bị trống trong Google Sheets
   - Worker bây giờ gửi `data.referralCode` thay vì `validReferralCode`

2. ✅ Không lưu vào D1 trên production
   - Xóa thư mục `functions/` (Pages Functions)
   - Frontend luôn gọi Worker URL

3. ✅ Cache issues trên custom domain
   - Giảm cache time cho JS files
   - Thêm version query string

### Cleaned:
- ❌ Xóa 14 files test/debug
- ❌ Xóa dữ liệu test trong `partners` object
- ✅ Cập nhật README.md

## 🆘 Troubleshooting

### Vấn đề: Custom domain vẫn load code cũ
**Giải pháp:**
1. Purge cache trên Cloudflare
2. Hard refresh browser: `Ctrl + Shift + R`
3. Tăng version: `?v=3`

### Vấn đề: ReferralCode vẫn trống
**Kiểm tra:**
1. Worker logs có `📤 Sending to Google Sheets` với referralCode không
2. Browser console có lỗi không
3. URL có `?ref=CTV...` không

### Vấn đề: Commission = 0
**Nguyên nhân:** CTV không tồn tại trong D1
**Giải pháp:** Thêm CTV vào D1 hoặc kiểm tra `referral_code` đúng chưa

## 📞 Support

Nếu có vấn đề, kiểm tra:
1. Worker logs: `npx wrangler tail ctv-api`
2. Browser console (F12)
3. Network tab (F12) → Xem request gọi đến đâu
