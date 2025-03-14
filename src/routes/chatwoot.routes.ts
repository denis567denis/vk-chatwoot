import { Router } from 'express';
import { ChatwootController } from '../controllers/chatwoot.controller';
import { asyncHandler } from '../utils/async-handler';

export const chatwootRouter = Router();
const controller = new ChatwootController();

// Вебхук для получения событий из Chatwoot
chatwootRouter.post('/webhook', asyncHandler(controller.handleChatwootEvent));

// Синхронизация истории сообщений
chatwootRouter.post('/sync/:groupId', asyncHandler(controller.syncHistory));