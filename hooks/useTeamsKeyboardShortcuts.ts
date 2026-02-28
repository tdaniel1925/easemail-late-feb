import { useEffect } from 'react';
import { useTeamsStore } from '@/stores/teams-store';
import { useRouter } from 'next/navigation';

/**
 * Keyboard shortcuts for Teams module
 *
 * Shortcuts:
 * - Cmd/Ctrl + K: Search channels
 * - Cmd/Ctrl + N: New message/reply (future: focus composer)
 * - Up/Down arrows: Navigate channels list
 * - Enter: Select/open channel
 * - Cmd/Ctrl + F: Toggle favorites filter
 * - Escape: Clear selection / close channel
 * - j/k: Navigate messages
 * - R: Reply to message (future: implement)
 */
export function useTeamsKeyboardShortcuts(enabled: boolean = true) {
  const {
    channels,
    messages,
    selectedChannelId,
    viewedMessageId,
    showFavoritesOnly,
    setSelectedChannel,
    setViewedMessage,
    setShowFavoritesOnly,
    getSelectedChannel,
  } = useTeamsStore();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;

      // Shortcuts that work everywhere
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search input (future: implement)
        const searchInput = document.querySelector<HTMLInputElement>(
          '[data-testid="teams-search"]'
        );
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Shortcuts that only work when NOT in input fields
      if (isInputField) return;

      // New message / focus composer
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        // Future: Focus message composer
        const composer = document.querySelector<HTMLTextAreaElement>(
          '[data-testid="teams-composer"]'
        );
        if (composer) {
          composer.focus();
        }
        return;
      }

      // Toggle favorites filter
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowFavoritesOnly(!showFavoritesOnly);
        return;
      }

      // Clear selection / close channel
      if (e.key === 'Escape') {
        e.preventDefault();
        if (viewedMessageId) {
          setViewedMessage(null);
        } else if (selectedChannelId) {
          setSelectedChannel(null);
        }
        return;
      }

      // Navigate channels with up/down arrows
      if (channels.length > 0 && !selectedChannelId) {
        const currentIndex = channels.findIndex((c) => c.id === selectedChannelId);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          // Go to next channel
          if (currentIndex < channels.length - 1) {
            setSelectedChannel(channels[currentIndex + 1].id);
          } else if (currentIndex === -1 && channels.length > 0) {
            // No channel selected, select first
            setSelectedChannel(channels[0].id);
          }
          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          // Go to previous channel
          if (currentIndex > 0) {
            setSelectedChannel(channels[currentIndex - 1].id);
          } else if (currentIndex === -1 && channels.length > 0) {
            // No channel selected, select last
            setSelectedChannel(channels[channels.length - 1].id);
          }
          return;
        }

        // Select/open channel with Enter
        if (e.key === 'Enter' && currentIndex !== -1) {
          e.preventDefault();
          // Channel is already selected, messages will load
          return;
        }
      }

      // Navigate messages with j/k
      if (messages.length > 0 && selectedChannelId) {
        const currentIndex = messages.findIndex((m) => m.id === viewedMessageId);

        if (e.key === 'j') {
          e.preventDefault();
          // Go to next message
          if (currentIndex < messages.length - 1) {
            setViewedMessage(messages[currentIndex + 1].id);
          } else if (currentIndex === -1 && messages.length > 0) {
            // No message selected, select first
            setViewedMessage(messages[0].id);
          }
          return;
        }

        if (e.key === 'k') {
          e.preventDefault();
          // Go to previous message
          if (currentIndex > 0) {
            setViewedMessage(messages[currentIndex - 1].id);
          } else if (currentIndex === -1 && messages.length > 0) {
            // No message selected, select last
            setViewedMessage(messages[messages.length - 1].id);
          }
          return;
        }

        // View message details with Enter
        if (e.key === 'Enter' && currentIndex !== -1) {
          e.preventDefault();
          // Message details already shown when viewedMessageId is set
          return;
        }
      }

      // Reply to message
      if (e.key === 'r' && viewedMessageId) {
        e.preventDefault();
        // Future: Open reply composer for viewed message
        console.log('[Keyboard Shortcut] Reply to message - not yet implemented');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    channels,
    messages,
    selectedChannelId,
    viewedMessageId,
    showFavoritesOnly,
    setSelectedChannel,
    setViewedMessage,
    setShowFavoritesOnly,
    getSelectedChannel,
    router,
  ]);
}

// Export shortcut definitions for help modal
export const TEAMS_KEYBOARD_SHORTCUTS = {
  General: [
    { key: 'Cmd/Ctrl + K', description: 'Search channels' },
    { key: 'Cmd/Ctrl + N', description: 'Focus message composer' },
    { key: 'Cmd/Ctrl + F', description: 'Toggle favorites filter' },
    { key: 'Escape', description: 'Clear selection / close channel' },
  ],
  Navigation: [
    { key: 'Up/Down Arrows', description: 'Navigate channels' },
    { key: 'j', description: 'Next message' },
    { key: 'k', description: 'Previous message' },
    { key: 'Enter', description: 'Select channel / view message' },
  ],
  Actions: [
    { key: 'R', description: 'Reply to message' },
  ],
};
