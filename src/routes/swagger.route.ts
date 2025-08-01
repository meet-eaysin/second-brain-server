import express from 'express';
import swaggerUi from 'swagger-ui-express';
// import YAML from 'yamljs'; // Temporarily disabled
import path from 'path';
import fs from 'fs';
import {appConfig} from '@/config';

const router = express.Router();

const loadOpenAPISpec = (): any => {
  try {
    const possiblePaths = [
      path.join(__dirname, '../openapi.yaml'),
      path.join(__dirname, '../../openapi.yaml'),
      path.join(process.cwd(), 'openapi.yaml'),
      './openapi.yaml'
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        // Simple YAML loading without external dependencies
        // For full YAML support, install: npm install yamljs
        try {
          const yamlContent = fs.readFileSync(filePath, 'utf8');
          // Basic YAML to JSON conversion (limited functionality)
          return JSON.parse(yamlContent.replace(/^\s*#.*$/gm, ''));
        } catch (error) {
          console.warn(`Failed to parse YAML file ${filePath}, using fallback spec`);
          break;
        }
      }
    }

    return {
      openapi: '3.0.0',
      info: {
        title: 'Second Brain Server API',
        version: '1.0.0',
        description: 'API documentation is loading...'
      },
      servers: [
        {
          url: process.env.NODE_ENV === 'production'
            ? `${process.env.BASE_URL || 'https://your-domain.com'}/api/v1`
            : `http://localhost:${appConfig.port}/api/v1`,
          description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server'
        }
      ],
      paths: {}
    };
  } catch (error) {
    console.error('Error loading OpenAPI spec:', error);
    return {
      openapi: '3.0.0',
      info: {
        title: 'Second Brain Server API',
        version: '1.0.0',
        description: 'Error loading API documentation'
      },
      servers: [],
      paths: {}
    };
  }
};

const openapiSpec = loadOpenAPISpec();

const servers = [
  {
    url: process.env.NODE_ENV === 'production'
      ? `${process.env.BaseURL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-domain.com'}/api/v1`
      : `http://localhost:${appConfig.port}/api/v1`,
    description: process.env.NODE_ENV === 'production' ? 'Production Server (Vercel)' : 'Development Server'
  }
];

const mergedSpec = {
  ...openapiSpec,
  servers,
  info: {
    ...openapiSpec.info,
    title: 'Second Brain Server API',
    description: 'Comprehensive personal intelligence platform API for knowledge management, creativity, learning, and personal growth.'
  }
};

const swaggerOptions = {
  explorer: true,
  customSiteTitle: 'Second Brain Server API Documentation',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
};

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(mergedSpec, swaggerOptions));

export default router;
