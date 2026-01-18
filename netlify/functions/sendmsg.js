const { createClient } = require('@supabase/supabase-js');
const { Redis } = require('@upstash/redis');

// Init Supabase
const supabaseUrl = 'https://kvvfheqxyedqarplafqe.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_4Rb9MRto0qgAn02E8j33vA_SfJIrHnf';
const supabase = createClient(supabaseUrl, supabaseKey);

// Init Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://mint-parakeet-36951.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "AZBXAAIncDFhMzQ2ZDAyOGY4N2Y0NzlhODhkYjI2NDFiNTdkMTNiZXAxMzY5NTE"
});

exports.handler = async (event, context) => {
  // CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const payload = JSON.parse(event.body);
    const message = payload.message;
    
    if (!message || message.trim().length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message cannot be empty' }) };
    }
    
    if (message.length > 50) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message too long (max 50 chars)' }) };
    }

    // IP Rate Limit
    const ip = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || 'unknown';
    const now = new Date();
    const key = `rate:msg:${now.getFullYear()}-${now.getMonth() + 1}:${ip}`;
    
    // Check limit
    const currentUsage = await redis.incr(key);
    
    // Set expiry (32 days) if new key
    if (currentUsage === 1) {
        await redis.expire(key, 3600 * 24 * 32);
    }

    if (currentUsage > 3) {
        return { 
            statusCode: 429, 
            headers, 
            body: JSON.stringify({ error: `Monthly limit exceeded (${currentUsage - 1}/3)` }) 
        };
    }

    // Insert into Supabase Outbox
    const { error: dbError } = await supabase.from('bot_outbox').insert([{
        group_id: 1077301999, // Target Group
        message: `[WebUser] ${message}`, // Add prefix
        sender_ip: ip
    }]);

    if (dbError) throw dbError;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, remaining: 3 - currentUsage })
    };

  } catch (error) {
    console.error("Send Msg Error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};