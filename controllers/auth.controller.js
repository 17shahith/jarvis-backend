import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { logger } from '../config/db.config.js';

const JWT_SECRET = process.env.JWT_SECRET || 'jarvis_secret_key';

export const register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const isMongoConnected = mongoose.connection.readyState === 1;
  if (!isMongoConnected) {
    return res.status(503).json({ error: 'Database offline. Registration is temporarily disabled.' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = new User({ username, password });
    await user.save();

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const isMongoConnected = mongoose.connection.readyState === 1;

  // Fallback credentials if database is offline (for local dev testing)
  if (!isMongoConnected) {
    if (username === 'tony' && password === 'stark') {
      const token = jwt.sign({ id: 'mock-user-id', username: 'tony' }, JWT_SECRET, { expiresIn: '24h' });
      req.session.user = { id: 'mock-user-id', username: 'tony' };
      return res.status(200).json({ success: true, token, user: { username: 'tony' }, note: 'Running in offline db mode' });
    }
    return res.status(503).json({ error: 'Database offline. Only default user "tony" with password "stark" is authorized.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    
    // Set session data
    req.session.user = { id: user._id, username: user.username };

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, username: user.username }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error(`Logout session destroy failed: ${err.message}`);
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
};

export const getStatus = (req, res) => {
  if (req.session.user) {
    return res.status(200).json({ authenticated: true, user: req.session.user });
  }

  // Also verify authorization header if JWT is used
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.status(200).json({ authenticated: true, user: { id: decoded.id, username: decoded.username } });
    } catch (err) {
      // Token invalid
    }
  }

  res.status(200).json({ authenticated: false });
};
