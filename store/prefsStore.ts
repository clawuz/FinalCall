import { create } from 'zustand';

interface PrefsState {
  quietStart: number;   // 22
  quietEnd: number;     // 8
  pushToken: string | null;
  hasOnboarded: boolean;

  setQuietHours: (start: number, end: number) => void;
  setPushToken: (token: string) => void;
  setOnboarded: () => void;
}

export const usePrefsStore = create<PrefsState>((set) => ({
  quietStart: 22,
  quietEnd: 8,
  pushToken: null,
  hasOnboarded: false,

  setQuietHours: (start, end) => set({ quietStart: start, quietEnd: end }),
  setPushToken: (token) => set({ pushToken: token }),
  setOnboarded: () => set({ hasOnboarded: true }),
}));
