export interface User {
    sub: string;
    nickname: string;
    name: string;
    picture: string;
    updated_at: string;
    email: string;
    email_verified: boolean;
}

export interface AuthRequest extends Request {
    oidc?: {
        isAuthenticated(): boolean;
        user?: User;
        idToken?: string;
        accessToken?: string;
        refreshToken?: string;
        idTokenClaims?: any;
    };
}

declare global {
    namespace Express {
        interface Request {
            oidc?: {
                isAuthenticated(): boolean;
                user?: User;
                idToken?: string;
                accessToken?: string;
                refreshToken?: string;
                idTokenClaims?: any;
            };
        }
    }
}