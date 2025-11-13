// Middleware để log và debug D1 binding
export async function onRequest(context) {
  const { env, request } = context;
  
  // Log để debug
  console.log('📍 Request:', request.method, new URL(request.url).pathname);
  console.log('🔧 D1 Available:', !!env.DB);
  
  // Continue to next handler
  return context.next();
}
