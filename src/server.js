import 'dotenv/config';
import app from './app.js';
import { connectDB, logger } from './config/db.config.js';
import redis from './config/redis.config.js';

const PORT = process.env.PORT || 8888;

const startServer = async () => {
  await connectDB();
  redis.connect().catch(err => logger.warn(`Redis optional connection: ${err.message}`));

  app.listen(PORT, () => {
    logger.info(`===================================================`);
    logger.info(`   J.A.R.V.I.S. Production Server running on port ${PORT}`);
    logger.info(`   Host URL: http://localhost:${PORT}`);
    logger.info(`   Press Ctrl+C to terminate connection`);
    logger.info(`===================================================`);
  });
};

startServer().catch((err) => {
  logger.error(`Critical server launch failure: ${err.message}`);
  process.exit(1);
});
