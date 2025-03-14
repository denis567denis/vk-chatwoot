import { Request, Response } from 'express';
import { VKService } from '../services/vk.service';
import { ChatwootService } from '../services/chatwoot.service';
import { VKWebhookEvent } from '../types/vk';
import { VKCommunity } from '../models/vk-community.model';
import { logger } from '../config/logger';

export class VKController {
  private vkService = new VKService();
  private chatwootService = new ChatwootService();

  async handleWebhook(req: Request, res: Response) {
    const event = req.body as VKWebhookEvent;

    console.log("handleWebhook.event", event);
    if (event.type === 'confirmation') {
      return this.handleConfirmation(event, res);
    }

    try {
      const messageData: any = await this.vkService.processMessage(event);
      console.log("handleWebhook.messageData", messageData);
      await this.chatwootService.forwardToChatwoot(messageData);
      res.status(200).send('ok');
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  }

  private async handleConfirmation(event: VKWebhookEvent, res: Response) {
    const community = await VKCommunity.findOne({ 
      where: { group_id: event.group_id } 
    });
    
    if (community) {
      res.send(community.confirmation_code);
    } else {
      res.status(404).send('Community not found');
    }
  }
  async getCommunitySettings(req: Request, res: Response) {
    const { groupId } = req.params;

    try {
      const community = await VKCommunity.findOne({
        where: { group_id: groupId },
      });

      if (!community) {
        res.status(404).json({ error: 'Community not found' });
        return;
      }

      res.status(200).json({
        groupId: community.group_id,
        accessToken: community.access_token,
        chatwootInboxId: community.chatwoot_inbox_id,
        confirmation_code: community.confirmation_code
      });
      return;
    } catch (error) {
      logger.error('Failed to fetch community settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateCommunitySettings(req: Request, res: Response) {
    const { groupId } = req.params;
    const { accessToken, chatwootInboxId, confirmation_code } = req.body;

    try {
      const [community, created] = await VKCommunity.upsert({
        group_id: groupId,
        access_token: accessToken,
        chatwoot_inbox_id: chatwootInboxId,
        confirmation_code
      });

      res.status(200).json({
        message: created ? 'Settings created' : 'Settings updated',
        groupId: community.group_id,
        accessToken: community.access_token,
        chatwootInboxId: community.chatwoot_inbox_id,
      });
    } catch (error) {
      logger.error('Failed to update community settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}