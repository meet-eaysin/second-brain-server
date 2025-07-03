import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    // Server Configuration
    NODE_ENV: z.enum(['production', 'development', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    BaseURL: z.string().url().default('http://localhost:5000'),

    // Database
    MONGO_URI: z.string().min(1, "MongoDB URI is required"),

    // Authentication
    ACCESS_TOKEN_SECRET: z.string().min(32, "Access token secret must be at least 32 characters"),
    REFRESH_TOKEN_SECRET: z.string().min(32, "Refresh token secret must be at least 32 characters"),
    ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRY: z.string().default('7d'),

    // Email Configuration
    EMAIL_SERVICE: z.string().default('gmail'),
    EMAIL_HOST: z.string().default('smtp.gmail.com'),
    EMAIL_PORT: z.coerce.number().default(587),
    EMAIL_USER: z.string().email(),
    EMAIL_PASS: z.string(),
    EMAIL_FROM: z.string().email(),

    // AWS S3 Configuration
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_BUCKET_NAME: z.string().optional(),
    AWS_REGION: z.string().optional(),

    // Twilio Configuration
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),

    // Auth0 Configuration
    AUTH0_DOMAIN: z.string().optional(),
    AUTH0_CLIENT_ID: z.string().optional(),
    AUTH0_CLIENT_SECRET: z.string().optional(),
    AUTH0_AUDIENCE: z.string().optional(),
    AUTH0_REDIRECT_URI: z.string().url().optional(),
    ISSUERBASEURL: z.string().url().default('https://your-domain.us.auth0.com'),
    AUTH0_PASSWORDLESS_TEMPLATE: z.string().optional(),
    AUTH0_PASSWORDLESS_SUBJECT: z.string().optional(),
    AUTH0_PASSWORDLESS_METHOD: z.enum(['link', 'code']).default('link'),

    // LinkedIn Configuration
    LINKEDIN_CLIENT_ID: z.string().optional(),
    LINKEDIN_CLIENT_SECRET: z.string().optional(),
    LINKEDIN_CALLBACK_URL: z.string().url().optional(),
    LINKEDIN_REDIRECT_URI: z.string().url().optional(),
    LINKEDIN_API_BASE_URL: z.string().url().default('https://api.linkedin.com/v2'),

    // Application
    CLIENT_URL: z.string().url().default('http://localhost:3000')
}).passthrough();

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
    throw new Error(`Config validation error: ${envVars.error.errors.map(e => e.message).join(', ')}`);
}

export const appConfig = {
    // Application Info
    APPLICATION_NAME: 'Sync-Workbench',
    versionPrefix: '/v1/',
    env: envVars.data.NODE_ENV,
    baseURL: envVars.data.BaseURL,
    port: envVars.data.PORT,
    clientUrl: envVars.data.CLIENT_URL,
    API_DOCS_URL: '/api-docs',

    // Database
    mongoose: {
        url: envVars.data.MONGO_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: true,
            w: 'majority'
        }
    },

    // Authentication
    jwt: {
        accessTokenSecret: envVars.data.ACCESS_TOKEN_SECRET,
        accessExpiration: envVars.data.ACCESS_TOKEN_EXPIRY,
        refreshTokenSecret: envVars.data.REFRESH_TOKEN_SECRET,
        refreshExpiration: envVars.data.REFRESH_TOKEN_EXPIRY,
        cookieOptions: {
            httpOnly: true,
            secure: envVars.data.NODE_ENV === 'production',
            signed: true
        }
    },

    // Email
    email: {
        service: envVars.data.EMAIL_SERVICE,
        host: envVars.data.EMAIL_HOST,
        port: envVars.data.EMAIL_PORT,
        auth: {
            user: envVars.data.EMAIL_USER,
            pass: envVars.data.EMAIL_PASS
        },
        from: envVars.data.EMAIL_FROM
    },

    // AWS
    aws: {
        accessKeyId: envVars.data.AWS_ACCESS_KEY_ID,
        secretAccessKey: envVars.data.AWS_SECRET_ACCESS_KEY,
        bucketName: envVars.data.AWS_BUCKET_NAME,
        region: envVars.data.AWS_REGION
    },

    // Twilio
    twilio: {
        accountSid: envVars.data.TWILIO_ACCOUNT_SID,
        authToken: envVars.data.TWILIO_AUTH_TOKEN,
        phoneNumber: envVars.data.TWILIO_PHONE_NUMBER
    },

    // Auth0
    auth0: {
        domain: envVars.data.AUTH0_DOMAIN,
        clientId: envVars.data.AUTH0_CLIENT_ID,
        clientSecret: envVars.data.AUTH0_CLIENT_SECRET,
        audience: envVars.data.AUTH0_AUDIENCE,
        redirectUri: envVars.data.AUTH0_REDIRECT_URI,
        issuerBaseURL: envVars.data.ISSUARBASEURL,
        passwordlessTemplate: envVars.data.AUTH0_PASSWORDLESS_TEMPLATE,
        passwordlessSubject: envVars.data.AUTH0_PASSWORDLESS_SUBJECT,
        passwordlessMethod: envVars.data.AUTH0_PASSWORDLESS_METHOD,
    },

    // LinkedIn
    linkedin: {
        clientId: envVars.data.LINKEDIN_CLIENT_ID,
        clientSecret: envVars.data.LINKEDIN_CLIENT_SECRET,
        callbackUrl: envVars.data.LINKEDIN_CALLBACK_URL,
        redirectUri: envVars.data.LINKEDIN_REDIRECT_URI,
        apiBaseUrl: envVars.data.LINKEDIN_API_BASE_URL
    }
};