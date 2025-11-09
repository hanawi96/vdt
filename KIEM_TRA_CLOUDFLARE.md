# 🔍 KIỂM TRA CẤU HÌNH CLOUDFLARE

## Vấn đề: Local chạy được, push lên không chạy

**Nguyên nhân có thể**:
1. Có Worker riêng đang chạy và chặn requests
2. Cloudflare Pages chưa được cấu hình đúng
3. Custom domain trỏ sai

---

## BƯỚC 1: Kiểm tra có Worker riêng không

1. Vào https://dash.cloudflare.com
2. Click **Workers & Pages**
3. Xem có 2 loại:
   - **Workers**: Là worker độc lập (CẦN XÓA!)
   - **Pages**: Là Pages project (GIỮ LẠI!)

### ❌ NẾU THẤY WORKER (không phải Pages):
```
Tên: shopvd-worker, hidden-bonus-76d2, hoặc tương tự
Type: Worker
```
→ **XÓA NGAY!** Click vào → Settings → Delete

### ✅ CHỈ GIỮ LẠI PAGES:
```
Tên: shopvd, vdt, hoặc tương tự  
Type: Pages
Source: GitHub (hanawi96/vdt)
```

---

## BƯỚC 2: Kiểm tra Custom Domain của Pages

1. Vào **Workers & Pages**
2. Click vào **Pages project** (không phải Worker!)
3. Vào tab **Custom domains**

### Kiểm tra:
- [ ] Domain `shopvd.store` có trong danh sách không?
- [ ] Status là "Active" (màu xanh)?

### Nếu KHÔNG có hoặc status không Active:
1. Click **Set up a custom domain**
2. Nhập: `shopvd.store`
3. Click **Continue**
4. Làm theo hướng dẫn để cập nhật DNS

---

## BƯỚC 3: Kiểm tra DNS Records

1. Vào **Websites** → Click domain `shopvd.store`
2. Vào **DNS** → **Records**

### Kiểm tra phải có 1 trong 2:

**Cách 1: CNAME record (Khuyến nghị)**
```
Type: CNAME
Name: @ (hoặc shopvd.store)
Content: <your-pages-project>.pages.dev
Proxy: Proxied (màu cam)
```

**Cách 2: A record**
```
Type: A
Name: @ (hoặc shopvd.store)
Content: (IP của Cloudflare Pages)
Proxy: Proxied (màu cam)
```

### ❌ NẾU THẤY:
```
Type: AAAA hoặc A
Content: Worker route
```
→ **XÓA** record này và thêm CNAME trỏ đến Pages

---

## BƯỚC 4: Kiểm tra Routes (Quan trọng!)

1. Vào **Websites** → `shopvd.store`
2. Vào **Workers Routes**

### ❌ NẾU THẤY:
```
Route: shopvd.store/*
Worker: shopvd-worker
```
→ **XÓA** route này! Click vào → Delete

### ✅ ĐÚNG:
```
(Không có routes nào, hoặc chỉ có /api/*)
```

---

## BƯỚC 5: Kiểm tra Build Log

1. Vào **Workers & Pages** → Click vào **Pages project**
2. Vào tab **Deployments**
3. Click vào deployment mới nhất
4. Xem **Build log**

### Kiểm tra:
- [ ] Build thành công (màu xanh)?
- [ ] Có dòng "Deploying to Cloudflare Pages"?
- [ ] Có file `functions/api/order.js` được deploy?

### Nếu có lỗi:
- Chụp screenshot build log
- Xem phần "Errors" hoặc "Warnings"

---

## BƯỚC 6: Test trực tiếp Pages URL

1. Vào **Workers & Pages** → **Pages project**
2. Tìm URL dạng: `https://<project-name>.pages.dev`
3. Mở URL này trong Incognito

### Kiểm tra:
- [ ] Website hiển thị đúng?
- [ ] CSS load được?
- [ ] Không có lỗi MIME type?

### Kết quả:
- **Nếu Pages URL chạy được** → Vấn đề ở DNS/Custom domain
- **Nếu Pages URL cũng lỗi** → Vấn đề ở code hoặc build

---

## BƯỚC 7: So sánh 2 URLs

### Test cả 2 URLs:
1. `https://shopvd.store` (custom domain)
2. `https://<project-name>.pages.dev` (pages URL)

### Kịch bản:

#### Kịch bản 1: Pages URL OK, Custom domain LỖI
→ **Vấn đề**: DNS hoặc có Worker đang chặn
→ **Giải pháp**: 
   - Xóa Worker routes (Bước 4)
   - Kiểm tra DNS trỏ đúng Pages (Bước 3)

#### Kịch bản 2: Cả 2 đều LỖI
→ **Vấn đề**: Code hoặc build
→ **Giải pháp**:
   - Kiểm tra file `_routes.json` đã có chưa
   - Kiểm tra file `functions/api/order.js` đã đúng chưa
   - Redeploy

#### Kịch bản 3: Cả 2 đều OK
→ **Vấn đề**: Cache
→ **Giải pháp**:
   - Purge cache Cloudflare
   - Xóa cache trình duyệt
   - Thử Incognito

---

## TÓM TẮT CHECKLIST

- [ ] Đã xóa Worker riêng (nếu có)
- [ ] Đã xóa Worker routes (nếu có)
- [ ] DNS trỏ đúng Pages project
- [ ] Custom domain status "Active"
- [ ] Build thành công
- [ ] Pages URL chạy được
- [ ] Đã purge cache
- [ ] Đã test Incognito

---

## SAU KHI KIỂM TRA XONG

Ghi lại kết quả:
1. Có Worker riêng không? (Có/Không)
2. DNS trỏ đến đâu? (Pages/Worker/Khác)
3. Pages URL chạy được không? (Có/Không)
4. Custom domain chạy được không? (Có/Không)
5. Build log có lỗi không? (Có/Không)

Với thông tin này, tôi sẽ biết chính xác vấn đề ở đâu!
