import { logger } from '../config/db.config.js';

/**
 * Groq does not provide a dedicated embeddings API.
 * This generates a normalized pseudo-random float vector as a fallback.
 * Replace with a real embedding service (e.g. HuggingFace) if needed.
 */
export const getEmbedding = async (text, dimension = 1024) => {
  logger.warn(`Groq does not support embeddings. Using pseudo-random vector for: "${text.substring(0, 40)}..."`);
  const vector = Array.from({ length: dimension }, () => Math.random() - 0.5);
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / (magnitude || 1));
};
