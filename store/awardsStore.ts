import { create } from 'zustand';
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
  trackedIds: Set<string>;
  unsubscribe: Unsubscribe | null;

  // Actions
  setFilter: (filter: FilterType) => void;
  toggleTracking: (awardId: string) => void;
  isTracking: (awardId: string) => boolean;
  startListening: () => void;
  stopListening: () => void;

  // Computed (selectors — çağrıldığında hesaplanır)
  getFilteredAwards: () => Award[];
  getUrgentAwards: () => Award[];  // son 24 saat
}

export const useAwardsStore = create<AwardsState>((set, get) => ({
  awards: [],
  loading: true,
  error: null,
  filter: 'all',
  trackedIds: new Set(),
  unsubscribe: null,

  setFilter: (filter) => set({ filter }),

  toggleTracking: (awardId) => {
    const { trackedIds } = get();
    const next = new Set(trackedIds);
    if (next.has(awardId)) {
      next.delete(awardId);
    } else {
      next.add(awardId);
    }
    set({ trackedIds: next });
  },

  isTracking: (awardId) => get().trackedIds.has(awardId),

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
    const { awards, filter, trackedIds } = get();
    const now = Timestamp.now();

    // Geçmiş tarihlileri çıkar
    const active = awards.filter((a) => a.deadlineDate.toMillis() > now.toMillis());

    switch (filter) {
      case 'TR': return active.filter((a) => a.region === 'TR');
      case 'Global': return active.filter((a) => a.region === 'Global');
      case 'tracking': return active.filter((a) => trackedIds.has(a.id));
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
}));
