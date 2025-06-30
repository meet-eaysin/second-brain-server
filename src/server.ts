import app from './app';
import connectDB from './config/db';
import logger from './config/logger';
import cronJobs from './config/cron';

// Configure the server
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start the server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Initialize cron jobs
cronJobs.init();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  console.log(err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  console.log(err);
  // Close server & exit process
  process.exit(1);
});