import { Stack } from 'expo-router';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { usePrefsStore } from '@/store/prefsStore';
// Must be imported at root so TaskManager.defineTask runs before any task fires
import '@/services/backgroundFetch';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  const hasOnboarded = usePrefsStore((s) => s.hasOnboarded);
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync();
    // Redirect to onboarding on first launch
    if (!hasOnboarded) {
      router.replace('/onboarding' as never);
    }
  }, [loaded, hasOnboarded]);

  if (!loaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="award/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
