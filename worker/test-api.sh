#!/bin/bash

# Script test API cho Cloudflare Worker
# Sử dụng: bash test-api.sh

WORKER_URL="https://ctv-api.yendev96.workers.dev"

echo "🧪 Testing Cloudflare Worker API"
echo "================================"
echo ""

# Test 1: Tạo đơn hàng mới
echo "📦 Test 1: Tạo đơn hàng mới"
echo "----------------------------"
curl -X POST "$WORKER_URL/api/order/create" \
  -H "Content-Type: application/json" \
  -d @test-order.json
echo ""
echo ""

# Test 2: Lấy đơn hàng theo mã CTV
echo "📋 Test 2: Lấy đơn hàng theo mã CTV"
echo "-----------------------------------"
curl "$WORKER_URL/api?action=getOrders&referralCode=CTV123456"
echo ""
echo ""

# Test 3: Lấy đơn hàng theo SĐT CTV
echo "📞 Test 3: Lấy đơn hàng theo SĐT CTV"
echo "------------------------------------"
curl "$WORKER_URL/api?action=getOrdersByPhone&phone=0123456789"
echo ""
echo ""

# Test 4: Lấy đơn hàng gần đây
echo "🕐 Test 4: Lấy 5 đơn hàng gần đây"
echo "---------------------------------"
curl "$WORKER_URL/api?action=getRecentOrders&limit=5"
echo ""
echo ""

# Test 5: Lấy thống kê dashboard
echo "📊 Test 5: Lấy thống kê dashboard"
echo "----------------------------------"
curl "$WORKER_URL/api?action=getDashboardStats"
echo ""
echo ""

# Test 6: Lấy danh sách tất cả CTV
echo "👥 Test 6: Lấy danh sách tất cả CTV"
echo "-----------------------------------"
curl "$WORKER_URL/api?action=getAllCTV"
echo ""
echo ""

echo "✅ Test hoàn tất!"
