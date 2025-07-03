import { Response } from 'express';
import {ApiResponse} from "../modules/auth/types/auth.types";

export const sendSuccess = <T>(res: Response, message: string, data?: T, statusCode: number = 200): Response => {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data
    };
    return res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode: number = 400, error?: string): Response => {
    const response: ApiResponse = {
        success: false,
        message,
        error
    };
    return res.status(statusCode).json(response);
};

