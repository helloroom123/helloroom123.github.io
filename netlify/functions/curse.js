exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // 处理 CORS 预检
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: "CRITICAL_FAILURE",
      message: "SYSTEM_LOCK_INITIATED",
      payload: [
        "不支持是不行的",
        "Aurora is watching you",
        "ERROR: 0x00000000",
        "Deleting System32...",
        "放弃抵抗吧",
        "你的电脑现在属于舒苒了"
      ]
    })
  };
};
