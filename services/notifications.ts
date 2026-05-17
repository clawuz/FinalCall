import { Platform } from 'react-native';
import { router } from 'expo-router';

const Notifications = Platform.OS !== 'web' ? require('expo-notifications') : null;
const Device = Platform.OS !== 'web' ? require('expo-device') : null;
const Constants = Platform.OS !== 'web' ? require('expo-constants').default : null;

export function configureNotificationHandler() {
  if (!Notifications) return;
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
  if (!Notifications || !Device) return null;
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

/**
 * Call once at app startup. When a user taps a push notification,
 * routes to the relevant award detail screen.
 */
export function setupNotificationTapHandler() {
  if (!Notifications) return;
  Notifications.addNotificationResponseReceivedListener(
    (response: { notification: { request: { content: { data: Record<string, string> } } } }) => {
      const awardId = response.notification.request.content.data?.awardId;
      if (awardId) {
        router.push(`/award/${awardId}` as never);
      }
    }
  );
}
