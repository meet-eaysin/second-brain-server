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

    // Find user by email with password
    const user = await getUserByEmail(email);
    console.log("user: *(*(*(*(*(*(*(*(", user)
    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
        throw new Error('Account is deactivated');
    }

    // Check if user uses local authentication
    if (user.authProvider !== EAuthProvider.LOCAL) {
        throw new Error('Please use social login for this account');
    }

    // Verify password
    if (!user.password) {
        throw new Error('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    // Get token version
    const userWithToken = await getUserWithTokenVersion(user.id);
    if (!userWithToken) {
        throw new Error('User not found');
    }

    // Generate tokens
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

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        token: accessToken,
        refreshToken
    };
};

export const initiateAuth0Login = async (loginData: TAuth0LoginRequest): Promise<{ loginUrl: string }> => {
    const { email } = loginData;

    // Generate Auth0 login URL
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
        // Exchange code for token
        const accessToken = await exchangeCodeForToken(code);

        // Get user profile
        const auth0Profile = await getAuth0UserProfile(accessToken);

        // Find or create user using the user service
        const user = await createOrUpdateAuth0User(auth0Profile);

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Get token version
        const userWithToken = await getUserWithTokenVersion(user.id);

        // Generate our own JWT tokens
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

        // Remove password from response
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

        // Get user with token version
        const user = await getUserWithTokenVersion(payload.userId);
        if (!user || !user.isActive) {
            throw new Error('Invalid refresh token');
        }

        // Check token version
        if (payload.tokenVersion !== user.tokenVersion) {
            throw new Error('Invalid refresh token');
        }

        // Generate new access token
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
        // Verify the code with Auth0
        const accessToken = await verifyPasswordlessCode(email, code);

        // Get user profile from Auth0
        const auth0Profile = await getAuth0UserProfile(accessToken);

        // Validate email matches
        if (auth0Profile.email.toLowerCase() !== email.toLowerCase()) {
            throw new Error('Email does not match verification code');
        }

        // Find or create user using the user service
        const user = await createOrUpdateAuth0User(auth0Profile);

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Get token version
        const userWithToken = await getUserWithTokenVersion(user.id);
        if (!userWithToken) {
            throw new Error('User not found');
        }

        // Generate our own JWT tokens
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

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token: newAccessToken,
            refreshToken
        };
    } catch (error) {
        console.error('Passwordless verification error:', error);
        throw new Error('Invalid passwordless code or email');
    }
};
