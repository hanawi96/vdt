// Cloudflare Pages Function with D1 Database
// File này sẽ xử lý endpoint: /api/order/create

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    console.log('📥 Received order data:', {
      orderId: data.orderId,
      customer: data.customer?.name,
      referralCode: data.referralCode
    });

    // Validate dữ liệu đơn hàng
    if (!data.orderId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Thiếu mã đơn hàng'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!data.customer || !data.customer.name || !data.customer.phone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Thiếu thông tin khách hàng'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!data.cart || data.cart.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Giỏ hàng trống'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Tính tổng tiền
    const totalAmount = data.total || data.totalAmount || 0;
    const totalAmountNumber = typeof totalAmount === 'string'
      ? parseInt(totalAmount.replace(/[^\d]/g, ''))
      : totalAmount;

    // Validate và lấy thông tin CTV
    let validReferralCode = null;
    let finalCommission = 0;
    let ctvPhone = null;

    if (data.referralCode && data.referralCode.trim() !== '') {
      // Kiểm tra xem referral code có tồn tại không
      const ctvData = await env.DB.prepare(`
        SELECT referral_code, commission_rate, phone FROM ctv WHERE referral_code = ?
      `).bind(data.referralCode.trim()).first();

      if (ctvData) {
        validReferralCode = ctvData.referral_code;
        ctvPhone = ctvData.phone;
        const commissionRate = ctvData.commission_rate || 0.1;
        finalCommission = totalAmountNumber * commissionRate;
        console.log('✅ Valid referral code:', validReferralCode, 'Commission:', finalCommission);
      } else {
        console.warn('⚠️ Referral code không tồn tại:', data.referralCode);
      }
    }

    // Format products thành JSON string
    const productsJson = JSON.stringify(data.cart);

    // 1. Lưu vào D1 Database
    const orderDate = data.orderDate || new Date().toISOString();

    const result = await env.DB.prepare(`
      INSERT INTO orders (
        order_id, order_date, customer_name, customer_phone,
        address, products, total_amount, payment_method,
        status, referral_code, commission, ctv_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.orderId,
      orderDate,
      data.customer.name,
      data.customer.phone,
      data.customer.address || '',
      productsJson,
      totalAmountNumber,
      data.paymentMethod || 'cod',
      data.status || 'Mới',
      validReferralCode,
      finalCommission,
      ctvPhone || null
    ).run();

    if (!result.success) {
      throw new Error('Failed to insert order into D1');
    }

    console.log('✅ Saved order to D1:', data.orderId);

    // 2. Lưu vào Google Sheets (gọi Google Apps Script)
    try {
      const googleScriptUrl = env.GOOGLE_APPS_SCRIPT_URL;

      if (googleScriptUrl) {
        // Chuẩn bị dữ liệu cho Google Sheets
        const sheetsData = {
          orderId: data.orderId,
          orderDate: data.orderDate || new Date().toISOString(),
          customer: {
            name: data.customer.name,
            phone: data.customer.phone,
            address: data.customer.address || '',
            notes: data.customer.notes || ''
          },
          cart: data.cart,
          total: data.total || `${totalAmountNumber.toLocaleString('vi-VN')}đ`,
          paymentMethod: data.paymentMethod || 'cod',
          referralCode: validReferralCode || '',
          referralCommission: finalCommission || 0,
          referralPartner: data.referralPartner || '',
          telegramNotification: env.SECRET_KEY || 'VDT_SECRET_2025_ANHIEN'
        };

        console.log('📤 Sending to Google Sheets:', {
          orderId: sheetsData.orderId,
          referralCode: sheetsData.referralCode,
          referralCommission: sheetsData.referralCommission
        });

        const sheetsResponse = await fetch(googleScriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sheetsData)
        });

        const responseText = await sheetsResponse.text();
        console.log('📥 Google Sheets response:', responseText);

        if (sheetsResponse.ok) {
          console.log('✅ Saved order to Google Sheets');
        } else {
          console.warn('⚠️ Failed to save to Google Sheets:', sheetsResponse.status, responseText);
        }
      }
    } catch (sheetsError) {
      console.error('⚠️ Google Sheets error:', sheetsError);
      // Không throw error, vì D1 đã lưu thành công
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Đơn hàng đã được tạo thành công',
      orderId: data.orderId,
      commission: finalCommission,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}
