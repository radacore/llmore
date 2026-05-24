const axios = require('axios');

const UPSTREAM_API_URL = process.env.UPSTREAM_API_URL || 'http://llm-proxy:9898/v1';
const UPSTREAM_API_KEY = process.env.UPSTREAM_API_KEY || '';
const DEFAULT_MODEL = process.env.UPSTREAM_DEFAULT_MODEL || 'anthropic/claude-opus-4.7';

function buildHeaders(extra = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...extra,
    };
    if (UPSTREAM_API_KEY) {
        headers['Authorization'] = `Bearer ${UPSTREAM_API_KEY}`;
    }
    return headers;
}

function buildPayload(messages, options, { stream }) {
    const payload = {
        model: options.model || DEFAULT_MODEL,
        messages,
        stream,
        max_tokens: options.max_tokens || 1024,
        temperature: options.temperature ?? 0.7,
    };

    if (options.top_p !== undefined) payload.top_p = options.top_p;
    if (options.frequency_penalty !== undefined) payload.frequency_penalty = options.frequency_penalty;
    if (options.presence_penalty !== undefined) payload.presence_penalty = options.presence_penalty;

    return payload;
}

async function streamCompletion(messages, options = {}) {
    return axios({
        method: 'post',
        url: `${UPSTREAM_API_URL}/chat/completions`,
        headers: buildHeaders({ Accept: 'text/event-stream' }),
        data: buildPayload(messages, options, { stream: true }),
        responseType: 'stream',
        timeout: 120000,
    });
}

async function completion(messages, options = {}) {
    const response = await axios({
        method: 'post',
        url: `${UPSTREAM_API_URL}/chat/completions`,
        headers: buildHeaders(),
        data: buildPayload(messages, options, { stream: false }),
        timeout: 120000,
    });

    return response.data;
}

async function listModels() {
    const response = await axios({
        method: 'get',
        url: `${UPSTREAM_API_URL}/models`,
        headers: buildHeaders(),
        timeout: 10000,
    });

    return response.data;
}

module.exports = {
    streamCompletion,
    completion,
    listModels,
    UPSTREAM_API_URL,
    DEFAULT_MODEL,
};
