const axios = require('axios');
const FormData = require('form-data');

exports.handler = async (event, context) => {
  // 仅允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 1. 解析前端传来的 JSON 数据
    const payload = JSON.parse(event.body);
    
    if (!payload.image) {
      return { statusCode: 400, body: 'Missing image data' };
    }

    // 2. 将 Base64 转回 Buffer
    const imageBuffer = Buffer.from(payload.image, 'base64');

    // 3. 构建 FormData
    const form = new FormData();
    // 注意：必须提供 filename，否则某些图床无法识别文件类型
    form.append('image', imageBuffer, {
      filename: payload.filename || 'upload.png'
    });

    // 4. 生成随机 Token
    const authToken = 'AuroraProxy_' + Math.random().toString(36).substr(2, 9);

    // 5. 发送请求给图床
    // form.getHeaders() 会自动生成正确的 Content-Type (包含 boundary)
    const response = await axios.post('https://i.111666.best/image', form, {
      headers: {
        ...form.getHeaders(),
        'Auth-Token': authToken
      },
      responseType: 'text', 
      maxContentLength: 10 * 1024 * 1024,
      maxBodyLength: 10 * 1024 * 1024
    });

    // 6. 返回结果
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    };

  } catch (error) {
    console.error('Proxy Error:', error.message);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Upload failed',
        details: error.message,
        remote_data: error.response ? error.response.data : null
      })
    };
  }
};
