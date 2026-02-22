import { create } from 'zustand';

interface AccountState {
  // Account store will be implemented in Agent 2
}

export const useAccountStore = create<AccountState>(() => ({}));
