import { create } from 'zustand';

interface UiState {
  loginPrompt: { open: boolean; redirect?: string };
  openLoginPrompt: (redirect?: string) => void;
  closeLoginPrompt: () => void;
}

export const useUi = create<UiState>((set) => ({
  loginPrompt: { open: false },
  openLoginPrompt: (redirect) => set({ loginPrompt: { open: true, redirect } }),
  closeLoginPrompt: () => set({ loginPrompt: { open: false } }),
}));
