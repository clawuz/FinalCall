// components/TabBar.tsx
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts } from '@/constants/Theme';

interface TabDef {
  name: string;
  label: string;
  icon: string;
  hex: string;
  rgb: string;
}

const TABS: TabDef[] = [
  { name: 'index',    label: 'Ödüller',  icon: '✦', hex: '#FFB347', rgb: '255,179,71'  },
  { name: 'explore',  label: 'Keşfet',   icon: '◉', hex: '#4DCDBE', rgb: '77,205,190'  },
  { name: 'tracking', label: 'Takip',    icon: '◆', hex: '#B47AFF', rgb: '180,122,255' },
  { name: 'news',     label: 'Haberler', icon: '⊡', hex: '#64B4FF', rgb: '100,180,255' },
  { name: 'settings', label: 'Ayarlar',  icon: '⊛', hex: '#FF7A7A', rgb: '255,122,122' },
];

function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: TabDef;
  isActive: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      scaleAnim.setValue(0.85);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 12,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  }, [isActive]);

  const boxBg = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0)', `rgba(${tab.rgb},0.15)`],
  });

  const iconColor = isActive ? tab.hex : 'rgba(255,255,255,0.22)';
  const labelColor = isActive ? tab.hex : 'rgba(255,255,255,0.22)';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.iconBox,
          {
            backgroundColor: boxBg,
            shadowColor: tab.hex,
            shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.icon,
            {
              color: iconColor,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {tab.icon}
        </Animated.Text>
      </Animated.View>
      <Text style={[styles.label, { color: labelColor }]}>{tab.label}</Text>
    </TouchableOpacity>
  );
}

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];
        const isActive = state.index === index;

        return (
          <TabItem
            key={route.key}
            tab={tab}
            isActive={isActive}
            onPress={() => {
              if (!isActive) navigation.navigate(route.name);
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10,9,14,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    lineHeight: 24,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 9,
    letterSpacing: 0.3,
  },
});
