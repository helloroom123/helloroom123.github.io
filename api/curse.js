const ALLOWED_ORIGINS = [
  'https://aurora-project.pages.dev',
  'https://helloroom123.github.io',
  'https://helloroom123-github-io.vercel.app',
  'http://localhost:3000'
];

const { checkRateLimit } = require('./utils/ratelimit');

const getCorsOrigin = (origin) => {
  if (!origin) return 'null';
  if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.vercel.app')) {
    return origin;
  }
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return 'null';
};

module.exports = async (req, res) => {
  const origin = req.headers.origin || req.headers.Origin;
  const allowOrigin = getCorsOrigin(origin);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache 24h

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (allowOrigin === 'null') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Rate Limiting
  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || 'unknown';
  // If x-forwarded-for has multiple IPs, take the first one
  const ip = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0].trim();

  const isAllowed = await checkRateLimit(ip, 'curse', 10, 60); // 10 requests per minute

  if (!isAllowed) {
    return res.status(429).json({ 
        error: 'Too Many Requests', 
        message: 'You are cursed for being too annoying.' 
    });
  }

  // Static content response
  return res.status(200).json({
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
  });
};
