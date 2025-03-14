import { Router } from 'express';
import { ChatwootController } from '../controllers/chatwoot.controller';
import { asyncHandler } from '../utils/async-handler';

export const chatwootRouter = Router();
const controller = new ChatwootController();

// Вебхук для получения событий из Chatwoot
chatwootRouter.post('/webhook', asyncHandler((req, res) => controller.handleChatwootEvent(req, res)));

// Синхронизация истории сообщений
chatwootRouter.post('/sync/:groupId',asyncHandler((req, res) => controller.syncHistory(req, res)));