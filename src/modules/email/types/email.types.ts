export interface IEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface IPasswordResetEmailOptions {
  email: string;
  resetToken: string;
}

export interface IWelcomeEmailOptions {
  email: string;
  name: string;
}

export interface INotificationEmailOptions {
  email: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export interface IEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface IEmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email service configuration
export interface IEmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  apiKey?: string;
}
