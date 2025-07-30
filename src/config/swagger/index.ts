import {appConfig} from '@/config';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Second Brain Server API',
    version: '1.0.0',
    description: 'Comprehensive personal intelligence platform API for knowledge management, creativity, learning, and personal growth.',
    contact: {
      name: 'API Support',
      email: 'eaysin.dev@gmail.com',
      url: 'https://github.com/meet-eaysin/second-brain-server'
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production'
        ? `${process.env.BaseURL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-domain.com'}/api/v1`
        : `http://localhost:${appConfig.port}/api/v1`,
      description: process.env.NODE_ENV === 'production' ? 'Production Server (Vercel)' : 'Development Server'
    }
  ]
};

export default swaggerDefinition;
