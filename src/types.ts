export interface Chat {
    id: number;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
    online: boolean;
    isGroup?: boolean;
  }
  
  export interface Message {
    id: number;
    sender?: string;
    content: string;
    time: string;
    isMe: boolean;
    status?: 'sent' | 'read';
  }