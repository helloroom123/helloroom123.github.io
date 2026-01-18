const axios = require('axios');
const FormData = require('form-data');
const https = require('https');
const { pusher } = require('./utils/pusher');
const { checkRateLimit } = require('./utils/ratelimit');
const { supabase } = require('./utils/db'); // Import Supabase Client

// 安全配置：允许访问的域名白名单
const ALLOWED_ORIGINS = [
  'https://aurora-project.pages.dev',
  'https://helloroom123.github.io',
  'https://helloroom123-aurora-project.netlify.app'
];

const getCorsHeaders = (origin) => {
  let allowOrigin = 'null';
  
  if (origin) {
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('--helloroom123-aurora-project.netlify.app')) {
      allowOrigin = origin;
    } else if (ALLOWED_ORIGINS.includes(origin)) {
      allowOrigin = origin;
    }
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Auth-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400' // 关键优化：缓存预检结果 24 小时
  };
};

exports.handler = async (event, context) => {
  // 快速路径：非 POST/OPTIONS 直接返回，不进行复杂逻辑
  const method = event.httpMethod;
  
  // 1. 处理 OPTIONS 预检 (极速返回)
  if (method === 'OPTIONS') {
    const origin = event.headers.origin || event.headers.Origin;
    return {
      statusCode: 204, // 204 No Content 比 200 更标准且包体更小
      headers: getCorsHeaders(origin),
      body: ''
    };
  }

  if (method !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const origin = event.headers.origin || event.headers.Origin;
  const headers = getCorsHeaders(origin);

  // 2. 验证来源
  if (headers['Access-Control-Allow-Origin'] === 'null') {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  try {
    // 2.5 速率限制 (Rate Limiting)
    const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || 'unknown';
    const isAllowed = await checkRateLimit(clientIp, 'upload', 3, 60); // 3 requests per 60s
    
    if (!isAllowed) {
        return { 
            statusCode: 429, 
            headers, 
            body: JSON.stringify({ error: 'Too Many Requests. Please wait a minute.' }) 
        };
    }

    // 3. 快速检查 Content-Length (避免解析超大 Body)
    const contentLength = event.headers['content-length'] || event.headers['Content-Length'];
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
         return { statusCode: 413, headers, body: JSON.stringify({ error: 'Payload too large' }) };
    }

    // 4. 解析 Body
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
    
    if (!payload.image) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing image' }) };
    }

    // 5. 复用 HTTPS Agent (减少 TCP 握手开销)
    // 注意：在 Serverless 环境中复用效果有限，但如果实例被保活则有用
    const agent = new https.Agent({ 
      rejectUnauthorized: false,
      keepAlive: true 
    });

    const imageBuffer = Buffer.from(payload.image, 'base64');
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', imageBuffer, {
      filename: payload.filename || 'upload.png',
    });

    // 6. 发起请求
    const response = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      httpsAgent: agent,
      timeout: 25000, 
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const imageUrl = response.data;

    // 7. 写入 Supabase (持久化存储)
    try {
        const { error: dbError } = await supabase.from('fanart_gallery').insert([{
            image_url: imageUrl,
            title: payload.title || 'Untitled Upload',
            author: payload.author || 'Anonymous',
            created_at: new Date().toISOString(),
            is_approved: true
        }]);
        
        if (dbError) {
            console.error("DB Insert Failed:", dbError);
            // 不阻断流程，仅记录错误
        }
    } catch (dbErr) {
        console.error("DB Exception:", dbErr);
    }

    // 8. 触发 Pusher 实时通知 (非阻塞)
    try {
        await pusher.trigger("aurora-updates", "new-fanart", {
            message: "有人提交了新的 Fanart 作品！",
            imageUrl: imageUrl,
            timestamp: new Date().toISOString()
        });
    } catch (pusherErr) {
        console.error("Pusher trigger failed:", pusherErr);
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'success',
        url: imageUrl
      })
    };

  } catch (error) {
    console.error('Proxy Error:', error.message); // 只在出错时 Log，减少常规日志输出（Netlify Log 也有配额/限制）
    return {
      statusCode: error.response ? error.response.status : 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Upload Failed',
        message: error.message
      })
    };
  }
};
