// Vercel Serverless Function: Chat Proxy with Strict Rate Limiting
const { Redis } = require('@upstash/redis');
const axios = require('axios');

// Configure Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// VPS AI Endpoint (Tunnel URL)
const VPS_CHAT_URL = process.env.VPS_AI_URL || 'https://straight-doc-purchase-briefs.trycloudflare.com/chat';

// Limits
const MONTHLY_LIMIT = 100;
const USER_DAILY_LIMIT = 20;

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message empty' });

        // 1. Get Client IP
        const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown_ip';
        const ip = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0].trim();

        const now = new Date();
        const monthKey = `ai:quota:${now.getFullYear()}-${now.getMonth() + 1}`;
        const userKey = `ai:user:${ip}:${now.getDate()}`;

        // 2. Check Monthly Global Limit
        const monthlyCount = await redis.get(monthKey) || 0;
        if (monthlyCount >= MONTHLY_LIMIT) {
            return res.status(429).json({ 
                error: 'Monthly Quota Exceeded', 
                message: '舒苒累了，这个月已经说了太多话了... (本月额度已耗尽)' 
            });
        }

        // 3. Check User Daily Limit
        const userCount = await redis.incr(userKey);
        if (userCount === 1) await redis.expire(userKey, 86400); // 24h expire

        if (userCount > USER_DAILY_LIMIT) {
            return res.status(429).json({ 
                error: 'Daily Limit Exceeded', 
                message: `你今天已经聊了很多了，明天再来吧。` 
            });
        }

        // 4. Increment Monthly Counter
        await redis.incr(monthKey);

        // 5. Proxy to VPS via Tunnel
        console.log(`[Chat Proxy] Proxying to VPS... (${monthlyCount + 1}/${MONTHLY_LIMIT})`);
        
        // Extract Token from Frontend Request
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized', message: '请先登录' });
        }

        const response = await axios.post(VPS_CHAT_URL, { 
            text: message,
            user_id: ip 
        }, { 
            timeout: 60000,
            headers: { 'Authorization': authHeader } // Forward Token
        }); // 60s timeout

        return res.status(200).json({
            reply: response.data.reply,
            quota: {
                monthly: MONTHLY_LIMIT - (monthlyCount + 1),
                daily: USER_DAILY_LIMIT - userCount
            }
        });

    } catch (error) {
        console.error('Chat Error:', error.message);
        const errDetails = error.response ? error.response.data : error.message;
        return res.status(500).json({ error: '舒苒连接失败', details: errDetails });
    }
};