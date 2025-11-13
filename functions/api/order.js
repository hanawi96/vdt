// Cloudflare Pages Function - API endpoint for order processing
// This file will be automatically deployed with Cloudflare Pages

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function handleOptions(request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, {
      headers: corsHeaders,
    });
  } else {
    return new Response(null, {
      headers: {
        Allow: 'POST, OPTIONS',
      },
    });
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Chỉ chấp nhận phương thức POST', { status: 405 });
  }

  try {
    // Get the order data from the request body
    const orderData = await request.json();

    // Validate dữ liệu đơn hàng
    if (!orderData.orderId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Thiếu mã đơn hàng'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!orderData.customer || !orderData.customer.name || !orderData.customer.phone) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Thiếu thông tin khách hàng'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Tính tổng tiền
    const totalAmount = orderData.total || orderData.totalAmount || 0;
    const totalAmountNumber = typeof totalAmount === 'string'
      ? parseInt(totalAmount.replace(/[^\d]/g, ''))
      : totalAmount;

    // Validate và lấy thông tin CTV
    let validReferralCode = null;
    let finalCommission = 0;
    let ctvPhone = null;

    if (orderData.referralCode && orderData.referralCode.trim() !== '' && env.DB) {
      try {
        const ctvData = await env.DB.prepare(`
          SELECT referral_code, commission_rate, phone FROM ctv WHERE referral_code = ?
        `).bind(orderData.referralCode.trim()).first();

        if (ctvData) {
          validReferralCode = ctvData.referral_code;
          ctvPhone = ctvData.phone;
          const commissionRate = ctvData.commission_rate || 0.1;
          finalCommission = totalAmountNumber * commissionRate;
        }
      } catch (dbError) {
        console.warn('⚠️ Không thể kiểm tra referral code trong D1:', dbError);
      }
    }

    // 1. LƯU VÀO D1 DATABASE (nếu có)
    if (env.DB) {
      try {
        const productsJson = JSON.stringify(orderData.cart || []);
        const orderDate = orderData.orderDate || new Date().toISOString();

        const result = await env.DB.prepare(`
          INSERT INTO orders (
            order_id, order_date, customer_name, customer_phone, 
            address, products, total_amount, payment_method, 
            status, referral_code, commission, ctv_phone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          orderData.orderId,
          orderDate,
          orderData.customer.name,
          orderData.customer.phone,
          orderData.customer.address || '',
          productsJson,
          totalAmountNumber,
          orderData.paymentMethod || 'cod',
          orderData.status || 'Mới',
          validReferralCode,
          finalCommission,
          ctvPhone || null
        ).run();

        if (result.success) {
          console.log('✅ Đã lưu đơn hàng vào D1:', orderData.orderId);
        }
      } catch (dbError) {
        console.error('❌ Lỗi lưu vào D1:', dbError);
        // Không throw error, tiếp tục lưu vào Google Sheets
      }
    } else {
      console.warn('⚠️ D1 database không khả dụng trong Pages Function');
    }

    // 2. LƯU VÀO GOOGLE SHEETS
    const googleScriptUrl = env.GOOGLE_SCRIPT_URL || env.GOOGLE_APPS_SCRIPT_URL;

    if (googleScriptUrl) {
      try {
        const googleResponse = await fetch(googleScriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        const googleResponseData = await googleResponse.json();

        if (googleResponse.ok && googleResponseData.result === 'success') {
          console.log('✅ Đã lưu đơn hàng vào Google Sheets');
        } else {
          console.warn('⚠️ Lỗi lưu vào Google Sheets:', googleResponseData.message);
        }
      } catch (sheetsError) {
        console.error('⚠️ Lỗi gọi Google Sheets:', sheetsError);
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Đơn hàng đã được gửi thành công!',
        orderId: orderData.orderId,
        commission: finalCommission
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    );

  } catch (error) {
    console.error('Lỗi xử lý đơn hàng:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Đã xảy ra lỗi không mong muốn.'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    );
  }
}
