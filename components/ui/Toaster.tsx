"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { useToastStore } from "@/stores/toast-store";
import { Toast } from "./Toast";

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
      <ToastPrimitive.Viewport className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:top-auto sm:bottom-0 sm:right-0 sm:flex-col md:max-w-[420px]" />
    </ToastPrimitive.Provider>
  );
}
