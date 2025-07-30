import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const options = {
  file: {
    level: 'info',
    filename: path.join(__dirname, '../../logs/app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
  },
  error: {
    level: 'error',
    filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
  },
  console: {
    level: 'debug',
    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
  }
};

const transports: winston.transport[] = [new winston.transports.Console(options.console)];

if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.DailyRotateFile(options.file),
    new winston.transports.DailyRotateFile(options.error)
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports,
  exitOnError: false
});

export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

export default logger;
