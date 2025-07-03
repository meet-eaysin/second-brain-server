export type TRefreshTokenPayload = {
    userId: string;
    tokenVersion: number;
    iat?: number;
    exp?: number;
}

export type TAuth0LoginRequest = {
    email: string;
}

export type TAuth0CallbackRequest = {
    code: string;
    state?: string;
}

export type TAuth0UserProfile = {
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
}

export type TApiResponse<T = any> = {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}
