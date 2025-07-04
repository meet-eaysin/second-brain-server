import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import {appConfig} from "../config/default-config/app-config";

const router = express.Router();

const openapiPath = path.join(__dirname, '../../openapi.yaml');
const openapiSpec = YAML.load(openapiPath);

const servers = [
    {
        url: process.env.NODE_ENV === 'production'
            ? 'https://marketing-server-eight.vercel.app/api/v1'
            : `http://localhost:${appConfig.port}/api/v1`,
        description: process.env.NODE_ENV === 'production'
            ? 'Production Server'
            : 'Development Server',
    },
];

const mergedSpec = {
    ...openapiSpec,
    servers
};

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(mergedSpec, {
    explorer: true,
    customSiteTitle: 'Marketing App API Documentation',
}));

export default router;