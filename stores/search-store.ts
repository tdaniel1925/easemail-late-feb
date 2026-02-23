import { create } from "zustand";

interface SearchResult {
  id: string;
  type: "message" | "contact" | "folder";
  title: string;
  subtitle?: string;
  preview?: string;
  folder_name?: string;
  received_at?: string;
  score?: number;
}

interface SearchState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  selectedIndex: number;

  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setSearching: (isSearching: boolean) => void;
  setSelectedIndex: (index: number) => void;
  nextResult: () => void;
  previousResult: () => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  isOpen: false,
  query: "",
  results: [],
  isSearching: false,
  selectedIndex: 0,

  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false, query: "", results: [], selectedIndex: 0 }),
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results, selectedIndex: 0 }),
  setSearching: (isSearching) => set({ isSearching }),
  setSelectedIndex: (index) => set({ selectedIndex: index }),

  nextResult: () => {
    const { selectedIndex, results } = get();
    if (selectedIndex < results.length - 1) {
      set({ selectedIndex: selectedIndex + 1 });
    }
  },

  previousResult: () => {
    const { selectedIndex } = get();
    if (selectedIndex > 0) {
      set({ selectedIndex: selectedIndex - 1 });
    }
  },

  clearSearch: () => set({ query: "", results: [], selectedIndex: 0 }),
}));
