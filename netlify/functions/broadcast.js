const Pusher = require('pusher');

// 复用硬编码的 Key 以防环境变量未生效 (仅用于调试，实际应走环境变量)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2103443",
  key: process.env.PUSHER_KEY || "2c6a6d2d91a43714d013",
  secret: process.env.PUSHER_SECRET || "701702118a29427eff49",
  cluster: process.env.PUSHER_CLUSTER || "mt1",
  useTLS: true
});

const SECRET_KEY = 'Aurora2026ProjectGroupKey';

exports.handler = async (event, context) => {
  // CORS 处理
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
    // 鉴权
    const secret = event.headers['x-bot-secret'] || event.headers['X-Bot-Secret'];
    if (secret !== SECRET_KEY) {
        console.warn("Unauthorized access attempt");
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    let payload;
    try {
        payload = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, headers, body: 'Invalid JSON' };
    }

    console.log("Broadcasting message from:", payload.sender ? payload.sender.nickname : 'Unknown');

    // 触发 Pusher
    // Channel: aurora-monitor
    // Event: group-message
    await pusher.trigger("aurora-monitor", "group-message", {
        group_id: payload.group_id,
        sender: payload.sender || { nickname: 'Unknown', user_id: 0 },
        message: payload.message || '',
        avatar: payload.sender ? `https://q1.qlogo.cn/g?b=qq&nk=${payload.sender.user_id}&s=100` : '',
        time: new Date().toLocaleTimeString('zh-CN'),
        raw: payload // 方便调试
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