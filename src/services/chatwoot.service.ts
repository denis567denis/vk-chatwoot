import axios from 'axios';
import { logger } from '../config/logger';

interface ChatwootMessage {
  inboxId: number;
  sender: {
    id: number;
    name: string;
  };
  text: string;
  attachments: string[];
}

export class ChatwootService {
  private client = axios.create({
    baseURL: process.env.CHATWOOT_URL,
    headers: {
      'api_access_token': process.env.CHATWOOT_API_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  async forwardToChatwoot(message: ChatwootMessage) {
    try {
      await this.client.post(
        `/api/v1/inboxes/${message.inboxId}/messages`,
        {
          content: message.text,
          sender: {
            id: `vk-${message.sender.id}`,
            name: message.sender.name
          },
          attachments: message.attachments,
        }
      );
    } catch (error) {
      logger.error('Chatwoot API Error:', error);
      throw error;
    }
  }
}