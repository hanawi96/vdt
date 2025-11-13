# Script test API cho Cloudflare Worker (PowerShell)
# Sử dụng: .\test-api.ps1

$WORKER_URL = "https://ctv-api.yendev96.workers.dev"

Write-Host "🧪 Testing Cloudflare Worker API" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Tạo đơn hàng mới
Write-Host "📦 Test 1: Tạo đơn hàng mới" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
$orderData = Get-Content "test-order.json" -Raw
try {
    $response = Invoke-RestMethod -Uri "$WORKER_URL/api/order/create" `
        -Method POST `
        -ContentType "application/json" `
        -Body $orderData
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Lỗi: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Test 2: Lấy đơn hàng theo mã CTV
Write-Host "📋 Test 2: Lấy đơn hàng theo mã CTV" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$WORKER_URL/api?action=getOrders&referralCode=CTV123456"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Lỗi: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Test 3: Lấy đơn hàng theo SĐT CTV
Write-Host "📞 Test 3: Lấy đơn hàng theo SĐT CTV" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$WORKER_URL/api?action=getOrdersByPhone&phone=0123456789"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Lỗi: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Test 4: Lấy đơn hàng gần đây
Write-Host "🕐 Test 4: Lấy 5 đơn hàng gần đây" -ForegroundColor Yellow
Write-Host "---------------------------------" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$WORKER_URL/api?action=getRecentOrders&limit=5"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Lỗi: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Test 5: Lấy thống kê dashboard
Write-Host "📊 Test 5: Lấy thống kê dashboard" -ForegroundColor Yellow
Write-Host "----------------------------------" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$WORKER_URL/api?action=getDashboardStats"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Lỗi: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Test 6: Lấy danh sách tất cả CTV
Write-Host "👥 Test 6: Lấy danh sách tất cả CTV" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$WORKER_URL/api?action=getAllCTV"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Lỗi: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

Write-Host "✅ Test hoàn tất!" -ForegroundColor Green
