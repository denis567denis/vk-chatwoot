import { Request, Response } from 'express';
import { VKService } from '../services/vk.service';
import { logger } from '../config/logger';
import FormData from 'form-data';
import axios from 'axios';

export class ChatwootController {
  private vkService = new VKService();
  private client = axios.create({
    baseURL: process.env.CHATWOOT_URL,
    headers: {
      'api_access_token': process.env.CHATWOOT_API_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  async handleChatwootEvent(req: Request, res: Response) {
    const event = req.body;
    console.log("handleChatwootEvent.req.body", req.body);
    try {
        if (event.message_type !== 'outgoing') {
          res.status(200).end();
          return;
        }
          
        await this.vkService.sendMessage({
          userId: event.conversation.contact_inbox.source_id,
          text: event.content,
          attachments: await this.processAttachments([]),
        });
        res.status(200).json({ status: 'success' });
        return;

    } catch (error) {
      logger.error('Chatwoot webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // async syncHistory(req: Request, res: Response) {
  //   const { groupId } = req.params;

  //   try {
  //     // Получаем настройки сообщества
  //     const community = await this.vkService.getCommunitySettings(Number(groupId));
  //     if (!community) {
  //       res.status(404).json({ error: 'Community not found' });
  //       return; 
  //     }

  //     const vkMessages = await this.vkService.getMessagesHistory({
  //       groupId: community.group_id,
  //       accessToken: community.access_token,
  //     });

  //     await this.syncMessages({
  //       inboxId: Number.parseInt(process.env.CHATWOOT_INBOX_ID || ''),
  //       messages: vkMessages,
  //     });

  //     res.status(200).json({
  //       message: 'Sync completed successfully',
  //       syncedMessages: vkMessages.length,
  //     });
  //     return;
  //   } catch (error) {
  //     logger.error('Failed to sync history:', error);
  //     res.status(500).json({ error: 'Internal server error' });
  //   }
  // }

  async syncMessages(params: {
    inboxId: number;
    messages: any[];
  }): Promise<void> {
    try {
      for (const message of params.messages) {
        await this.client.post(
          `/api/v1/inboxes/${params.inboxId}/messages`,
          {
            content: message.text,
            sender_id: `vk-${message.from_id}`,
            created_at: message.date,
          }
        );
      }
    } catch (error) {
      logger.error('Failed to sync messages to Chatwoot:', error);
      throw error;
    }
  }

  private async processAttachments(attachments: any[]): Promise<string[]> {
    const processedAttachments: string[] = [];

    for (const attachment of attachments) {
      try {
        if (attachment.file_type?.startsWith('image')) {
          const imageUrl = await this.downloadAndUploadImage(attachment.data_url);
          if (imageUrl) {
            processedAttachments.push(imageUrl);
          }
        } else if (attachment.file_type === 'file') {
          const fileUrl = await this.downloadAndUploadFile(attachment.data_url);
          if (fileUrl) {
            processedAttachments.push(fileUrl);
          }
        } else {
          logger.warn(`Unsupported attachment type: ${attachment.file_type}`);
        }
      } catch (error) {
        logger.error('Failed to process attachment:', error);
      }
    }

    return processedAttachments;
  }

  private async downloadAndUploadImage(url: string): Promise<string | null> {
    try {
      const response: any = await axios.get(url, { responseType: 'arraybuffer' });
      const imageBuffer: any = Buffer.from(response.data, 'binary');

      const uploadUrl = await this.vkService.getVKUploadUrl('photo');
      const form = new FormData();
      form.append('photo', imageBuffer, 'image.jpg');

      const uploadResponse = await axios.post(uploadUrl, form, {
        headers: form.getHeaders(),
      });

      const saveResponse = await this.vkService.savePhoto(uploadResponse.data);
      return `photo${saveResponse.owner_id}_${saveResponse.id}`;
    } catch (error) {
      logger.error('Failed to upload image to VK:', error);
      return null;
    }
  }

  private async downloadAndUploadFile(url: string): Promise<string | null> {
    try {
      const response: any = await axios.get(url, { responseType: 'arraybuffer' });
      const fileBuffer: any = Buffer.from(response.data, 'binary');

      const uploadUrl = await this.vkService.getVKUploadUrl('doc');
      const form = new FormData();
      form.append('file', fileBuffer, 'file.pdf');

      const uploadResponse = await axios.post(uploadUrl, form, {
        headers: form.getHeaders(),
      });

      const saveResponse = await this.vkService.saveDoc(uploadResponse.data);
      return `doc${saveResponse.owner_id}_${saveResponse.id}`;
    } catch (error) {
      logger.error('Failed to upload file to VK:', error);
      return null;
    }
  }
}