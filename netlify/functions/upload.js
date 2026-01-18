const axios = require('axios');
const FormData = require('form-data');
const https = require('https');

exports.handler = async (event, context) => {
  // 定义通用的 CORS 响应头
  const headers = {
    'Access-Control-Allow-Origin': '*', // 允许任何域名访问
    'Access-Control-Allow-Headers': 'Content-Type, Auth-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // 1. 处理 OPTIONS 预检请求 (CORS 关键)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: headers,
      body: ''
    };
  }

  // 仅允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);
    
    if (!payload.image) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing image data' }) };
    }

    const imageBuffer = Buffer.from(payload.image, 'base64');
    const form = new FormData();
    
    // Catbox API Parameters
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
      timeout: 30000,
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
