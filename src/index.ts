import util from 'util';
import { createServer } from 'http';
import { appConfig, logger, SafeMongooseConnection } from './config';
import app from './app';
import { initializeRealtimeNotifications } from '@/modules/system/services/realtime-notifications.service';
import { initializeReminderSystem } from '@/modules/system/services/reminder.service';
import { initializeCalendarSync } from '@/modules/calendar/services/sync.service';
import { initializeWebSocketService } from '@/modules/editor/services/websocket.service';

const PORT = appConfig.port || 4000;

const debugCallback =
  appConfig.env === 'development'
    // eslint-disable-next-line no-unused-vars
    ? (collectionName: string, method: string, query: any, _doc: string) => {
        const message = `${collectionName}.${method}(${util.inspect(query, {
          colors: true,
          depth: null
        })})`;
        logger.log({
          level: 'verbose',
          message,
          consoleLoggerOptions: { label: 'MONGO' }
        });
      }
    : undefined;

const safeMongooseConnection = new SafeMongooseConnection({
  mongoUrl: appConfig.mongoose.url ?? '',
  ...(debugCallback && { debugCallback }),
  onStartConnection: mongoUrl => logger.info(`Connecting to MongoDB at ${mongoUrl}`),
  onConnectionError: (error, mongoUrl) =>
    logger.log({
      level: 'error',
      message: `Could not connect to MongoDB at ${mongoUrl}`,
      error
    }),
  onConnectionRetry: mongoUrl => logger.info(`Retrying to MongoDB at ${mongoUrl}`)
});

const serve = () => {
  const httpServer = createServer(app);

  initializeRealtimeNotifications(httpServer);
  initializeWebSocketService(httpServer);
  initializeReminderSystem();
  initializeCalendarSync();

  const server = httpServer.listen(PORT, () => {
    logger.info(`🚀 EXPRESS server started at http://localhost:${PORT}`);
    logger.info(`📚 API Documentation available at http://localhost:${PORT}/api`);
    logger.info(`🔍 Health check available at http://localhost:${PORT}/health`);
    logger.info(`🌟 Environment: ${appConfig.env}`);
    logger.info('🔔 Advanced Notifications System initialized');
    logger.info('📡 Real-time notifications enabled');
    logger.info('⏰ Due task reminders active');
    logger.info('📅 Calendar sync system initialized');
    logger.info('🔗 External calendar integration ready');
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      logger.error('Server error:', error);
      process.exit(1);
    }
  });

  const gracefulShutdown = (signal: string) => {
    logger.info(`🛑 ${signal} received`);
    logger.info('🔄 Gracefully shutting down...');

    server.close(async err => {
      if (err) {
        logger.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }

      logger.info('📴 HTTP server closed');

      try {
        await safeMongooseConnection.close(true);
        logger.info('🍃 MongoDB connection closed successfully');
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
};

process.on('uncaughtException', error => {
  logger.error('💥 Uncaught Exception:', error);
  logger.error('🚨 Application will exit');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 Unhandled Rejection at:', promise);
  logger.error('💥 Reason:', reason);
  logger.error('🔄 Application will exit');
  process.exit(1);
});

const startApplication = async () => {
  try {
    if (!appConfig.mongoose.url) {
      throw new Error('DB_CONNECTION_URL not specified in environment');
    }

    await new Promise<void>((resolve, reject) => {
      safeMongooseConnection.connect(mongoUrl => {
        logger.info(`🍃 Connected to MongoDB at ${mongoUrl}`);
        resolve();
      });

      setTimeout(() => {
        reject(new Error('MongoDB connection timeout'));
      }, 30000);
    });

    serve();
  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
};

let isInitialized = false;

const initializeDatabase = async (): Promise<void> => {
  if (!isInitialized) {
    try {
      if (!appConfig.mongoose.url) {
        throw new Error('MONGO_URI environment variable is required');
      }

      await safeMongooseConnection.connectOptimized();
      logger.info('🚀 Database initialized successfully');
      isInitialized = true;
    } catch (error) {
      logger.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }
};

export default async function handler(req: any, res: any) {
  try {
    await initializeDatabase();
    return app(req, res);
  } catch (error) {
    logger.error('❌ Handler error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        statusCode: 500,
        status: 'error'
      }
    });
  }
}

if (require.main === module) startApplication();

