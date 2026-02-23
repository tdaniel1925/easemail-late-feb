import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";

/**
 * Hook to initialize app settings on client mount
 * Runs once when the app loads on the client side
 */
export function useInitializeApp() {
  const { setTimezone, timezone } = useUIStore();

  useEffect(() => {
    // Set user's timezone if not already set or if still UTC (default)
    if (!timezone || timezone === "UTC") {
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(userTimezone);
      } catch (error) {
        console.error("Failed to detect timezone:", error);
        // Fallback to UTC if detection fails
        setTimezone("UTC");
      }
    }
  }, []); // Run only once on mount
}
