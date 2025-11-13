# Script xem Worker logs real-time

Write-Host "=== WORKER LOGS VIEWER ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "📡 Đang theo dõi logs của Worker: ctv-api" -ForegroundColor Yellow
Write-Host "⚠️ Hãy đặt hàng trên website để xem logs real-time" -ForegroundColor Yellow
Write-Host "🛑 Nhấn Ctrl+C để dừng" -ForegroundColor Gray
Write-Host ""

# Tail Worker logs
npx wrangler tail ctv-api --format pretty
