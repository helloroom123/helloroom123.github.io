exports.handler = async (event, context) => {
  // 仅允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 模拟后端记录“不支持者”的信息 (Log to Netlify console)
  console.log(`[JUMPSCARE TRIGGERED] User Agent: ${event.headers['user-agent']}`);

  // 返回恶搞的“诅咒”数据
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
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
