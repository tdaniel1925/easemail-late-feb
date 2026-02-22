// Application constants

export const GRAPH_SCOPES = [
  'Mail.Read',
  'Mail.ReadWrite',
  'Mail.Send',
  'Calendars.ReadWrite',
  'Chat.ReadWrite',
  'Contacts.Read',
  'User.Read',
  'Presence.Read',
  'Team.ReadBasic.All',
  'ChannelMessage.Read.All',
  'OnlineMeetings.ReadWrite',
];

export const APP_NAME = 'EaseMail';
export const APP_VERSION = '3.0.0';

export const SYNC_INTERVALS = {
  DELTA_SYNC_MS: 60000, // 1 minute
  WEBHOOK_RENEWAL_HOURS: 48, // 2 days
  TOKEN_REFRESH_BUFFER_MINUTES: 5,
};

export const PAGINATION = {
  MESSAGES_PER_PAGE: 50,
  MAX_BATCH_SIZE: 100,
};
