import { z } from 'zod';

export const sendTestEmailSchema = z.object({
  to: z.string().email('Please provide a valid email address'),
  subject: z.string()
    .min(1, 'Subject must not be empty')
    .max(200, 'Subject must not exceed 200 characters'),
  text: z.string().optional(),
  html: z.string().optional()
}).refine(
  (data) => data.text || data.html,
  {
    message: 'Either text or html content is required',
    path: ['text', 'html']
  }
);

export const sendPasswordResetEmailSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  resetToken: z.string().min(1, 'Reset token is required')
});

export const sendWelcomeEmailSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  name: z.string()
    .min(1, 'Name must not be empty')
    .max(100, 'Name must not exceed 100 characters')
});
