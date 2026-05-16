import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function registerPushToken(token: string): Promise<void> {
  try {
    await setDoc(
      doc(db, 'user_prefs', token),
      {
        mutedAwards: [],
        allNotifs: true,
        quietStart: 22,
        quietEnd: 8,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Could not register push token to Firestore:', e);
  }
}

export async function updateUserNotifSettings(
  token: string,
  settings: {
    allNotifs?: boolean;
    quietStart?: number;
    quietEnd?: number;
  }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'user_prefs', token), {
      ...settings,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Could not update notification settings in Firestore:', e);
  }
}

export async function muteAward(token: string, awardId: string): Promise<void> {
  const { arrayUnion } = await import('firebase/firestore');
  try {
    await updateDoc(doc(db, 'user_prefs', token), {
      mutedAwards: arrayUnion(awardId),
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Could not mute award in Firestore:', e);
  }
}

export async function unmuteAward(token: string, awardId: string): Promise<void> {
  const { arrayRemove } = await import('firebase/firestore');
  try {
    await updateDoc(doc(db, 'user_prefs', token), {
      mutedAwards: arrayRemove(awardId),
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Could not unmute award in Firestore:', e);
  }
}
