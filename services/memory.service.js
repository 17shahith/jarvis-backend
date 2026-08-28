import Memory from '../models/memory.model.js';
import mongoose from 'mongoose';
import { logger } from '../config/db.config.js';

// Local backup array if MongoDB is offline
const localMemorySession = [];

export const saveMessage = async (role, message, userId = null) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  if (isMongoConnected) {
    try {
      const log = new Memory({
        role,
        message,
        userId: userId ? new mongoose.Types.ObjectId(userId) : null
      });
      await log.save();
      return log;
    } catch (error) {
      logger.error(`Error saving message to MongoDB: ${error.message}`);
    }
  }

  // Local backup in-memory storage
  const logItem = {
    role,
    message,
    userId,
    timestamp: new Date()
  };
  localMemorySession.push(logItem);
  if (localMemorySession.length > 50) localMemorySession.shift(); // Keep last 50 items
  return logItem;
};

export const getHistory = async (userId = null, limit = 20) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  if (isMongoConnected) {
    try {
      const query = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
      return await Memory.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .then(docs => docs.reverse());
    } catch (error) {
      logger.error(`Error fetching message history: ${error.message}`);
      return [];
    }
  }

  return localMemorySession;
};
