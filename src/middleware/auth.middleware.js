import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

const JWT_SECRET = process.env.JWT_SECRET || 'jarvis_secret_key_production_token_default';

export const requireAuth = (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    } else if (req.session && req.session.token) {
      token = req.session.token;
    }

    if (!token) {
      return ApiResponse.error(res, 'Authentication token missing or invalid', ['Unauthorized access'], 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username };
    return next();
  } catch (error) {
    return ApiResponse.error(res, 'Invalid or expired authentication token', [error.message], 401);
  }
};
