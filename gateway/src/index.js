require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const chatRoutes = require('./routes/chat');
const usageRoutes = require('./routes/usage');
const modelsRoutes = require('./routes/models');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'llmore-gateway', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/v1/chat', chatRoutes);
app.use('/v1', usageRoutes);
app.use('/v1', modelsRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: { type: 'internal_error', message: 'Internal server error' } });
});

app.listen(PORT, () => {
    console.log(`LLMore Gateway running on port ${PORT}`);
});
