import axios from 'axios';
import { logger } from '../config/logger';

export class ChatwootService {
  private client = axios.create({
    baseURL: process.env.CHATWOOT_URL,
    headers: {
      'api_access_token': process.env.CHATWOOT_API_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  async forwardToChatwoot(conversationId: number , message: any) {
    try {
      await this.client.post(
        `/api/v1/accounts/${Number.parseInt(process.env.CHATWOOT_ACCOUNT_ID || '')}/conversations/${conversationId}/messages`,
        {
          content: message.text,
          message_type: 'incoming',
          attachments: message.attachments,
          conversation_id: conversationId
        }
      );
    } catch (error) {
      logger.error('Chatwoot API Error:', error);
      throw error;
    }
  }

  async findContact(vkUserId: any) {
    try {
      const response =  await this.client.get(`/api/v1/accounts/${Number.parseInt(process.env.CHATWOOT_ACCOUNT_ID || '')}/contacts`, {
        headers: { Authorization: `Bearer ${process.env.CHATWOOT_API_TOKEN}` },
        params: { identifier: vkUserId }
      });
      if (response.data.payload.length > 0) {
        return response.data.payload[0].id;
      }
      return undefined;
    } catch (error) {
      logger.error('Chatwoot API contact Error:', error);
      throw error;
    }
  }

  async createContact(vkUserId: any, message: any) {
    try {
      const newContact =  await this.client.post(`/api/v1/accounts/${Number.parseInt(process.env.CHATWOOT_ACCOUNT_ID || '')}/contacts`, {
        inbox_id: parseInt(process.env.CHATWOOT_INBOX_ID || ''),
        name: message.name,
        identifier: vkUserId,
        avatar_url: message.avatar
     }, {
       headers: { Authorization: `Bearer ${process.env.CHATWOOT_API_TOKEN}` }
      });
  
      return newContact.data.id;
    } catch (error) {
    logger.error('Chatwoot API contact Error:', error);
    throw error;
    }
  }

  async createConversationIfNeeded(contactId: any) {
    try {
    const response = await this.client.get(`/api/v1/accounts/${Number.parseInt(process.env.CHATWOOT_ACCOUNT_ID || '')}/conversations`, {
      headers: { Authorization: `Bearer ${process.env.CHATWOOT_API_TOKEN}` },
      params: { contact_id: contactId }
    });
    console.log('createConversationIfNeeded.response', response);
  
    if (response?.data?.data?.payload?.length > 0) {
      return response.data.data.payload[0].id;
    }

    const newConversation = await this.client.post(`/api/v1/accounts/${Number.parseInt(process.env.CHATWOOT_ACCOUNT_ID || '')}/conversations`, {
      inbox_id: parseInt(process.env.CHATWOOT_INBOX_ID || ''),
      contact_id: contactId,
      status: 'open'
    }, {
      headers: { Authorization: `Bearer ${process.env.CHATWOOT_API_TOKEN}` }
    });
  
    console.log('createConversationIfNeeded.newConversation', newConversation);
    return newConversation.data.id;
      }catch (error) {
      logger.error('Chatwoot API contact Error:', error);
      throw error;
      }
  }
  
}