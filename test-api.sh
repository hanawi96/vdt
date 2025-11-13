#!/bin/bash

# Script test API endpoint sau khi deploy

echo "🧪 Testing API Endpoint..."
echo ""

# Thay YOUR_DOMAIN bằng domain thực tế của bạn
DOMAIN="https://shopvd.store"

# Test 1: Health check (nếu có)
echo "1️⃣ Testing health check..."
curl -X GET "$DOMAIN/api/health" -H "Content-Type: application/json"
echo ""
echo ""

# Test 2: Create order
echo "2️⃣ Testing create order..."
curl -X POST "$DOMAIN/api/order/create" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST'$(date +%s)'",
    "orderDate": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "customer": {
      "name": "Test User",
      "phone": "0123456789",
      "address": "123 Test Street, Test City"
    },
    "cart": [
      {
        "name": "Test Product",
        "price": "100,000đ",
        "quantity": 1,
        "weight": "5kg"
      }
    ],
    "total": 100000,
    "paymentMethod": "cod",
    "referralCode": "",
    "status": "Mới"
  }'

echo ""
echo ""
echo "✅ Test completed!"
echo ""
echo "📋 Next steps:"
echo "1. Check D1 database: npx wrangler d1 execute vdt --command \"SELECT * FROM orders ORDER BY created_at DESC LIMIT 5\""
echo "2. Check Google Sheets for the test order"
echo "3. Check Cloudflare Pages Functions logs in Dashboard"
