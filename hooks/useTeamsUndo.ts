import { useEffect, useCallback } from 'react';
import { useTeamsStore, TeamsMessage } from '@/stores/teams-store';
import { UndoQueue } from '@/lib/undo-queue';
import { useToastStore } from '@/stores/toast-store';

const teamsUndoQueue = new UndoQueue(50, 5 * 60 * 1000);

/**
 * Undo hook for Teams module
 *
 * Provides undo/redo functionality for:
 * - Message edits
 * - Message deletions
 * - Reactions
 */
export function useTeamsUndo() {
  const { updateMessage, setMessages, messages } = useTeamsStore();
  const { addToast } = useToastStore();

  /**
   * Track message edit for undo
   */
  const trackMessageEdit = useCallback(
    (messageId: string, oldData: Partial<TeamsMessage>, newData: Partial<TeamsMessage>) => {
      teamsUndoQueue.push({
        type: 'message-edit',
        description: `Edit message`,
        data: { messageId, oldData, newData },
        undo: ({
          messageId,
          oldData,
        }: {
          messageId: string;
          oldData: Partial<TeamsMessage>;
        }) => {
          updateMessage(messageId, oldData);
          addToast({
            id: `undo-${Date.now()}`,
            type: 'info',
            message: 'Message edit undone',
          });
        },
        redo: ({
          messageId,
          newData,
        }: {
          messageId: string;
          newData: Partial<TeamsMessage>;
        }) => {
          updateMessage(messageId, newData);
          addToast({
            id: `redo-${Date.now()}`,
            type: 'info',
            message: 'Message edit redone',
          });
        },
      });
    },
    [updateMessage, addToast]
  );

  /**
   * Track message deletion for undo
   */
  const trackMessageDeletion = useCallback(
    (deletedMessages: TeamsMessage[]) => {
      teamsUndoQueue.push({
        type: 'message-delete',
        description: `Delete ${deletedMessages.length} message(s)`,
        data: { deletedMessages, currentMessages: [...messages] },
        undo: ({ deletedMessages }: { deletedMessages: TeamsMessage[] }) => {
          // Re-add deleted messages
          setMessages([...messages, ...deletedMessages]);
          addToast({
            id: `undo-${Date.now()}`,
            type: 'info',
            message: `Restored ${deletedMessages.length} message(s)`,
          });
        },
        redo: ({ deletedMessages }: { deletedMessages: TeamsMessage[] }) => {
          // Remove messages again (mark as deleted)
          const deletedIds = new Set(deletedMessages.map((m) => m.id));
          setMessages(
            messages.map((m) =>
              deletedIds.has(m.id) ? { ...m, is_deleted: true } : m
            )
          );
          addToast({
            id: `redo-${Date.now()}`,
            type: 'info',
            message: `Deleted ${deletedMessages.length} message(s)`,
          });
        },
      });
    },
    [setMessages, messages, addToast]
  );

  /**
   * Track reaction addition/removal for undo
   */
  const trackReaction = useCallback(
    (
      messageId: string,
      reactionType: string,
      action: 'add' | 'remove',
      oldReactions: any[],
      newReactions: any[]
    ) => {
      teamsUndoQueue.push({
        type: 'message-reaction',
        description: `${action === 'add' ? 'Add' : 'Remove'} reaction`,
        data: { messageId, reactionType, action, oldReactions, newReactions },
        undo: ({ messageId, oldReactions }: { messageId: string; oldReactions: any[] }) => {
          updateMessage(messageId, { reactions: oldReactions });
          addToast({
            id: `undo-${Date.now()}`,
            type: 'info',
            message: 'Reaction undone',
          });
        },
        redo: ({ messageId, newReactions }: { messageId: string; newReactions: any[] }) => {
          updateMessage(messageId, { reactions: newReactions });
          addToast({
            id: `redo-${Date.now()}`,
            type: 'info',
            message: 'Reaction redone',
          });
        },
      });
    },
    [updateMessage, addToast]
  );

  /**
   * Undo the last action
   */
  const undo = useCallback(async () => {
    const success = await teamsUndoQueue.undo();
    if (!success) {
      addToast({
        id: `undo-error-${Date.now()}`,
        type: 'error',
        message: 'Nothing to undo',
      });
    }
  }, [addToast]);

  /**
   * Redo the last undone action
   */
  const redo = useCallback(async () => {
    const success = await teamsUndoQueue.redo();
    if (!success) {
      addToast({
        id: `redo-error-${Date.now()}`,
        type: 'error',
        message: 'Nothing to redo',
      });
    }
  }, [addToast]);

  /**
   * Keyboard shortcuts for undo/redo
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) ||
        ((e.metaKey || e.ctrlKey) && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    undo,
    redo,
    canUndo: teamsUndoQueue.canUndo(),
    canRedo: teamsUndoQueue.canRedo(),
    undoDescription: teamsUndoQueue.getUndoDescription(),
    redoDescription: teamsUndoQueue.getRedoDescription(),
    trackMessageEdit,
    trackMessageDeletion,
    trackReaction,
  };
}
