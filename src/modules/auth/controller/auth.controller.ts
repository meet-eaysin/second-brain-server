import { Request, Response } from 'express';
import {
    authenticateUser,
    refreshAccessToken,
    logoutUser,
    logoutAllDevices,
    initiatePasswordlessLogin, verifyPasswordlessLogin
} from '../services/auth.service';
import {sendError, sendSuccess} from "../../../utils/response.utils";
import {AuthenticatedRequest} from "../../../middlewares/auth";
import {LoginRequest, UserCreateRequest} from "../../users/types/user.types";
import {createUser, getUsersWithoutPassword} from "../../users/services/users.services";

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const userData: UserCreateRequest = req.body;
        const user = await createUser(userData);
        const userWithoutPassword = getUsersWithoutPassword([user])[0];

        sendSuccess(res, 'User registered successfully', userWithoutPassword, 201);
    } catch (error) {
        sendError(res, 'Registration failed', 400, error instanceof Error ? error.message : 'Unknown error');
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const loginData: LoginRequest = req.body;
        const authResponse = await authenticateUser(loginData);

        sendSuccess(res, 'Login successful', authResponse);
    } catch (error) {
        sendError(res, 'Login failed', 401, error instanceof Error ? error.message : 'Unknown error');
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            sendError(res, 'Refresh token required', 400);
            return;
        }

        const result = await refreshAccessToken(refreshToken);
        sendSuccess(res, 'Token refreshed successfully', result);
    } catch (error) {
        sendError(res, 'Token refresh failed', 401, error instanceof Error ? error.message : 'Unknown error');
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user } = req as AuthenticatedRequest;
        await logoutUser(user.userId);

        sendSuccess(res, 'Logged out successfully');
    } catch (error) {
        sendError(res, 'Logout failed', 500, error instanceof Error ? error.message : 'Unknown error');
    }
};

export const logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user } = req as AuthenticatedRequest;
        await logoutAllDevices(user.userId);

        sendSuccess(res, 'Logged out from all devices successfully');
    } catch (error) {
        sendError(res, 'Logout failed', 500, error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user } = req as AuthenticatedRequest;
        sendSuccess(res, 'Profile retrieved successfully', user);
    } catch (error) {
        sendError(res, 'Failed to get profile', 500, error instanceof Error ? error.message : 'Unknown error');
    }
};

export const initiatePasswordless = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const result = await initiatePasswordlessLogin(email);
        sendSuccess(res, result.message);
    } catch (error) {
        sendError(res, 'Passwordless initiation failed', 400, error instanceof Error ? error.message : 'Unknown error');
    }
};

export const verifyPasswordless = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, code } = req.body;
        const authResponse = await verifyPasswordlessLogin(email, code);
        sendSuccess(res, 'Passwordless login successful', authResponse);
    } catch (error) {
        sendError(res, 'Passwordless verification failed', 401, error instanceof Error ? error.message : 'Unknown error');
    }
};
