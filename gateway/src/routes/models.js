const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { listModels } = require('../services/upstream');

router.get('/models', authenticate, async (req, res) => {
    try {
        const data = await listModels();
        res.json(data);
    } catch (error) {
        console.error('Models endpoint error:', error.message);
        res.json({
            object: 'list',
            data: [
                { id: 'anthropic/claude-opus-4.7', object: 'model', owned_by: 'anthropic' },
                { id: 'anthropic/claude-sonnet-4-6', object: 'model', owned_by: 'anthropic' },
                { id: 'openai/gpt-5.4-mini', object: 'model', owned_by: 'openai' },
                { id: 'google/gemini-2.5-flash', object: 'model', owned_by: 'google' },
                { id: 'deepseek/deepseek-v4-flash', object: 'model', owned_by: 'deepseek' },
            ],
        });
    }
});

module.exports = router;
