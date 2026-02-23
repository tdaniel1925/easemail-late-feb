"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface Recipient {
  email: string;
  name?: string;
}

interface RecipientInputProps {
  label: string;
  recipients: Recipient[];
  onChange: (recipients: Recipient[]) => void;
  placeholder?: string;
}

export function RecipientInput({
  label,
  recipients,
  onChange,
  placeholder = "Add recipients...",
}: RecipientInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const parseRecipient = (input: string): Recipient | null => {
    // Handle "Name <email@example.com>" format
    const nameEmailMatch = input.match(/^(.+?)\s*<(.+?)>$/);
    if (nameEmailMatch) {
      const [, name, email] = nameEmailMatch;
      if (validateEmail(email.trim())) {
        return { email: email.trim(), name: name.trim() };
      }
    }

    // Handle plain email
    const email = input.trim();
    if (validateEmail(email)) {
      return { email };
    }

    return null;
  };

  const addRecipient = (input: string) => {
    const recipient = parseRecipient(input);
    if (recipient) {
      // Check for duplicates
      const isDuplicate = recipients.some((r) => r.email === recipient.email);
      if (!isDuplicate) {
        onChange([...recipients, recipient]);
      }
      setInputValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const input = inputValue.trim();

    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      if (input) {
        addRecipient(input);
      }
    }

    if (e.key === "Backspace" && !inputValue && recipients.length > 0) {
      // Remove last recipient
      onChange(recipients.slice(0, -1));
    }

    if (e.key === "Tab" && input) {
      e.preventDefault();
      addRecipient(input);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData("text");

    // Check if pasted text contains multiple emails (comma or semicolon separated)
    if (pastedText.includes(",") || pastedText.includes(";")) {
      e.preventDefault();
      const emails = pastedText.split(/[,;]/).map((s) => s.trim());
      const newRecipients = emails
        .map(parseRecipient)
        .filter((r): r is Recipient => r !== null)
        .filter((r) => !recipients.some((existing) => existing.email === r.email));

      if (newRecipients.length > 0) {
        onChange([...recipients, ...newRecipients]);
      }
      setInputValue("");
    }
  };

  const removeRecipient = (email: string) => {
    onChange(recipients.filter((r) => r.email !== email));
  };

  return (
    <div className="flex items-start gap-2 border-b border-border-subtle py-2">
      <label className="flex-shrink-0 pt-1.5 text-xs font-medium text-text-secondary" style={{ width: "48px" }}>
        {label}:
      </label>
      <div className="flex min-h-[28px] flex-1 flex-wrap items-center gap-1">
        {recipients.map((recipient) => (
          <div
            key={recipient.email}
            className="flex items-center gap-1 rounded bg-surface-tertiary px-2 py-1 text-xs text-text-primary"
          >
            <span>{recipient.name || recipient.email}</span>
            <button
              onClick={() => removeRecipient(recipient.email)}
              className="rounded hover:bg-surface-hover"
              type="button"
            >
              <X size={12} className="text-text-tertiary" strokeWidth={2} />
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={recipients.length === 0 ? placeholder : ""}
          className="flex-1 border-none bg-transparent text-xs text-text-primary outline-none placeholder:text-text-tertiary"
          style={{ minWidth: "120px" }}
        />
      </div>
    </div>
  );
}
