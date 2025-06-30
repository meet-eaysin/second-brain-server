import CryptoJS from 'crypto-js';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET as string;

// Interface for custom response
interface CustomResponse extends Response {
  rawJson?: Function;
}

// Encrypt data
export const encryptData = (data: any): string => {
  // If data is not a string, convert it to JSON string
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(dataString, ENCRYPTION_SECRET).toString();
};

// Decrypt data
export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error('Decryption failed');
  }
};

// Parse decrypted data
export const parseDecryptedData = (decryptedString: string): any => {
  try {
    return JSON.parse(decryptedString);
  } catch (e) {
    return decryptedString;
  }
};

// Encrypt request middleware
export const encryptRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Skip encryption in development mode if DEBUG_ENCRYPTION is false
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_ENCRYPTION !== 'true') {
    return next();
  }

  try {
    // Skip if no body or if it's not a POST/PUT/PATCH request
    if (!req.body || !['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    // Only the 'data' field should be encrypted in the request
    if (req.body.data) {
      try {
        const decryptedData = decryptData(req.body.data);
        req.body = parseDecryptedData(decryptedData);
      } catch (error) {
        console.error('Decryption error:', error);
        return next(new Error('Invalid encrypted data'));
      }
    }
    next();
  } catch (error) {
    console.error('Request encryption middleware error:', error);
    next(error);
  }
};

// Encrypt response middleware
export const encryptResponse = (req: Request, res: Response, next: NextFunction): void => {
  // Skip encryption in development mode if DEBUG_ENCRYPTION is false
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_ENCRYPTION !== 'true') {
    return next();
  }

  try {
    // Store the original json method
    const originalJson = res.json;
    
    // Override the json method
    res.json = function(body: any): any {
      if (body) {
        try {
          const encrypted = encryptData(body);
          return originalJson.call(this, { data: encrypted });
        } catch (error) {
          console.error('Response encryption error:', error);
          return originalJson.call(this, body);
        }
      }
      return originalJson.call(this, body);
    };
    
    next();
  } catch (error) {
    console.error('Response encryption middleware error:', error);
    next(error);
  }
};