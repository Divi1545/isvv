const jwt = require('jsonwebtoken');
const { logger } = require('./logging');

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    // Check for session-based auth first (existing system)
    if (req.session && req.session.user) {
      req.user = req.session.user;
      return next();
    }

    // Check for token-based auth (for API access)
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.query.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    req.user = decoded;
    next();

  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    res.status(401).json({
      success: false,
      error: 'Invalid authentication',
      code: 'INVALID_AUTH'
    });
  }
};

// Authorization middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    // Convert string to array
    if (typeof roles === 'string') {
      roles = [roles];
    }

    // Check if user has required role
    if (roles.length && !roles.includes(req.user.role || req.user.userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles
      });
    }

    next();
  };
};

// API key validation for external services
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey || apiKey !== process.env.AGENT_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  validateApiKey
};