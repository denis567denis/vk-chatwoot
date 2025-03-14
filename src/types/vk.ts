// src/types/vk.ts
export interface VKWebhookEvent {
    type: string;
    group_id: number;
    object: {
      message: {
        from_id: number;
        text: string;
        attachments: VKAttachment[];
      };
    };
  }
  
  export interface VKAttachment {
    url: any;
    type: 'photo' | 'video' | 'doc';
    title: string;
  }