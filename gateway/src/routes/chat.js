const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const authenticate = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');
const { streamCompletion, completion } = require('../services/askcodi');
const { checkQuota, deductQuota } = require('../services/quota');
const { countTokens, countMessagesTokens } = require('../utils/tokenCounter');
const redis = require('../services/redis');

router.post('/completions', authenticate, rateLimit, async (req, res) => {
    const requestId = `llm-${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const startTime = Date.now();

    try {
        const { messages, model, stream, max_tokens, temperature, top_p, frequency_penalty, presence_penalty } = req.body;

        // Validate request
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: { type: 'invalid_request', message: 'messages is required and must be a non-empty array' }
            });
        }

        // Validate each message
        for (const msg of messages) {
            if (!msg.role || !msg.content) {
                return res.status(400).json({
                    error: { type: 'invalid_request', message: 'Each message must have role and content' }
                });
            }
            if (!['system', 'user', 'assistant'].includes(msg.role)) {
                return res.status(400).json({
                    error: { type: 'invalid_request', message: 'Invalid message role. Must be system, user, or assistant' }
                });
            }
        }

        const { user_id, api_key_id, subscription_id } = req.apiKeyData;

        // Check quota
        const quotaInfo = await checkQuota(user_id);
        if (!quotaInfo.hasQuota) {
            return res.status(402).json({
                error: {
                    type: 'quota_exceeded',
                    message: 'Token quota exceeded. Please upgrade your plan or top up.',
                    quota: { total: quotaInfo.total, used: quotaInfo.used, remaining: 0 }
                }
            });
        }

        // Count prompt tokens
        const promptTokens = countMessagesTokens(messages);

        // Check if we have enough tokens for at least the prompt
        if (promptTokens > quotaInfo.remaining) {
            return res.status(402).json({
                error: {
                    type: 'quota_exceeded',
                    message: 'Insufficient tokens for this request.',
                    quota: { total: quotaInfo.total, used: quotaInfo.used, remaining: quotaInfo.remaining }
                }
            });
        }

        const options = {
            model: model || 'askcodi-default',
            max_tokens: Math.min(max_tokens || 1024, 4096),
            temperature: temperature ?? 0.7,
            top_p,
            frequency_penalty,
            presence_penalty,
        };

        // Determine if streaming
        const isStreaming = stream !== false; // Default to streaming

        if (isStreaming) {
            // === STREAMING RESPONSE ===
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Request-Id', requestId);
            res.flushHeaders();

            let completionText = '';
            let completionTokens = 0;

            try {
                const upstream = await streamCompletion(messages, options);
                let buffer = '';

                upstream.data.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: ')) continue;

                        const data = trimmed.substring(6);

                        if (data === '[DONE]') {
                            // Calculate final tokens and deduct
                            completionTokens = countTokens(completionText);
                            const totalTokens = promptTokens + completionTokens;

                            // Deduct quota (fire and forget, non-blocking)
                            deductQuota(user_id, totalTokens).catch(err => {
                                console.error('Failed to deduct quota:', err);
                            });

                            // Log usage (fire and forget)
                            logUsage(user_id, api_key_id, subscription_id, options.model, promptTokens, completionTokens, Date.now() - startTime, 200, req.ip).catch(() => {});

                            // Send final event with usage
                            const usageEvent = {
                                id: requestId,
                                object: 'chat.completion.chunk',
                                created: Math.floor(Date.now() / 1000),
                                model: options.model,
                                choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
                                usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: totalTokens }
                            };
                            res.write(`data: ${JSON.stringify(usageEvent)}\n\n`);
                            res.write('data: [DONE]\n\n');
                            res.end();
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            // Extract content from delta
                            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                                completionText += parsed.choices[0].delta.content;
                            }

                            // Re-wrap with our ID and forward
                            const outEvent = {
                                id: requestId,
                                object: 'chat.completion.chunk',
                                created: Math.floor(Date.now() / 1000),
                                model: options.model,
                                choices: parsed.choices || [],
                            };
                            res.write(`data: ${JSON.stringify(outEvent)}\n\n`);
                        } catch (parseErr) {
                            // If we can't parse, forward as-is
                            res.write(`${trimmed}\n\n`);
                        }
                    }
                });

                upstream.data.on('end', () => {
                    if (!res.writableEnded) {
                        // If stream ended without [DONE], finalize
                        completionTokens = countTokens(completionText);
                        const totalTokens = promptTokens + completionTokens;
                        deductQuota(user_id, totalTokens).catch(() => {});
                        logUsage(user_id, api_key_id, subscription_id, options.model, promptTokens, completionTokens, Date.now() - startTime, 200, req.ip).catch(() => {});
                        res.write('data: [DONE]\n\n');
                        res.end();
                    }
                });

                upstream.data.on('error', (err) => {
                    console.error('Upstream stream error:', err);
                    if (!res.writableEnded) {
                        const errorEvent = { error: { type: 'upstream_error', message: 'AI service stream error' } };
                        res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
                        res.end();
                    }
                });

            } catch (upstreamError) {
                console.error('Upstream connection error:', upstreamError.message);
                if (!res.headersSent) {
                    return res.status(503).json({
                        error: { type: 'upstream_unavailable', message: 'AI service is currently unavailable' }
                    });
                }
                if (!res.writableEnded) {
                    res.write(`data: ${JSON.stringify({ error: { type: 'upstream_unavailable', message: 'AI service error' } })}\n\n`);
                    res.end();
                }
            }

        } else {
            // === NON-STREAMING RESPONSE ===
            try {
                const result = await completion(messages, options);

                // Get token counts from response or estimate
                const respPromptTokens = result.usage?.prompt_tokens || promptTokens;
                const respCompletionTokens = result.usage?.completion_tokens || countTokens(result.choices?.[0]?.message?.content || '');
                const totalTokens = respPromptTokens + respCompletionTokens;

                // Deduct quota
                const deducted = await deductQuota(user_id, totalTokens);
                if (!deducted) {
                    return res.status(402).json({
                        error: { type: 'quota_exceeded', message: 'Insufficient tokens to complete this request' }
                    });
                }

                // Log usage
                await logUsage(user_id, api_key_id, subscription_id, options.model, respPromptTokens, respCompletionTokens, Date.now() - startTime, 200, req.ip).catch(() => {});

                // Return response with our format
                res.json({
                    id: requestId,
                    object: 'chat.completion',
                    created: Math.floor(Date.now() / 1000),
                    model: options.model,
                    choices: result.choices || [],
                    usage: {
                        prompt_tokens: respPromptTokens,
                        completion_tokens: respCompletionTokens,
                        total_tokens: totalTokens,
                    },
                });

            } catch (upstreamError) {
                console.error('Upstream error:', upstreamError.message);
                logUsage(user_id, api_key_id, subscription_id, options.model, promptTokens, 0, Date.now() - startTime, 503, req.ip).catch(() => {});
                return res.status(503).json({
                    error: { type: 'upstream_unavailable', message: 'AI service is currently unavailable' }
                });
            }
        }

    } catch (error) {
        console.error('Chat completion error:', error);
        res.status(500).json({
            error: { type: 'internal_error', message: 'Internal server error' }
        });
    }
});

/**
 * Log usage to Redis (will be synced to PostgreSQL by Laravel)
 */
async function logUsage(userId, apiKeyId, subscriptionId, model, promptTokens, completionTokens, responseTimeMs, statusCode, ipAddress) {
    const log = {
        user_id: userId,
        api_key_id: apiKeyId,
        subscription_id: subscriptionId,
        model,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
        response_time_ms: responseTimeMs,
        status_code: statusCode,
        ip_address: ipAddress || '',
        created_at: new Date().toISOString(),
    };

    // Push to Redis list for batch processing by Laravel
    await redis.rpush('usage_logs_queue', JSON.stringify(log));
}

module.exports = router;
