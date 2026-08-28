import { logger } from '../config/db.config.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`Express error: ${err.message}\nStack: ${err.stack}`);
  
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    error: message,
    // Avoid sending full stack details in production
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
