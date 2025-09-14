import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['production', 'development', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    BaseURL: z.string().url().default('http://localhost:5000'),

    MONGO_URI: z.string().min(1, 'MongoDB URI is required'),

    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_BUCKET_NAME: z.string().optional(),
    AWS_REGION: z.string().optional(),

    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),

    CLIENT_URL: z.string().url().default('http://localhost:5173')
  })
  .passthrough();

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  throw new Error(
    `Config validation error: ${envVars.error.issues.map(e => e.message).join(', ')}`
  );
}

export const appConfig = {
  APPLICATION_NAME: 'Second Brain Server',
  APPLICATION_DESCRIPTION:
    'Comprehensive personal intelligence platform for knowledge management, creativity, learning, and personal growth',
  VERSION: '1.0.0',

  env: envVars.data.NODE_ENV,
  baseURL: envVars.data.BaseURL,
  port: envVars.data.PORT,
  clientUrl: envVars.data.CLIENT_URL,

  versionPrefix: '/api/v1/',
  API_DOCS_URL: '/api/v1/docs',

  mongoose: {
    url: envVars.data.MONGO_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority'
    }
  },

  aws: {
    accessKeyId: envVars.data.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.data.AWS_SECRET_ACCESS_KEY,
    bucketName: envVars.data.AWS_BUCKET_NAME,
    region: envVars.data.AWS_REGION
  },

  twilio: {
    accountSid: envVars.data.TWILIO_ACCOUNT_SID,
    authToken: envVars.data.TWILIO_AUTH_TOKEN,
    phoneNumber: envVars.data.TWILIO_PHONE_NUMBER
  }
};
