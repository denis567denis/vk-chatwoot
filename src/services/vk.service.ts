import axios, { AxiosInstance } from 'axios';
import { VKWebhookEvent, VKAttachment } from '../types/vk';
import { logger } from '../config/logger';
import { VKCommunity } from '../models/vk-community.model';
import { StorageService } from './storage.service';

export class VKService {
  private client: AxiosInstance;
  private storage: StorageService;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.vk.com/method/',
      params: { v: process.env.VK_API_VERSION },
    });
    this.storage = new StorageService();
  }
  async processMessage(event: VKWebhookEvent) {
    console.log("event.object.message", event.object.message);
    console.log("event.object.message", ...event.object.message.attachments);
    return {
      text: event.object.message.text,
      attachments:  event.object.message.attachments?.map(attachment => ({
        url: attachment.url,
        type: attachment.type,
        ...(attachment.title && { title: attachment.title })
    }))
    };
  }

  // private async processAttachments(attachments: VKAttachment[], groupId: number) {
  //   return Promise.all(
  //     attachments.map(async (attachment) => {
  //       switch (attachment.type) {
  //         case 'photo':
  //           return this.storage.uploadImage(
  //             attachment.photo?.sizes.pop()?.url,
  //             groupId
  //           );
  //         case 'doc':
  //           return this.storage.uploadDoc(attachment.doc?.url, groupId);
  //         default:
  //           logger.warn(`Unsupported attachment type: ${attachment.type}`);
  //           return null;
  //       }
  //     })
  //   );
  // }

  async sendMessage(params: {
    userId: number;
    text: string;
    attachments: string[];
    accessToken: string;
  }) {
    try {
      const response = await this.client.post('messages.send', {
        user_id: params.userId,
        message: params.text,
        attachment: params.attachments.join(','),
        access_token: params.accessToken,
      });
      console.log("handleChatwootEvent.sendMessage.response", response);
      return response.data;
    } catch (error) {
      logger.error('VK API Error:', error);
      throw error;
    }
  }

  async getCommunitySettings(groupId: number): Promise<VKCommunity | null> {
    try {
      const community = await VKCommunity.findOne({
        where: { group_id: groupId },
      });
      return community;
    } catch (error) {
      logger.error('Failed to fetch community settings:', error);
      throw error;
    }
  }

  async getCommunityByInboxId(inboxId: number): Promise<VKCommunity | null> {
    try {
      const community = await VKCommunity.findOne({
        where: { chatwoot_inbox_id: inboxId },
      });
      console.log("handleChatwootEvent.getCommunityByInboxId.community", community);
      return community;
    } catch (error) {
      logger.error('Failed to fetch community by inbox ID:', error);
      throw error;
    }
  }
  async getMessagesHistory(params: {
    groupId: number;
    accessToken: string;
    offset?: number;
    count?: number;
  }): Promise<any[]> {
    try {
      const response = await this.client.post('messages.getHistory', {
        group_id: params.groupId,
        access_token: params.accessToken,
        offset: params.offset || 0,
        count: params.count || 200,
      });

      return response.data.response.items;
    } catch (error) {
      logger.error('Failed to fetch VK messages history:', error);
      throw error;
    }
  }

  async getVKUploadUrl(type: 'photo' | 'doc', groupId?: number): Promise<string> {
    try {
      const method = type === 'photo' ? 'photos.getUploadServer' : 'docs.getUploadServer';
      const response = await this.client.post(method, {
        group_id: groupId,
        access_token: process.env.VK_ACCESS_TOKEN,
      });

      return response.data.response.upload_url;
    } catch (error) {
      logger.error('Failed to get VK upload URL:', error);
      throw error;
    }
  }
  async savePhoto(uploadData: any): Promise<{ owner_id: number; id: number }> {
    try {
      const response = await this.client.post('photos.saveMessagesPhoto', {
        ...uploadData,
        access_token: process.env.VK_ACCESS_TOKEN,
      });

      return response.data.response[0];
    } catch (error) {
      logger.error('Failed to save photo in VK:', error);
      throw error;
    }
  }
  async saveDoc(uploadData: any): Promise<{ owner_id: number; id: number }> {
    try {
      const response = await this.client.post('docs.save', {
        ...uploadData,
        access_token: process.env.VK_ACCESS_TOKEN,
      });

      return response.data.response.doc;
    } catch (error) {
      logger.error('Failed to save document in VK:', error);
      throw error;
    }
  }

  async getVKUserInfo(vkUserId: any) {
    const response = await this.client.get('users.get', {
      params: {
          user_ids: vkUserId,
          fields: 'photo_100',
          access_token: process.env.VK_ACCESS_TOKEN,
      }
  });

  const userData = response.data.response[0];
  return {
      name: `${userData.first_name} ${userData.last_name}`,
      avatar: userData.photo_100
  };
  }
}