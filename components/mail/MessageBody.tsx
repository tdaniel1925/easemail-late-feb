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
  const [showImages, setShowImages] = useState(true); // Show images by default
  const [hasExternalImages, setHasExternalImages] = useState(false);
  const [showQuotedText, setShowQuotedText] = useState(false);
  const [hasQuotedText, setHasQuotedText] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleBlockSender = () => {
    if (!fromAddress) return;

    const blockedSenders = JSON.parse(localStorage.getItem("easemail_blocked_image_senders") || "[]");
    if (!blockedSenders.includes(fromAddress.toLowerCase())) {
      blockedSenders.push(fromAddress.toLowerCase());
      localStorage.setItem("easemail_blocked_image_senders", JSON.stringify(blockedSenders));
    }

    setShowImages(false);
  };

  const handleUnblockSender = () => {
    if (!fromAddress) return;

    const blockedSenders = JSON.parse(localStorage.getItem("easemail_blocked_image_senders") || "[]");
    const filtered = blockedSenders.filter((email: string) => email !== fromAddress.toLowerCase());
    localStorage.setItem("easemail_blocked_image_senders", JSON.stringify(filtered));

    setShowImages(true);
  };

  useEffect(() => {
    if (bodyRef.current && bodyHtml) {
      // Check if sender is blocked
      const blockedSenders = JSON.parse(localStorage.getItem("easemail_blocked_image_senders") || "[]");
      const isBlocked = fromAddress && blockedSenders.includes(fromAddress.toLowerCase());

      // Check if there are external images
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = bodyHtml;
      const images = tempDiv.querySelectorAll("img");
      const hasExternal = Array.from(images).some((img) => {
        const src = img.getAttribute("src") || "";
        return src.startsWith("http://") || src.startsWith("https://");
      });
      setHasExternalImages(hasExternal);

      // Block images if sender is in blocked list
      if (isBlocked && hasExternal) {
        setShowImages(false);
      } else if (hasExternal) {
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

    // For debugging: be very permissive with sanitization
    if (!allowImages) {
      // Block external images but keep inline images (data: and cid:)
      config.FORBID_ATTR = [];
      config.ADD_ATTR = ['src'];
    }

    let sanitized = DOMPurify.sanitize(html, config);

    // If images are not allowed, remove external image src after sanitization
    if (!allowImages) {
      const tempRemoveImages = document.createElement("div");
      tempRemoveImages.innerHTML = sanitized;
      const externalImages = tempRemoveImages.querySelectorAll("img");
      externalImages.forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (src.startsWith("http://") || src.startsWith("https://")) {
          img.removeAttribute("src");
          img.setAttribute("data-blocked-src", src);
        }
      });
      sanitized = tempRemoveImages.innerHTML;
    }

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
      {/* External Images Banner - Show when images are blocked */}
      {hasExternalImages && !showImages && (
        <div className="sticky top-0 z-10 border-b border-border-subtle bg-amber-50 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon size={14} className="text-amber-700" strokeWidth={1.5} />
              <span className="text-xs text-amber-900">
                Images are blocked from this sender
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUnblockSender}
                className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
                title={`Load images from ${fromAddress || 'this sender'}`}
              >
                Unblock sender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Option to block images when they are showing */}
      {hasExternalImages && showImages && fromAddress && (
        <div className="sticky top-0 z-10 border-b border-border-subtle bg-surface-secondary px-4 py-1.5">
          <div className="flex items-center justify-end">
            <button
              onClick={handleBlockSender}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              title={`Block images from ${fromAddress}`}
            >
              Block images from this sender
            </button>
          </div>
        </div>
      )}

      {/* Message Body Content */}
      <div className="mx-auto max-w-4xl px-8 py-6">
        {renderContent()}
      </div>

      <style jsx global>{`
        .email-content {
          font-size: 14px;
          line-height: 1.6;
          color: #1A1A1A;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        /* Reset email client styles */
        .email-content * {
          max-width: 100%;
        }

        .email-content p {
          margin: 0 0 12px 0;
        }

        .email-content p:last-child {
          margin-bottom: 0;
        }

        .email-content p:empty {
          margin: 0;
          line-height: 0;
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
          display: block;
          margin: 0 auto;
        }

        /* Handle email layout tables */
        .email-content table {
          border-collapse: collapse;
          border-spacing: 0;
          max-width: 100%;
        }

        .email-content table[role="presentation"],
        .email-content table[border="0"],
        .email-content table[cellpadding="0"],
        .email-content table[cellspacing="0"] {
          border: none !important;
        }

        .email-content table[role="presentation"] td,
        .email-content table[border="0"] td {
          border: none !important;
          padding: 0;
        }

        /* Content tables (actual data tables) */
        .email-content table:not([role="presentation"]):not([border="0"]) {
          margin: 16px 0;
        }

        .email-content table:not([role="presentation"]):not([border="0"]) th,
        .email-content table:not([role="presentation"]):not([border="0"]) td {
          border: 1px solid #E5E7EB;
          padding: 8px 12px;
          text-align: left;
        }

        .email-content table:not([role="presentation"]):not([border="0"]) th {
          background: #F8F9FA;
          font-weight: 500;
        }

        /* Email container divs */
        .email-content > div,
        .email-content > table {
          width: 100% !important;
          max-width: 100% !important;
        }

        .email-content center {
          width: 100%;
          display: block;
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

        /* Email buttons */
        .email-content a[style*="background"],
        .email-content a[style*="button"],
        .email-content td[style*="background"] a {
          display: inline-block;
          text-decoration: none !important;
          border-bottom: none !important;
        }

        /* Font smoothing */
        .email-content {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Handle email spacers */
        .email-content div[style*="height"][style*="line-height: 0"],
        .email-content div[style*="height: 0"],
        .email-content div[style*="font-size: 0"] {
          line-height: 0;
          font-size: 0;
          overflow: hidden;
        }

        /* Responsive fixes */
        @media only screen and (max-width: 600px) {
          .email-content table {
            width: 100% !important;
          }

          .email-content img {
            width: 100% !important;
            height: auto !important;
          }
        }

        /* Better text wrapping */
        .email-content span,
        .email-content div {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        /* Remove excessive line breaks */
        .email-content br + br + br {
          display: none;
        }

        /* Better spacing for divs */
        .email-content > div + div {
          margin-top: 0;
        }
      `}</style>
    </div>
  );
}
