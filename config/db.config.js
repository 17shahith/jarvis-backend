import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.warn('MONGODB_URI is not defined in the environment. Running in standard mock-memory database mode.');
    return false;
  }

  try {
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB cluster successfully.');
    return true;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    logger.warn('Falling back to local simulation database mode.');
    return false;
  }
};

export { logger };
