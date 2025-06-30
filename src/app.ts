import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { stream } from './config/logger';
import routes from './routes';
import { encryptRequest, encryptResponse } from './config/encryption';

// Load environment variables
dotenv.config();

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('combined', { stream }));

// Encryption middleware - Apply to all routes
app.use(encryptRequest);
app.use(encryptResponse);

// Main Routes - all API routes will be under /api
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

export default app;