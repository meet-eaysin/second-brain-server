import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler, notFound } from './middlewares';
import { generalLimiter, encryptRequest, encryptResponse } from './config';
import { stream } from './config/logger';
import routes from './routes';
import { createAppError } from './utils';
import { validateGoogleConfig } from './config/google/google';

dotenv.config();

const app: Express = express();

app.set('trust proxy', 1);
validateGoogleConfig();

app.use(
  express.json({
    limit: '10mb',
    verify: (_req: Request, res: Response, buf: Buffer) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        const error = createAppError('Invalid JSON payload', 400);
        res.status(400).json({
          success: false,
          error: {
            message: error.message,
            statusCode: error.statusCode,
            status: error.status
          }
        });
      }
    }
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5000',
        'http://localhost:5173'
      ];

      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        const error = createAppError('Not allowed by CORS policy', 403);
        return callback(error);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For'],
    exposedHeaders: ['X-Total-Count', 'X-Total-Pages']
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    },
    crossOriginEmbedderPolicy: false
  })
);
app.use(morgan('combined', { stream }));
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 1000
  })
);

app.use(generalLimiter);

app.use(encryptRequest);
app.use(encryptResponse);

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Second Brain Server API',
    version: 'v1',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/v1',
      docs: '/api/v1/docs'
    },
    documentation: '/api/v1/docs'
  });
});
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is running!',
    version: 'v1',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      docs: '/api/v1/docs'
    },
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
