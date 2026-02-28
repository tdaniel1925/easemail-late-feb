# Duplicate Folders Fix - Completed

## Problem

The account `tdaniel@bundlefly.com` had duplicate inbox folders:
- "Inbox" with 88,352 messages
- "INBOX" with only 125 messages

The UI was showing the wrong inbox (alphabetically first "INBOX") instead of the correct one ("Inbox" with 88K messages). This happened because the API sorted folders alphabetically by `display_name`, and "INBOX" comes before "Inbox".

Similar duplicates existed for other well-known folders (Sent Items, Drafts, Deleted Items, Archive, Junk Email).

## Solution

Implemented a 4-part solution:

### 1. Database Migration (008_fix_duplicate_folders.sql)
- Added `is_primary` BOOLEAN column to `account_folders` table
- Created index for faster lookups: `idx_account_folders_primary`
- Automatically marks the folder with the most messages as primary for each `account_id + folder_type` combination
- Handles all well-known folder types: inbox, sentitems, drafts, deleteditems, archive, junkemail
- Custom folders are all marked as primary (no duplicates expected)

### 2. API Update (app/api/mail/folders/route.ts)
- Added filter: `.eq('is_primary', true)`
- Now only returns primary folders to the UI
- Eliminates duplicate folders from the folder list

### 3. Folder Sync Service Update (lib/graph/folder-sync.ts)
- Added `fixDuplicateFolders()` private method
- Automatically runs after each folder sync
- Maintains the `is_primary` flag based on:
  1. `total_count` DESC (folder with most messages wins)
  2. `unread_count` DESC (tie-breaker)
  3. `created_at` ASC (oldest folder wins if still tied)

### 4. Test Scripts
- `scripts/check-duplicate-folders.ts` - Diagnostic script to identify duplicates
- `scripts/test-duplicate-folders-fix.ts` - Tests the folder sync with duplicate fix
- `scripts/test-folders-api-v3.ts` - Verifies API returns correct folders

## Verification Results

### Before Fix:
- 2 inbox folders: "Inbox" (88,352 messages) and "INBOX" (125 messages)
- UI showed wrong inbox ("INBOX" with only 125 messages)

### After Fix:
```
✅ inbox          : 1 folder (Inbox - 88,352 messages)
✅ sentitems      : 1 folder (Sent - 6,973 messages)
✅ drafts         : 1 folder (Drafts - 470 messages)
✅ deleteditems   : 1 folder (Deleted Items - 22,871 messages)
✅ archive        : 1 folder (Archive - 1,782 messages)
✅ junkemail      : 1 folder (Junk Email - 0 messages)
```

All folder types now have exactly 1 primary folder being returned by the API.

## Files Modified

1. `supabase/migrations/008_fix_duplicate_folders.sql` - Created
2. `lib/graph/folder-sync.ts` - Added `fixDuplicateFolders()` method
3. `app/api/mail/folders/route.ts` - Added `is_primary` filter
4. `scripts/check-duplicate-folders.ts` - Created diagnostic script
5. `scripts/test-duplicate-folders-fix.ts` - Created test script
6. `scripts/test-folders-api-v3.ts` - Created API verification script

## Migration Applied

```bash
npx supabase db push --linked
```

Migration 008 successfully applied to remote database.

## Impact

- Users now see the correct inbox with all their messages
- No more confusion from duplicate folders
- Automatic maintenance during folder sync
- Performance improvement with indexed `is_primary` column

## Date Completed

2026-02-28
