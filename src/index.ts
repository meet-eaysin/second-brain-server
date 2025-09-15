import { logger } from './config';
import app from './app';
import { initializeDatabase } from './initiate-database';

// Vercel serverless function handler
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
