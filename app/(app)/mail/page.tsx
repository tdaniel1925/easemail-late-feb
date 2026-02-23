import { MessageList, MessageViewer } from "@/components/mail";

export default function MailPage() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Message List */}
      <div className="w-96 flex-shrink-0 border-r border-border-default">
        <MessageList />
      </div>

      {/* Message Viewer */}
      <div className="flex flex-1 overflow-hidden">
        <MessageViewer />
      </div>
    </div>
  );
}
