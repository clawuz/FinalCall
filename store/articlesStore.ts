import { create } from 'zustand';
import {
  collection, query, where, orderBy,
  onSnapshot, Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Article } from '@/types';

interface ArticlesState {
  articles: Article[];
  loading: boolean;
  error: string | null;
  unsubscribe: Unsubscribe | null;
  startListening: () => void;
  stopListening: () => void;
}

export const useArticlesStore = create<ArticlesState>((set, get) => ({
  articles: [],
  loading: true,
  error: null,
  unsubscribe: null,

  startListening: () => {
    const { unsubscribe: existing } = get();
    if (existing) existing();

    const q = query(
      collection(db, 'articles'),
      where('isActive', '==', true),
      orderBy('publishedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const articles = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Article[];
        set({ articles, loading: false, error: null });
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
}));
