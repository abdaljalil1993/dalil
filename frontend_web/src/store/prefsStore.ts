import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'ar' | 'en';
export type ThemeMode = 'light' | 'dark';

interface PrefsState {
  locale: Locale;
  mode: ThemeMode;
  cityId: number | null;
  view: 'grid' | 'list' | 'map';
  setLocale: (l: Locale) => void;
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
  setCityId: (id: number | null) => void;
  setView: (v: 'grid' | 'list' | 'map') => void;
}

const systemDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export const usePrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      locale: 'ar',
      mode: systemDark ? 'dark' : 'light',
      cityId: null,
      view: 'grid',
      setLocale: (locale) => set({ locale }),
      setMode: (mode) => set({ mode }),
      toggleMode: () => set({ mode: get().mode === 'dark' ? 'light' : 'dark' }),
      setCityId: (cityId) => set({ cityId }),
      setView: (view) => set({ view }),
    }),
    { name: 'dalilak-prefs' }
  )
);
