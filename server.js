import 'dotenv/config';
import app from './app.js';
import { connectDB, logger } from './config/db.config.js';
import redis from './config/redis.js';

const PORT = process.env.PORT || 8888;

const startServer = async () => {
  // Try database connection
  await connectDB();
  redis.connect().catch(err => logger.warn(`Failed to connect to Redis. Some features might be limited: ${err.message}`));

  app.listen(PORT, () => {
    logger.info(`===================================================`);
    logger.info(`   J.A.R.V.I.S. Server running on port ${PORT}`);
    logger.info(`   Host URL: http://localhost:${PORT}`);
    logger.info(`   Press Ctrl+C to terminate connection`);
    logger.info(`===================================================`);
  });
};

startServer().catch((err) => {
  logger.error(`Critical server launch failure: ${err.message}`);
  process.exit(1);
});
