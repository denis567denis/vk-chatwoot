import axios, { AxiosInstance, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { logger } from '../config/logger';
import { VKCommunity } from '../models/vk-community.model';
import { VKUploadResponse, VKSavePhotoResponse, VKSaveDocResponse } from '../types/vk-api';

export class StorageService {
  private client = axios.create({
    baseURL: process.env.CHATWOOT_URL,
    headers: {
      'api_access_token': process.env.CHATWOOT_API_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  async uploadImage(url: string | undefined, groupId: number): Promise<string> {
    if (!url) throw new Error('Invalid image URL');
    
    try {
      const response: any = await axios.get(url, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data, 'binary');
      
      const uploadUrl = await this.getVKUploadUrl(groupId, 'photo');
      
      const form = new FormData();
      form.append('photo', imageBuffer, 'image.jpg');
      
      const uploadResponse: AxiosResponse<VKUploadResponse> = await this.client.post(uploadUrl, form, {
        headers: form.getHeaders()
      });

      const saveResponse: AxiosResponse<VKSavePhotoResponse> = await axios.post(
        'https://api.vk.com/method/photos.saveMessagesPhoto',
        {
          ...uploadResponse.data,
          access_token: process.env.VK_ACCESS_TOKEN,
          v: process.env.VK_API_VERSION,
        }
      );

      // Теперь TypeScript знает структуру saveResponse.data
      return `photo${saveResponse.data.response[0].owner_id}_${saveResponse.data.response[0].id}`;
    } catch (error) {
      logger.error('Image upload failed:', error);
      throw error;
    }
  }

  async uploadDoc(url: string | undefined, groupId: number): Promise<string> {
    if (!url) throw new Error('Invalid document URL');
    
    try {
      // Аналогичная логика для документов
      const response = await this.client.get(url, { responseType: 'arraybuffer' });
      const docBuffer = Buffer.from(response.data, 'binary');
      
      const uploadUrl = await this.getVKUploadUrl(groupId, 'doc');
      
      const form = new FormData();
      form.append('file', docBuffer, 'document.pdf');
      
      const uploadResponse = await this.client.post(uploadUrl, form, {
        headers: form.getHeaders()
      });

      const saveResponse: AxiosResponse<VKSaveDocResponse> = await axios.post(
        'https://api.vk.com/method/docs.save',
        {
          ...uploadResponse.data,
          access_token: process.env.VK_ACCESS_TOKEN,
          v: process.env.VK_API_VERSION
        }
      );

      return `doc${saveResponse.data.response.doc.owner_id}_${saveResponse.data.response.doc.id}`;
    } catch (error) {
      logger.error('Document upload failed:', error);
      throw error;
    }
  }

  private async getVKUploadUrl(groupId: number, type: 'photo' | 'doc'): Promise<string> {
    const method = type === 'photo' 
      ? 'photos.getUploadServer' 
      : 'docs.getUploadServer';

    const response: any = await axios.get(
      `https://api.vk.com/method/${method}`,
      {
        params: {
          group_id: groupId,
          access_token: process.env.VK_ACCESS_TOKEN,
          v: process.env.VK_API_VERSION
        }
      }
    );

    return response.data.response.upload_url;
  }
}