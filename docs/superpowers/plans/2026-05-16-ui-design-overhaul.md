# UI Design Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Final Call into a premium, "wow"-quality app for advertising professionals — per-award color theming, dramatic glow animations, ultra-premium tab bar symbols, and polished onboarding.

**Architecture:** Each visual concern is isolated — `constants/AwardColors.ts` owns the color map, `components/AwardCard.tsx` owns card rendering with animations, `components/TabBar.tsx` is a custom tab bar component. The `Award` type gets a new optional `color` field. Changes flow outward: constants → components → screens.

**Tech Stack:** React Native (Expo SDK 54), `react-native` Animated API, Expo Router, TypeScript, Firestore (for `color` field on award documents), Outfit font family already loaded.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `constants/AwardColors.ts` | **Create** | Color map: name → hex + rgb |
| `types/index.ts` | **Modify** | Add `color` field to `Award` interface |
| `components/AwardCard.tsx` | **Rewrite** | Liquid Gold card: per-color border/glow, scan line, glow pulse |
| `components/CountdownNumber.tsx` | **Rewrite** | Count-up animation on mount, glow pulse |
| `components/TabBar.tsx` | **Create** | Custom tab bar with ✦ ◉ ◆ ⊡ ⊛ and per-tab color glows |
| `components/ParticleBurst.tsx` | **Create** | Particle animation for "Takibe Al" |
| `app/(tabs)/_layout.tsx` | **Modify** | Wire custom TabBar, update tab icon data |
| `app/(tabs)/index.tsx` | **Modify** | Use new AwardCard, wire ParticleBurst on track toggle |
| `app/onboarding.tsx` | **Rewrite** | Float animation, animated pill dots, slide+fade transitions, per-screen colors |
| `scripts/seed.ts` | **Modify** | Add `color` field to seeded award documents |

---

## Task 1: Award Color Constants

**Files:**
- Create: `constants/AwardColors.ts`

- [ ] **Step 1: Create the color map**

```typescript
// constants/AwardColors.ts
export type AwardColorKey = 'amber' | 'violet' | 'teal' | 'red' | 'gold' | 'blue';

export interface AwardColorDef {
  hex: string;
  rgb: string;       // "r,g,b" for rgba() usage
  light: string;     // lighter variant for gradients
}

export const AWARD_COLORS: Record<AwardColorKey, AwardColorDef> = {
  amber:  { hex: '#FFB347', rgb: '255,179,71',  light: '#FFD080' },
  violet: { hex: '#B47AFF', rgb: '180,122,255', light: '#D4AAFF' },
  teal:   { hex: '#4DCDBE', rgb: '77,205,190',  light: '#90EDE6' },
  red:    { hex: '#FF5A5A', rgb: '255,90,90',   light: '#FF9090' },
  gold:   { hex: '#FFC832', rgb: '255,200,50',  light: '#FFE080' },
  blue:   { hex: '#64B4FF', rgb: '100,180,255', light: '#A0D0FF' },
};

export const DEFAULT_AWARD_COLOR: AwardColorKey = 'amber';

export function resolveAwardColor(key?: string | null): AwardColorDef {
  if (key && key in AWARD_COLORS) return AWARD_COLORS[key as AwardColorKey];
  return AWARD_COLORS[DEFAULT_AWARD_COLOR];
}
```

- [ ] **Step 2: Commit**

```bash
git add constants/AwardColors.ts
git commit -m "feat: award color constants (amber/violet/teal/red/gold/blue)"
```

---

## Task 2: Add `color` to Award Type and Seeds

**Files:**
- Modify: `types/index.ts` (line 6–25)
- Modify: `scripts/seed.ts`

- [ ] **Step 1: Add `color` field to Award interface in `types/index.ts`**

Find the `Award` interface and add one line after `description?`:

```typescript
export interface Award {
  id: string;
  name: string;
  nameEn?: string;
  region: Region;
  country: string;
  categories: string[];
  applicationOpenDate: Timestamp;
  deadlineDate: Timestamp;
  earlyBirdDate?: Timestamp;
  applicationUrl: string;
  website: string;
  applicationRequirements?: string;
  fee?: string;
  logoUrl?: string;
  description?: string;
  color?: string;   // AwardColorKey — resolved via resolveAwardColor()
  pastWinners?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

- [ ] **Step 2: Add `color` to seed data in `scripts/seed.ts`**

Open `scripts/seed.ts`. Find each award object and add a `color` field using the mapping below:

| Award | color |
|-------|-------|
| Kristal Elma | `'teal'` |
| Cannes Lions | `'amber'` |
| D&AD Awards | `'violet'` |
| Clio Awards | `'red'` |
| Effie Awards | `'gold'` |
| Webby Awards | `'blue'` |
| One Show | `'violet'` |
| Any others | `'amber'` |

Add `color: 'teal'` (or appropriate key) alongside `isActive`, `createdAt`, etc. in each award object.

- [ ] **Step 3: Commit**

```bash
git add types/index.ts scripts/seed.ts
git commit -m "feat: add color field to Award type and seed data"
```

---

## Task 3: AwardCard — Liquid Gold Redesign

**Files:**
- Rewrite: `components/AwardCard.tsx`

This replaces the placeholder AwardCard component entirely. The home screen (`app/(tabs)/index.tsx`) has its own inline `AwardCard` — that one will be replaced in Task 6. This component will be the shared, reusable version.

- [ ] **Step 1: Write new AwardCard component**

```typescript
// components/AwardCard.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing } from '@/constants/Theme';
import { Award, getCountdownDisplay } from '@/types';
import { resolveAwardColor } from '@/constants/AwardColors';

const MONO = Platform.select({ ios: 'Courier', android: 'monospace' }) ?? 'Courier';

interface AwardCardProps {
  award: Award;
  isTracking: boolean;
  onTrackToggle: (id: string) => void;
  onPress: () => void;
  showParticleBurst?: boolean;
}

function getRegionFlag(region: string, country: string): string {
  if (region === 'TR') return '🇹🇷';
  const flags: Record<string, string> = {
    'Fransa': '🇫🇷', 'İngiltere': '🇬🇧', 'ABD': '🇺🇸',
    'Almanya': '🇩🇪', 'Dubai': '🇦🇪', 'Avrupa': '🇪🇺',
  };
  return flags[country] ?? '🌍';
}

export default function AwardCard({ award, isTracking, onTrackToggle, onPress }: AwardCardProps) {
  const colorDef = resolveAwardColor(award.color);
  const countdown = getCountdownDisplay(award.deadlineDate);

  // Scan line animation
  const scanAnim = useRef(new Animated.Value(0)).current;
  // Glow pulse
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Scan line: loops from 0→1 over 4s
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: false,
      })
    ).start();

    // Glow pulse: 0.3→0.7→0.3 every 3s
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.7, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.3, 0.7],
    outputRange: [0.3, 0.7],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          borderColor: `rgba(${colorDef.rgb}, 0.2)`,
          backgroundColor: `rgba(${colorDef.rgb}, 0.05)`,
          shadowColor: colorDef.hex,
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        },
      ]}
    >
      {/* Scan line overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.scanLine,
          {
            opacity: scanAnim.interpolate({
              inputRange: [0, 0.4, 0.6, 1],
              outputRange: [0, 0.6, 0.6, 0],
            }),
            transform: [
              {
                translateX: scanAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-300, 300],
                }),
              },
            ],
          },
        ]}
      />

      <View style={styles.top}>
        <View style={styles.left}>
          <Text style={styles.region}>
            {getRegionFlag(award.region, award.country)} {award.country.toUpperCase()}
          </Text>
          <Text style={styles.name}>{award.name}</Text>
        </View>
        <View style={styles.right}>
          <Animated.Text
            style={[
              styles.num,
              {
                color: colorDef.hex,
                textShadowColor: `rgba(${colorDef.rgb}, ${glowOpacity})`,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 12,
              },
            ]}
          >
            {countdown.value}
          </Animated.Text>
          <Text style={[styles.unit, { color: `rgba(${colorDef.rgb}, 0.5)` }]}>
            {countdown.unit.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          onPress={() => onTrackToggle(award.id)}
          style={[
            styles.trackBtn,
            isTracking && {
              backgroundColor: `rgba(${colorDef.rgb}, 0.15)`,
              borderColor: `rgba(${colorDef.rgb}, 0.35)`,
            },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.trackIcon, isTracking && { color: colorDef.hex }]}>
            {isTracking ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  scanLine: {
    width: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  left: { flex: 1, paddingRight: 12 },
  region: {
    fontFamily: Fonts.semiBold,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.white,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  right: { alignItems: 'flex-end' },
  num: {
    fontFamily: MONO,
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 44,
    letterSpacing: -2,
  },
  unit: {
    fontFamily: Fonts.semiBold,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 2,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  trackBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackIcon: { fontSize: 12, color: Colors.muted },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/okilavuz/Desktop/omer_works/NotifAwards && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to AwardCard.

- [ ] **Step 3: Commit**

```bash
git add components/AwardCard.tsx
git commit -m "feat: AwardCard — Liquid Gold design with scan line and glow pulse"
```

---

## Task 4: Custom Tab Bar

**Files:**
- Create: `components/TabBar.tsx`
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create custom TabBar component**

```typescript
// components/TabBar.tsx
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
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
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          from: 0.85,
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
```

- [ ] **Step 2: Wire TabBar in `app/(tabs)/_layout.tsx`**

Replace the entire file with:

```typescript
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
```

- [ ] **Step 3: Check TypeScript**

```bash
cd /Users/okilavuz/Desktop/omer_works/NotifAwards && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/TabBar.tsx app/(tabs)/_layout.tsx
git commit -m "feat: custom tab bar with ✦◉◆⊡⊛ icons and per-tab color glows"
```

---

## Task 5: Particle Burst Component

**Files:**
- Create: `components/ParticleBurst.tsx`

- [ ] **Step 1: Create particle burst component**

```typescript
// components/ParticleBurst.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ParticleProps {
  color: string;
  angle: number;
  anim: Animated.Value;
}

function Particle({ color, angle, anim }: ParticleProps) {
  const distance = 40 + Math.random() * 20;
  const size = 4 + Math.random() * 4;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
          transform: [
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.cos(angle) * distance],
              }),
            },
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.sin(angle) * distance],
              }),
            },
          ],
        },
      ]}
    />
  );
}

interface ParticleBurstProps {
  color: string;
  trigger: boolean;
}

export default function ParticleBurst({ color, trigger }: ParticleBurstProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true;
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        hasTriggered.current = false;
      });
    }
  }, [trigger]);

  const PARTICLE_COUNT = 8;
  const angles = Array.from({ length: PARTICLE_COUNT }, (_, i) => (i / PARTICLE_COUNT) * Math.PI * 2);

  return (
    <View style={styles.container} pointerEvents="none">
      {angles.map((angle, i) => (
        <Particle key={i} color={color} angle={angle} anim={anim} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 0,
    height: 0,
  },
  particle: {
    position: 'absolute',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/ParticleBurst.tsx
git commit -m "feat: ParticleBurst component for track-toggle animation"
```

---

## Task 6: Home Screen — Wire New AwardCard + ParticleBurst

**Files:**
- Modify: `app/(tabs)/index.tsx`

The home screen currently has an inline `AwardCard`. Replace it with the new component from Task 3, and wire `ParticleBurst` on the track toggle.

- [ ] **Step 1: Update imports at top of `app/(tabs)/index.tsx`**

Replace the file's `AwardCard` inline component and add these imports:

```typescript
import AwardCard from '@/components/AwardCard';
import ParticleBurst from '@/components/ParticleBurst';
import { resolveAwardColor } from '@/constants/AwardColors';
```

- [ ] **Step 2: Add particle burst state and handler in `AwardsScreen`**

Inside `AwardsScreen`, add after the existing store selectors:

```typescript
const [burstAwardId, setBurstAwardId] = React.useState<string | null>(null);

const handleTrackToggle = (id: string) => {
  if (!isTracking(id)) {
    setBurstAwardId(id);
    setTimeout(() => setBurstAwardId(null), 700);
  }
  toggleTracking(id);
};
```

- [ ] **Step 3: Replace inline `AwardCard` usage in the ScrollView**

Find the `{nonUrgentAwards.map((award) => (` block and replace:

```tsx
{nonUrgentAwards.map((award) => {
  const colorDef = resolveAwardColor(award.color);
  return (
    <View key={award.id} style={{ position: 'relative' }}>
      <AwardCard
        award={award}
        isTracking={isTracking(award.id)}
        onTrackToggle={handleTrackToggle}
        onPress={() => router.push(`/award/${award.id}` as never)}
      />
      <ParticleBurst
        color={colorDef.hex}
        trigger={burstAwardId === award.id}
      />
    </View>
  );
})}
```

- [ ] **Step 4: Remove the inline `AwardCard` function definition** (lines ~58–110 in current file) since it's now imported.

- [ ] **Step 5: Check TypeScript**

```bash
cd /Users/okilavuz/Desktop/omer_works/NotifAwards && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: home screen — new AwardCard + ParticleBurst on track toggle"
```

---

## Task 7: Onboarding — Float Animation, Pill Dots, Slide Transitions

**Files:**
- Rewrite: `app/onboarding.tsx`

- [ ] **Step 1: Rewrite `app/onboarding.tsx`**

Replace the entire file:

```typescript
// app/onboarding.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing } from '@/constants/Theme';
import { usePrefsStore } from '@/store/prefsStore';
import { registerForPushNotificationsAsync } from '@/services/notifications';

const STEPS = [
  {
    icon: '✦',
    color: '#FFB347',
    rgb: '255,179,71',
    title: 'Tüm ödüller\nbir arada',
    desc: 'Türkiye ve global marketing ödüllerini tek yerden takip et. Kristal Elma\'dan Cannes Lions\'a kadar.',
  },
  {
    icon: '◆',
    color: '#4DCDBE',
    rgb: '77,205,190',
    title: 'Kaçırma,\nönceden bil',
    desc: '30 gün, 7 gün, 3 gün, son gün — her kritik noktada bildirim alırsın. Son günde saatlik hatırlatma.',
  },
  {
    icon: '◉',
    color: '#B47AFF',
    rgb: '180,122,255',
    title: 'Sana özel\ntakip listesi',
    desc: 'İlgilendiğin ödülleri favorile. Takip ettiğin ödüller için öncelikli bildirimler gelsin.',
  },
];

function FloatingIcon({ icon, color, rgb }: { icon: string; color: string; rgb: string }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <Animated.View
      style={[
        styles.iconWrap,
        {
          borderColor: `rgba(${rgb},0.25)`,
          backgroundColor: `rgba(${rgb},0.10)`,
          shadowColor: color,
          shadowOpacity: 0.3,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 0 },
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={[styles.icon, { color }]}>{icon}</Text>
    </Animated.View>
  );
}

function AnimatedDots({ total, current, colors }: { total: number; current: number; colors: string[] }) {
  const widths = useRef(
    Array.from({ length: total }, (_, i) => new Animated.Value(i === 0 ? 20 : 6))
  ).current;

  useEffect(() => {
    widths.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i === current ? 20 : 6,
        damping: 12,
        stiffness: 180,
        useNativeDriver: false,
      }).start();
    });
  }, [current]);

  return (
    <View style={styles.dots}>
      {widths.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              width: anim,
              backgroundColor: i === current ? colors[current] : Colors.faint,
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const setOnboarded = usePrefsStore((s) => s.setOnboarded);
  const setPushToken = usePrefsStore((s) => s.setPushToken);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const goToStep = (next: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 14, stiffness: 160, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (!isLast) goToStep(step + 1);
    else handlePermission();
  };

  const handlePermission = async () => {
    setRequesting(true);
    const token = await registerForPushNotificationsAsync();
    if (token) setPushToken(token);
    setOnboarded();
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    setOnboarded();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={[styles.orb, styles.orb1, { backgroundColor: `rgba(${current.rgb},0.10)` }]} />
        <View style={[styles.orb, styles.orb2]} />
        <View style={[styles.orb, styles.orb3]} />
      </View>

      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Text style={styles.logo}>
            Final<Text style={[styles.logoAccent, { color: current.color }]}> Call</Text>
          </Text>
          {!isLast && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Geç</Text>
            </TouchableOpacity>
          )}
        </View>

        <AnimatedDots
          total={STEPS.length}
          current={step}
          colors={STEPS.map((s) => s.color)}
        />

        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <FloatingIcon icon={current.icon} color={current.color} rgb={current.rgb} />
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.desc}>{current.desc}</Text>
        </Animated.View>

        <View style={styles.footer}>
          {isLast ? (
            <View style={styles.permissionWrap}>
              <Text style={styles.permissionLabel}>
                Bildirimlere izin vererek hiçbir ödülün son tarihini kaçırma.
              </Text>
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: current.color, borderColor: current.color }]}
                onPress={handlePermission}
                disabled={requesting}
                activeOpacity={0.85}
              >
                {requesting ? (
                  <ActivityIndicator color={Colors.bg} size="small" />
                ) : (
                  <Text style={styles.ctaBtnText}>🔔  Bildirimlere İzin Ver</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSkip} style={styles.skipBtnFooter}>
                <Text style={styles.skipBtnFooterText}>Şimdi değil</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: `rgba(${current.rgb},0.15)`, borderColor: `rgba(${current.rgb},0.3)` }]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaBtnText, { color: current.color }]}>Devam →</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { width: 350, height: 350, top: -150, left: -100 },
  orb2: { width: 280, height: 280, top: 100, right: -120, backgroundColor: 'rgba(255,140,60,0.05)' },
  orb3: { width: 220, height: 220, bottom: 100, left: -40, backgroundColor: 'rgba(60,200,180,0.05)' },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md,
  },
  logo: { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.white },
  logoAccent: {},
  skipBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  skipText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted },

  dots: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  dot: { height: 6, borderRadius: 3 },

  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, alignItems: 'center' },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
  },
  icon: { fontSize: 36 },
  title: {
    fontFamily: Fonts.extraBold, fontSize: 34, color: Colors.white,
    letterSpacing: -1, textAlign: 'center', lineHeight: 40, marginBottom: Spacing.md,
  },
  desc: {
    fontFamily: Fonts.regular, fontSize: 15, color: Colors.dim,
    textAlign: 'center', lineHeight: 22,
  },

  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  permissionWrap: { gap: Spacing.md },
  permissionLabel: {
    fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted,
    textAlign: 'center', lineHeight: 18,
  },
  ctaBtn: {
    borderWidth: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  ctaBtnText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white, letterSpacing: 0.3 },
  skipBtnFooter: { alignItems: 'center', paddingVertical: 8 },
  skipBtnFooterText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted },
});
```

- [ ] **Step 2: Check TypeScript**

```bash
cd /Users/okilavuz/Desktop/omer_works/NotifAwards && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/onboarding.tsx
git commit -m "feat: onboarding — float icons, animated pill dots, slide+fade transitions"
```

---

## Task 8: Verify on Simulator

- [ ] **Step 1: Start Metro and open simulator**

```bash
cd /Users/okilavuz/Desktop/omer_works/NotifAwards
pkill -9 -f "expo|metro|node" 2>/dev/null; sleep 1
REACT_NATIVE_PACKAGER_HOSTNAME=localhost npx expo start --port 8081 --clear
```

Press `i` to open iOS Simulator.

- [ ] **Step 2: Verify tab bar**

- All 5 tabs show: ✦ ◉ ◆ ⊡ ⊛
- Tapping each tab shows the correct glow color (Amber / Teal / Violet / Blue / Rose)
- Icon animates with scale spring on selection

- [ ] **Step 3: Verify award cards**

- Each card has colored border and glow matching its `color` field
- Countdown number pulses with glow
- Scan line sweeps across card
- Tapping the ☆ → ★ on a non-tracked award triggers particle burst

- [ ] **Step 4: Reset onboarding and verify**

```bash
xcrun simctl uninstall D4BFA3E0-8DDE-4A58-93AF-2C20E6B4FDC0 com.notifawards.app
```

Then rebuild:
```bash
REACT_NATIVE_PACKAGER_HOSTNAME=localhost npx expo run:ios --device "iPhone 17 Pro"
```

- Floating icon bobs up and down
- Step dots animate between sizes/colors
- Slide+fade transition between steps
- Logo accent color matches current step
- CTA button uses current step's color

- [ ] **Step 5: Final commit if any fixups were made**

```bash
git add -A
git commit -m "fix: simulator review fixups"
```

---

## Task 9: Update exports in `components/index.ts`

**Files:**
- Modify: `components/index.ts`

- [ ] **Step 1: Add new components to barrel export**

Read `components/index.ts` first, then add:

```typescript
export { default as TabBar } from './TabBar';
export { default as ParticleBurst } from './ParticleBurst';
```

(Keep all existing exports.)

- [ ] **Step 2: Commit**

```bash
git add components/index.ts
git commit -m "chore: export TabBar and ParticleBurst from components index"
```
