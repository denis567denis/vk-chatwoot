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
      console.log("process.env.CHATWOOT_INBOX_INDENTIFER", process.env.CHATWOOT_INBOX_INDENTIFER, "userIdTg", userIdTg, "conversationId", conversationId);
      await this.client.post(
        `/public/api/v1/inboxes/${process.env.CHATWOOT_INBOX_INDENTIFER}/contacts/${userIdTg}/conversations/${conversationId}/messages`,
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
      const response =  await this.client.get(`/public/api/v1/inboxes/${process.env.CHATWOOT_INBOX_INDENTIFER}/contacts/${vkUserId}`, {
        headers: { Authorization: `Bearer ${process.env.CHATWOOT_API_TOKEN}` },
      });
      console.log("response?.data", response?.data);
      if (response?.data?.source_id) {
        await UserGroup.upsert({
          userIdTg: vkUserId,
        });
        return response.data.source_id;
      }
      return undefined;
    } catch (error: any) {
      console.log('error',error);
      if(error.status === 404) {
        return undefined;
      }
      logger.error('Chatwoot API contact Error:', error);
      throw error;
    }
  }

  async createContact(vkUserId: any, message: any) {
      const newContact =  await this.client.post(`/public/api/v1/inboxes/${process.env.CHATWOOT_INBOX_INDENTIFER}/contacts`, {
        name: message.name,
        source_id: vkUserId,
        identifier: vkUserId,
        avatar_url: message.avatar
     }, {
       headers: { Authorization: `Bearer ${process.env.CHATWOOT_API_TOKEN}` }
      });

      if (!newContact) {
        return false;
      }
  
      await UserGroup.upsert({
        userIdTg: vkUserId,
      });

      return newContact.data.source_id;
  }

  async createConversationIfNeeded(userIdTg: any, groupIdTg: number) {
    try {
      console.log("userIdTg", userIdTg);
    const user = await UserGroup.findOne({
      where: { userIdTg }
    });
    console.log("handleWebhook.createConversationIfNeeded.user", user);
    const conversation = user?.conversationList?.find((value)=> {
      if(value.groupIdTg === groupIdTg) {
        return true;
      }
      return false;
    });
  
    console.log("handleWebhook.createConversationIfNeeded.conversation", conversation);
    if (conversation?.conversationIdChatwoot) {
      return conversation.conversationIdChatwoot;
    }

    const newConversation = await this.client.post(`/public/api/v1/inboxes/${process.env.CHATWOOT_INBOX_ID}/contacts/${userIdTg}/conversations`, {
      headers: { Authorization: `Bearer ${process.env.CHATWOOT_API_TOKEN}` }
    });
    console.log("handleWebhook.createConversationIfNeeded.newConversation", newConversation);
    user?.conversationList?.push({
      groupIdTg,
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