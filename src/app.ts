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

// Load environment variables
dotenv.config();

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('combined', { stream }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true in production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
}));

// Auth0 middleware
app.use(auth(auth0Config));

// Encryption middleware - Apply to all routes
app.use(encryptRequest);
app.use(encryptResponse);

// Main Routes - all API routes will be under /api
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

export default app;