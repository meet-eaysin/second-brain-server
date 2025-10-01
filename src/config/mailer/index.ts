import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from '../logger';

dotenv.config();

interface EmailConfig {
  service: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailData {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: any;
    contentType?: string;
  }>;
}

const createTransporter = () => {
  const config: EmailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    }
  };

  return nodemailer.createTransport(config);
};

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      attachments: emailData.attachments
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${emailData.to}`);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Email sending failed: ${error.message}`);
    } else {
      logger.error('Unknown error in email sending');
    }
    return false;
  }
};

export const emailTemplates = {
  welcome: (name: string): string => {
    return `
      <h1>Welcome to you Second Brain, ${name}!</h1>
      <p>Thank you for joining us. We are excited to have you on board.</p>
      <p>Get started by logging into your account.</p>
    `;
  },
  passwordReset: (resetUrl: string): string => {
    return `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
  },
  notification: (message: string): string => {
    return `
      <h1>Notification</h1>
      <p>${message}</p>
    `;
  }
};

export default { sendEmail, emailTemplates };
