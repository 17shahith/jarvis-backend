import { logger } from '../config/db.config.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || [err.message];

  logger.error(`[${req.method}] ${req.originalUrl} - Status: ${statusCode} - ${message}`);

  return ApiResponse.error(res, message, errors, statusCode, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
