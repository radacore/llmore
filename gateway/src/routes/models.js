const express = require('express');
const axios = require('axios');
const router = express.Router();
const authenticate = require('../middleware/auth');

const ASKCODI_API_URL = process.env.ASKCODI_API_URL || 'https://api.askcodi.com/v1';
const ASKCODI_API_KEY = process.env.ASKCODI_API_KEY || '';

router.get('/models', authenticate, async (req, res) => {
    try {
        // Proxy models list from AskCodi
        const response = await axios.get(`${ASKCODI_API_URL}/models`, {
            headers: {
                'Authorization': `Bearer ${ASKCODI_API_KEY}`,
            },
            timeout: 10000,
        });

        res.json(response.data);
    } catch (error) {
        console.error('Models endpoint error:', error.message);
        // Fallback to hardcoded list if AskCodi unavailable
        res.json({
            object: 'list',
            data: [
                { id: 'anthropic/claude-haiku-4-5', object: 'model', owned_by: 'anthropic' },
                { id: 'anthropic/claude-sonnet-4-6', object: 'model', owned_by: 'anthropic' },
                { id: 'openai/gpt-5.4-mini', object: 'model', owned_by: 'openai' },
                { id: 'google/gemini-2.5-flash', object: 'model', owned_by: 'google' },
                { id: 'deepseek/deepseek-v4-flash', object: 'model', owned_by: 'deepseek' },
            ],
        });
    }
});

module.exports = router;
