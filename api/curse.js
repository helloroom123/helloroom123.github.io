// VPS_CURSE_URL should be a Tunnel URL or HTTPS endpoint
const VPS_CURSE_URL = process.env.VPS_CURSE_URL;
const { getCorsOrigin, setCorsHeaders } = require('./utils/cors');
const { checkRateLimit } = require('./utils/ratelimit');

module.exports = async (req, res) => {
    // CORS
    const allowOrigin = getCorsOrigin(req);
    setCorsHeaders(res, allowOrigin);

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // Validate Origin
    if (allowOrigin === 'null') {
        return res.status(403).json({ error: 'Forbidden Origin' });
    }

    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

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
