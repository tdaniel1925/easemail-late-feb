-- Fix folder types for existing folders
UPDATE account_folders SET folder_type = 'inbox' WHERE display_name = 'Inbox';
UPDATE account_folders SET folder_type = 'sent' WHERE display_name = 'Sent Items';
UPDATE account_folders SET folder_type = 'drafts' WHERE display_name = 'Drafts';
UPDATE account_folders SET folder_type = 'deleted' WHERE display_name = 'Deleted Items';
UPDATE account_folders SET folder_type = 'archive' WHERE display_name = 'Archive';
UPDATE account_folders SET folder_type = 'junk' WHERE display_name = 'Junk Email';
