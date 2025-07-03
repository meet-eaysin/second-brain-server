export type TUser = {
    id: string;
    email: string;
    username: string;
    password?: string;
    role: TUserRole;
    isActive: boolean;
    authProvider: EAuthProvider;
    auth0Sub?: string;
    tokenVersion?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum EAuthProvider {
    LOCAL = 'local',
    AUTH0 = 'auth0'
}

export type TUserCreateRequest = {
    email: string;
    username: string;
    password?: string;
    role?: TUserRole;
    authProvider?: EAuthProvider;
    auth0Sub?: string;
}

export type TUserUpdateRequest = {
    email?: string;
    username?: string;
    password?: string;
    role?: TUserRole;
    isActive?: boolean;
}

export type TLoginRequest = {
    email: string;
    password: string;
}

export type TAuthResponse = {
    user: Omit<TUser, 'password'>;
    token: string;
    refreshToken: string;
}

export type TJwtPayload = {
    userId: string;
    email: string;
    username: string;
    role: TUserRole;
    authProvider: EAuthProvider;
    iat?: number;
    exp?: number;
}

export enum TUserRole {
    ADMIN = 'admin',
    USER = 'user',
    MODERATOR = 'moderator'
}
