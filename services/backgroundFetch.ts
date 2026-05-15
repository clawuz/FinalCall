import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { getDocs, query, collection, where, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAwardsStore } from '@/store/awardsStore';

export const BACKGROUND_FETCH_TASK = 'notifawards-background-fetch';

// Define the background task — this must be called at module level (top of entry file)
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const q = query(
      collection(db, 'awards'),
      where('isActive', '==', true),
      orderBy('deadlineDate', 'asc')
    );
    const snapshot = await getDocs(q);
    // Trigger a store update so data is fresh when the user opens the app
    useAwardsStore.setState({
      awards: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as never[],
      loading: false,
      error: null,
    });
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetch(): Promise<void> {
  const status = await BackgroundFetch.getStatusAsync();
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
    status === BackgroundFetch.BackgroundFetchStatus.Denied
  ) {
    console.warn('Background fetch is not available on this device.');
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  if (isRegistered) return;

  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 15 * 60, // 15 minutes minimum (iOS may throttle further)
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export async function unregisterBackgroundFetch(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  }
}
