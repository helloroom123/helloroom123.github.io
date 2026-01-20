// Cloudflare Pages Function for Curse

export async function onRequest(context) {
  const { request } = context;

  const ALLOWED_ORIGINS = [
    'https://aurora-project.pages.dev',
    'https://helloroom123.github.io',
    'https://helloroom123-github-io.vercel.app'
  ];

  const origin = request.headers.get('Origin');
  let allowOrigin = 'null';
  if (origin) {
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.pages.dev') || origin.endsWith('.vercel.app')) {
        allowOrigin = origin;
    } else if (ALLOWED_ORIGINS.includes(origin)) {
        allowOrigin = origin;
    }
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  // Rate Limit would go here if needed, similar to other functions using Upstash

  return new Response(JSON.stringify({
    status: "CRITICAL_FAILURE",
    message: "SYSTEM_LOCK_INITIATED",
    payload: [
      "不支持是不行的",
      "Aurora is watching you",
      "ERROR: 0x00000000",
      "Deleting System32...",
      "放弃抵抗吧",
      "你的电脑现在属于舒苒了"
    ]
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}
