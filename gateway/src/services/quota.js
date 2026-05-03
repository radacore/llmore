const redis = require('./redis');

// Lua script for atomic check-and-deduct
const DEDUCT_SCRIPT = `
local used = tonumber(redis.call('hget', KEYS[1], 'used'))
local total = tonumber(redis.call('hget', KEYS[1], 'total'))
local tokens = tonumber(ARGV[1])
if used == nil or total == nil then
    return -1
end
if (used + tokens) > total then
    return 0
end
redis.call('hincrby', KEYS[1], 'used', tokens)
return 1
`;

/**
 * Check if user has remaining quota
 */
async function checkQuota(userId) {
    const key = `quota:${userId}`;
    const data = await redis.hgetall(key);

    if (!data || !data.total) {
        return { hasQuota: false, remaining: 0, total: 0, used: 0 };
    }

    const total = parseInt(data.total);
    const used = parseInt(data.used || '0');
    const remaining = total - used;

    return {
        hasQuota: remaining > 0,
        remaining,
        total,
        used,
        subscriptionId: data.subscription_id,
    };
}

/**
 * Deduct tokens from quota (atomic operation)
 */
async function deductQuota(userId, tokens) {
    const key = `quota:${userId}`;
    const result = await redis.eval(DEDUCT_SCRIPT, 1, key, tokens);
    
    // -1 = key not found, 0 = insufficient quota, 1 = success
    return result === 1;
}

/**
 * Get quota info for usage endpoint
 */
async function getQuotaInfo(userId) {
    const key = `quota:${userId}`;
    const data = await redis.hgetall(key);

    if (!data || !data.total) {
        return null;
    }

    const total = parseInt(data.total);
    const used = parseInt(data.used || '0');

    return {
        total,
        used,
        remaining: total - used,
        percentage: total > 0 ? Math.round((used / total) * 100) : 0,
        subscriptionId: data.subscription_id,
    };
}

module.exports = { checkQuota, deductQuota, getQuotaInfo };
