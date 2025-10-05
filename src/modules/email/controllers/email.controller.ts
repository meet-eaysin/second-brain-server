import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse, createNotFoundError } from '../../../utils';
import * as emailService from '../services/email.services';

/**
 * Send a test email (admin only)
 */
export const sendTestEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { to, subject, text, html } = req.body;

    if (!to || !subject) {
      return next(createNotFoundError('Email recipient and subject are required'));
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      text,
      html
    });

    if (result) {
      sendSuccessResponse(res, 'Test email sent successfully', { sent: true });
    } else {
      return next(createNotFoundError('Failed to send test email'));
    }
  }
);

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, resetToken } = req.body;

    if (!email || !resetToken) {
      return next(createNotFoundError('Email and reset token are required'));
    }

    const result = await emailService.sendPasswordResetEmail(email, resetToken);

    if (result) {
      sendSuccessResponse(res, 'Password reset email sent successfully', { sent: true });
    } else {
      return next(createNotFoundError('Failed to send password reset email'));
    }
  }
);

/**
 * Send welcome email
 */
export const sendWelcomeEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, name } = req.body;

    if (!email || !name) {
      return next(createNotFoundError('Email and name are required'));
    }

    const result = await emailService.sendWelcomeEmail(email, name);

    if (result) {
      sendSuccessResponse(res, 'Welcome email sent successfully', { sent: true });
    } else {
      return next(createNotFoundError('Failed to send welcome email'));
    }
  }
);
