"use client";

import { useState } from "react";
import { Paperclip, Download, FileText, Image as ImageIcon, File, Eye } from "lucide-react";
import { Lightbox } from "@/components/ui/Lightbox";

interface Attachment {
  id: string;
  name: string;
  content_type: string | null;
  size_bytes: number | null;
  is_inline: boolean | null;
  content_id: string | null;
}

interface AttachmentListProps {
  attachments: Attachment[];
  messageId: string;
}

export function AttachmentList({ attachments, messageId }: AttachmentListProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (contentType: string | null) => {
    if (!contentType) return <File size={16} className="text-text-tertiary" strokeWidth={1.5} />;

    if (contentType.startsWith("image/")) {
      return <ImageIcon size={16} className="text-blue-500" strokeWidth={1.5} />;
    }
    if (contentType.includes("pdf")) {
      return <FileText size={16} className="text-red-500" strokeWidth={1.5} />;
    }
    if (contentType.includes("word") || contentType.includes("document")) {
      return <FileText size={16} className="text-blue-600" strokeWidth={1.5} />;
    }
    if (contentType.includes("sheet") || contentType.includes("excel")) {
      return <FileText size={16} className="text-green-600" strokeWidth={1.5} />;
    }
    if (contentType.includes("presentation") || contentType.includes("powerpoint")) {
      return <FileText size={16} className="text-orange-600" strokeWidth={1.5} />;
    }

    return <File size={16} className="text-text-tertiary" strokeWidth={1.5} />;
  };

  const isImage = (contentType: string | null) => {
    return contentType?.startsWith("image/") || false;
  };

  const handlePreview = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleDownload = async (attachmentId: string, name: string) => {
    try {
      const response = await fetch(`/api/mail/messages/${messageId}/attachments/${attachmentId}`);

      if (!response.ok) {
        throw new Error("Failed to download attachment");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading attachment:", error);
    }
  };

  // Filter out inline attachments (they're shown in the body)
  const displayAttachments = attachments.filter(att => !att.is_inline);

  if (displayAttachments.length === 0) {
    return null;
  }

  // Get image attachments for lightbox
  const imageAttachments = displayAttachments
    .map((att, index) => ({ ...att, originalIndex: index }))
    .filter((att) => isImage(att.content_type));

  const lightboxImages = imageAttachments.map((att) => ({
    id: att.id,
    name: att.name,
    url: `/api/mail/messages/${messageId}/attachments/${att.id}`,
  }));

  return (
    <>
      <div className="border-b border-border-subtle bg-surface-secondary px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Paperclip size={14} className="text-text-tertiary" strokeWidth={1.5} />
          <span className="text-xs font-medium text-text-secondary">
            {displayAttachments.length} {displayAttachments.length === 1 ? "attachment" : "attachments"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {displayAttachments.map((attachment, index) => {
            const isImg = isImage(attachment.content_type);
            const imageIndex = imageAttachments.findIndex((img) => img.id === attachment.id);

            return (
              <div
                key={attachment.id}
                className="flex items-center gap-2 rounded-md border border-border-default bg-surface-primary px-3 py-2"
              >
                {getFileIcon(attachment.content_type)}
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium text-text-primary">{attachment.name}</span>
                  <span className="text-[10px] text-text-tertiary">{formatFileSize(attachment.size_bytes)}</span>
                </div>

                {/* Action buttons */}
                <div className="ml-2 flex items-center gap-1">
                  {isImg && (
                    <button
                      onClick={() => handlePreview(imageIndex)}
                      className="rounded p-1 transition-colors hover:bg-surface-hover"
                      title="Preview"
                    >
                      <Eye size={14} className="text-text-tertiary" strokeWidth={1.5} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(attachment.id, attachment.name)}
                    className="rounded p-1 transition-colors hover:bg-surface-hover"
                    title="Download"
                  >
                    <Download size={14} className="text-text-tertiary" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox for image preview */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
