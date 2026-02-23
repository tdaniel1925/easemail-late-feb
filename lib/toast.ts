import { useToastStore, type ToastType } from "@/stores/toast-store";

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const createToast = (type: ToastType) => {
  return (options: string | ToastOptions) => {
    const { addToast } = useToastStore.getState();

    if (typeof options === "string") {
      return addToast({ type, title: options });
    }

    return addToast({ type, ...options });
  };
};

export const toast = {
  success: createToast("success"),
  error: createToast("error"),
  info: createToast("info"),
  warning: createToast("warning"),
};
