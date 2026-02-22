// Microsoft Graph API types
export interface GraphUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
}

export interface GraphMessage {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  receivedDateTime: string;
  isRead: boolean;
  body: {
    contentType: 'text' | 'html';
    content: string;
  };
}

export interface GraphFolder {
  id: string;
  displayName: string;
  totalItemCount: number;
  unreadItemCount: number;
}
