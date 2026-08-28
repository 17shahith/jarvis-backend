import axios from 'axios';
import { getEmbedding } from './embeddings.service.js';
import { logger } from '../config/db.config.js';

let cachedIndexHost = null;

const getPineconeHost = async () => {
  if (cachedIndexHost) return cachedIndexHost;
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) return null;

  try {
    const response = await axios.get('https://api.pinecone.io/indexes/jarvis', {
      headers: { 'Api-Key': apiKey },
      timeout: 5000
    });
    cachedIndexHost = response.data?.host;
    return cachedIndexHost;
  } catch (error) {
    logger.error(`RAG host resolution failed: ${error.message}`);
    return null;
  }
};

/**
 * Queries Pinecone for semantically similar contexts
 */
export const querySemanticMemory = async (text, userId = null, limit = 4) => {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) return [];

  try {
    const host = await getPineconeHost();
    if (!host) return [];

    const vector = await getEmbedding(text);
    if (!vector) return [];

    const url = `https://${host}/query`;
    
    // Optional: filter vectors matching this operator session only
    const filter = userId ? { userId: { '$eq': userId.toString() } } : undefined;

    const payload = {
      vector: vector,
      topK: limit,
      includeMetadata: true,
      filter: filter
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 4000
    });

    return response.data?.matches || [];
  } catch (error) {
    logger.error(`Pinecone query failed: ${error.message}`);
    return [];
  }
};

/**
 * Builds an enriched prompt injected with historical RAG contexts
 */
export const buildRAGContext = async (queryText, userId = null) => {
  try {
    const matches = await querySemanticMemory(queryText, userId);
    
    if (matches.length === 0) return '';

    // De-duplicate and build clean contexts string
    const contexts = matches
      .filter(m => m.score > 0.65) // Filter out weak matches
      .map(m => `[Memory: ${m.metadata?.category || 'episodic'} at ${m.metadata?.timestamp || 'unknown'}]\nUser: ${m.metadata?.text || m.id}`)
      .join('\n\n');

    if (!contexts) return '';

    return `\n=== RELEVANT LONG-TERM MEMORIES ===\n${contexts}\n====================================\n`;
  } catch (error) {
    logger.error(`Failed to construct RAG context: ${error.message}`);
    return '';
  }
};
