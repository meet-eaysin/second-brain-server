import axios from 'axios';
import {Auth0UserProfile, RefreshTokenPayload} from '../types/auth.types';
import bcrypt from 'bcrypt';
import {jwtConfig} from "../../../config/jwt/jwt.config";
import {auth0Config} from "../../../config/auth0";
import jwt from 'jsonwebtoken';
import {JwtPayload} from "../../users/types/user.types";


export const generateAuth0LoginUrl = (email: string): string => {
    const params = new URLSearchParams({
        response_type: auth0Config.responseType,
        client_id: auth0Config.clientId,
        redirect_uri: auth0Config.redirectUri,
        scope: auth0Config.scope,
        connection: auth0Config.connection,
        login_hint: email,
        state: Buffer.from(JSON.stringify({ email, timestamp: Date.now() })).toString('base64')
    });

    return `https://${auth0Config.domain}/authorize?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string): Promise<string> => {
    const tokenEndpoint = `https://${auth0Config.domain}/oauth/token`;

    const response = await axios.post(tokenEndpoint, {
        grant_type: auth0Config.grantType,
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        code,
        redirect_uri: auth0Config.redirectUri
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response.data.access_token;
};

export const getAuth0UserProfile = async (accessToken: string): Promise<Auth0UserProfile> => {
    const userInfoEndpoint = `https://${auth0Config.domain}/userinfo`;

    const response = await axios.get(userInfoEndpoint, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    return response.data;
};

export const generateAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, jwtConfig.accessTokenSecret, jwtConfig.accessTokenOptions);
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
    return jwt.sign(payload, jwtConfig.refreshTokenSecret, jwtConfig.refreshTokenOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token, jwtConfig.accessTokenSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
    return jwt.verify(token, jwtConfig.refreshTokenSecret) as RefreshTokenPayload;
};

export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
};


const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

// utils/validation.utils.ts
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

export const validateUsername = (username: string): boolean => {
    // 3-30 characters, alphanumeric and underscore only
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
};

export const sendPasswordlessEmail = async (email: string): Promise<void> => {
    const passwordlessEndpoint = `https://${auth0Config.domain}/passwordless/start`;

    const response = await axios.post(passwordlessEndpoint, {
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        connection: 'email',
        email,
        send: 'code',
        authParams: {
            scope: auth0Config.scope,
            redirect_uri: auth0Config.redirectUri,
            response_type: auth0Config.responseType
        }
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.status !== 200) {
        throw new Error('Failed to send passwordless email');
    }
};

// Update the verifyPasswordlessCode function
export const verifyPasswordlessCode = async (email: string, code: string): Promise<string> => {
    const tokenEndpoint = `https://${auth0Config.domain}/oauth/token`;

    const response = await axios.post(tokenEndpoint, {
        grant_type: 'http://auth0.com/oauth/grant-type/passwordless/otp',
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        username: email,
        otp: code,
        realm: 'email',
        audience: auth0Config.audience,
        scope: auth0Config.scope
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.status !== 200) {
        throw new Error('Invalid verification code');
    }

    return response.data.access_token;
};
