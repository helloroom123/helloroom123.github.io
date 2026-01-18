const { createClient } = require('@supabase/supabase-js');
const { Redis } = require('@upstash/redis');

// Init Supabase
const supabaseUrl = 'https://kvvfheqxyedqarplafqe.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dmZoZXF4eWVkcWFycGxhZnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDg4MzcsImV4cCI6MjA4NDI4NDgzN30.TICY21JDYQugBaQ-pOJEvCbpoVdmRDA88zDW3tgU9CY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Init Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://mint-parakeet-36951.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "AZBXAAIncDFhMzQ2ZDAyOGY4N2Y0NzlhODhkYjI2NDFiNTdkMTNiZXAxMzY5NTE"
});

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
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
        message: `[WebUser] ${message}`, // Add prefix
        sender_ip: ip
    }]);

    if (dbError) throw dbError;

    return res.status(200).json({ success: true, remaining: 3 - currentUsage });

  } catch (error) {
    console.error("Send Msg Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
