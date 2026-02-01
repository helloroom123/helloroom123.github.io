const axios = require('axios');
const FormData = require('form-data');
const https = require('https');
const { pusher } = require('./utils/pusher');
const { checkRateLimit } = require('./utils/ratelimit');
const { supabase } = require('./utils/db');
const { getCorsOrigin, setCorsHeaders } = require('./utils/cors');

module.exports = async (req, res) => {
  const allowOrigin = getCorsOrigin(req);

  // Set CORS headers
  setCorsHeaders(res, allowOrigin);

  // 1. Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 2. Validate Origin
  if (allowOrigin === 'null') {
    return res.status(403).json({ error: 'Forbidden Origin' });
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // 2.5 Rate Limit
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const ip = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0].trim();
    
    const isAllowed = await checkRateLimit(ip, 'upload', 3, 60); // 3 requests per 60s
    
    if (!isAllowed) {
        return res.status(429).json({ error: 'Too Many Requests. Please wait a minute.' });
    }

    // 3. Check Content-Length
    const contentLength = req.headers['content-length'] || req.headers['Content-Length'];
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
         return res.status(413).json({ error: 'Payload too large' });
    }

    // 4. Parse Body
    let payload = req.body;
    if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch(e) {
             return res.status(400).json({ error: 'Invalid JSON' });
        }
    }
    
    if (!payload.image) {
      return res.status(400).json({ error: 'Missing image' });
    }

    // 5. HTTPS Agent
    const agent = new https.Agent({ 
      rejectUnauthorized: false,
      keepAlive: true 
    });

    const imageBuffer = Buffer.from(payload.image, 'base64');
    
    // 5.1 Validate File Signature (Magic Number)
    const signature = imageBuffer.slice(0, 4).toString('hex');
    const isJPEG = signature.startsWith('ffd8');
    const isPNG = signature === '89504e47';
    const isGIF = signature.startsWith('47494638');
    const isWEBP = imageBuffer.slice(8, 12).toString('hex') === '57454250'; // RIFF...WEBP

    if (!isJPEG && !isPNG && !isGIF && !isWEBP) {
        return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, GIF, WEBP are allowed.' });
    }

    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', imageBuffer, {
      filename: payload.filename || 'upload.png',
    });

    // 6. Request to Catbox
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

    // 7. Write to Supabase
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
        }
    } catch (dbErr) {
        console.error("DB Exception:", dbErr);
    }

    // 8. Trigger Pusher
    try {
        await pusher.trigger("aurora-updates", "new-fanart", {
            message: "有人提交了新的 Fanart 作品！",
            imageUrl: imageUrl,
            timestamp: new Date().toISOString()
        });
    } catch (pusherErr) {
        console.error("Pusher trigger failed:", pusherErr);
    }

    return res.status(200).json({
      status: 'success',
      url: imageUrl
    });

  } catch (error) {
    console.error('Upload Error:', error.message);
    return res.status(error.response ? error.response.status : 500).json({
      error: 'Upload Failed',
      message: error.message
    });
  }
};
