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
    type: 'photo' | 'video' | 'doc';
    photo?: { sizes: Array<{ url: string }> };
    video?: { title: string; player: string };
    doc?: { url: string; title: string };
  }