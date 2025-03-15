import { Router } from 'express';
import { ChatwootController } from '../controllers/chatwoot.controller';
import { asyncHandler } from '../utils/async-handler';

export const chatwootRouter = Router();
const controller = new ChatwootController();

chatwootRouter.post('/webhook', asyncHandler((req, res) => controller.handleChatwootEvent(req, res)));

//chatwootRouter.post('/sync/:groupId',asyncHandler((req, res) => controller.syncHistory(req, res)));

// import WebSocket from 'ws';

// const pubsubToken = 'your_pubsub_token_here';
// const ws = new WebSocket('wss://app.chatwoot.com/cable');

// ws.on('open', () => {
//     console.log('WebSocket connected');

//     // Подписываемся на канал
//     const subscribeMessage = {
//         command: 'subscribe',
//         identifier: JSON.stringify({
//             channel: 'ConversationChannel',
//             pubsub_token: pubsubToken
//         })
//     };

//     ws.send(JSON.stringify(subscribeMessage));
// });

// ws.on('message', async (data) => {
//     const message = JSON.parse(data.toString());

//     if (message.type === 'message_created') {
//         const content = message.content;
//         const vkUserId = extractVkUserIdFromMessage(message); // Извлеките ID пользователя

//         // Отправляем сообщение в VK
//         await sendMessageToVK(vkUserId, content);
//     }
// });