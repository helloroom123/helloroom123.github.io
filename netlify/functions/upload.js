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
    
    // Catbox API Parameters
    form.append('reqtype', 'fileupload');
    // filename is required for Catbox to detect extension
    form.append('fileToUpload', imageBuffer, {
      filename: payload.filename || 'upload.png',
    });

    // Create a custom agent just in case
    const agent = new https.Agent({  
      rejectUnauthorized: false
    });

    console.log('Proxying upload to Catbox.moe...');

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      httpsAgent: agent,
      timeout: 30000, // 30s timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('Catbox success:', response.data);

    // Catbox returns the URL directly as plain text
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'success',
        url: response.data // Catbox returns the raw URL string
      })
    };

  } catch (error) {
    console.error('Proxy Error Details:', error.message);
    if (error.response) {
      console.error('Remote Response:', error.response.status, error.response.data);
    }

    return {
      statusCode: error.response ? error.response.status : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Upload Failed',
        message: error.message,
        details: error.response ? error.response.data : 'No remote response'
      })
    };
  }
};
