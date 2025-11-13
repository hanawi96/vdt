# PowerShell script để test D1 Database

Write-Host "=== Kiểm tra D1 Database ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Kiểm tra bảng orders:" -ForegroundColor Yellow
npx wrangler d1 execute vdt --command "SELECT COUNT(*) as total_orders FROM orders"

Write-Host ""
Write-Host "2. Xem 5 đơn hàng mới nhất:" -ForegroundColor Yellow
npx wrangler d1 execute vdt --command "SELECT order_id, customer_name, total_amount, referral_code, created_at FROM orders ORDER BY created_at DESC LIMIT 5"

Write-Host ""
Write-Host "3. Kiểm tra bảng ctv:" -ForegroundColor Yellow
npx wrangler d1 execute vdt --command "SELECT COUNT(*) as total_ctv FROM ctv"

Write-Host ""
Write-Host "4. Xem CTV có đơn hàng:" -ForegroundColor Yellow
npx wrangler d1 execute vdt --command "SELECT c.referral_code, c.full_name, COUNT(o.id) as order_count FROM ctv c LEFT JOIN orders o ON c.referral_code = o.referral_code GROUP BY c.referral_code, c.full_name"
