import { create } from 'zustand';

interface PrefsState {
  notificationsEnabled: boolean;
  reminderDaysBefore: number;
  preferredCategories: string[];
  language: 'tr' | 'en';
  setNotificationsEnabled: (enabled: boolean) => void;
  setReminderDaysBefore: (days: number) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  setLanguage: (lang: 'tr' | 'en') => void;
}

export const usePrefsStore = create<PrefsState>((set) => ({
  notificationsEnabled: true,
  reminderDaysBefore: 7,
  preferredCategories: [],
  language: 'tr',
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setReminderDaysBefore: (days) => set({ reminderDaysBefore: days }),
  addCategory: (category) =>
    set((state) => ({
      preferredCategories: [...new Set([...state.preferredCategories, category])],
    })),
  removeCategory: (category) =>
    set((state) => ({
      preferredCategories: state.preferredCategories.filter((c) => c !== category),
    })),
  setLanguage: (language) => set({ language }),
}));
