#!/bin/bash

echo "=== Kiểm tra D1 Database ==="
echo ""

echo "1. Kiểm tra bảng orders:"
npx wrangler d1 execute vdt --command "SELECT COUNT(*) as total_orders FROM orders"

echo ""
echo "2. Xem 5 đơn hàng mới nhất:"
npx wrangler d1 execute vdt --command "SELECT order_id, customer_name, total_amount, referral_code, created_at FROM orders ORDER BY created_at DESC LIMIT 5"

echo ""
echo "3. Kiểm tra bảng ctv:"
npx wrangler d1 execute vdt --command "SELECT COUNT(*) as total_ctv FROM ctv"

echo ""
echo "4. Xem CTV có đơn hàng:"
npx wrangler d1 execute vdt --command "SELECT c.referral_code, c.full_name, COUNT(o.id) as order_count FROM ctv c LEFT JOIN orders o ON c.referral_code = o.referral_code GROUP BY c.referral_code, c.full_name"
