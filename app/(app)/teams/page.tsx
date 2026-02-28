"use client";

import { ChannelList } from "@/components/teams/ChannelList";
import { TeamsMessageList } from "@/components/teams/TeamsMessageList";
import { TeamsMessageDetails } from "@/components/teams/TeamsMessageDetails";
import { TeamsToolbar } from "@/components/teams/TeamsToolbar";
import { useAccountStore } from "@/stores/account-store";
import { useTeamsStore } from "@/stores/teams-store";
import { useTeamsAutoSync } from "@/hooks/useTeamsAutoSync";
import { useTeamsKeyboardShortcuts } from "@/hooks/useTeamsKeyboardShortcuts";
import { useTeamsUndo } from "@/hooks/useTeamsUndo";

export default function TeamsPage() {
  const activeAccountId = useAccountStore((state) => state.activeAccountId);
  const { viewedMessageId, setViewedMessage, getViewedMessage } = useTeamsStore();
  const viewedMessage = getViewedMessage();

  // Auto-sync Teams every 3 minutes (more frequent for chat)
  useTeamsAutoSync(activeAccountId, 3 * 60 * 1000, true);

  // Enable keyboard shortcuts
  useTeamsKeyboardShortcuts(true);

  // Enable undo/redo
  useTeamsUndo();

  return (
    <div className="flex h-full bg-bg-secondary">
      {/* Channels sidebar */}
      <div data-testid="teams-sidebar" className="w-60 border-r border-border-default bg-surface-secondary">
        <ChannelList />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <TeamsToolbar />

        {/* Messages */}
        <div className="flex-1 overflow-auto">
          <TeamsMessageList />
        </div>
      </div>

      {/* Message details panel */}
      {viewedMessage && activeAccountId && (
        <TeamsMessageDetails
          message={viewedMessage}
          accountId={activeAccountId}
          onClose={() => setViewedMessage(null)}
        />
      )}
    </div>
  );
}
