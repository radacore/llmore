const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getQuotaInfo } = require('../services/quota');

router.get('/usage', authenticate, async (req, res) => {
    try {
        const { user_id, plan_slug, rate_limit_per_minute } = req.apiKeyData;
        
        const quota = await getQuotaInfo(user_id);
        
        if (!quota) {
            return res.status(404).json({
                error: { type: 'not_found', message: 'No active subscription found' }
            });
        }

        res.json({
            plan: plan_slug,
            quota_total: quota.total,
            quota_used: quota.used,
            quota_remaining: quota.remaining,
            usage_percentage: quota.percentage,
            rate_limit: `${rate_limit_per_minute}/min`,
        });
    } catch (error) {
        console.error('Usage endpoint error:', error);
        res.status(500).json({
            error: { type: 'internal_error', message: 'Failed to retrieve usage information' }
        });
    }
});

module.exports = router;
