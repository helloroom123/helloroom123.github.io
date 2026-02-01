import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis/cloudflare';

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Auth-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    const payload = await request.json();
    
    if (!payload.image) {
      return new Response(JSON.stringify({ error: 'Missing image' }), { status: 400, headers: corsHeaders });
    }

    // 1. Rate Limit
    const redisUrl = env.UPSTASH_REDIS_REST_URL;
    const redisToken = env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
       console.error("Redis credentials missing in Cloudflare Environment Variables");
       // Fail safe: Allow upload but log error, or block?
       // Let's block to prevent abuse if config is wrong
       return new Response(JSON.stringify({ error: 'Server Configuration Error (Redis)' }), { status: 500, headers: corsHeaders });
    }

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = `rate:upload:${ip}`;
    const currentUsage = await redis.incr(key);
    if (currentUsage === 1) await redis.expire(key, 60);

    if (currentUsage > 3) {
       return new Response(JSON.stringify({ error: 'Rate limit exceeded (3/min)' }), { status: 429, headers: corsHeaders });
    }

    // 2. Upload to Catbox
    // Decode Base64 to Blob
    const base64Data = payload.image;
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', blob, payload.filename || 'upload.png');

    const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Cloudflare Worker)'
        }
    });

    if (!catboxRes.ok) {
        throw new Error(`Catbox Upload Failed: ${catboxRes.statusText}`);
    }

    const imageUrl = await catboxRes.text();

    // 3. Write to Supabase
    const sbUrl = env.SUPABASE_URL || 'https://kvvfheqxyedqarplafqe.supabase.co';
    const sbKey = env.SUPABASE_KEY;

    if (!sbKey) {
        console.error("Supabase Key missing");
        return new Response(JSON.stringify({ error: 'Server Configuration Error (DB)' }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(sbUrl, sbKey);

    const { error: dbError } = await supabase.from('fanart_gallery').insert([{
        image_url: imageUrl,
        title: payload.title || 'Untitled Upload',
        author: payload.author || 'Anonymous',
        is_approved: true
    }]);

    if (dbError) console.error('DB Error:', dbError);

    return new Response(JSON.stringify({ 
        status: 'success', 
        url: imageUrl 
    }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Auth-Token',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}
