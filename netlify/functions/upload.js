const axios = require('axios');

exports.handler = async (event, context) => {
  // 仅允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 1. 获取前端上传的数据
    // Netlify 接收到的二进制数据通常是 Base64 编码的
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');

    // 2. 获取 Content-Type (包含 boundary，非常重要)
    // 头部可能是大小写敏感的，做一下兼容
    const headers = event.headers;
    const contentType = headers['content-type'] || headers['Content-Type'];

    if (!contentType) {
      return { statusCode: 400, body: 'Missing Content-Type' };
    }

    // 3. 生成随机 Token (如果不想用硬编码的)
    const authToken = 'AuroraProxy_' + Math.random().toString(36).substr(2, 9);

    // 4. 转发请求给图床
    const response = await axios.post('https://i.111666.best/image', bodyBuffer, {
      headers: {
        'Content-Type': contentType,
        'Auth-Token': authToken
      },
      // 告诉 axios 不要处理响应数据，我们需要原始数据
      responseType: 'text', 
      // 设置最大内容长度，防止上传大文件报错 (例如 10MB)
      maxContentLength: 10 * 1024 * 1024,
      maxBodyLength: 10 * 1024 * 1024
    });

    // 5. 返回图床的响应给前端
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // 允许跨域
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    };

  } catch (error) {
    console.error('Proxy Error:', error.message);
    if (error.response) {
      console.error('Remote Error Data:', error.response.data);
    }

    return {
      statusCode: error.response ? error.response.status : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Upload failed via proxy',
        details: error.message,
        remote_data: error.response ? error.response.data : null
      })
    };
  }
};
