import axios from 'axios';
import { getEmbedding } from './embeddings.service.js';
import Memory from '../models/memory.model.js';
import { logger } from '../config/db.config.js';

let cachedIndexHost = null;

// Resolve index host URL from Pinecone Control Plane
const getPineconeHost = async () => {
  if (cachedIndexHost) return cachedIndexHost;

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    return null;
  }

  try {
    const response = await axios.get('https://api.pinecone.io/indexes/jarvis', {
      headers: { 'Api-Key': apiKey },
      timeout: 5000
    });
    cachedIndexHost = response.data?.host;
    if (cachedIndexHost) {
      logger.info(`Resolved Pinecone index host: ${cachedIndexHost}`);
    }
    return cachedIndexHost;
  } catch (error) {
    logger.error(`Failed to describe Pinecone index: ${error.message}`);
    return null;
  }
};

/**
 * Upsert semantic vector memory into Pinecone Index
 */
export const saveSemanticMemory = async (messageId, text, metadata = {}) => {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) return false;

  try {
    const host = await getPineconeHost();
    if (!host) return false;

    // 1. Generate embedding vector
    const values = await getEmbedding(text);
    if (!values) return false;

    // 2. Upsert vector to Pinecone
    const url = `https://${host}/vectors/upsert`;
    const payload = {
      vectors: [
        {
          id: messageId,
          values: values,
          metadata: {
            text: text.substring(0, 1000), // Limit metadata text size
            timestamp: new Date().toISOString(),
            ...metadata
          }
        }
      ]
    };

    const res = await axios.post(url, payload, {
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    return res.status === 200;
  } catch (error) {
    logger.error(`Pinecone semantic upsert error: ${error.message}`);
    return false;
  }
};

/**
 * Save user query/assistant reply into both MongoDB (Structured) and Pinecone (Semantic)
 */
export const storeInteraction = async (role, text, userId = null, category = 'episodic') => {
  try {
    // 1. Save in MongoDB
    const log = new Memory({
      role,
      message: text,
      userId
    });
    await log.save();

    // 2. Save in Pinecone vectors
    await saveSemanticMemory(log._id.toString(), text, {
      role,
      userId: userId ? userId.toString() : 'anonymous',
      category
    });

    return log;
  } catch (error) {
    logger.error(`Failed to store interaction: ${error.message}`);
    // Safe fallback to save in MongoDB if vector database is down
    try {
      const log = new Memory({ role, message: text, userId });
      await log.save();
      return log;
    } catch (dbErr) {
      logger.error(`Ultimate database write error: ${dbErr.message}`);
      return null;
    }
  }
};
