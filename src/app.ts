import express, { Express } from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { stream } from './config/logger';
import routes from './routes';
import { encryptRequest, encryptResponse } from './config/encryption';
import {auth0Config} from "./config/auth0";
import { auth } from 'express-openid-connect';
import MongoStore from "connect-mongo";
import {generalLimiter} from "./config/rateLimiter";
import {createAppError} from "./utils/error.utils";
import {Request, Response} from "express";
import {notFound} from "./middlewares/not-found";

// Load environment variables
dotenv.config();

const app: Express = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Middleware
// Body parsing middleware with enhanced validation
app.use(express.json({
    limit: '10mb',
    verify: (req: Request, res: Response, buf: Buffer) => {
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
            return;
        }
    }
}));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000'];

        // Allow requests with no origin (like mobile apps or curl requests)
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
}));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));
app.use(morgan('combined', { stream }));
app.use(express.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 1000
}));

// Rate limiting
app.use(generalLimiter);

// Auth0 middleware
// app.use(auth({
//     issuerBaseURL: auth0Config.issuerBaseURL,
//     baseURL: auth0Config.baseURL,
//     clientID: auth0Config.clientID,
//     secret: auth0Config.secret,
//     idpLogout: true,
//     clientSecret: auth0Config.clientSecret,
//     authorizationParams: {
//         response_type: auth0Config.authorizationParams.responseType,
//         response_mode: auth0Config.authorizationParams.responseMode,
//         scope: auth0Config.authorizationParams.scope
//     }
// }));

// Encryption middleware - Apply to all routes
app.use(encryptRequest);
app.use(encryptResponse);

// Health check route (before API routes)
app.get('/health', (req: Request, res: Response) => {
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

// Main Routes - all API routes will be under /api
app.get('/api', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'API is running!',
        version: 'v1',
        endpoints: {
            health: '/health',
            api: '/api/v1',
            docs: '/api/docs'
        },
        timestamp: new Date().toISOString()
    });
});

app.use('/api/v1', routes);

app.use(notFound);

// Global error handler - This must be the LAST middleware
app.use(errorHandler);

export default app;