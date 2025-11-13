# PowerShell script test API endpoint sau khi deploy

Write-Host "🧪 Testing API Endpoint..." -ForegroundColor Cyan
Write-Host ""

# Thay YOUR_DOMAIN bằng domain thực tế của bạn
$DOMAIN = "https://shopvd.store"

# Test 1: Create order
Write-Host "1️⃣ Testing create order..." -ForegroundColor Yellow

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$orderDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

$body = @{
    orderId = "TEST$timestamp"
    orderDate = $orderDate
    customer = @{
        name = "Test User"
        phone = "0123456789"
        address = "123 Test Street, Test City"
    }
    cart = @(
        @{
            name = "Test Product"
            price = "100,000đ"
            quantity = 1
            weight = "5kg"
        }
    )
    total = 100000
    paymentMethod = "cod"
    referralCode = ""
    status = "Mới"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$DOMAIN/api/order/create" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    Write-Host ""
    Write-Host "✅ Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host ""
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    $_.Exception.Response
}

Write-Host ""
Write-Host ""
Write-Host "✅ Test completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Check D1 database: npx wrangler d1 execute vdt --command `"SELECT * FROM orders ORDER BY created_at DESC LIMIT 5`""
Write-Host "2. Check Google Sheets for the test order"
Write-Host "3. Check Cloudflare Pages Functions logs in Dashboard"
