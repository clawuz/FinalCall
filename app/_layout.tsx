import { Stack } from 'expo-router';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { usePrefsStore } from '@/store/prefsStore';
import { Platform } from 'react-native';
import SplashAnimation from '@/components/SplashAnimation';
import { configureNotificationHandler, setupNotificationTapHandler } from '@/services/notifications';
import { useNotificationsStore } from '@/store/notificationsStore';

if (Platform.OS !== 'web') {
  require('@/services/backgroundFetch');
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  const [animDone, setAnimDone] = useState(false);
  const hasOnboarded = usePrefsStore((s) => s.hasOnboarded);
  const router = useRouter();

  const addNotification = useNotificationsStore((s) => s.addNotification);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    configureNotificationHandler();

    const Notifications = require('expo-notifications');

    // Foreground: bildirim gelince kaydet
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (notification: { request: { content: { title: string; body: string; data: Record<string, string> } } }) => {
        const { title, body, data } = notification.request.content;
        addNotification({ title: title ?? '', body: body ?? '', awardId: data?.awardId, receivedAt: Date.now() });
      }
    );

    // Tap: bildirime tıklanınca kaydet + yönlendir
    const tapSub = Notifications.addNotificationResponseReceivedListener(
      (response: { notification: { request: { content: { title: string; body: string; data: Record<string, string> } } } }) => {
        const { title, body, data } = response.notification.request.content;
        addNotification({ title: title ?? '', body: body ?? '', awardId: data?.awardId, receivedAt: Date.now() });
        if (data?.awardId) router.push(`/award/${data.awardId}` as never);
      }
    );

    return () => {
      foregroundSub.remove();
      tapSub.remove();
    };
  }, []);

  // Hide native splash as soon as fonts are ready — custom animation takes over
  useEffect(() => {
    if (!loaded) return;
    if (Platform.OS !== 'web') SplashScreen.hideAsync();
  }, [loaded]);

  // Navigate after both fonts loaded and animation finished
  useEffect(() => {
    if (!animDone) return;
    if (!hasOnboarded) {
      router.replace('/onboarding' as never);
    }
  }, [animDone, hasOnboarded]);

  // Block on web until fonts load (no custom splash on web)
  if (!loaded && Platform.OS !== 'web') return null;

  // Show custom animated splash on native
  if (!animDone && Platform.OS !== 'web') {
    return <SplashAnimation onFinished={() => setAnimDone(true)} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="award/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
