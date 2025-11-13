// Cloudflare Pages Function - API endpoint /api/order/create
// Redirect to /api/order for compatibility

export async function onRequest(context) {
  // Import và sử dụng logic từ order.js
  const orderHandler = await import('../order.js');
  return orderHandler.onRequest(context);
}
