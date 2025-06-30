import { Response } from 'express';

interface ResponseData {
  success: boolean;
  data?: any;
  message?: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

export const sendResponse = (
  res: Response,
  statusCode: number,
  data: any = null,
  message: string = '',
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  }
): Response => {
  const responseData: ResponseData = {
    success: statusCode >= 200 && statusCode < 400,
    message: message,
  };

  if (data) {
    responseData.data = data;
  }

  if (Array.isArray(data)) {
    responseData.count = data.length;
  }

  if (pagination) {
    responseData.pagination = pagination;
  }

  return res.status(statusCode).json(responseData);
};