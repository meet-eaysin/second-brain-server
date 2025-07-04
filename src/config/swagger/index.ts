import {appConfig} from "../default-config/app-config";

const swaggerDefinition  = {
    openapi: '3.0.0',
    info: {
        title: 'Marketing App API Documentation',
        version: '0.0.1',
        description: 'Marketing App API Documentation',
        license: {
            name: 'MIT',
            url: '',
        },
    },
    servers: [
        {
            url: `http://localhost:${appConfig.port}/v1/api`,
            description: 'Development Server',
        },
    ],
};

export default swaggerDefinition ;