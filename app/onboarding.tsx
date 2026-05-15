import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing } from '@/constants/Theme';
import { usePrefsStore } from '@/store/prefsStore';
import { registerForPushNotificationsAsync } from '@/services/notifications';

const STEPS = [
  {
    icon: '◈',
    iconColor: Colors.violet,
    title: 'Tüm ödüller\nbir arada',
    desc: 'Türkiye ve global marketing ödüllerini tek yerden takip et. Kristal Elma\'dan Cannes Lions\'a kadar.',
  },
  {
    icon: '⏰',
    iconColor: Colors.amber,
    title: 'Kaçırma,\nönceden bil',
    desc: '30 gün, 7 gün, 3 gün, son gün — her kritik noktada bildirim alırsın. Son günde saatlik hatırlatma.',
  },
  {
    icon: '★',
    iconColor: Colors.teal,
    title: 'Sana özel\ntakip listesi',
    desc: 'İlgilendiğin ödülleri favorile. Takip ettiğin ödüller için öncelikli bildirimler gelsin.',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const setOnboarded = usePrefsStore((s) => s.setOnboarded);
  const setPushToken = usePrefsStore((s) => s.setPushToken);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const handleNext = () => {
    if (!isLast) {
      setStep((s) => s + 1);
    } else {
      handlePermission();
    }
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

      {/* Aurora orbs */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
        <View style={[styles.orb, styles.orb3]} />
      </View>

      <SafeAreaView style={styles.safe}>
        {/* Skip */}
        <View style={styles.topBar}>
          <Text style={styles.logo}>
            Notif<Text style={styles.logoAccent}>Awards</Text>
          </Text>
          {!isLast && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Geç</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Step dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive, { backgroundColor: i === step ? current.iconColor : Colors.faint }]}
            />
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={[styles.iconWrap, { borderColor: `${current.iconColor}22`, backgroundColor: `${current.iconColor}10` }]}>
            <Text style={[styles.icon, { color: current.iconColor }]}>{current.icon}</Text>
          </View>

          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.desc}>{current.desc}</Text>

          {/* Illustration cards */}
          {step === 0 && <AwardIllustration />}
          {step === 1 && <NotifIllustration />}
          {step === 2 && <TrackingIllustration />}
        </View>

        {/* CTA */}
        <View style={styles.footer}>
          {isLast ? (
            <View style={styles.permissionWrap}>
              <Text style={styles.permissionLabel}>
                Bildirimlere izin vererek hiçbir ödülün son tarihini kaçırma.
              </Text>
              <TouchableOpacity
                style={[styles.ctaBtn, styles.ctaBtnPrimary]}
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
              style={styles.ctaBtn}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaBtnText}>Devam →</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function AwardIllustration() {
  const items = [
    { name: 'Kristal Elma', days: '47', region: '🇹🇷' },
    { name: 'Cannes Lions', days: '25', region: '🇫🇷' },
    { name: 'Clio Awards', days: '65', region: '🌍' },
  ];
  return (
    <View style={styles.illus}>
      {items.map((item, i) => (
        <View key={i} style={[styles.illusCard, { opacity: 1 - i * 0.2 }]}>
          <Text style={styles.illusRegion}>{item.region}</Text>
          <Text style={styles.illusName}>{item.name}</Text>
          <Text style={styles.illusDays}>{item.days}</Text>
        </View>
      ))}
    </View>
  );
}

function NotifIllustration() {
  const notifs = [
    { label: '30 gün kaldı', color: Colors.teal },
    { label: '7 gün kaldı', color: Colors.amber },
    { label: 'Son gün — 8 saat!', color: Colors.red },
  ];
  return (
    <View style={styles.illus}>
      {notifs.map((n, i) => (
        <View key={i} style={[styles.illusNotif, { borderColor: `${n.color}33` }]}>
          <View style={[styles.illusNotifDot, { backgroundColor: n.color }]} />
          <Text style={[styles.illusNotifText, { color: n.color }]}>{n.label}</Text>
        </View>
      ))}
    </View>
  );
}

function TrackingIllustration() {
  return (
    <View style={styles.illus}>
      <View style={styles.illusTrack}>
        <Text style={styles.illusTrackStar}>★</Text>
        <Text style={styles.illusTrackName}>Cannes Lions</Text>
        <Text style={styles.illusTrackDays}>25 gün</Text>
      </View>
      <View style={styles.illusTrack}>
        <Text style={styles.illusTrackStar}>★</Text>
        <Text style={styles.illusTrackName}>Kristal Elma</Text>
        <Text style={styles.illusTrackDays}>47 gün</Text>
      </View>
    </View>
  );
}

const MONO = Platform.select({ ios: 'Courier', android: 'monospace' }) ?? 'Courier';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { width: 350, height: 350, top: -150, left: -100, backgroundColor: 'rgba(180,122,255,0.12)' },
  orb2: { width: 280, height: 280, top: 100, right: -120, backgroundColor: 'rgba(255,140,60,0.08)' },
  orb3: { width: 220, height: 220, bottom: 100, left: -40, backgroundColor: 'rgba(60,200,180,0.07)' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  logo: { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.white },
  logoAccent: { color: Colors.violet },
  skipBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  skipText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted },

  dots: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.faint },
  dotActive: { width: 20, borderRadius: 3 },

  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, alignItems: 'center' },
  iconWrap: { width: 72, height: 72, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  icon: { fontSize: 32 },
  title: { fontFamily: Fonts.extraBold, fontSize: 32, color: Colors.white, letterSpacing: -1, textAlign: 'center', lineHeight: 38, marginBottom: Spacing.md },
  desc: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.dim, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xxl },

  // Illustrations
  illus: { width: '100%', gap: Spacing.sm },
  illusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingHorizontal: Spacing.lg, paddingVertical: 10,
  },
  illusRegion: { fontSize: 16 },
  illusName: { flex: 1, fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.white },
  illusDays: { fontFamily: MONO, fontSize: 22, fontWeight: '700', color: Colors.amber },
  illusNotif: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderWidth: 1,
    borderRadius: 14, paddingHorizontal: Spacing.lg, paddingVertical: 12,
  },
  illusNotifDot: { width: 8, height: 8, borderRadius: 4 },
  illusNotifText: { fontFamily: Fonts.semiBold, fontSize: 14 },
  illusTrack: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingHorizontal: Spacing.lg, paddingVertical: 12,
  },
  illusTrackStar: { fontSize: 16, color: Colors.amber },
  illusTrackName: { flex: 1, fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.white },
  illusTrackDays: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted },

  // Footer
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  permissionWrap: { gap: Spacing.md },
  permissionLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 18 },
  ctaBtn: {
    backgroundColor: Colors.violetDim, borderWidth: 1, borderColor: 'rgba(180,122,255,0.3)',
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  ctaBtnPrimary: { backgroundColor: Colors.violet, borderColor: Colors.violet },
  ctaBtnText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white, letterSpacing: 0.3 },
  skipBtnFooter: { alignItems: 'center', paddingVertical: 8 },
  skipBtnFooterText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted },
});
