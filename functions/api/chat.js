// Cloudflare Pages Function: Chat Proxy with Redis Rate Limiting
import { Redis } from '@upstash/redis';

// Limits
const MONTHLY_LIMIT = 100;
const USER_DAILY_LIMIT = 20;

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const message = body.message;

    if (!message) {
      return new Response(JSON.stringify({ error: "Message empty" }), { status: 400 });
    }

    // 1. Init Redis (Needs Env Vars in Cloudflare Dashboard)
    // If not configured, fallback to "Unlimited" mode for safety
    let redis = null;
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
        redis = new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN
        });
    }

    // 2. Rate Limiting Logic
    const ip = request.headers.get("CF-Connecting-IP") || "cf_unknown";
    const now = new Date();
    const monthKey = `ai:quota:${now.getFullYear()}-${now.getMonth() + 1}`;
    const userKey = `ai:user:${ip}:${now.getDate()}`;
    
    let monthlyCount = 0;
    let userCount = 0;

    if (redis) {
        // Check Monthly
        monthlyCount = await redis.get(monthKey) || 0;
        if (monthlyCount >= MONTHLY_LIMIT) {
            return new Response(JSON.stringify({ 
                error: 'Monthly Quota Exceeded', 
                message: '舒苒累了，下个月再见吧。（本月额度已耗尽）' 
            }), { status: 429 });
        }

        // Check Daily
        userCount = await redis.incr(userKey);
        if (userCount === 1) await redis.expire(userKey, 86400);
        
        if (userCount > USER_DAILY_LIMIT) {
            return new Response(JSON.stringify({ 
                error: 'Daily Limit Exceeded', 
                message: '今天聊太久啦，休息一下吧。' 
            }), { status: 429 });
        }

        // Increment Global
        await redis.incr(monthKey);
    } else {
        console.warn("Redis not configured on Cloudflare, skipping rate limit.");
    }

    // 3. Forward to VPS via Tunnel
    const VPS_URL = env.VPS_AI_URL;
    
    if (!VPS_URL) {
        console.error("VPS_AI_URL is missing in Cloudflare Environment Variables");
        return new Response(JSON.stringify({ error: 'Chat Service Unavailable (Config Error)' }), { status: 500 });
    }

    console.log(`[CF Proxy] Forwarding to VPS...`);

    const vpsResponse = await fetch(VPS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text: message,
        user_id: ip
      })
    });

    if (!vpsResponse.ok) {
      throw new Error(`VPS error: ${vpsResponse.status}`);
    }

    const data = await vpsResponse.json();

    // 4. Return result with Real Quota
    return new Response(JSON.stringify({
      reply: data.reply,
      quota: redis ? {
          monthly: MONTHLY_LIMIT - (monthlyCount + 1),
          daily: USER_DAILY_LIMIT - userCount
      } : { monthly: 999, daily: 999 } // Fallback display
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      error: "Connection Failed", 
      message: "舒苒连接失败 (Tunnel/VPS Issue)",
      details: err.message
    }), { status: 502 });
  }
}