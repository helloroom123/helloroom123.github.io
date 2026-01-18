import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis/cloudflare';

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    const payload = await request.json();
    const message = payload.message;

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message empty' }), { status: 400, headers: corsHeaders });
    }

    // Init Redis
    // 需要确保环境变量在 Cloudflare Pages 后台已设置
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL || "https://mint-parakeet-36951.upstash.io",
      token: env.UPSTASH_REDIS_REST_TOKEN || "AZBXAAIncDFhMzQ2ZDAyOGY4N2Y0NzlhODhkYjI2NDFiNTdkMTNiZXAxMzY5NTE",
    });

    // IP Rate Limit
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = new Date();
    const key = `rate:msg:${now.getFullYear()}-${now.getMonth() + 1}:${ip}`;

    const currentUsage = await redis.incr(key);
    if (currentUsage === 1) await redis.expire(key, 3600 * 24 * 32);

    if (currentUsage > 3) {
      return new Response(JSON.stringify({ error: `Monthly limit exceeded (${currentUsage - 1}/3)` }), { status: 429, headers: corsHeaders });
    }

    // Init Supabase
    // 同样需要环境变量，这里先hardcode作为fallback以便快速测试
    const sbUrl = env.SUPABASE_URL || 'https://kvvfheqxyedqarplafqe.supabase.co';
    const sbKey = env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dmZoZXF4eWVkcWFycGxhZnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDg4MzcsImV4cCI6MjA4NDI4NDgzN30.TICY21JDYQugBaQ-pOJEvCbpoVdmRDA88zDW3tgU9CY';
    
    const supabase = createClient(sbUrl, sbKey);

    // Insert
    const { error: dbError } = await supabase.from('bot_outbox').insert([{
        group_id: 1077301999,
        message: `[WebUser] ${message}`,
        sender_ip: ip
    }]);

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ success: true, remaining: 3 - currentUsage }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}