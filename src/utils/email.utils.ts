import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ Email credentials not configured. Email functionality will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const verifyEmailConfig = async () => {
  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.verify();
      console.log('✅ Email server is ready to send emails');
    } catch (error) {
      console.error('❌ Error verifying email transporter:', error);
    }
  }
};

verifyEmailConfig();

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.warn('⚠️  Email not sent - credentials not configured');
      return;
    }

    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
};
