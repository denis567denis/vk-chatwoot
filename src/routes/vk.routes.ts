// src/routes/vk.routes.ts
import { Router } from 'express';
import { VKController } from '../controllers/vk.controller';
import { asyncHandler } from '../utils/async-handler';

export const vkRouter = Router();
const controller = new VKController();

vkRouter.post('/webhook',asyncHandler((req, res) => controller.handleWebhook(req, res)));

vkRouter.get('/communities/:groupId', asyncHandler(controller.getCommunitySettings));

vkRouter.put('/communities/:groupId', asyncHandler(controller.updateCommunitySettings));