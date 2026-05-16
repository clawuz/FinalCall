import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPushToken, updateUserNotifSettings } from '@/services/userPrefs';

interface PrefsState {
  quietStart: number;
  quietEnd: number;
  pushToken: string | null;
  hasOnboarded: boolean;

  // Notification toggles
  allNotifs: boolean;
  openNotif: boolean;
  countdownNotif: boolean;
  lastDayNotif: boolean;

  setQuietHours: (start: number, end: number) => void;
  setPushToken: (token: string | null) => void;
  setOnboarded: () => void;
  setAllNotifs: (v: boolean) => void;
  setOpenNotif: (v: boolean) => void;
  setCountdownNotif: (v: boolean) => void;
  setLastDayNotif: (v: boolean) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set, get) => ({
      quietStart: 22,
      quietEnd: 8,
      pushToken: null,
      hasOnboarded: false,
      allNotifs: true,
      openNotif: true,
      countdownNotif: true,
      lastDayNotif: true,

      setQuietHours: (start, end) => {
        set({ quietStart: start, quietEnd: end });
        const token = get().pushToken;
        if (token) updateUserNotifSettings(token, { quietStart: start, quietEnd: end });
      },
      setPushToken: (token) => {
        set({ pushToken: token });
        if (token) registerPushToken(token);
      },
      setOnboarded: () => set({ hasOnboarded: true }),
      setAllNotifs: (v) => {
        set({ allNotifs: v });
        const token = get().pushToken;
        if (token) updateUserNotifSettings(token, { allNotifs: v });
      },
      setOpenNotif: (v) => set({ openNotif: v }),
      setCountdownNotif: (v) => set({ countdownNotif: v }),
      setLastDayNotif: (v) => set({ lastDayNotif: v }),
    }),
    {
      name: 'notifawards-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
