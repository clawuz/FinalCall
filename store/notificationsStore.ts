import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotifItem {
  id: string;
  title: string;
  body: string;
  awardId?: string;
  receivedAt: number;
  read: boolean;
}

interface NotificationsState {
  items: NotifItem[];
  addNotification: (item: Omit<NotifItem, 'id' | 'read'>) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: [],

      addNotification: (item) => {
        const newItem: NotifItem = {
          ...item,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          read: false,
        };
        set((s) => ({ items: [newItem, ...s.items].slice(0, 50) }));
      },

      markAllRead: () =>
        set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),

      clearAll: () => set({ items: [] }),

      unreadCount: () => get().items.filter((n) => !n.read).length,
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
