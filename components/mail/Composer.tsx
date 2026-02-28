"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { X, Paperclip, Send, ChevronDown, ChevronUp, Mic, Sparkles, AudioLines, FileSignature } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { RecipientInput } from "./RecipientInput";
import { ComposerToolbar } from "./ComposerToolbar";
import { VoiceMessageRecorder } from "./VoiceMessageRecorder";
import { AIDictateModal } from "./AIDictateModal";
import { AIRemixPreview } from "./AIRemixPreview";
import { useAccountStore } from "@/stores/account-store";
import { useComposerStore } from "@/stores/composer-store";
import { useMailStore } from "@/stores/mail-store";
import type { Database } from "@/types/database";

type EmailSignature = Database['public']['Tables']['email_signatures']['Row'];

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
  const { activeAccountId, accounts } = useAccountStore();
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
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const [aiDictateOpen, setAiDictateOpen] = useState(false);
  const [aiRemixOpen, setAiRemixOpen] = useState(false);
  const [originalTextForRemix, setOriginalTextForRemix] = useState("");
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);

  // Signature state
  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [currentSignature, setCurrentSignature] = useState<EmailSignature | null>(null);
  const [signatureEnabled, setSignatureEnabled] = useState(true);
  const [selectedFromAccount, setSelectedFromAccount] = useState<string>(activeAccountId || "");
  const [signatureInserted, setSignatureInserted] = useState(false);

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

  // Fetch signatures when composer opens
  useEffect(() => {
    if (open && selectedFromAccount) {
      fetchSignatures();
    }
  }, [open, selectedFromAccount]);

  const fetchSignatures = async () => {
    try {
      const response = await fetch(`/api/signatures?accountId=${selectedFromAccount}`);
      if (response.ok) {
        const data = await response.json();
        setSignatures(data.signatures || []);

        // Find default signature for this account
        const defaultSig = (data.signatures || []).find((sig: EmailSignature) =>
          sig.is_default && (sig.account_id === selectedFromAccount || sig.account_id === null)
        );
        setCurrentSignature(defaultSig || null);
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
    }
  };

  // Insert signature when ready
  useEffect(() => {
    if (editor && currentSignature && signatureEnabled && !signatureInserted && open) {
      // Wait a bit for content to settle (especially for replies/forwards)
      setTimeout(() => {
        insertSignature();
      }, 300);
    }
  }, [editor, currentSignature, signatureEnabled, mode, signatureInserted, open]);

  // Auto-save draft when subject OR 2+ words in body
  useEffect(() => {
    if (!open || !editor) return;

    const saveDraft = () => {
      const bodyText = editor.getText().trim();
      const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

      // Save if: subject exists OR body has 2+ words
      if (subject.trim() || wordCount >= 2) {
        const draft = {
          to,
          cc,
          bcc,
          subject,
          body: editor.getHTML(),
          timestamp: Date.now(),
        };
        localStorage.setItem('email_draft', JSON.stringify(draft));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    };

    // Debounce save by 3 seconds
    const timeoutId = setTimeout(saveDraft, 3000);
    return () => clearTimeout(timeoutId);
  }, [open, editor, subject, to, cc, bcc]);

  const insertSignature = () => {
    if (!editor || !currentSignature || signatureInserted) return;

    const signatureHtml = `<p>--</p>${currentSignature.body_html}`;

    if (mode === "compose" || mode === "new") {
      // For new emails: append signature at the end
      const currentContent = editor.getHTML();
      if (currentContent === '<p></p>' || !currentContent) {
        editor.commands.setContent(signatureHtml);
      } else {
        editor.commands.insertContent(signatureHtml);
      }
    } else if (mode === "reply" || mode === "replyAll" || mode === "forward") {
      // For replies/forwards: insert signature BEFORE quoted text
      const content = editor.getHTML();

      // Look for forwarded content div or other quoted structures
      const blockquoteIndex = content.indexOf('<blockquote');
      const forwardDivIndex = content.indexOf('<div style="border-left:');

      let insertIndex = -1;
      if (blockquoteIndex !== -1) insertIndex = blockquoteIndex;
      else if (forwardDivIndex !== -1) insertIndex = forwardDivIndex;

      if (insertIndex !== -1) {
        const beforeQuote = content.substring(0, insertIndex);
        const afterQuote = content.substring(insertIndex);
        editor.commands.setContent(beforeQuote + signatureHtml + '<br>' + afterQuote);
      } else {
        // No quoted text found, just append
        editor.commands.insertContent('<br>' + signatureHtml);
      }
    }

    setSignatureInserted(true);

    // Move cursor to start
    setTimeout(() => {
      editor.commands.focus('start');
    }, 100);
  };

  const handleFromAccountChange = async (newAccountId: string) => {
    setSelectedFromAccount(newAccountId);
    setSignatureInserted(false);

    // Fetch signatures for new account
    try {
      const response = await fetch(`/api/signatures?accountId=${newAccountId}`);
      if (response.ok) {
        const data = await response.json();
        setSignatures(data.signatures || []);

        const defaultSig = (data.signatures || []).find((sig: EmailSignature) =>
          sig.is_default && (sig.account_id === newAccountId || sig.account_id === null)
        );

        setCurrentSignature(defaultSig || null);
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
    }
  };

  const toggleSignature = () => {
    setSignatureEnabled(!signatureEnabled);
    // If re-enabling and not inserted, insert it
    if (!signatureEnabled && !signatureInserted) {
      setSignatureInserted(false);
    }
  };

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
        setErrorMessage("");
        setSuccessMessage("");
        setSignatureInserted(false);
        setSignatureEnabled(true);
        setSelectedFromAccount(activeAccountId || "");
      }, 200);
    }
  }, [open, editor, activeAccountId]);

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
    // Clear previous messages
    setErrorMessage("");
    setSuccessMessage("");

    if (!activeAccountId) {
      setErrorMessage("No account selected");
      return;
    }

    if (to.length === 0) {
      setErrorMessage("Please add at least one recipient (press Enter to confirm)");
      return;
    }

    setIsSending(true);

    try {
      // Convert File attachments to base64
      const convertedAttachments = await Promise.all(
        attachments.map(async (att) => {
          return new Promise<{ name: string; contentType: string; contentBytes: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
              resolve({
                name: att.file.name,
                contentType: att.file.type || 'application/octet-stream',
                contentBytes: base64,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(att.file);
          });
        })
      );

      // Build request body matching API expectations
      const requestBody = {
        accountId: activeAccountId,
        to: to.map(r => r.email), // Extract just email strings
        cc: cc.map(r => r.email),
        bcc: bcc.map(r => r.email),
        subject: subject,
        body: editor?.getHTML() || "",
        bodyType: 'html' as const,
        attachments: convertedAttachments.length > 0 ? convertedAttachments : undefined,
      };

      const response = await fetch("/api/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      setSuccessMessage(`Email sent successfully to ${to.map(r => r.email).join(", ")}`);

      // Close composer after short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setErrorMessage(error.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleDiscard = () => {
    const hasContent = to.length > 0 || subject || editor?.getText().trim();
    if (hasContent && !showDiscardConfirm) {
      // Show inline confirmation
      setShowDiscardConfirm(true);
    } else if (!hasContent) {
      // No content, just close
      onClose();
    }
  };

  const confirmDiscard = () => {
    setShowDiscardConfirm(false);
    onClose();
  };

  const cancelDiscard = () => {
    setShowDiscardConfirm(false);
  };

  const handleVoiceMessage = () => {
    setVoiceRecorderOpen(true);
  };

  const handleVoiceMessageAttach = (file: File) => {
    const newAttachment: Attachment = {
      file,
      id: Math.random().toString(36).substring(7),
    };
    setAttachments([...attachments, newAttachment]);
    setSuccessMessage(`Voice message "${file.name}" attached successfully`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleAIRemix = () => {
    if (!editor) return;

    const currentText = editor.getText().trim();
    if (!currentText) {
      setErrorMessage("Please write some text before using AI Remix");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setOriginalTextForRemix(currentText);
    setAiRemixOpen(true);
  };

  // Helper function to convert plain text with newlines to HTML
  const convertTextToHtml = (text: string): string => {
    // Convert double newlines to <br><br> (creates 1 blank line)
    // Then convert single newlines to <br>
    // Wrap everything in a single paragraph to avoid margin stacking issues
    const html = text
      .replace(/\n\n/g, '<br><br>') // Double newline = 1 blank line
      .replace(/\n/g, '<br>');       // Single newline = line break

    return `<p>${html}</p>`;
  };

  // Generate subject line from body text using AI
  const generateSubjectLine = async (bodyText: string): Promise<string> => {
    try {
      console.log('[Composer] Generating subject line from text:', bodyText.substring(0, 100));
      setIsGeneratingSubject(true);
      const response = await fetch('/api/ai/generate-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bodyText }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Composer] API error:', error);
        throw new Error(error.error || 'Failed to generate subject');
      }

      const data = await response.json();
      console.log('[Composer] Generated subject:', data.subject);
      return data.subject || '';
    } catch (error) {
      console.error('[Composer] Error generating subject:', error);
      setErrorMessage(`Failed to generate subject: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setErrorMessage(""), 5000);
      return '';
    } finally {
      setIsGeneratingSubject(false);
    }
  };

  const handleAcceptRemix = async (improvedText: string) => {
    if (editor) {
      const html = convertTextToHtml(improvedText);
      editor.commands.setContent(html);
      setSuccessMessage("Text improved with AI successfully");
      setTimeout(() => setSuccessMessage(""), 3000);

      // Generate subject if empty
      if (!subject.trim()) {
        const generatedSubject = await generateSubjectLine(improvedText);
        if (generatedSubject) {
          setSubject(generatedSubject);
        }
      }
    }
  };

  const handleAIDictate = () => {
    setAiDictateOpen(true);
  };

  const handleAIDictateInsert = async (text: string) => {
    console.log('[Composer] AI Dictate Insert called with text:', text.substring(0, 100));
    console.log('[Composer] Current subject:', subject);
    if (editor) {
      // Convert plain text to HTML with proper paragraph formatting
      const html = convertTextToHtml(text);
      editor.commands.setContent(html);
      setSuccessMessage("AI-formatted text inserted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);

      // Generate subject if empty
      if (!subject.trim()) {
        console.log('[Composer] Subject is empty, generating subject line...');
        const generatedSubject = await generateSubjectLine(text);
        console.log('[Composer] Generated subject result:', generatedSubject);
        if (generatedSubject) {
          console.log('[Composer] Setting subject to:', generatedSubject);
          setSubject(generatedSubject);
        } else {
          console.log('[Composer] No subject generated (empty result)');
        }
      } else {
        console.log('[Composer] Subject already exists, skipping generation');
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[80vh] w-[75vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border-default bg-surface-primary shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
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

          {/* Inline Error/Success Messages */}
          {errorMessage && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-2">
              <p className="text-xs text-red-800">{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border-b border-green-200 px-4 py-2">
              <p className="text-xs text-green-800">{successMessage}</p>
            </div>
          )}
          {showDiscardConfirm && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-between">
              <p className="text-xs text-yellow-800">Discard this message?</p>
              <div className="flex gap-2">
                <button
                  onClick={confirmDiscard}
                  className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={cancelDiscard}
                  className="px-3 py-1 text-xs rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Recipient Fields */}
          <div className="border-b border-border-default bg-surface-primary px-4">
            {/* From Account Selector */}
            {accounts.length > 1 && (
              <div className="flex items-center gap-2 border-b border-border-subtle py-2">
                <label className="flex-shrink-0 text-xs font-medium text-text-secondary" style={{ width: "48px" }}>
                  From:
                </label>
                <select
                  value={selectedFromAccount}
                  onChange={(e) => handleFromAccountChange(e.target.value)}
                  className="flex-1 border-none bg-transparent text-xs text-text-primary outline-none focus:ring-0"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.display_name || account.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <RecipientInput label="To" recipients={to} onChange={setTo} placeholder="Add recipients..." />

            {(!showCc || !showBcc) && (
              <div className="flex gap-2 py-2">
                {!showCc && (
                  <button
                    onClick={() => setShowCc(true)}
                    className="text-xs text-text-tertiary hover:text-text-primary"
                    type="button"
                  >
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    onClick={() => setShowBcc(true)}
                    className="text-xs text-text-tertiary hover:text-text-primary"
                    type="button"
                  >
                    Bcc
                  </button>
                )}
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

              <div className="mx-2 h-6 w-px bg-border-default"></div>

              <button
                onClick={handleVoiceMessage}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
                title="Record voice message"
              >
                <Mic size={14} strokeWidth={1.5} />
                <span>Voice</span>
              </button>

              <button
                onClick={handleAIRemix}
                className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                title="AI Remix - Rewrite message with AI"
              >
                <Sparkles size={14} strokeWidth={1.5} />
                <span>AI Remix</span>
              </button>

              <button
                onClick={handleAIDictate}
                className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                title="AI Dictate - Voice to text with AI"
              >
                <AudioLines size={14} strokeWidth={1.5} />
                <span>AI Dictate</span>
              </button>

              <div className="mx-2 h-6 w-px bg-border-default"></div>

              <button
                onClick={toggleSignature}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  signatureEnabled
                    ? "bg-accent text-white"
                    : "text-text-primary hover:bg-surface-hover"
                }`}
                title={signatureEnabled ? "Signature enabled" : "Signature disabled"}
              >
                <FileSignature size={14} strokeWidth={1.5} />
                <span>Signature</span>
              </button>
            </div>

            <div className="text-xs text-text-tertiary">
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "Draft saved"}
              {saveStatus === "error" && "Save failed"}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Voice Message Recorder */}
      <VoiceMessageRecorder
        open={voiceRecorderOpen}
        onClose={() => setVoiceRecorderOpen(false)}
        onAttach={handleVoiceMessageAttach}
      />

      {/* AI Dictate Modal */}
      <AIDictateModal
        open={aiDictateOpen}
        onClose={() => setAiDictateOpen(false)}
        onInsert={handleAIDictateInsert}
      />

      {/* AI Remix Preview */}
      <AIRemixPreview
        open={aiRemixOpen}
        onClose={() => setAiRemixOpen(false)}
        originalText={originalTextForRemix}
        onAccept={handleAcceptRemix}
      />
    </Dialog.Root>
  );
}
