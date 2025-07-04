import util from 'util';
import { appConfig } from "./config/default-config/app-config";
import logger from "./config/logger";
import SafeMongooseConnection from "./config/db";
import app from "./app";

const PORT = appConfig.port || 4000;

const debugCallback =
    appConfig.env === 'development'
        ? (collectionName: string, method: string, query: any, _doc: string) => {
            const message = `${collectionName}.${method}(${util.inspect(query, {
                colors: true,
                depth: null,
            })})`;
            logger.log({
                level: 'verbose',
                message,
                consoleLoggerOptions: { label: 'MONGO' },
            });
        }
        : undefined;

const safeMongooseConnection = new SafeMongooseConnection({
    mongoUrl: appConfig.mongoose.url ?? '',
    ...(debugCallback && { debugCallback }),
    onStartConnection: (mongoUrl) => logger.info(`Connecting to MongoDB at ${mongoUrl}`),
    onConnectionError: (error, mongoUrl) =>
        logger.log({
            level: 'error',
            message: `Could not connect to MongoDB at ${mongoUrl}`,
            error,
        }),
    onConnectionRetry: (mongoUrl) => logger.info(`Retrying to MongoDB at ${mongoUrl}`),
});

// Enhanced server startup
const serve = () => {
    const server = app.listen(PORT, () => {
        logger.info(`🚀 EXPRESS server started at http://localhost:${PORT}`);
        logger.info(`📚 API Documentation available at http://localhost:${PORT}/api`);
        logger.info(`🔍 Health check available at http://localhost:${PORT}/health`);
        logger.info(`🌟 Environment: ${appConfig.env}`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
            logger.error(`Port ${PORT} is already in use`);
            process.exit(1);
        } else {
            logger.error('Server error:', error);
            process.exit(1);
        }
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
        logger.info(`🛑 ${signal} received`);
        logger.info('🔄 Gracefully shutting down...');

        server.close(async (err) => {
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

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('💥 Uncaught Exception:', error);
    logger.error('🚨 Application will exit');
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('🚨 Unhandled Rejection at:', promise);
    logger.error('💥 Reason:', reason);
    logger.error('🔄 Application will exit');
    process.exit(1);
});

// Main startup sequence
const startApplication = async () => {
    try {
        // Check MongoDB connection URL
        if (!appConfig.mongoose.url) {
            throw new Error('DB_CONNECTION_URL not specified in environment');
        }

        // Connect to MongoDB first, then start the server
        await new Promise<void>((resolve, reject) => {
            safeMongooseConnection.connect((mongoUrl) => {
                logger.info(`🍃 Connected to MongoDB at ${mongoUrl}`);
                resolve();
            });

            // Set a timeout for MongoDB connection
            setTimeout(() => {
                reject(new Error('MongoDB connection timeout'));
            }, 30000); // 30 seconds timeout
        });

        // Start the server
        serve();

    } catch (error) {
        logger.error('❌ Failed to start application:', error);
        process.exit(1);
    }
};

// Start the application
startApplication();