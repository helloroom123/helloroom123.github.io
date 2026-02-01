const { createClient } = require('@supabase/supabase-js');
const { Redis } = require('@upstash/redis');
const { getCorsOrigin, setCorsHeaders } = require('./utils/cors');

// Init Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://kvvfheqxyedqarplafqe.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Init Redis
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
    console.warn('Redis credentials missing, falling back to mock or failing.');
    // Fail-safe: don't connect if no creds, or throw error
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken
});

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

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch(e) {}
    }

    const message = payload.message;
    
    if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    if (message.length > 50) {
        return res.status(400).json({ error: 'Message too long (max 50 chars)' });
    }
    
    // Basic Sanitation to prevent injection when message is used downstream
    // Replace potentially dangerous characters (e.g. for SQL or Shell contexts if mishandled later)
    const sanitizedMessage = message.replace(/['";`$<>]/g, "");

    // IP Rate Limit
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const ip = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0].trim();

    const now = new Date();
    const key = `rate:msg:${now.getFullYear()}-${now.getMonth() + 1}:${ip}`;
    
    // Check limit
    const currentUsage = await redis.incr(key);
    
    // Set expiry (32 days) if new key
    if (currentUsage === 1) {
        await redis.expire(key, 3600 * 24 * 32);
    }

    if (currentUsage > 3) {
        return res.status(429).json({ error: `Monthly limit exceeded (${currentUsage - 1}/3)` });
    }

    // Insert into Supabase Outbox
    const { error: dbError } = await supabase.from('bot_outbox').insert([{
        group_id: 1077301999, // Target Group
        message: `[WebUser] ${sanitizedMessage}`, // Add prefix and use sanitized message
        sender_ip: ip
    }]);

    if (dbError) throw dbError;

    return res.status(200).json({ success: true, remaining: 3 - currentUsage });

  } catch (error) {
    console.error("Send Msg Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
