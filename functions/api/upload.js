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
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL || "https://mint-parakeet-36951.upstash.io",
      token: env.UPSTASH_REDIS_REST_TOKEN || "AZBXAAIncDFhMzQ2ZDAyOGY4N2Y0NzlhODhkYjI2NDFiNTdkMTNiZXAxMzY5NTE",
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
    const sbKey = env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dmZoZXF4eWVkcWFycGxhZnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDg4MzcsImV4cCI6MjA4NDI4NDgzN30.TICY21JDYQugBaQ-pOJEvCbpoVdmRDA88zDW3tgU9CY';
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
