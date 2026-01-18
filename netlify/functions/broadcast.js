const { pusher } = require('./utils/pusher');

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Bot-Secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    // Auth Check
    const secret = event.headers['x-bot-secret'] || event.headers['X-Bot-Secret'];
    // Hardcoded key for simplicity, matches admin key
    if (secret !== 'Aurora2026ProjectGroupKey') {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const payload = JSON.parse(event.body);
    
    // Validate payload
    if (!payload.message || !payload.sender) {
        return { statusCode: 400, headers, body: 'Missing fields' };
    }

    // Trigger Pusher
    // Channel: aurora-monitor
    // Event: group-message
    await pusher.trigger("aurora-monitor", "group-message", {
        group_id: payload.group_id,
        sender: payload.sender, // Expecting { nickname, user_id, card }
        message: payload.message,
        avatar: `https://q1.qlogo.cn/g?b=qq&nk=${payload.sender.user_id}&s=100`,
        time: new Date().toLocaleTimeString('zh-CN')
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'ok' })
    };

  } catch (error) {
    console.error("Broadcast Error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};