import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Account {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  account_type: string | null;
  status: string;
  status_message: string | null;
  last_error_at: string | null;
  error_count: number | null;
  last_full_sync_at: string | null;
  initial_sync_complete: boolean | null;
  created_at: string | null;
  // Stats from API
  messageCount?: number;
  unreadCount?: number;
  folderCount?: number;
}

interface AccountState {
  accounts: Account[];
  activeAccountId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAccounts: (accounts: Account[]) => void;
  setActiveAccount: (accountId: string | null) => void;
  addAccount: (account: Account) => void;
  updateAccount: (accountId: string, updates: Partial<Account>) => void;
  removeAccount: (accountId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Getters
  getActiveAccount: () => Account | null;
  getAccountById: (accountId: string) => Account | null;
}

// DISABLED PERSIST MIDDLEWARE - causing infinite loop in production
// TODO: Re-enable with proper hydration handling
export const useAccountStore = create<AccountState>()((set, get) => ({
  accounts: [],
  activeAccountId: null,
  isLoading: false,
  error: null,

  setAccounts: (accounts) => set({ accounts }),

  setActiveAccount: (accountId) => set({ activeAccountId: accountId }),

  addAccount: (account) =>
    set((state) => ({
      accounts: [...state.accounts, account],
      // Set as active if it's the first account
      activeAccountId: state.accounts.length === 0 ? account.id : state.activeAccountId,
    })),

  updateAccount: (accountId, updates) =>
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === accountId ? { ...acc, ...updates } : acc
      ),
    })),

  removeAccount: (accountId) =>
    set((state) => ({
      accounts: state.accounts.filter((acc) => acc.id !== accountId),
      // Clear active account if it's the one being removed
      activeAccountId:
        state.activeAccountId === accountId ? null : state.activeAccountId,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  getActiveAccount: () => {
    const state = get();
    return state.accounts.find((acc) => acc.id === state.activeAccountId) || null;
  },

  getAccountById: (accountId) => {
    const state = get();
    return state.accounts.find((acc) => acc.id === accountId) || null;
  },
}));
