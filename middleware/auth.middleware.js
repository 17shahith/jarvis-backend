import jwt from 'jsonwebtoken';
import { logger } from '../config/db.config.js';

const JWT_SECRET = process.env.JWT_SECRET || 'jarvis_secret_key';

export const requireAuth = (req, res, next) => {
  // Bypass authentication and set mock user
  req.user = { id: 'mock-user-id', username: 'tony' };
  return next();
};
