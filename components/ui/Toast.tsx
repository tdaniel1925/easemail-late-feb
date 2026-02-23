"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { X, CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";
import { type Toast as ToastType } from "@/stores/toast-store";

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

export function Toast({ toast, onRemove }: ToastProps) {
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle size={16} className="text-green-500" strokeWidth={2} />;
      case "error":
        return <XCircle size={16} className="text-red-500" strokeWidth={2} />;
      case "warning":
        return <AlertTriangle size={16} className="text-orange-500" strokeWidth={2} />;
      case "info":
        return <Info size={16} className="text-blue-500" strokeWidth={2} />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "success":
        return "border-l-green-500";
      case "error":
        return "border-l-red-500";
      case "warning":
        return "border-l-orange-500";
      case "info":
        return "border-l-blue-500";
    }
  };

  return (
    <ToastPrimitive.Root
      className={`group pointer-events-auto flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-md border-l-4 ${getBorderColor()} border-r border-t border-b border-border-default bg-surface-primary p-4 shadow-lg data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full`}
    >
      <div className="flex-shrink-0 pt-0.5">{getIcon()}</div>

      <div className="flex-1 space-y-1">
        <ToastPrimitive.Title className="text-sm font-semibold text-text-primary">
          {toast.title}
        </ToastPrimitive.Title>
        {toast.description && (
          <ToastPrimitive.Description className="text-xs text-text-secondary">
            {toast.description}
          </ToastPrimitive.Description>
        )}
        {toast.action && (
          <ToastPrimitive.Action
            altText={toast.action.label}
            onClick={toast.action.onClick}
            className="mt-2 inline-block rounded-md bg-accent px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {toast.action.label}
          </ToastPrimitive.Action>
        )}
      </div>

      <ToastPrimitive.Close
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
      >
        <X size={14} strokeWidth={2} />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}
