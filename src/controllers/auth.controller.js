import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { logger } from '../config/db.config.js';
import { ApiResponse } from '../utils/apiResponse.js';

const JWT_SECRET = process.env.JWT_SECRET || 'jarvis_secret_key_production_token_default';

export const register = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return ApiResponse.error(res, 'Username and password are required', ['Missing fields'], 400);
    }

    const isMongoConnected = mongoose.connection.readyState === 1;
    if (!isMongoConnected) {
      return ApiResponse.error(res, 'Database offline. Registration is temporarily disabled.', ['Database unavailable'], 503);
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return ApiResponse.error(res, 'Username already exists', ['Conflict'], 400);
    }

    const user = new User({ username, password });
    await user.save();

    return ApiResponse.success(res, 'User registered successfully', { id: user._id, username: user.username }, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return ApiResponse.error(res, 'Username and password are required', ['Missing fields'], 400);
    }

    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      if (username === 'tony' && password === 'stark') {
        const token = jwt.sign({ id: 'mock-user-id', username: 'tony' }, JWT_SECRET, { expiresIn: '24h' });
        req.session.token = token;
        return ApiResponse.success(res, 'Authenticated in offline simulation mode', {
          token,
          user: { id: 'mock-user-id', username: 'tony' }
        });
      }
      return ApiResponse.error(res, 'Database offline. Standard authentication unavailable.', ['Database unavailable'], 503);
    }

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return ApiResponse.error(res, 'Invalid username or password', ['Unauthorized'], 401);
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    req.session.token = token;

    return ApiResponse.success(res, 'Login successful', {
      token,
      user: { id: user._id, username: user.username }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error(`Logout session destroy failed: ${err.message}`);
      return ApiResponse.error(res, 'Could not log out', [err.message], 500);
    }
    return ApiResponse.success(res, 'Logged out successfully');
  });
};

export const getStatus = (req, res) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.session && req.session.token) {
    token = req.session.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return ApiResponse.success(res, 'Authenticated', { authenticated: true, user: { id: decoded.id, username: decoded.username } });
    } catch (err) {
      // Invalid token
    }
  }

  return ApiResponse.success(res, 'Unauthenticated', { authenticated: false });
};
