import { Tabs } from 'expo-router';

const TABS = [
  { name: 'index', title: 'Ödüller', icon: '◈' },
  { name: 'explore', title: 'Keşfet', icon: '⊞' },
  { name: 'tracking', title: 'Takip', icon: '★' },
  { name: 'news', title: 'Haberler', icon: '◉' },
  { name: 'settings', title: 'Ayarlar', icon: '◎' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F0D0A',
          borderTopColor: 'rgba(255,255,255,0.06)',
          height: 80,
          paddingBottom: 16,
        },
        tabBarActiveTintColor: '#B47AFF',
        tabBarInactiveTintColor: 'rgba(250,250,250,0.3)',
        tabBarLabelStyle: {
          fontSize: 9,
          letterSpacing: 0.5,
          fontFamily: 'Outfit_600SemiBold',
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
          }}
        />
      ))}
    </Tabs>
  );
}
