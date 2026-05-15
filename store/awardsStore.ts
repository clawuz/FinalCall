import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Award } from '@/types';

type FilterType = 'all' | 'TR' | 'Global' | 'tracking';

interface AwardsState {
  awards: Award[];
  loading: boolean;
  error: string | null;
  filter: FilterType;
  trackedIdsList: string[];
  unsubscribe: Unsubscribe | null;

  setFilter: (filter: FilterType) => void;
  toggleTracking: (awardId: string) => void;
  isTracking: (awardId: string) => boolean;
  startListening: () => void;
  stopListening: () => void;
  getFilteredAwards: () => Award[];
  getUrgentAwards: () => Award[];
}

export const useAwardsStore = create<AwardsState>()(
  persist(
    (set, get) => ({
      awards: [],
      loading: true,
      error: null,
      filter: 'all',
      trackedIdsList: [],
      unsubscribe: null,

      setFilter: (filter) => set({ filter }),

      toggleTracking: (awardId) => {
        const list = get().trackedIdsList;
        const next = list.includes(awardId)
          ? list.filter((id) => id !== awardId)
          : [...list, awardId];
        set({ trackedIdsList: next });
      },

      isTracking: (awardId) => get().trackedIdsList.includes(awardId),

      startListening: () => {
        const { unsubscribe: existing } = get();
        if (existing) existing();

        const q = query(
          collection(db, 'awards'),
          where('isActive', '==', true),
          orderBy('deadlineDate', 'asc')
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const awards = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Award[];
            set({ awards, loading: false, error: null });
          },
          (error) => {
            set({ error: error.message, loading: false });
          }
        );

        set({ unsubscribe });
      },

      stopListening: () => {
        const { unsubscribe } = get();
        if (unsubscribe) {
          unsubscribe();
          set({ unsubscribe: null });
        }
      },

      getFilteredAwards: () => {
        const { awards, filter, trackedIdsList } = get();
        const now = Timestamp.now();
        const active = awards.filter((a) => a.deadlineDate.toMillis() > now.toMillis());

        switch (filter) {
          case 'TR': return active.filter((a) => a.region === 'TR');
          case 'Global': return active.filter((a) => a.region === 'Global');
          case 'tracking': return active.filter((a) => trackedIdsList.includes(a.id));
          default: return active;
        }
      },

      getUrgentAwards: () => {
        const { awards } = get();
        const now = Date.now();
        const in24h = now + 24 * 60 * 60 * 1000;
        return awards.filter(
          (a) => a.deadlineDate.toMillis() > now && a.deadlineDate.toMillis() <= in24h
        );
      },
    }),
    {
      name: 'notifawards-awards',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        filter: state.filter,
        trackedIdsList: state.trackedIdsList,
      }),
    }
  )
);
