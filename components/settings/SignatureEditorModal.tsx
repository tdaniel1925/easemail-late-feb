"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, Palette } from "lucide-react";
import DOMPurify from "dompurify";
import type { Database } from "@/types/database";

type EmailSignature = Database['public']['Tables']['email_signatures']['Row'];
type Account = {
  id: string;
  email: string;
  display_name: string | null;
};

interface SignatureEditorModalProps {
  open: boolean;
  onClose: () => void;
  signature: EmailSignature | null;
  accounts: Account[];
  onSave: () => void;
}

export function SignatureEditorModal({
  open,
  onClose,
  signature,
  accounts,
  onSave,
}: SignatureEditorModalProps) {
  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

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
      TextStyle,
      Color,
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none text-text-primary min-h-[200px]",
        style: "font-size: 13px; line-height: 1.5; padding: 12px;",
      },
    },
  });

  // Load signature data when editing
  useEffect(() => {
    if (open) {
      if (signature) {
        // Editing existing signature
        setName(signature.name);
        setAccountId(signature.account_id);
        setIsDefault(signature.is_default || false);
        if (editor) {
          editor.commands.setContent(signature.body_html);
        }
      } else {
        // Creating new signature
        setName("");
        setAccountId(accounts.length > 0 ? accounts[0].id : null);
        setIsDefault(false);
        if (editor) {
          editor.commands.setContent("");
        }
      }
      setError(null);
    }
  }, [open, signature, editor, accounts]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Signature name is required");
      return;
    }

    const bodyHtml = editor?.getHTML() || "";
    if (!bodyHtml.trim() || bodyHtml === "<p></p>") {
      setError("Signature content is required");
      return;
    }

    // Sanitize HTML
    const sanitizedHtml = DOMPurify.sanitize(bodyHtml, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
    });

    setIsSaving(true);
    setError(null);

    try {
      const body = {
        name: name.trim(),
        body_html: sanitizedHtml,
        account_id: accountId,
        is_default: isDefault,
      };

      const response = signature
        ? await fetch(`/api/signatures/${signature.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/signatures", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save signature");
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const setColor = (color: string) => {
    editor?.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  };

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface-primary p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              {signature ? "Edit Signature" : "New Signature"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 text-text-secondary hover:bg-surface-hover hover:text-text-primary">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Signature Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Work, Personal"
                className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Account
              </label>
              <select
                value={accountId || ""}
                onChange={(e) => setAccountId(e.target.value || null)}
                className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.display_name || account.email}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-text-tertiary">
                Choose which account uses this signature, or select "All Accounts" for a global signature
              </p>
            </div>

            {/* Editor Toolbar */}
            {editor && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Signature Content
                </label>
                <div className="border border-border-default rounded-md overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 border-b border-border-default bg-surface-secondary p-2">
                    <button
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`rounded p-2 transition-colors ${
                        editor.isActive("bold")
                          ? "bg-accent text-white"
                          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      }`}
                      type="button"
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`rounded p-2 transition-colors ${
                        editor.isActive("italic")
                          ? "bg-accent text-white"
                          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      }`}
                      type="button"
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleUnderline().run()}
                      className={`rounded p-2 transition-colors ${
                        editor.isActive("underline")
                          ? "bg-accent text-white"
                          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      }`}
                      type="button"
                    >
                      <UnderlineIcon size={16} />
                    </button>
                    <button
                      onClick={setLink}
                      className={`rounded p-2 transition-colors ${
                        editor.isActive("link")
                          ? "bg-accent text-white"
                          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      }`}
                      type="button"
                    >
                      <LinkIcon size={16} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="rounded p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        type="button"
                      >
                        <Palette size={16} />
                      </button>
                      {showColorPicker && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-surface-primary border border-border-default rounded-md shadow-lg z-10">
                          <div className="grid grid-cols-6 gap-1">
                            {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#FF7F50', '#808080'].map((color) => (
                              <button
                                key={color}
                                onClick={() => setColor(color)}
                                className="w-6 h-6 rounded border border-border-default"
                                style={{ backgroundColor: color }}
                                type="button"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Editor */}
                  <EditorContent editor={editor} />
                </div>
              </div>
            )}

            {/* Default checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-border-default text-accent focus:ring-2 focus:ring-accent"
              />
              <label htmlFor="is-default" className="text-sm text-text-primary">
                Set as default signature{accountId ? " for this account" : " (global)"}
              </label>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Preview
              </label>
              <div
                className="rounded-md border border-border-default bg-surface-secondary p-3 text-sm"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editor?.getHTML() || "") }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="rounded-md border border-border-default bg-surface-primary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {isSaving ? "Saving..." : signature ? "Update" : "Create"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
