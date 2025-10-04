// Routes
export { default as emailRoutes } from './routes/email.routes';

// Controllers
export {
  sendTestEmail,
  sendPasswordResetEmail as sendPasswordResetEmailController,
  sendWelcomeEmail as sendWelcomeEmailController
} from './controllers/email.controller';

// Services
export {
  emailService,
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPasswordResetConfirmation
} from './services/email.services';

// Types
export type {
  IEmailOptions,
  IPasswordResetEmailOptions,
  IWelcomeEmailOptions,
  INotificationEmailOptions,
  IEmailTemplate,
  IEmailSendResult,
  IEmailConfig
} from './types';

// Validators
export {
  sendTestEmailSchema,
  sendPasswordResetEmailSchema,
  sendWelcomeEmailSchema
} from './validators/email.validators';
