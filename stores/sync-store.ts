import { create } from 'zustand';

interface SyncState {
  // Sync store will be implemented in Agent 3
}

export const useSyncStore = create<SyncState>(() => ({}));
