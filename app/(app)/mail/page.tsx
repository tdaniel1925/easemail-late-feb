import { MessageList, MessageViewer } from "@/components/mail";

export default function MailPage() {
  return (
    <div className="flex h-full overflow-hidden bg-surface-primary">
      {/* Message List */}
      <div className="w-96 flex-shrink-0 border-r border-border-default bg-surface-primary">
        <MessageList />
      </div>

      {/* Message Viewer */}
      <div className="flex-1 overflow-hidden">
        <MessageViewer />
      </div>
    </div>
  );
}
