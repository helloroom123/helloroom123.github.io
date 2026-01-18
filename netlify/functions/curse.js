const ALLOWED_ORIGINS = [
  'https://aurora-project.pages.dev',
  'https://helloroom123.github.io',
  'https://helloroom123-aurora-project.netlify.app'
];

const { checkRateLimit } = require('./utils/ratelimit');

const getCorsHeaders = (origin) => {
  let allowOrigin = 'null';
  if (origin) {
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('--helloroom123-aurora-project.netlify.app')) {
      allowOrigin = origin;
    } else if (ALLOWED_ORIGINS.includes(origin)) {
      allowOrigin = origin;
    }
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400' // 缓存 24h
  };
};

exports.handler = async (event, context) => {
  // 极速处理预检
  if (event.httpMethod === 'OPTIONS') {
    const origin = event.headers.origin || event.headers.Origin;
    return {
      statusCode: 204,
      headers: getCorsHeaders(origin),
      body: ''
    };
  }

  const origin = event.headers.origin || event.headers.Origin;
  const headers = getCorsHeaders(origin);

  if (headers['Access-Control-Allow-Origin'] === 'null') {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  // 速率限制
  const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || 'unknown';
  const isAllowed = await checkRateLimit(clientIp, 'curse', 10, 60); // 10 requests per minute

  if (!isAllowed) {
    return { 
        statusCode: 429, 
        headers, 
        body: JSON.stringify({ error: 'Too Many Requests', message: 'You are cursed for being too annoying.' }) 
    };
  }

  // 静态内容直接返回，无需复杂计算
  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
    })
  };
};
