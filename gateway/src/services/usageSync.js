const redis = require('./redis');

/**
 * Process usage logs from Redis queue.
 * This can be run as a separate worker or called periodically.
 * Alternatively, Laravel's scheduled command can process these.
 */
async function processUsageLogs(batchSize = 100) {
    const logs = [];
    
    for (let i = 0; i < batchSize; i++) {
        const log = await redis.lpop('usage_logs_queue');
        if (!log) break;
        
        try {
            logs.push(JSON.parse(log));
        } catch (e) {
            console.error('Failed to parse usage log:', e);
        }
    }
    
    return logs;
}

module.exports = { processUsageLogs };
