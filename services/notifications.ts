import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Timestamp } from 'firebase/firestore';

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('awards', {
      name: 'Ödül Bildirimleri',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#B47AFF',
    });
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied.');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (e) {
    console.warn('Could not get push token:', e);
    return null;
  }
}

// Days/hours before deadline to schedule local notifications
const SCHEDULE_POINTS = [
  { msBeforeDeadline: 30 * 24 * 60 * 60 * 1000, label: '30 gün' },
  { msBeforeDeadline: 14 * 24 * 60 * 60 * 1000, label: '14 gün' },
  { msBeforeDeadline: 7 * 24 * 60 * 60 * 1000, label: '7 gün' },
  { msBeforeDeadline: 3 * 24 * 60 * 60 * 1000, label: '3 gün' },
  { msBeforeDeadline: 1 * 24 * 60 * 60 * 1000, label: '1 gün' },
];

const LAST_DAY_HOURS = [16, 12, 8, 4];

function isInQuietHours(date: Date, quietStart: number, quietEnd: number): boolean {
  const hour = date.getHours();
  if (quietStart > quietEnd) return hour >= quietStart || hour < quietEnd;
  return hour >= quietStart && hour < quietEnd;
}

function shiftOutOfQuiet(triggerMs: number, quietStart: number, quietEnd: number): number {
  const date = new Date(triggerMs);
  if (!isInQuietHours(date, quietStart, quietEnd)) return triggerMs;
  const next = new Date(date);
  next.setHours(quietEnd, 0, 0, 0);
  if (next.getTime() <= date.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime();
}

/**
 * Schedule all local countdown notifications for an award.
 * Cancels any previously scheduled ones first.
 * Returns the scheduled notification IDs.
 */
export async function scheduleAwardNotifications(
  awardId: string,
  awardName: string,
  deadlineDate: Timestamp,
  quietStart = 22,
  quietEnd = 8,
): Promise<string[]> {
  const deadlineMs = deadlineDate.toMillis();
  const now = Date.now();
  const scheduledIds: string[] = [];

  await cancelAwardNotifications(awardId);

  // Countdown milestones (30d → 1d)
  for (const point of SCHEDULE_POINTS) {
    const triggerMs = deadlineMs - point.msBeforeDeadline;
    if (triggerMs <= now) continue;

    const adjusted = shiftOutOfQuiet(triggerMs, quietStart, quietEnd);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ ${awardName}`,
        body: `Son başvuruya ${point.label} kaldı!`,
        data: { awardId, type: 'countdown' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(adjusted),
      },
    });
    scheduledIds.push(id);
  }

  // Last-day 4-hour intervals — no quiet-hour shift (these are time-critical)
  for (const hoursLeft of LAST_DAY_HOURS) {
    const triggerMs = deadlineMs - hoursLeft * 60 * 60 * 1000;
    if (triggerMs <= now) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 ${awardName} — Son Gün!`,
        body: `${hoursLeft} saat kaldı. Başvurmayı unutma!`,
        data: { awardId, type: 'lastDay' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerMs),
      },
    });
    scheduledIds.push(id);
  }

  return scheduledIds;
}

/** Cancel all scheduled notifications for a specific award. */
export async function cancelAwardNotifications(awardId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((n) => n.content.data?.awardId === awardId);
  await Promise.all(
    toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/** Cancel every scheduled notification in the app. */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
