# Script kiểm tra Worker và D1

Write-Host "=== KIỂM TRA HỆ THỐNG ===" -ForegroundColor Cyan
Write-Host ""

# 1. Kiểm tra Worker có deploy chưa
Write-Host "1️⃣ Kiểm tra Worker deployment:" -ForegroundColor Yellow
npx wrangler deployments list --name ctv-api 2>&1 | Select-Object -First 10

Write-Host ""
Write-Host "2️⃣ Kiểm tra D1 database:" -ForegroundColor Yellow
npx wrangler d1 list

Write-Host ""
Write-Host "3️⃣ Kiểm tra bảng trong D1:" -ForegroundColor Yellow
npx wrangler d1 execute vdt --command ".tables"

Write-Host ""
Write-Host "4️⃣ Kiểm tra schema bảng orders:" -ForegroundColor Yellow
npx wrangler d1 execute vdt --command ".schema orders"

Write-Host ""
Write-Host "5️⃣ Đếm số đơn hàng trong D1:" -ForegroundColor Yellow
npx wrangler d1 execute vdt --command "SELECT COUNT(*) as total FROM orders"

Write-Host ""
Write-Host "6️⃣ Xem 3 đơn hàng mới nhất:" -ForegroundColor Yellow
npx wrangler d1 execute vdt --command "SELECT order_id, customer_name, total_amount, referral_code, commission, created_at FROM orders ORDER BY created_at DESC LIMIT 3"

Write-Host ""
Write-Host "7️⃣ Kiểm tra CTV trong D1:" -ForegroundColor Yellow
npx wrangler d1 execute vdt --command "SELECT referral_code, full_name, phone, commission_rate FROM ctv LIMIT 5"

Write-Host ""
Write-Host "8️⃣ Test Worker endpoint:" -ForegroundColor Yellow
Write-Host "Đang gọi Worker API..." -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "https://ctv-api.yendev96.workers.dev" -Method GET -ErrorAction Stop
    Write-Host "✅ Worker đang hoạt động! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Worker không phản hồi: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "⚠️ Có thể Worker chưa được deploy hoặc URL sai" -ForegroundColor Yellow
}


Write-Host ""
Write-Host "=== HƯỚNG DẪN TIẾP THEO ===" -ForegroundColor Cyan
Write-Host "1. Mở file test-order-api.html trong browser" -ForegroundColor White
Write-Host "2. Nhấn các nút test để kiểm tra từng bước" -ForegroundColor White
Write-Host "3. Xem logs trong browser console (F12)" -ForegroundColor White
Write-Host ""
Write-Host "📝 Nếu Worker chưa deploy, chạy:" -ForegroundColor Yellow
Write-Host "   cd worker" -ForegroundColor Gray
Write-Host "   npx wrangler deploy" -ForegroundColor Gray
