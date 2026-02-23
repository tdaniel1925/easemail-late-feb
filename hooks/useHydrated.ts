import { useEffect, useState } from "react";

/**
 * Hook to check if the component has been hydrated on the client
 * Prevents hydration mismatches when using persisted stores or client-only state
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
