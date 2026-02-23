"use client";

import { useEffect, useState, useRef } from "react";
import DOMPurify from "dompurify";
import { ImageIcon } from "lucide-react";

interface MessageBodyProps {
  bodyHtml: string | null;
  bodyText: string | null;
  contentType: string | null;
  fromAddress: string | null;
}

export function MessageBody({ bodyHtml, bodyText, contentType, fromAddress }: MessageBodyProps) {
  const [showImages, setShowImages] = useState(false);
  const [hasExternalImages, setHasExternalImages] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current && bodyHtml) {
      // Check if there are external images
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = bodyHtml;
      const images = tempDiv.querySelectorAll("img");
      const hasExternal = Array.from(images).some((img) => {
        const src = img.getAttribute("src") || "";
        return src.startsWith("http://") || src.startsWith("https://");
      });
      setHasExternalImages(hasExternal);
    }
  }, [bodyHtml]);

  const sanitizeHtml = (html: string, allowImages: boolean = false) => {
    const config: DOMPurify.Config = {
      ALLOWED_TAGS: [
        "p", "br", "span", "div", "b", "i", "u", "strong", "em", "a", "ul", "ol", "li",
        "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code", "table", "thead",
        "tbody", "tr", "td", "th", "hr", "img", "font"
      ],
      ALLOWED_ATTR: [
        "href", "target", "rel", "src", "alt", "width", "height", "style", "class",
        "color", "size", "face", "align", "bgcolor"
      ],
      ALLOW_DATA_ATTR: false,
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
      });
    }

    return tempDiv.innerHTML;
  };

  const renderContent = () => {
    if (bodyHtml) {
      const sanitizedHtml = sanitizeHtml(bodyHtml, showImages);
      return (
        <div
          ref={bodyRef}
          className="prose prose-sm max-w-none text-text-primary"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          style={{
            fontSize: "13px",
            lineHeight: "1.5",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        />
      );
    }

    if (bodyText) {
      return (
        <div
          className="whitespace-pre-wrap text-text-primary"
          style={{
            fontSize: "13px",
            lineHeight: "1.5",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            fontFamily: "inherit",
          }}
        >
          {bodyText}
        </div>
      );
    }

    return (
      <div className="text-sm italic text-text-tertiary">
        (No content)
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* External Images Banner */}
      {hasExternalImages && !showImages && (
        <div className="border-b border-border-subtle bg-surface-secondary px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon size={14} className="text-text-tertiary" strokeWidth={1.5} />
              <span className="text-xs text-text-secondary">
                External images are blocked for your privacy
              </span>
            </div>
            <button
              onClick={() => setShowImages(true)}
              className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Load images
            </button>
          </div>
        </div>
      )}

      {/* Message Body */}
      <div className="px-4 py-3">
        {renderContent()}
      </div>
    </div>
  );
}
