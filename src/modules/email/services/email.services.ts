import type { IEmailOptions } from '../types';

// ===================================
// EMAIL SERVICE
// ===================================

export const emailService = {
  // ===================================
  // CORE EMAIL METHODS
  // ===================================

  sendEmail: async (options: IEmailOptions): Promise<boolean> => {
    try {
      console.log('📧 Sending email:', {
        to: options.to,
        subject: options.subject,
        content: options.text || options.html
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', JSON.stringify(error, null, 2));
      return false;
    }
  },

  sendPasswordResetEmail: async (email: string, resetToken: string): Promise<boolean> => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;

    const emailOptions: IEmailOptions = {
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
      `,
      text: `
        Password Reset Request

        You have requested to reset your password. Use the following link to reset your password:
        ${resetUrl}

        This link will expire in 15 minutes.

        If you didn't request this password reset, please ignore this email.
      `
    };

    return await emailService.sendEmail(emailOptions);
  },

  sendWelcomeEmail: async (email: string, name: string): Promise<boolean> => {
    const emailOptions: IEmailOptions = {
      to: email,
      subject: 'Welcome to Second Brain!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Second Brain, ${name}!</h2>
          <p>Thank you for joining Second Brain. We're excited to help you organize your thoughts and ideas.</p>
          <p>Here are some things you can do to get started:</p>
          <ul>
            <li>Create your first database</li>
            <li>Add some records to track your information</li>
            <li>Explore the different views and properties</li>
            <li>Set up your workspace preferences</li>
          </ul>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Happy organizing!</p>
          <p>The Second Brain Team</p>
        </div>
      `,
      text: `
        Welcome to Second Brain, ${name}!

        Thank you for joining Second Brain. We're excited to help you organize your thoughts and ideas.

        Here are some things you can do to get started:
        - Create your first database
        - Add some records to track your information
        - Explore the different views and properties
        - Set up your workspace preferences

        If you have any questions, feel free to reach out to our support team.

        Happy organizing!
        The Second Brain Team
      `
    };

    return await emailService.sendEmail(emailOptions);
  },

  sendPasswordResetConfirmation: async (email: string): Promise<boolean> => {
    const emailOptions: IEmailOptions = {
      to: email,
      subject: 'Password Reset Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Successful</h2>
          <p>Your password has been successfully reset.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
        </div>
      `,
      text: `
        Password Reset Successful

        Your password has been successfully reset.

        If you didn't make this change, please contact our support team immediately.
      `
    };

    return await emailService.sendEmail(emailOptions);
  }
};

// Export individual functions for backward compatibility
export const sendEmail = (options: IEmailOptions) => emailService.sendEmail(options);
export const sendPasswordResetEmail = (email: string, resetToken: string) =>
  emailService.sendPasswordResetEmail(email, resetToken);
export const sendWelcomeEmail = (email: string, name: string) =>
  emailService.sendWelcomeEmail(email, name);

export const sendPasswordResetConfirmation = (email: string) =>
  emailService.sendPasswordResetConfirmation(email);
