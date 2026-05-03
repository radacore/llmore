const crypto = require('crypto');
const redis = require('../services/redis');

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: { type: 'invalid_api_key', message: 'Missing Authorization header' }
            });
        }

        const apiKey = authHeader.substring(7); // Remove "Bearer "
        
        if (!apiKey.startsWith('llm_sk_')) {
            return res.status(401).json({
                error: { type: 'invalid_api_key', message: 'Invalid API key format' }
            });
        }

        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
        const cached = await redis.get(`apikey:${keyHash}`);

        if (!cached) {
            return res.status(401).json({
                error: { type: 'invalid_api_key', message: 'Invalid or expired API key' }
            });
        }

        const keyData = JSON.parse(cached);

        if (keyData.status !== 'active') {
            return res.status(401).json({
                error: { type: 'invalid_api_key', message: 'API key has been revoked' }
            });
        }

        req.apiKeyData = keyData;
        req.keyHash = keyHash;

        // Fire and forget: update last_used_at
        redis.set(`apikey_last_used:${keyData.api_key_id}`, new Date().toISOString()).catch(() => {});

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            error: { type: 'internal_error', message: 'Authentication service error' }
        });
    }
}

module.exports = authenticate;
