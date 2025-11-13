// Test endpoint để kiểm tra D1 binding
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Kiểm tra DB binding có tồn tại không
    if (!env.DB) {
      return new Response(JSON.stringify({
        success: false,
        error: 'D1 binding not found. Please configure DB binding in Cloudflare Dashboard.',
        hint: 'Settings → Functions → D1 database bindings → Add binding (Variable: DB, Database: vdt)'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Test query bảng ctv
    const { results: ctvList } = await env.DB.prepare(`
      SELECT referral_code, full_name, phone, commission_rate 
      FROM ctv 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    // Test query bảng orders
    const { results: orderList } = await env.DB.prepare(`
      SELECT order_id, referral_code, commission 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    return new Response(JSON.stringify({
      success: true,
      message: 'D1 binding is working!',
      data: {
        ctvCount: ctvList.length,
        ctvList: ctvList,
        orderCount: orderList.length,
        orderList: orderList
      },
      environment: {
        hasDB: !!env.DB,
        hasGoogleScriptUrl: !!env.GOOGLE_APPS_SCRIPT_URL,
        hasSecretKey: !!env.SECRET_KEY
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      hint: 'Make sure D1 binding is configured correctly in Cloudflare Dashboard'
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
