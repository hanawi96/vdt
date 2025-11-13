# Test Google Apps Script URL

Write-Host "🧪 Testing Google Apps Script URL..." -ForegroundColor Cyan
Write-Host ""

$GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwh4Az3BjmNMan7Ik_FxcsmDSSuUE4lWMBgcPBlsITYN39bWfHztZK9VOS930rrin3dEA/exec"

# Test data
$testOrder = @{
    orderId = "TEST_" + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    orderDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    customer = @{
        name = "Test Customer"
        phone = "0123456789"
        address = "123 Test Street"
        notes = "Test order from PowerShell"
    }
    cart = @(
        @{
            name = "Test Product"
            price = "100,000đ"
            quantity = 1
            weight = "5kg"
        }
    )
    total = "100,000đ"
    paymentMethod = "cod"
    referralCode = "CTV123456"
    referralPartner = "Test CTV"
    referralCommission = 10000
    telegramNotification = "VDT_SECRET_2025_ANHIEN"
} | ConvertTo-Json -Depth 10

Write-Host "📤 Sending test order to Google Apps Script..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $GOOGLE_SCRIPT_URL `
        -Method Post `
        -ContentType "application/json" `
        -Body $testOrder `
        -TimeoutSec 30

    Write-Host "✅ Response from Google Apps Script:" -ForegroundColor Green
    Write-Host ""
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    
    if ($response.result -eq "success") {
        Write-Host "✅ Google Apps Script is working correctly!" -ForegroundColor Green
        Write-Host "📋 Check your Google Sheets for the test order" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ Google Apps Script returned an error" -ForegroundColor Yellow
        Write-Host "Message: $($response.message)" -ForegroundColor Yellow
    }

} catch {
    Write-Host "❌ Error connecting to Google Apps Script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "1. URL is incorrect or script is not deployed" -ForegroundColor Yellow
    Write-Host "2. Script permissions not set correctly" -ForegroundColor Yellow
    Write-Host "3. Script execution timeout" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Cyan
    Write-Host "- Open https://script.google.com" -ForegroundColor Cyan
    Write-Host "- Find your order-handler script" -ForegroundColor Cyan
    Write-Host "- Deploy → New deployment → Web app" -ForegroundColor Cyan
    Write-Host "- Copy the Web App URL" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
