import { create } from 'zustand';

export interface Award {
  id: string;
  title: string;
  category: string;
  deadline: string;
  description?: string;
  url?: string;
  isTracked: boolean;
  notificationsEnabled: boolean;
}

interface AwardsState {
  awards: Award[];
  trackedIds: Set<string>;
  setAwards: (awards: Award[]) => void;
  toggleTracking: (id: string) => void;
  toggleNotification: (id: string) => void;
}

export const useAwardsStore = create<AwardsState>((set) => ({
  awards: [],
  trackedIds: new Set(),
  setAwards: (awards) => set({ awards }),
  toggleTracking: (id) =>
    set((state) => {
      const newTracked = new Set(state.trackedIds);
      if (newTracked.has(id)) {
        newTracked.delete(id);
      } else {
        newTracked.add(id);
      }
      return { trackedIds: newTracked };
    }),
  toggleNotification: (id) =>
    set((state) => ({
      awards: state.awards.map((a) =>
        a.id === id ? { ...a, notificationsEnabled: !a.notificationsEnabled } : a,
      ),
    })),
}));
