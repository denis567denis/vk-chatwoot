// src/utils/async-handler.ts
import { RequestHandler } from 'express';

// Обработчик асинхронных ошибок для Express
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};