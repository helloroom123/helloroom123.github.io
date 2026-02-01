const { pusher } = require('./utils/pusher');
// Use Environment Variable for Secret Key
const SECRET_KEY = process.env.BROADCAST_SECRET_KEY;
const { getCorsOrigin, setCorsHeaders } = require('./utils/cors');

module.exports = async (req, res) => {
  // CORS Handling
  const allowOrigin = getCorsOrigin(req);
  setCorsHeaders(res, allowOrigin);

  if (req.method === 'OPTIONS') return res.status(200).end();
    
  // Validate Origin
  if (allowOrigin === 'null') {
      return res.status(403).json({ error: 'Forbidden Origin' });
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  if (!SECRET_KEY) {
      console.error('Configuration Error: BROADCAST_SECRET_KEY is missing.');
      return res.status(500).json({ error: 'Server Configuration Error' });
  }

  try {
    // Authentication
    const secret = req.headers['x-bot-secret'] || req.headers['X-Bot-Secret'];
    if (secret !== SECRET_KEY) {
        console.warn("Unauthorized broadcast attempt");
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Body parsing: Vercel parses JSON automatically if Content-Type is application/json
    let payload = req.body;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            return res.status(400).send('Invalid JSON');
        }
    }

    console.log("Broadcasting message from:", payload.sender ? payload.sender.nickname : 'Unknown');

    // Trigger Pusher
    // Channel: aurora-chat
    // Event: group-message
    await pusher.trigger("aurora-chat", "group-message", {
        group_id: payload.group_id,
        sender: payload.sender || { nickname: 'Unknown', user_id: 0 },
        message: payload.message || '',
        avatar: payload.sender ? `https://q1.qlogo.cn/g?b=qq&nk=${payload.sender.user_id}&s=100` : '',
        time: new Date().toLocaleTimeString('zh-CN'),
        raw: payload // For debugging
    });

    return res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error("Broadcast Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
