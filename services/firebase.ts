import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCgqd3k_bfYWnoT4CapJV5FF8pv-3atQ-E',
  authDomain: 'notifawards-app.firebaseapp.com',
  projectId: 'notifawards-app',
  storageBucket: 'notifawards-app.firebasestorage.app',
  messagingSenderId: '305518403000',
  appId: '1:305518403000:web:031596516843da71edc34d',
};

// Singleton — prevent re-initialization on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export { app };
