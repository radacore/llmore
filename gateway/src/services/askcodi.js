const axios = require('axios');

const ASKCODI_API_URL = process.env.ASKCODI_API_URL || 'https://api.askcodi.com/v1';
const ASKCODI_API_KEY = process.env.ASKCODI_API_KEY || '';

/**
 * Forward request ke AskCodi dan return streaming response
 */
async function streamCompletion(messages, options = {}) {
    const payload = {
        model: options.model || 'anthropic/claude-haiku-4-5',
        messages,
        stream: true,
        max_tokens: options.max_tokens || 1024,
        temperature: options.temperature ?? 0.7,
    };

    if (options.top_p !== undefined) payload.top_p = options.top_p;
    if (options.frequency_penalty !== undefined) payload.frequency_penalty = options.frequency_penalty;
    if (options.presence_penalty !== undefined) payload.presence_penalty = options.presence_penalty;

    const response = await axios({
        method: 'post',
        url: `${ASKCODI_API_URL}/chat/completions`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ASKCODI_API_KEY}`,
            'Accept': 'text/event-stream',
        },
        data: payload,
        responseType: 'stream',
        timeout: 120000, // 2 minute timeout
    });

    return response;
}

/**
 * Non-streaming completion
 */
async function completion(messages, options = {}) {
    const payload = {
        model: options.model || 'anthropic/claude-haiku-4-5',
        messages,
        stream: false,
        max_tokens: options.max_tokens || 1024,
        temperature: options.temperature ?? 0.7,
    };

    if (options.top_p !== undefined) payload.top_p = options.top_p;
    if (options.frequency_penalty !== undefined) payload.frequency_penalty = options.frequency_penalty;
    if (options.presence_penalty !== undefined) payload.presence_penalty = options.presence_penalty;

    const response = await axios({
        method: 'post',
        url: `${ASKCODI_API_URL}/chat/completions`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ASKCODI_API_KEY}`,
        },
        data: payload,
        timeout: 120000,
    });

    return response.data;
}

module.exports = { streamCompletion, completion };
