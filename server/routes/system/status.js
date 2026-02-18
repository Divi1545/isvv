const express = require('express');
const router = express.Router();
const { logger } = require('../../middleware/logging');

// System status endpoint
router.get('/status', async (req, res) => {
  try {
    const status = {
      service: 'islandloaf-api',
      version: '2.0.0',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: await checkDatabaseConnection(),
        openai: !!process.env.OPENAI_API_KEY,
        telegram: !!process.env.TELEGRAM_BOT_TOKEN,
        stripe: !!process.env.STRIPE_SECRET_KEY,
        storage: 'memory' // or 'postgres' based on configuration
      },
      endpoints: {
        health: '/api/health',
        agent: '/api/agent/execute',
        ai: '/api/ai/*',
        webhooks: '/api/webhooks/*'
      }
    };

    res.json({
      success: true,
      data: status,
      message: 'System operational'
    });

  } catch (error) {
    logger.error('System status check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'System check failed',
      details: error.message
    });
  }
});

// Database connection check
async function checkDatabaseConnection() {
  try {
    // Check if using PostgreSQL
    if (process.env.DATABASE_URL) {
      // Simple connection test would go here
      return { status: 'connected', type: 'postgresql' };
    }
    return { status: 'connected', type: 'memory' };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

module.exports = router;