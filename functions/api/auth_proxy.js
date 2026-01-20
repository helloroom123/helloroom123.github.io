// Cloudflare Pages Function: Auth Proxy
// Hides the real VPS IP from the client

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // Configure this in Cloudflare Environment Variables
    // VPS_AUTH_URL = https://track-sir-salon-minister.trycloudflare.com
    const VPS_AUTH_URL = env.VPS_AUTH_URL;

    if (!VPS_AUTH_URL) {
      return new Response(JSON.stringify({ error: "Server Configuration Error (Missing VPS_AUTH_URL)" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await request.json();
    const action = body.action; // 'send-code' or 'verify-code'

    // Forward to VPS
    const response = await fetch(VPS_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`VPS Auth Error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Auth Service Unavailable (Proxy Error)",
      details: err.message 
    }), { 
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
