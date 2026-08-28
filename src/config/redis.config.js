import { createClient } from 'redis';
import { logger } from './db.config.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: false // Disable infinite reconnect log spam when Redis container isn't running locally
  }
});

redis.on('error', (err) => logger.warn(`Redis optional cache notice: ${err.message}`));
redis.on('connect', () => logger.info('Connected to Redis Cache Server successfully.'));

export default redis;
