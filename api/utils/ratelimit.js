const { Redis } = require('@upstash/redis');

// Initialize Redis client
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.error("CRITICAL: UPSTASH_REDIS_REST_URL or TOKEN is missing.");
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

/**
 * Rate Limit Check
 * @param {string} ip - User IP address
 * @param {string} action - Action name (e.g., 'upload', 'curse')
 * @param {number} limit - Max requests allowed
 * @param {number} duration - Time window in seconds
 * @returns {Promise<boolean>} - true if allowed, false if blocked
 */
async function checkRateLimit(ip, action, limit = 5, duration = 60) {
  const key = `ratelimit:${action}:${ip}`;
  
  try {
    // Increment the counter
    const count = await redis.incr(key);
    
    // Set expiration only on the first request
    if (count === 1) {
      await redis.expire(key, duration);
    }
    
    return count <= limit;
  } catch (err) {
    console.error('Redis Rate Limit Error:', err);
    // Fail open: If Redis fails, allow the request to proceed (don't block users due to infra error)
    return true;
  }
}

module.exports = { checkRateLimit, redis };
