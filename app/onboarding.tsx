// app/onboarding.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Animated,
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
