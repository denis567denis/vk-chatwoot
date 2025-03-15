import axios, { AxiosInstance } from 'axios';
import { VKWebhookEvent } from '../types/vk';
import { logger } from '../config/logger';
import { VKCommunity } from '../models/vk-community.model';

export class VKService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.vk.com/method/',
      params: { v: process.env.VK_API_VERSION },
    });
  }
  async processMessage(event: VKWebhookEvent) {
    return {
      text: event.object.message.text,
      attachments:  await this.processAttachments(event.object.message.attachments)
    };
  }

  private async processAttachments(attachments: any[]) {
    return attachments.map(attachment => {
      if (attachment.type === 'photo') {
          const photo = attachment.photo;
          const largestSize = photo.sizes.reduce((prev: any, current: any) =>
            (prev.width > current.width && prev.height > current.height) ? prev : current
          );
          return { url: largestSize.url, type: 'image' };
      }
      if (attachment.type === 'video') {
          const video = attachment.video;
          return { url: video.player || video.image[0].url, type: 'video' };
      }
      if (attachment.type === 'doc') {
          const doc = attachment.doc;
          return { url: doc.url, type: 'file', title: doc.title };
      }
      return null;
  }).filter(Boolean);
  }

  async sendMessage(params: {
    userId: number;
    text: string;
    attachments: string[];
  }) {
    try {
      const response = await this.client.post('messages.send', {
       params: {
        user_id: params.userId,
        message: params.text,
        random_id: Math.floor(Math.random() * 100000),
        attachment: params.attachments.join(','),
        access_token: process.env.VK_ACCESS_TOKEN,
       }
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

  // async getMessagesHistory(params: {
  //   groupId: number;
  //   accessToken: string;
  //   offset?: number;
  //   count?: number;
  // }): Promise<any[]> {
  //   try {
  //     const response = await this.client.post('messages.getHistory', {
  //       group_id: params.groupId,
  //       access_token: params.accessToken,
  //       offset: params.offset || 0,
  //       count: params.count || 200,
  //     });

  //     return response.data.response.items;
  //   } catch (error) {
  //     logger.error('Failed to fetch VK messages history:', error);
  //     throw error;
  //   }
  // }

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
    } catch (error) {;
      logger.error('Failed to save document in VK:', error)
      throw error;
    }
  }

  async getVKUserInfo(vkUserId: any) {
    try {
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
  } catch(error) {
    logger.error('Failed to getVKUserInfo:', error)
  }
  }
}