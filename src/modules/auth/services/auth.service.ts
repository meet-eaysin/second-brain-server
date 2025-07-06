import {
    createOrUpdateAuth0User, getUserByEmail,
    getUserWithTokenVersion,
    incrementTokenVersion
} from "../../users/services/users.services";
import {
    comparePassword, exchangeCodeForToken,
    generateAccessToken,
    generateAuth0LoginUrl,
    generateRefreshToken, getAuth0UserProfile,
    sendPasswordlessEmail, verifyPasswordlessCode, verifyRefreshToken
} from "../utils/auth.utils";
import {JwtPayload} from "jsonwebtoken";
import {EAuthProvider, TAuthResponse, TLoginRequest} from "../../users/types/user.types";
import {TAuth0CallbackRequest, TAuth0LoginRequest, TRefreshTokenPayload} from "../types/auth.types";

const userTokenVersions: Map<string, number> = new Map();

export const authenticateUser = async (loginData: TLoginRequest): Promise<TAuthResponse> => {
    const { email, password } = loginData;

    const user = await getUserByEmail(email);
    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
        throw new Error('Account is deactivated');
    }

    if (user.authProvider !== EAuthProvider.LOCAL) {
        throw new Error('Please use social login for this account');
    }

    if (!user.password) {
        throw new Error('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    const userWithToken = await getUserWithTokenVersion(user.id);
    if (!userWithToken) {
        throw new Error('User not found');
    }

    const accessTokenPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        authProvider: user.authProvider
    };

    const refreshTokenPayload: TRefreshTokenPayload = {
        userId: user.id,
        tokenVersion: userWithToken.tokenVersion
    };

    const accessToken = generateAccessToken(accessTokenPayload);
    const refreshToken = generateRefreshToken(refreshTokenPayload);

    const { password: _, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        token: accessToken,
        refreshToken
    };
};

export const initiateAuth0Login = async (loginData: TAuth0LoginRequest): Promise<{ loginUrl: string }> => {
    const { email } = loginData;

    const loginUrl = generateAuth0LoginUrl(email);

    return { loginUrl };
};

export const initiatePasswordlessLogin = async (email: string): Promise<{ message: string }> => {
    try {
        await sendPasswordlessEmail(email);
        return { message: 'Passwordless login email sent successfully' };
    } catch (error) {
        throw new Error('Failed to send passwordless email');
    }
};

export const handleAuth0Callback = async (callbackData: TAuth0CallbackRequest): Promise<TAuthResponse> => {
    const { code, state } = callbackData;

    try {
        const accessToken = await exchangeCodeForToken(code);

        const auth0Profile = await getAuth0UserProfile(accessToken);

        const user = await createOrUpdateAuth0User(auth0Profile);

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        const userWithToken = await getUserWithTokenVersion(user.id);

        const accessTokenPayload: JwtPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            authProvider: user.authProvider
        };

        const refreshTokenPayload: TRefreshTokenPayload = {
            userId: user.id,
            tokenVersion: userWithToken?.tokenVersion || 0
        };

        const newAccessToken = generateAccessToken(accessTokenPayload);
        const refreshToken = generateRefreshToken(refreshTokenPayload);

        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token: newAccessToken,
            refreshToken
        };
    } catch (error) {
        throw new Error('Auth0 callback failed');
    }
};

export const refreshAccessToken = async (refreshToken: string): Promise<{ token: string }> => {
    try {
        const payload = verifyRefreshToken(refreshToken);

        const user = await getUserWithTokenVersion(payload.userId);
        if (!user || !user.isActive) {
            throw new Error('Invalid refresh token');
        }

        if (payload.tokenVersion !== user.tokenVersion) {
            throw new Error('Invalid refresh token');
        }

        const accessTokenPayload: JwtPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            authProvider: user.authProvider
        };

        const newAccessToken = generateAccessToken(accessTokenPayload);

        return { token: newAccessToken };
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};

export const logoutUser = async (userId: string): Promise<void> => {
    await incrementTokenVersion(userId);
};

export const logoutAllDevices = async (userId: string): Promise<void> => {
    await incrementTokenVersion(userId);
};

export const verifyPasswordlessLogin = async (email: string, code: string): Promise<TAuthResponse> => {
    try {
        const accessToken = await verifyPasswordlessCode(email, code);

        const auth0Profile = await getAuth0UserProfile(accessToken);

        if (auth0Profile.email.toLowerCase() !== email.toLowerCase()) {
            throw new Error('Email does not match verification code');
        }

        const user = await createOrUpdateAuth0User(auth0Profile);

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        const userWithToken = await getUserWithTokenVersion(user.id);
        if (!userWithToken) {
            throw new Error('User not found');
        }

        const accessTokenPayload: JwtPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            authProvider: user.authProvider
        };

        const refreshTokenPayload: TRefreshTokenPayload = {
            userId: user.id,
            tokenVersion: userWithToken.tokenVersion
        };

        const newAccessToken = generateAccessToken(accessTokenPayload);
        const refreshToken = generateRefreshToken(refreshTokenPayload);

        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token: newAccessToken,
            refreshToken
        };
    } catch (error) {
        console.error('Passwordless verification error:', JSON.stringify(error, null, 2));
        throw new Error('Invalid passwordless code or email');
    }
};
