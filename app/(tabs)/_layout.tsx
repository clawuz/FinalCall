// app/(tabs)/_layout.tsx
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Tabs } from 'expo-router';
import { useAwardsStore } from '@/store/awardsStore';
import { configureNotificationHandler } from '@/services/notifications';
import { registerBackgroundFetch } from '@/services/backgroundFetch';
import TabBar from '@/components/TabBar';

export default function TabLayout() {
  const startListening = useAwardsStore((s) => s.startListening);
  const stopListening = useAwardsStore((s) => s.stopListening);

  useEffect(() => {
    configureNotificationHandler();
    startListening();
    registerBackgroundFetch();

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') startListening();
    });

    return () => {
      stopListening();
      sub.remove();
    };
  }, []);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="tracking" />
      <Tabs.Screen name="news" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
