// 安全配置：允许访问的域名白名单
const ALLOWED_ORIGINS = [
  'https://aurora-project.pages.dev',
  'https://helloroom123.github.io',
  'https://helloroom123-aurora-project.netlify.app'
];

const getCorsHeaders = (origin) => {
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('--helloroom123-aurora-project.netlify.app'))) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
  }
  if (ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
  }
  return {
    'Access-Control-Allow-Origin': 'null',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
};

exports.handler = async (event, context) => {
  const origin = event.headers.origin || event.headers.Origin;
  const headers = getCorsHeaders(origin);

  // 1. 预检
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 2. 鉴权
  if (headers['Access-Control-Allow-Origin'] === 'null') {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

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
