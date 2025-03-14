import winston from 'winston';
import { TransformableInfo } from 'logform';

const { combine, timestamp, printf, colorize } = winston.format;

const customFormat = printf((info: TransformableInfo) => {
  return `${info.timestamp} [${info.level}] ${info.message}${
    info.metadata && Object.keys(info.metadata).length ? ` | ${JSON.stringify(info.metadata)}` : ''
  }`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        customFormat
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(
        customFormat
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(
        customFormat
      ),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
});

// Подключаем логгер для промисов
logger.exitOnError = false;

export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};