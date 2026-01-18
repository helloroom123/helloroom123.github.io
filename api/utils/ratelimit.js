const { Redis } = require('@upstash/redis');

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://mint-parakeet-36951.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "AZBXAAIncDFhMzQ2ZDAyOGY4N2Y0NzlhODhkYjI2NDFiNTdkMTNiZXAxMzY5NTE",
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
