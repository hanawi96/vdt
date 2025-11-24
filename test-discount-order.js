// Test script để gọi API tạo đơn hàng với mã giảm giá
// Chạy: node test-discount-order.js

const testOrder = {
    orderId: `TEST${Date.now()}`,
    orderDate: new Date().toISOString(),
    customer: {
        name: "Nguyễn Test",
        phone: "0123456789",
        email: "test@example.com",
        address: "123 Test Street, Phường Test, Quận Test, TP Test",
        notes: "Đơn hàng test mã giảm giá"
    },
    cart: [
        {
            name: "Vòng Dâu Tằm Trơn Cổ Điển",
            price: "89.000đ",
            quantity: 2,
            weight: "5kg",
            notes: ""
        }
    ],
    subtotal: "178.000đ",
    shipping: "21.000đ",
    discount: "-15.000đ (VDT15K)",  // Mã giảm 15K
    total: "184.000đ",
    totalAmount: 184000,
    paymentMethod: "Thanh toán khi nhận hàng (COD)",
    referralCode: "",
    referralPartner: "",
    referralCommission: 0,
    telegramNotification: "VDT_SECRET_2025_ANHIEN"
};

async function testCreateOrder() {
    console.log('🧪 Testing order creation with discount...\n');
    console.log('📦 Order data:', JSON.stringify(testOrder, null, 2));
    console.log('\n🚀 Sending request to worker...\n');

    try {
        const response = await fetch('https://shop-order-api.yendev96.workers.dev/api/order/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testOrder)
        });

        const result = await response.json();
        
        console.log('✅ Response:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('\n✅ Order created successfully!');
            console.log('Order ID:', result.orderId);
            
            // Đợi 2 giây rồi kiểm tra database
            console.log('\n⏳ Waiting 2 seconds before checking database...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('\n📊 Now check the database with:');
            console.log(`wrangler d1 execute vdt --remote --command "SELECT order_id, discount_code, discount_amount FROM orders WHERE order_id = '${result.orderId}'"`);
            console.log(`wrangler d1 execute vdt --remote --command "SELECT * FROM discount_usage WHERE order_id = '${result.orderId}'"`);
        } else {
            console.error('❌ Order creation failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testCreateOrder();
