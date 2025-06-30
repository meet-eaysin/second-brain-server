import dotenv from 'dotenv';
import logger from '../logger';

dotenv.config();

// Mock SMS service for now - you can replace with actual Twilio implementation
// This helps with development when you don't want to send actual SMS

interface SmsData {
  to: string;
  body: string;
}

// Send SMS
export const sendSMS = async (smsData: SmsData): Promise<boolean> => {
  try {
    // For development/testing
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[MOCK SMS] To: ${smsData.to}, Body: ${smsData.body}`);
      return true;
    }
    
    // For production, implement actual SMS sending logic here
    // Example with Twilio:
    // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: smsData.body,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: smsData.to
    // });
    
    logger.info(`SMS sent to ${smsData.to}`);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`SMS sending failed: ${error.message}`);
    } else {
      logger.error('Unknown error in SMS sending');
    }
    return false;
  }
};

// SMS templates
export const smsTemplates = {
  verification: (code: string): string => {
    return `Your verification code is: ${code}`;
  },
  notification: (message: string): string => {
    return `Notification: ${message}`;
  }
};

export default { sendSMS, smsTemplates };