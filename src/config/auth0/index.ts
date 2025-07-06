import {appConfig} from "../default-config/app-config";

export const auth0Config = {
    secret: appConfig.auth0.clientSecret as string,
    baseURL: appConfig.baseURL as string,
    clientID: appConfig.auth0.clientId as string,
    issuerBaseURL: appConfig.auth0.issuerBaseURL as string,

    authRequired: false,
    enablePasswordless: true,
    passwordlessMethod: 'link',

    passwordlessEmail: {
        template: appConfig.auth0.passwordlessTemplate || 'your_email_template',
        subject: appConfig.auth0.passwordlessSubject || 'Your Login Link',
        otp: {
            length: 6,
            expiresIn: 300
        }
    },

    clientSecret: appConfig.auth0.clientSecret,
    audience: appConfig.auth0.audience,
    scope: 'openid profile email',
    redirectUri: appConfig.auth0.redirectUri || 'http://localhost:5000/api/auth/auth0/callback',
    responseType: 'code',
    grantType: 'authorization_code',
    authorizationParams: {
        responseType: 'code',
        responseMode: 'query',
        scope: 'openid profile email'
    },

    connection: 'email',
};