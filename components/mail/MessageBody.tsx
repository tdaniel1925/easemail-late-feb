"use client";

import { useEffect, useState, useRef } from "react";
import DOMPurify from "dompurify";
import { ImageIcon } from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  content_type: string | null;
  size_bytes: number | null;
  is_inline: boolean | null;
  content_id: string | null;
}

interface MessageBodyProps {
  bodyHtml: string | null;
  bodyText: string | null;
  contentType: string | null;
  fromAddress: string | null;
  messageId: string;
  attachments?: Attachment[];
}

export function MessageBody({ bodyHtml, bodyText, contentType, fromAddress, messageId, attachments = [] }: MessageBodyProps) {
  const [showImages, setShowImages] = useState(false);
  const [hasExternalImages, setHasExternalImages] = useState(false);
  const [showQuotedText, setShowQuotedText] = useState(false);
  const [hasQuotedText, setHasQuotedText] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleTrustSender = () => {
    if (!fromAddress) return;

    const trustedSenders = JSON.parse(localStorage.getItem("easemail_trusted_senders") || "[]");
    if (!trustedSenders.includes(fromAddress.toLowerCase())) {
      trustedSenders.push(fromAddress.toLowerCase());
      localStorage.setItem("easemail_trusted_senders", JSON.stringify(trustedSenders));
    }

    setShowImages(true);
  };

  useEffect(() => {
    if (bodyRef.current && bodyHtml) {
      // Check if sender is trusted
      const trustedSenders = JSON.parse(localStorage.getItem("easemail_trusted_senders") || "[]");
      const isTrusted = fromAddress && trustedSenders.includes(fromAddress.toLowerCase());

      // Check if there are external images
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = bodyHtml;
      const images = tempDiv.querySelectorAll("img");
      const hasExternal = Array.from(images).some((img) => {
        const src = img.getAttribute("src") || "";
        return src.startsWith("http://") || src.startsWith("https://");
      });
      setHasExternalImages(hasExternal);

      // Auto-load images if sender is trusted
      if (isTrusted && hasExternal) {
        setShowImages(true);
      }
    }
  }, [bodyHtml, fromAddress]);

  const sanitizeHtml = (html: string, allowImages: boolean = false) => {
    const config: DOMPurify.Config = {
      ALLOWED_TAGS: [
        "p", "br", "span", "div", "b", "i", "u", "strong", "em", "a", "ul", "ol", "li",
        "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code", "table", "thead",
        "tbody", "tr", "td", "th", "hr", "img", "font", "center", "small", "big", "sub", "sup",
        "strike", "s", "del", "ins", "mark", "abbr", "cite", "q", "dl", "dt", "dd", "caption",
        "colgroup", "col", "tfoot"
      ],
      ALLOWED_ATTR: [
        "href", "target", "rel", "src", "alt", "width", "height", "style", "class",
        "color", "size", "face", "align", "bgcolor", "border", "cellpadding", "cellspacing",
        "colspan", "rowspan", "valign", "dir", "lang", "title", "aria-label", "aria-hidden",
        "id", "name"
      ],
      ALLOW_DATA_ATTR: true,
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    };

    if (!allowImages) {
      // Block external images by removing src attribute
      config.FORBID_ATTR = ["src"];
    }

    let sanitized = DOMPurify.sanitize(html, config);

    // Add rel="noopener" to all links
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = sanitized;
    const links = tempDiv.querySelectorAll("a");
    links.forEach((link) => {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    });

    // If images are allowed, set loading="lazy"
    if (allowImages) {
      const images = tempDiv.querySelectorAll("img");
      images.forEach((img) => {
        img.setAttribute("loading", "lazy");

        // Replace cid: references with actual attachment URLs
        const src = img.getAttribute("src") || "";
        if (src.startsWith("cid:")) {
          const contentId = src.substring(4); // Remove "cid:" prefix

          // Find the attachment by content_id
          const attachment = attachments.find(
            (att) => att.is_inline && att.content_id === contentId
          );

          if (attachment) {
            // Replace with API URL
            img.setAttribute("src", `/api/mail/messages/${messageId}/attachments/${attachment.id}`);
            img.setAttribute("alt", attachment.name || "Inline image");
          }
        }
      });
    }

    // Detect and mark quoted content
    if (!showQuotedText) {
      const quotedElements = tempDiv.querySelectorAll(
        'blockquote, .gmail_quote, [class*="quoted"], [class*="OutlookQuote"]'
      );

      // Check for text-based quote markers (lines starting with >)
      const textContent = tempDiv.textContent || "";
      const hasTextQuotes = textContent.split("\n").some((line) => line.trim().startsWith(">"));

      if (quotedElements.length > 0 || hasTextQuotes) {
        setHasQuotedText(true);

        // Hide quoted blockquotes and quote elements
        quotedElements.forEach((el) => {
          (el as HTMLElement).style.display = "none";
          (el as HTMLElement).setAttribute("data-quoted", "true");
        });
      }
    } else {
      // Show all quoted elements
      const quotedElements = tempDiv.querySelectorAll('[data-quoted="true"]');
      quotedElements.forEach((el) => {
        (el as HTMLElement).style.display = "";
      });
    }

    return tempDiv.innerHTML;
  };

  const renderContent = () => {
    if (bodyHtml) {
      const sanitizedHtml = sanitizeHtml(bodyHtml, showImages);
      return (
        <>
          <div
            ref={bodyRef}
            className="email-content"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />

          {/* Show quoted text button */}
          {hasQuotedText && !showQuotedText && (
            <button
              onClick={() => setShowQuotedText(true)}
              className="mt-4 flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary"
            >
              <span className="text-text-tertiary">•••</span>
              <span>Show quoted text</span>
            </button>
          )}
        </>
      );
    }

    if (bodyText) {
      // Process plain text for quoted content
      const lines = bodyText.split("\n");
      const quotedLines: string[] = [];
      const nonQuotedLines: string[] = [];

      lines.forEach((line) => {
        if (line.trim().startsWith(">")) {
          quotedLines.push(line);
        } else {
          nonQuotedLines.push(line);
        }
      });

      const hasQuoted = quotedLines.length > 0;

      return (
        <div className="email-content">
          <div style={{ whiteSpace: "pre-wrap" }}>
            {nonQuotedLines.join("\n")}
          </div>

          {hasQuoted && !showQuotedText && (
            <button
              onClick={() => setShowQuotedText(true)}
              className="mt-4 flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary"
            >
              <span className="text-text-tertiary">•••</span>
              <span>Show quoted text</span>
            </button>
          )}

          {hasQuoted && showQuotedText && (
            <div className="mt-4 border-l-2 border-border-default pl-4 text-text-secondary" style={{ whiteSpace: "pre-wrap" }}>
              {quotedLines.join("\n")}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm italic text-text-tertiary">(No content)</p>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-primary">
      {/* External Images Banner */}
      {hasExternalImages && !showImages && (
        <div className="sticky top-0 z-10 border-b border-border-subtle bg-surface-secondary px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon size={14} className="text-text-tertiary" strokeWidth={1.5} />
              <span className="text-xs text-text-secondary">
                External images are blocked for your privacy
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImages(true)}
                className="rounded-md border border-border-default bg-surface-primary px-3 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
              >
                Load images
              </button>
              {fromAddress && (
                <button
                  onClick={handleTrustSender}
                  className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
                  title={`Always load images from ${fromAddress}`}
                >
                  Trust sender
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Body Content - centered with max width for readability */}
      <div className="mx-auto max-w-3xl px-6 py-6">
        {renderContent()}
      </div>

      <style jsx global>{`
        .email-content {
          font-size: 13px;
          line-height: 1.625;
          color: var(--text-primary, #1A1A1A);
        }

        .email-content p {
          margin: 0 0 16px 0;
        }

        .email-content p:last-child {
          margin-bottom: 0;
        }

        .email-content h1,
        .email-content h2,
        .email-content h3,
        .email-content h4 {
          font-weight: 600;
          line-height: 1.3;
          margin: 24px 0 12px 0;
          color: var(--text-primary, #1A1A1A);
        }

        .email-content h1 {
          font-size: 18px;
        }

        .email-content h2 {
          font-size: 16px;
        }

        .email-content h3,
        .email-content h4 {
          font-size: 14px;
        }

        .email-content a {
          color: var(--accent, #FF7F50);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.15s ease;
        }

        .email-content a:hover {
          border-bottom-color: var(--accent, #FF7F50);
        }

        .email-content ul,
        .email-content ol {
          margin: 0 0 16px 0;
          padding-left: 24px;
        }

        .email-content li {
          margin: 4px 0;
        }

        .email-content blockquote {
          border-left: 3px solid var(--border-default, #E5E7EB);
          margin: 16px 0;
          padding: 8px 0 8px 16px;
          color: var(--text-secondary, #6B7280);
          font-style: italic;
        }

        /* Quoted email styles */}
        .email-content .gmail_quote,
        .email-content [class*="quoted"],
        .email-content [class*="OutlookQuote"] {
          border-left: 2px solid var(--border-subtle, #F1F3F5);
          padding-left: 12px;
          margin-left: 8px;
          color: var(--text-secondary, #6B7280);
          font-size: 12px;
        }

        .email-content [data-quoted="true"] {
          border-left: 2px solid var(--border-subtle, #F1F3F5);
          padding-left: 12px;
          margin-left: 8px;
          margin-top: 16px;
          color: var(--text-secondary, #6B7280);
        }

        .email-content code {
          background: var(--bg-tertiary, #F1F3F5);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Geist Mono', monospace;
          font-size: 12px;
        }

        .email-content pre {
          background: var(--bg-tertiary, #F1F3F5);
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 16px 0;
        }

        .email-content pre code {
          background: none;
          padding: 0;
        }

        .email-content img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 16px 0;
        }

        .email-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }

        .email-content th,
        .email-content td {
          border: 1px solid var(--border-default, #E5E7EB);
          padding: 8px 12px;
          text-align: left;
        }

        .email-content th {
          background: var(--bg-secondary, #F8F9FA);
          font-weight: 500;
        }

        .email-content hr {
          border: none;
          border-top: 1px solid var(--border-default, #E5E7EB);
          margin: 24px 0;
        }

        .email-content strong,
        .email-content b {
          font-weight: 600;
        }

        .email-content em,
        .email-content i {
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
