// worker/worker.js

export default {
  async fetch(request, env) {
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

      // --- IMPORTANT ---
      // The GOOGLE_SCRIPT_URL is a secret variable you need to set in your Cloudflare dashboard.
      // It's the URL of your Google Apps Script Web App.
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

      // Await the response from Google Apps Script and parse it as JSON immediately.
      const googleResponseData = await googleResponse.json();

      // Check if the HTTP response itself is okay AND if the script reported success in its response body.
      // This assumes the Google Apps Script returns a JSON object like { "result": "success", ... } or { "result": "error", "message": "..." }.
      if (!googleResponse.ok || googleResponseData.result !== 'success') {
        const errorMessage = googleResponseData.message || 'Google Apps Script báo lỗi không xác định.';
        console.error('Lỗi từ Google Apps Script:', errorMessage);
        // Forward the specific error from Google back to the client
        throw new Error(errorMessage);
      }

      // Return a success response to the website, forwarding the data from Google
      return new Response(JSON.stringify({ success: true, message: 'Đơn hàng đã được gửi thành công!', data: googleResponseData }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders // Add CORS headers
        },
      });

    } catch (error) {
      console.error('Lỗi xử lý đơn hàng:', error);
      return new Response(JSON.stringify({ success: false, message: error.message || 'Đã xảy ra lỗi không mong muốn.' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders // Add CORS headers
        },
      });
    }
  },
};

// CORS Headers - Allows your website to talk to this worker
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, you should restrict this to your website's domain
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function handleOptions(request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS preflight requests.
    return new Response(null, {
      headers: corsHeaders,
    });
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        Allow: 'POST, OPTIONS',
      },
    });
  }
}
