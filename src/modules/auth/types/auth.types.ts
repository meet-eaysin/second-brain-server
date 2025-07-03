export interface RefreshTokenPayload {
    userId: string;
    tokenVersion: number;
    iat?: number;
    exp?: number;
}

export interface Auth0LoginRequest {
    email: string;
}

export interface Auth0CallbackRequest {
    code: string;
    state?: string;
}

export interface Auth0UserProfile {
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}
