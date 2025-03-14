import axios from 'axios';
import { logger } from '../config/logger';
import { UserGroup } from '../models/userGroup.model';

export class ChatwootService {
  private client = axios.create({
    baseURL: process.env.CHATWOOT_URL,
    headers: {
      'api_access_token': process.env.CHATWOOT_API_TOKEN,
      'Content-Type': ['application/json', 'charset=utf-8'],
    },
  });
  async forwardToChatwoot(conversationId: number, userIdTg: number , message: any) {
    try {
      await this.client.post(
        `/public/api/v1/inboxes/${Number.parseInt(process.env.CHATWOOT_INBOX_INDENTIFER || '')}/contacts/${userIdTg}/conversations/${conversationId}/messages`,
        {
          content: message.text,
          message_type: 'incoming',
        }
      );
    } catch (error) {
      logger.error('Chatwoot API Error:', error);
      throw error;
    }
  }
  async findContact(vkUserId: any) {
    try {
      const response =  await this.client.get(`/public/api/v1/inboxes/${Number.parseInt(process.env.CHATWOOT_INBOX_INDENTIFER || '')}/contacts/${vkUserId}`, {
        headers: { Authorization: `Bearer ${process.env.CHATWOOT_API_TOKEN}` },
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
      const newContact =  await this.client.post(`/public/api/v1/inboxes/${Number.parseInt(process.env.CHATWOOT_INBOX_INDENTIFER || '')}/contacts`, {
        inbox_id: parseInt(process.env.CHATWOOT_INBOX_ID || ''),
        name: message.name,
        identifier: vkUserId,
        avatar_url: message.avatar
     }, {
       headers: { Authorization: `Bearer ${process.env.CHATWOOT_API_TOKEN}` }
      });
  
      await UserGroup.upsert({
        userTgId: vkUserId,
      });

      return newContact.data.id;
    } catch (error) {
    logger.error('Chatwoot API contact Error:', error);
    throw error;
    }
  }

  async createConversationIfNeeded(userIdTg: number, groubIdTg: number) {
    try {
    const user = await UserGroup.findOne({
      where: { userIdTg }
    });
    const conversation = user?.conversationList?.find((value)=> {
      if(value.groubIdTg === groubIdTg) {
        return true;
      }
      return false;
    });
  
    if (conversation?.conversationIdChatwoot) {
      return conversation.conversationIdChatwoot;
    }

    const newConversation = await this.client.post(`/api/v1/accounts/${Number.parseInt(process.env.CHATWOOT_ACCOUNT_ID || '')}/conversations`, {
      inbox_id: parseInt(process.env.CHATWOOT_INBOX_ID || ''),
      contact_id: userIdTg,
      status: 'open'
    }, {
      headers: { Authorization: `Bearer ${process.env.CHATWOOT_API_TOKEN}` }
    });
    user?.conversationList?.push({
      groubIdTg,
      conversationIdChatwoot: newConversation.data.id
    })

    await UserGroup.update({
      conversationList : user?.conversationList
    }, {
      where: { userIdTg }
    });
    return newConversation.data.id;
      }catch (error) {
      logger.error('Chatwoot API contact Error:', error);
      throw error;
      }
  }
  
}