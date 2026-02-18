import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import path from 'path';

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'islandloaf-api' },
  transports: [
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log') 
    })
  ]
});

// Add console output in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logger middleware
const requestLogger = (req, res, next) => {
  req.requestId = uuidv4();
  req.startTime = Date.now();
  
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Log response when request completes
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - req.startTime;
    
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      responseSize: Buffer.byteLength(data),
      timestamp: new Date().toISOString()
    });

    return originalSend.call(this, data);
  };

  next();
};

// Error logger middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Request error', {
    requestId: req.requestId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  next(err);
};

export {
  requestLogger,
  errorLogger,
  logger
};