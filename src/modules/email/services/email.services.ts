interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    try {
        console.log('📧 Sending email:', {
            to: options.to,
            subject: options.subject,
            content: options.text || options.html,
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock success
        return true;
    } catch (error) {
        console.error('❌ Failed to send email:', JSON.stringify(error, null, 2));
        return false;
    }
};

export const sendPasswordResetEmail = async (
    email: string,
    resetToken: string
): Promise<boolean> => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;

    const emailOptions: EmailOptions = {
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
    `,
    };

    return await sendEmail(emailOptions);
};

export const sendPasswordResetConfirmation = async (email: string): Promise<boolean> => {
    const emailOptions: EmailOptions = {
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
    `,
    };

    return await sendEmail(emailOptions);
};
