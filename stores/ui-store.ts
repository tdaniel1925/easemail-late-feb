import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";
export type Density = "compact" | "comfortable" | "spacious";
export type ReadingPanePosition = "right" | "bottom" | "hidden";

interface UIPreferences {
  theme: Theme;
  density: Density;
  readingPanePosition: ReadingPanePosition;
  defaultAccountId: string | null;
  timezone: string;
  dateFormat: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

interface UIState extends UIPreferences {
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  setReadingPanePosition: (position: ReadingPanePosition) => void;
  setDefaultAccount: (accountId: string | null) => void;
  setTimezone: (timezone: string) => void;
  setDateFormat: (format: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  updatePreferences: (preferences: Partial<UIPreferences>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Default preferences
      theme: "system",
      density: "comfortable",
      readingPanePosition: "right",
      defaultAccountId: null,
      timezone: "UTC", // Will be set to user's timezone on client mount
      dateFormat: "MM/DD/YYYY",
      notificationsEnabled: true,
      soundEnabled: false,

      // Actions
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      setReadingPanePosition: (position) => set({ readingPanePosition: position }),
      setDefaultAccount: (accountId) => set({ defaultAccountId: accountId }),
      setTimezone: (timezone) => set({ timezone }),
      setDateFormat: (format) => set({ dateFormat: format }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      updatePreferences: (preferences) => set((state) => ({ ...state, ...preferences })),
    }),
    {
      name: "easemail-ui-preferences",
    }
  )
);
