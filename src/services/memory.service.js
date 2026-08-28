import Memory from '../models/memory.model.js';
import { logger } from '../config/db.config.js';

export const getConversationHistory = async (userId = null, limit = 20) => {
  try {
    const query = userId ? { userId } : {};
    return await Memory.find(query).sort({ timestamp: -1 }).limit(limit);
  } catch (err) {
    logger.error(`Error fetching conversation history: ${err.message}`);
    return [];
  }
};
