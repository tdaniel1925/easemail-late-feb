"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { X, Paperclip, Send, ChevronDown, ChevronUp } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { RecipientInput } from "./RecipientInput";
import { ComposerToolbar } from "./ComposerToolbar";
import { useAccountStore } from "@/stores/account-store";
import { useComposerStore } from "@/stores/composer-store";
import { useMailStore } from "@/stores/mail-store";

interface Recipient {
  email: string;
  name?: string;
}

interface Attachment {
  file: File;
  id: string;
}

interface ComposerProps {
  open: boolean;
  onClose: () => void;
}

export function Composer({ open, onClose }: ComposerProps) {
  const { activeAccountId } = useAccountStore();
  const { mode, originalMessageId } = useComposerStore();
  const { getMessageById } = useMailStore();
  const [to, setTo] = useState<Recipient[]>([]);
  const [cc, setCc] = useState<Recipient[]>([]);
  const [bcc, setBcc] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Placeholder.configure({
        placeholder: "Compose your message...",
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none text-text-primary",
        style: "font-size: 13px; line-height: 1.5; padding: 12px;",
      },
    },
  });

  // Pre-fill fields based on mode
  useEffect(() => {
    if (open && originalMessageId) {
      const originalMessage = getMessageById(originalMessageId);
      if (originalMessage) {
        if (mode === "reply") {
          // Reply: To = original sender
          if (originalMessage.from_address) {
            setTo([
              {
                email: originalMessage.from_address,
                name: originalMessage.from_name || undefined,
              },
            ]);
          }
          setSubject(
            originalMessage.subject?.startsWith("Re:")
              ? originalMessage.subject
              : `Re: ${originalMessage.subject || ""}`
          );
        } else if (mode === "replyAll") {
          // Reply All: To = sender, CC = all other recipients
          if (originalMessage.from_address) {
            setTo([
              {
                email: originalMessage.from_address,
                name: originalMessage.from_name || undefined,
              },
            ]);
          }

          // Parse and add CC recipients from original message
          const ccRecipients: Recipient[] = [];

          // Add original TO recipients (excluding current user)
          try {
            const toList = typeof originalMessage.to_recipients === 'string'
              ? JSON.parse(originalMessage.to_recipients)
              : originalMessage.to_recipients;

            if (Array.isArray(toList)) {
              toList.forEach((r: any) => {
                const email = r?.emailAddress?.address || r?.address || r?.email;
                const name = r?.emailAddress?.name || r?.name;
                if (email) {
                  ccRecipients.push({ email, name });
                }
              });
            }
          } catch (e) {
            console.error('Error parsing to_recipients:', e);
          }

          // Add original CC recipients
          try {
            const ccList = typeof originalMessage.cc_recipients === 'string'
              ? JSON.parse(originalMessage.cc_recipients)
              : originalMessage.cc_recipients;

            if (Array.isArray(ccList)) {
              ccList.forEach((r: any) => {
                const email = r?.emailAddress?.address || r?.address || r?.email;
                const name = r?.emailAddress?.name || r?.name;
                if (email) {
                  ccRecipients.push({ email, name });
                }
              });
            }
          } catch (e) {
            console.error('Error parsing cc_recipients:', e);
          }

          setCc(ccRecipients);
          setShowCc(true);
          setSubject(
            originalMessage.subject?.startsWith("Re:")
              ? originalMessage.subject
              : `Re: ${originalMessage.subject || ""}`
          );
        } else if (mode === "forward") {
          // Forward: empty To, keep subject with Fwd:
          setSubject(
            originalMessage.subject?.startsWith("Fwd:")
              ? originalMessage.subject
              : `Fwd: ${originalMessage.subject || ""}`
          );

          // Include original message body
          const forwardedContent = `
            <br><br>
            <div style="border-left: 2px solid #ccc; padding-left: 12px; margin-left: 8px;">
              <p style="font-size: 11px; color: #666; margin-bottom: 8px;">
                <strong>From:</strong> ${originalMessage.from_name || originalMessage.from_address}<br>
                <strong>Sent:</strong> ${originalMessage.received_at ? new Date(originalMessage.received_at).toLocaleString() : ''}<br>
                <strong>Subject:</strong> ${originalMessage.subject || '(No subject)'}
              </p>
              ${originalMessage.body_html || originalMessage.body_text || ''}
            </div>
          `;
          editor?.commands.setContent(forwardedContent);
        }
      }
    }
  }, [open, mode, originalMessageId, getMessageById, editor]);

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setTo([]);
        setCc([]);
        setBcc([]);
        setSubject("");
        setAttachments([]);
        setShowCc(false);
        setShowBcc(false);
        editor?.commands.setContent("");
        setSaveStatus("idle");
      }, 200);
    }
  }, [open, editor]);

  // Keyboard shortcut: Cmd+Enter to send
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, to, subject, editor]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments: Attachment[] = Array.from(files).map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
      }));
      setAttachments([...attachments, ...newAttachments]);
    }
    // Reset input
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTotalAttachmentSize = () => {
    return attachments.reduce((total, att) => total + att.file.size, 0);
  };

  const handleSend = async () => {
    if (!activeAccountId) {
      alert("No account selected");
      return;
    }

    if (to.length === 0) {
      alert("Please add at least one recipient");
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append("accountId", activeAccountId);
      formData.append("to", JSON.stringify(to));
      formData.append("cc", JSON.stringify(cc));
      formData.append("bcc", JSON.stringify(bcc));
      formData.append("subject", subject);
      formData.append("body", editor?.getHTML() || "");

      // Add attachments
      attachments.forEach((att) => {
        formData.append("attachments", att.file);
      });

      const response = await fetch("/api/mail/send", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      // TODO: Show success toast
      console.log("Message sent successfully");
      onClose();
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert(`Failed to send message: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleDiscard = () => {
    const hasContent = to.length > 0 || subject || editor?.getText().trim();
    if (hasContent) {
      if (confirm("Discard this message?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && handleDiscard()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border-default bg-surface-primary shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-default bg-surface-secondary px-4 py-3">
            <Dialog.Title className="text-sm font-semibold text-text-primary">
              {mode === "new" && "New Message"}
              {mode === "reply" && "Reply"}
              {mode === "replyAll" && "Reply All"}
              {mode === "forward" && "Forward"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded p-1 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                onClick={handleDiscard}
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>

          {/* Recipient Fields */}
          <div className="border-b border-border-default bg-surface-primary px-4">
            <RecipientInput label="To" recipients={to} onChange={setTo} placeholder="Add recipients..." />

            {!showCc && !showBcc && (
              <div className="flex gap-2 py-2">
                <button
                  onClick={() => setShowCc(true)}
                  className="text-xs text-text-tertiary hover:text-text-primary"
                  type="button"
                >
                  Cc
                </button>
                <button
                  onClick={() => setShowBcc(true)}
                  className="text-xs text-text-tertiary hover:text-text-primary"
                  type="button"
                >
                  Bcc
                </button>
              </div>
            )}

            {showCc && (
              <RecipientInput label="Cc" recipients={cc} onChange={setCc} placeholder="Add Cc recipients..." />
            )}

            {showBcc && (
              <RecipientInput label="Bcc" recipients={bcc} onChange={setBcc} placeholder="Add Bcc recipients..." />
            )}

            {/* Subject */}
            <div className="flex items-center gap-2 border-b border-border-subtle py-2">
              <label className="flex-shrink-0 text-xs font-medium text-text-secondary" style={{ width: "48px" }}>
                Subject:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Add subject..."
                className="flex-1 border-none bg-transparent text-xs text-text-primary outline-none placeholder:text-text-tertiary"
              />
            </div>
          </div>

          {/* Toolbar */}
          <ComposerToolbar editor={editor} />

          {/* Editor */}
          <div className="flex-1 overflow-y-auto bg-surface-primary">
            <EditorContent editor={editor} />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="border-t border-border-subtle bg-surface-secondary px-4 py-2">
              <div className="flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 rounded border border-border-default bg-surface-primary px-2 py-1"
                  >
                    <Paperclip size={12} className="text-text-tertiary" strokeWidth={1.5} />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-text-primary">{att.file.name}</span>
                      <span className="text-[10px] text-text-tertiary">{formatFileSize(att.file.size)}</span>
                    </div>
                    <button onClick={() => removeAttachment(att.id)} type="button">
                      <X size={12} className="text-text-tertiary hover:text-text-primary" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
              {getTotalAttachmentSize() > 25 * 1024 * 1024 && (
                <p className="mt-1 text-xs text-red-500">
                  Total attachment size exceeds 25MB limit
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border-default bg-surface-secondary px-4 py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSend}
                disabled={isSending || to.length === 0}
                className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={14} strokeWidth={1.5} />
                <span>{isSending ? "Sending..." : "Send"}</span>
              </button>

              <label className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-1.5">
                  <Paperclip size={14} strokeWidth={1.5} />
                  <span>Attach</span>
                </div>
              </label>
            </div>

            <div className="text-xs text-text-tertiary">
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "Draft saved"}
              {saveStatus === "error" && "Save failed"}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
