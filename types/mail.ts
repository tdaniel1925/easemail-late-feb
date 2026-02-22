// Mail domain types
export interface Message {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  receivedAt: string;
  isRead: boolean;
  hasAttachments: boolean;
  labels: string[];
}

export interface Folder {
  id: string;
  name: string;
  unreadCount: number;
  totalCount: number;
}

export interface ConnectedAccount {
  id: string;
  email: string;
  provider: 'microsoft';
  isActive: boolean;
}
