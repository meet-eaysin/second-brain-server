import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import {appConfig} from "../config/default-config/app-config";

const router = express.Router();

// Load your OpenAPI YAML file
const openapiPath = path.join(__dirname, '../../openapi.yaml');
const openapiSpec = YAML.load(openapiPath);

// Merge with your existing swagger definition
const mergedSpec = {
    ...openapiSpec,
    servers: [
        {
            url: `http://localhost:${appConfig.port}/v1`,
            description: 'Development Server',
        },
    ],
};

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(mergedSpec, {
    explorer: true,
    customSiteTitle: 'Marketing App API Documentation',
}));

export default router;