/**
 * Step 5.10 Test Gate: Keyboard Shortcuts
 *
 * Manual Test Checklist - Verify all items:
 */

// ✅ CHECKLIST:

// 1. General Shortcuts
//    [ ] Cmd+K / Ctrl+K opens search modal
//    [ ] / opens search modal (when not in input field)
//    [ ] Cmd+, / Ctrl+, opens settings page
//    [ ] ? opens keyboard shortcuts help modal
//    [ ] Esc closes keyboard shortcuts modal

// 2. Compose Shortcuts
//    [ ] c opens new compose modal
//    [ ] Compose shortcut only works when NOT in input field
//    [ ] Compose shortcut works from any page

// 3. Reply Shortcuts (when viewing a message)
//    [ ] r opens reply composer
//    [ ] Shift+R opens reply all composer
//    [ ] f opens forward composer
//    [ ] Reply shortcuts only work when a message is selected/viewed
//    [ ] Reply shortcuts only work when NOT in input field

// 4. Navigation Shortcuts
//    [ ] j selects next message in list
//    [ ] k selects previous message in list
//    [ ] j/k navigation loops properly (stops at first/last)
//    [ ] j/k navigation updates the message viewer
//    [ ] Navigation shortcuts only work when NOT in input field

// 5. Go-To Shortcuts (two-key sequence)
//    [ ] g then i navigates to Inbox
//    [ ] g then s navigates to Sent
//    [ ] g then d navigates to Drafts
//    [ ] Second key must be pressed within 2 seconds
//    [ ] Go-to shortcuts only work when NOT in input field

// 6. Keyboard Shortcuts Modal
//    [ ] Modal displays all shortcut categories (General, Compose, Navigation)
//    [ ] Modal shows correct keyboard glyphs (⌘ on Mac, Ctrl on Windows)
//    [ ] Modal has proper styling (matches design system)
//    [ ] Modal shows proper key combinations (Cmd/Ctrl + K, Shift + R, etc.)
//    [ ] Modal footer shows help text about ? and Esc
//    [ ] Modal can be closed with X button
//    [ ] Modal can be closed with Esc key
//    [ ] Modal can be closed by clicking overlay

// 7. Input Field Prevention
//    [ ] Shortcuts do NOT trigger when typing in <input>
//    [ ] Shortcuts do NOT trigger when typing in <textarea>
//    [ ] Shortcuts do NOT trigger when in contentEditable element
//    [ ] Search shortcuts (Cmd+K, /) STILL work even in input fields

// 8. useKeyboardShortcuts Hook
//    [ ] Hook is called in AppShell
//    [ ] Hook properly cleans up event listeners on unmount
//    [ ] Hook responds to store changes (viewedMessageId, messages)
//    [ ] Hook integrates with useComposerStore
//    [ ] Hook integrates with useSearchStore
//    [ ] Hook integrates with useMailStore

// HOW TO TEST:

// 1. Open the app in browser
// 2. Press ? to open keyboard shortcuts modal - verify it displays correctly
// 3. Close modal with Esc
// 4. Test general shortcuts:
//    - Press Cmd+K (or Ctrl+K) - search should open
//    - Press / - search should open
//    - Press Cmd+, - settings should open
// 5. Navigate to mail page with messages
// 6. Test compose shortcuts:
//    - Press c - compose modal should open
//    - Close it
// 7. Click on a message to view it
// 8. Test reply shortcuts:
//    - Press r - reply composer should open with original message
//    - Close it
//    - Press Shift+R - reply all composer should open
//    - Close it
//    - Press f - forward composer should open
//    - Close it
// 9. Test navigation shortcuts:
//    - Press j - should select next message
//    - Press j again - should select next message
//    - Press k - should select previous message
//    - Verify message viewer updates with each selection
// 10. Test go-to shortcuts:
//    - Press g then i - should navigate to inbox
//    - Press g then s - should navigate to sent
//    - Press g then d - should navigate to drafts
// 11. Test input field prevention:
//    - Click in the search bar (or any input field)
//    - Type c, r, f, j, k - should type letters, not trigger shortcuts
//    - Press Cmd+K - should still open search (even in input field)
// 12. Test on both Windows and Mac (if possible):
//    - Verify Cmd key works on Mac
//    - Verify Ctrl key works on Windows
//    - Verify keyboard shortcuts modal shows correct glyphs

// PASS CRITERIA:
// ✅ All general shortcuts work (Cmd+K, /, Cmd+,, ?)
// ✅ All compose shortcuts work (c)
// ✅ All reply shortcuts work (r, Shift+R, f)
// ✅ All navigation shortcuts work (j, k)
// ✅ All go-to shortcuts work (g+i, g+s, g+d)
// ✅ Keyboard shortcuts modal displays correctly
// ✅ Modal shows correct key glyphs based on OS
// ✅ Shortcuts do NOT trigger in input fields (except Cmd+K and /)
// ✅ Hook integrates with all necessary stores
// ✅ No console errors
// ✅ Event listeners properly cleaned up

export {};
