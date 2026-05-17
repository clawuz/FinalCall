import { create } from 'zustand';
import {
  collection, query, where, orderBy,
  onSnapshot, Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Article } from '@/types';

interface ArticlesState {
  articles: Article[];
  loading: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
}

type Unsub = () => void;

export const useArticlesStore = create<ArticlesState>((set) => {
  let unsubs: Unsub[] = [];
  let newsItems: Article[] = [];
  let tipItems: Article[] = [];
  let newsLoaded = false;
  let tipsLoaded = false;

  function merge() {
    if (!newsLoaded && !tipsLoaded) return;
    const stillLoading = !newsLoaded || !tipsLoaded;
    const combined = [...newsItems, ...tipItems].sort((a, b) => {
      const aMs = a.publishedAt?.toMillis?.() ?? 0;
      const bMs = b.publishedAt?.toMillis?.() ?? 0;
      return bMs - aMs;
    });
    set({ articles: combined, loading: stillLoading, error: null });
  }

  return {
    articles: [],
    loading: true,
    error: null,

    startListening: () => {
      unsubs.forEach((u) => u());
      unsubs = [];
      newsLoaded = false;
      tipsLoaded = false;
      newsItems = [];
      tipItems = [];

      const qNews = query(
        collection(db, 'articles'),
        where('isActive', '==', true),
        orderBy('publishedAt', 'desc'),
      );
      unsubs.push(
        onSnapshot(
          qNews,
          (snap) => {
            newsItems = snap.docs.map((doc) => {
              const d = doc.data();
              return {
                id: doc.id,
                type: 'news',
                title: d.title as string,
                summary: (d.summary ?? '') as string,
                url: d.url as string | undefined,
                publishedAt: d.publishedAt as Timestamp,
                isActive: true,
              } as Article;
            });
            newsLoaded = true;
            merge();
          },
          () => {
            newsLoaded = true;
            merge();
          },
        ),
      );

      const qTips = query(
        collection(db, 'tips'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
      );
      unsubs.push(
        onSnapshot(
          qTips,
          (snap) => {
            tipItems = snap.docs.map((doc) => {
              const d = doc.data();
              return {
                id: doc.id,
                type: 'tip',
                title: d.title as string,
                summary: (d.body ?? d.summary ?? '') as string,
                publishedAt: (d.createdAt ?? Timestamp.now()) as Timestamp,
                isActive: true,
              } as Article;
            });
            tipsLoaded = true;
            merge();
          },
          () => {
            tipsLoaded = true;
            merge();
          },
        ),
      );
    },

    stopListening: () => {
      unsubs.forEach((u) => u());
      unsubs = [];
    },
  };
});
