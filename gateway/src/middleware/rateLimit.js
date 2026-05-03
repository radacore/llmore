const redis = require('../services/redis');

async function rateLimit(req, res, next) {
    try {
        const { api_key_id, rate_limit_per_minute } = req.apiKeyData;
        
        if (!rate_limit_per_minute || rate_limit_per_minute <= 0) {
            return next(); // No rate limit (enterprise/custom)
        }

        const currentMinute = Math.floor(Date.now() / 60000);
        const key = `ratelimit:${api_key_id}:${currentMinute}`;

        const current = await redis.incr(key);
        
        if (current === 1) {
            await redis.expire(key, 60);
        }

        // Set rate limit headers
        res.set('X-RateLimit-Limit', rate_limit_per_minute.toString());
        res.set('X-RateLimit-Remaining', Math.max(0, rate_limit_per_minute - current).toString());

        if (current > rate_limit_per_minute) {
            return res.status(429).json({
                error: {
                    type: 'rate_limit_exceeded',
                    message: `Rate limit exceeded. Maximum ${rate_limit_per_minute} requests per minute.`,
                }
            });
        }

        next();
    } catch (error) {
        console.error('Rate limit error:', error);
        // Fail open — jika Redis error, biarkan request lewat
        next();
    }
}

module.exports = rateLimit;
