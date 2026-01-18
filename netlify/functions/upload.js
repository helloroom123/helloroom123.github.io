const axios = require('axios');
const FormData = require('form-data');
const https = require('https');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);
    
    if (!payload.image) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing image data' }) };
    }

    const imageBuffer = Buffer.from(payload.image, 'base64');
    const form = new FormData();
    form.append('image', imageBuffer, {
      filename: payload.filename || 'upload.png',
      contentType: 'image/png' // Explicit content type helps
    });

    const authToken = 'AuroraProxy_' + Math.random().toString(36).substr(2, 9);
    
    // Create a custom agent to ignore SSL errors if that's the issue
    const agent = new https.Agent({  
      rejectUnauthorized: false
    });

    console.log('Proxying upload to i.111666.best...');

    const response = await axios.post('https://i.111666.best/image', form, {
      headers: {
        ...form.getHeaders(),
        'Auth-Token': authToken,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Connection': 'keep-alive'
      },
      httpsAgent: agent,
      timeout: 25000, // 25 seconds timeout (Netlify function limit is 10s default, but we can try)
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('Upload success:', response.data);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    };

  } catch (error) {
    console.error('Proxy Error Details:', error.message);
    if (error.response) {
      console.error('Remote Response:', error.response.status, error.response.data);
    }

    // Return the actual error to the frontend for display
    return {
      statusCode: error.response ? error.response.status : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Proxy Upload Failed',
        message: error.message,
        details: error.response ? error.response.data : 'No remote response'
      })
    };
  }
};
