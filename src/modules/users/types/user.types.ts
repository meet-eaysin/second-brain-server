export interface User {
    id: string;
    email: string;
    username: string;
    password?: string;
    role: UserRole;
    isActive: boolean;
    authProvider: AuthProvider;
    auth0Sub?: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum AuthProvider {
    LOCAL = 'local',
    AUTH0 = 'auth0'
}

export interface UserCreateRequest {
    email: string;
    username: string;
    password?: string;
    role?: UserRole;
    authProvider?: AuthProvider;
    auth0Sub?: string;
}

export interface UserUpdateRequest {
    email?: string;
    username?: string;
    password?: string;
    role?: UserRole;
    isActive?: boolean;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: Omit<User, 'password'>;
    token: string;
    refreshToken: string;
}

export interface JwtPayload {
    userId: string;
    email: string;
    username: string;
    role: UserRole;
    authProvider: AuthProvider;
    iat?: number;
    exp?: number;
}

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    MODERATOR = 'moderator'
}
