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

    // Get Google Script URL from environment variables
    const googleScriptUrl = env.GOOGLE_SCRIPT_URL;

    if (!googleScriptUrl) {
      console.error('Lỗi: Biến môi trường GOOGLE_SCRIPT_URL chưa được thiết lập.');
      return new Response('Lỗi cấu hình phía máy chủ.', { status: 500 });
    }

    // Send the data to Google Apps Script
    const googleResponse = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    // Parse response from Google Apps Script
    const googleResponseData = await googleResponse.json();

    // Check if the request was successful
    if (!googleResponse.ok || googleResponseData.result !== 'success') {
      const errorMessage = googleResponseData.message || 'Google Apps Script báo lỗi không xác định.';
      console.error('Lỗi từ Google Apps Script:', errorMessage);
      throw new Error(errorMessage);
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Đơn hàng đã được gửi thành công!', 
        data: googleResponseData 
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
