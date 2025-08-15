import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET as string;
const ALGORITHM = 'aes-256-gcm';

interface CustomResponse extends Response {
  rawJson?: Function;
}

export const encryptData = (data: unknown): string => {
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_SECRET, iv);

    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('Encryption failed');
  }
};

export const decryptData = (encryptedData: string): string => {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_SECRET, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed');
  }
};

export const parseDecryptedData = (decryptedString: string): unknown => {
  try {
    return JSON.parse(decryptedString);
  } catch (e) {
    return decryptedString;
  }
};

export const encryptRequest = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_ENCRYPTION !== 'true') {
    return next();
  }

  try {
    if (!req.body || !['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    if (req.body.data) {
      try {
        const decryptedData = decryptData(req.body.data);
        req.body = parseDecryptedData(decryptedData);
      } catch (error) {
        console.error('Decryption error:', JSON.stringify(error, null, 2));
        return next(new Error('Invalid encrypted data'));
      }
    }
    next();
  } catch (error) {
    console.error('Request encryption middleware error:', JSON.stringify(error, null, 2));
    next(error);
  }
};

export const encryptResponse = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_ENCRYPTION !== 'true') {
    return next();
  }

  try {
    const originalJson = res.json;

    res.json = function (body: unknown): Response {
      if (body) {
        try {
          const encrypted = encryptData(body);
          return originalJson.call(this, { data: encrypted });
        } catch (error) {
          console.error('Response encryption error:', JSON.stringify(error, null, 2));
          return originalJson.call(this, body);
        }
      }
      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    console.error('Response encryption middleware error:', JSON.stringify(error, null, 2));
    next(error);
  }
};
