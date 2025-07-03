import { Response } from 'express';
import {TApiResponse} from "../modules/auth/types/auth.types";

export const sendSuccess = <T>(res: Response, message: string, data?: T, statusCode: number = 200): Response => {
    const response: TApiResponse<T> = {
        success: true,
        message,
        data
    };
    return res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode: number = 400, error?: string): Response => {
    const response: TApiResponse = {
        success: false,
        message,
        error
    };
    return res.status(statusCode).json(response);
};

