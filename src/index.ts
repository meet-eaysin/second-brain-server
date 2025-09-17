import { createServer } from 'http';
import app from './app';
import { appConfig, logger, SafeMongooseConnection } from './config';
import { initializeRealtimeNotifications } from '@/modules/system/services/realtime-notifications.service';
import { initializeReminderSystem } from '@/modules/system/services/reminder.service';
import { initializeCalendarSync } from '@/modules/calendar/services/sync.service';
import { initializeWebSocketService } from '@/modules/editor/services/websocket.service';

const PORT = appConfig.port || 4000;

const safeMongooseConnection = new SafeMongooseConnection({
  mongoUrl: appConfig.mongoose.url || '',
  onStartConnection: (url) => logger.info(`Connecting to MongoDB at ${url}`),
  onConnectionError: (err, url) => logger.error(`MongoDB connection error at ${url}`, err),
  onConnectionRetry: (url) => logger.info(`Retrying MongoDB connection at ${url}`)
});

let isInitialized = false;

export const initializeDatabase = async () => {
  if (isInitialized) return;
  if (!appConfig.mongoose.url) throw new Error('MONGO_URI environment variable is required');

  await safeMongooseConnection.connectOptimized();
  logger.info('Database initialized successfully');
  isInitialized = true;
};

const startServer = async () => {
  await initializeDatabase();

  const httpServer = createServer(app);

  initializeRealtimeNotifications(httpServer);
  initializeWebSocketService(httpServer);
  initializeReminderSystem();
  initializeCalendarSync();

  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running at http://localhost:${PORT}`);
    logger.info(`📚 API Docs: http://localhost:${PORT}/api`);
  });

  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
    } else {
      logger.error('Server error:', error);
    }
    process.exit(1);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close(async (err) => {
      if (err) logger.error('Error closing server:', err);
      await safeMongooseConnection.close(true);
      logger.info('Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) startServer();

export default async function handler(req: any, res: any) {
  try {
    await initializeDatabase();
    return app(req, res);
  } catch (error) {
    logger.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error', statusCode: 500, status: 'error' }
    });
  }
}
