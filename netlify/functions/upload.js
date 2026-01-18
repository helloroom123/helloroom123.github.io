const axios = require('axios');
const FormData = require('form-data');
const https = require('https');

// 安全配置：允许访问的域名白名单
const ALLOWED_ORIGINS = [
  'https://aurora-project.pages.dev',           // Cloudflare 主站
  'https://helloroom123.github.io',             // GitHub 备用站
  'https://helloroom123-aurora-project.netlify.app' // Netlify 原站
];

// 辅助函数：根据请求来源生成 CORS 头
const getCorsHeaders = (origin) => {
  // 允许本地开发 localhost
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type, Auth-Token',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
  }
  
  // 允许 Netlify 预览链接 (deploy-preview-xxx)
  if (origin && origin.endsWith('--helloroom123-aurora-project.netlify.app')) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type, Auth-Token',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
  }

  // 检查白名单
  if (ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type, Auth-Token',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
  }

  // 默认拒绝 (返回 null 或者不返回 Allow-Origin)
  return {
    'Access-Control-Allow-Origin': 'null', // 或者不返回，浏览器会拦截
    'Access-Control-Allow-Headers': 'Content-Type, Auth-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
};

exports.handler = async (event, context) => {
  const origin = event.headers.origin || event.headers.Origin;
  const headers = getCorsHeaders(origin);

  // 1. 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 2. 验证来源 (安全核心)
  if (headers['Access-Control-Allow-Origin'] === 'null') {
    console.warn(`Blocked unauthorized request from: ${origin}`);
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: Unauthorized Origin' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    // 3. 数据量验证
    // Netlify 只有 10s 执行时间，过大的文件会导致超时。限制 JSON body 大小约为 10MB (Base64 后)
    if (event.body.length > 10 * 1024 * 1024) {
      return { statusCode: 413, headers, body: JSON.stringify({ error: 'Payload too large. Max 7MB image allowed.' }) };
    }

    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
    
    if (!payload.image) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing image data' }) };
    }

    const imageBuffer = Buffer.from(payload.image, 'base64');
    
    // 4. 简单的文件头检查 (Magic Bytes) 防止上传非图片文件
    // PNG: 89 50 4E 47, JPG: FF D8 FF, GIF: 47 49 46
    const magic = imageBuffer.toString('hex', 0, 4);
    const validMagic = ['89504e47', 'ffd8ff', '474946'];
    const isValidImage = validMagic.some(m => magic.toLowerCase().startsWith(m));
    
    if (!isValidImage) {
        // 虽然 Catbox 会检查，但我们在代理层拦截可以节省带宽和时间
        // 注意：这里只做了最基础检查，不做强拦截，以防误判，仅作 Log
        console.log(`Uploading file with header: ${magic}`);
    }

    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', imageBuffer, {
      filename: payload.filename || 'upload.png',
    });

    const agent = new https.Agent({ rejectUnauthorized: false });

    console.log('Proxying upload to Catbox.moe...');

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      httpsAgent: agent,
      timeout: 25000, // 25s timeout (leave buffer for Netlify)
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'success',
        url: response.data
      })
    };

  } catch (error) {
    console.error('Proxy Error:', error.message);
    return {
      statusCode: error.response ? error.response.status : 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Upload Failed',
        message: error.message,
        details: error.response ? error.response.data : 'No remote response'
      })
    };
  }
};
