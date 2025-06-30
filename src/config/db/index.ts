import mongoose from 'mongoose';
import logger from '../logger';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Database Connection Error: ${error.message}`);
    } else {
      logger.error('Unknown error occurred during database connection');
    }
    process.exit(1);
  }
};

export default connectDB;