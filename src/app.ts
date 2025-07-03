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
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));
app.use(helmet());
app.use(morgan('combined', { stream }));

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

// Main Routes - all API routes will be under /api
app.use('/api/v1', routes);

// Error handling middleware
app.use(errorHandler);

export default app;