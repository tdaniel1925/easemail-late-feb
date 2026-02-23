/**
 * Step 5.4 Test Gate: Message List
 *
 * Tests:
 * - Messages load and display
 * - Can select single message
 * - Can multi-select messages
 * - Toolbar actions work
 * - Infinite scroll or pagination works
 */

console.log("✓ Step 5.4 Test Gate: Message List");
console.log("");
console.log("Manual Testing Checklist:");
console.log("");
console.log("1. Start dev server: npm run dev");
console.log("2. Open http://localhost:3000/mail (or next available port)");
console.log("3. Select an account in the AccountSwitcher");
console.log("4. Select a folder in the FolderTree (e.g., Inbox)");
console.log("");
console.log("Message List Display:");
console.log("   [ ] Message list visible in middle column (384px = 96 = w-96)");
console.log("   [ ] Messages load from API when folder is selected");
console.log("   [ ] Header shows 'Inbox' with message count");
console.log("   [ ] Each message row is 72px tall");
console.log("   [ ] Refresh and Filter buttons in header");
console.log("   [ ] Select all checkbox in header");
console.log("");
console.log("Message Row Display:");
console.log("   [ ] Each message shows:");
console.log("       - Checkbox (left edge)");
console.log("       - Unread dot (coral, 6px, only if unread)");
console.log("       - Avatar (28px, initials if no photo)");
console.log("       - From name (14px, semibold if unread)");
console.log("       - Date (formatted: '2:30 PM', 'Yesterday', 'Monday', 'Jan 15')");
console.log("       - Subject (14px, semibold if unread)");
console.log("       - Preview text (12px, gray)");
console.log("       - Attachment icon (if has_attachments)");
console.log("       - Category labels (if categories exist)");
console.log("       - Flag icon (if flagged, coral, filled)");
console.log("   [ ] Unread messages: semibold subject + sender, coral dot");
console.log("   [ ] Read messages: normal weight subject + sender, no dot");
console.log("   [ ] Selected message: coral left border (2px), subtle coral bg");
console.log("   [ ] Hover state: light gray background");
console.log("");
console.log("Message Selection:");
console.log("   [ ] Click row to single-select (clears other selections)");
console.log("   [ ] Click checkbox to multi-select (toggles selection)");
console.log("   [ ] Checkbox in header selects/deselects all");
console.log("   [ ] Selection count shows in toolbar when > 0 selected");
console.log("");
console.log("Message List Toolbar:");
console.log("   [ ] Toolbar appears when messages are selected");
console.log("   [ ] Toolbar shows: '3 selected' count");
console.log("   [ ] Toolbar buttons:");
console.log("       - Archive (with icon + text)");
console.log("       - Delete (with icon + text)");
console.log("       - Mark Read (icon only)");
console.log("       - Mark Unread (icon only)");
console.log("       - Flag (icon only)");
console.log("       - Move (with icon + text)");
console.log("       - Clear button (right side)");
console.log("   [ ] Click 'Clear' button clears selection");
console.log("   [ ] Toolbar disappears when no messages selected");
console.log("");
console.log("Loading & Error States:");
console.log("   [ ] Loading: Shows 8 skeleton rows with pulse animation");
console.log("   [ ] No account: Shows 'Select an account to view messages'");
console.log("   [ ] No messages: Shows 'No messages' with mail icon");
console.log("   [ ] API error: Shows error message with 'Try Again' button");
console.log("");
console.log("Design System Compliance:");
console.log("   [ ] Row height: exactly 72px (18 = 72px)");
console.log("   [ ] Avatar size: 28px (7 = 28px)");
console.log("   [ ] Unread dot: 6px diameter (1.5 = 6px), coral (#FF7F50)");
console.log("   [ ] Checkbox: 16px (4 = 16px)");
console.log("   [ ] Font sizes:");
console.log("       - From name: 14px (text-sm)");
console.log("       - Subject: 14px (text-sm)");
console.log("       - Preview: 12px (text-xs)");
console.log("       - Date: 12px (text-xs)");
console.log("       - Categories: 10px");
console.log("   [ ] Spacing: all padding/margins multiples of 4px");
console.log("   [ ] Border radius: 6px on buttons");
console.log("   [ ] Coral accent ONLY on: unread dot, flag icon, selection border");
console.log("");
console.log("Date Formatting:");
console.log("   [ ] Today: '2:30 PM' (time only)");
console.log("   [ ] Yesterday: 'Yesterday'");
console.log("   [ ] This week: 'Monday', 'Tuesday', etc.");
console.log("   [ ] Older: 'Jan 15' (month + day)");
console.log("");
console.log("Accessibility:");
console.log("   [ ] Checkboxes are keyboard accessible");
console.log("   [ ] Tab navigation works through messages");
console.log("   [ ] Focus rings visible (coral, 2px)");
console.log("   [ ] Toolbar buttons have title attributes");
console.log("");
console.log("API Integration:");
console.log("   [ ] Fetches from GET /api/mail/messages?accountId=xxx&folderId=xxx");
console.log("   [ ] Updates when account changes");
console.log("   [ ] Updates when folder changes");
console.log("   [ ] Stores messages in Zustand mail store");
console.log("   [ ] Refresh button re-fetches messages");
console.log("");

console.log("If all checks pass, Step 5.4 is COMPLETE ✅");
console.log("");
console.log("Test account: info@tonnerow.com (f817b168-8de0-462b-a676-9e9b8295e8d5)");
console.log("Expected: ~5 messages in various folders");
