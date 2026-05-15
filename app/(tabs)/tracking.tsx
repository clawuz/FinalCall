import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing, Radius } from '@/constants/Theme';
import { useAwardsStore } from '@/store/awardsStore';
import { getDaysLeft, getHoursLeft } from '@/types';

const MONO = Platform.select({ ios: 'Courier', android: 'monospace' }) ?? 'Courier';

export default function TrackingScreen() {
  const awards = useAwardsStore((s) => s.awards);
  const trackedIdsList = useAwardsStore((s) => s.trackedIdsList);
  const toggleTracking = useAwardsStore((s) => s.toggleTracking);

  const tracked = awards.filter(
    (a) => trackedIdsList.includes(a.id) && a.deadlineDate.toMillis() > Date.now()
  ).sort((a, b) => a.deadlineDate.toMillis() - b.deadlineDate.toMillis());

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerSub}>listem</Text>
          <Text style={styles.headerTitle}>
            Takip <Text style={styles.headerAccent}>Ediyor</Text>
          </Text>
          {tracked.length > 0 && (
            <Text style={styles.headerCount}>{tracked.length} ödül takipte</Text>
          )}
        </View>

        {tracked.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>☆</Text>
            <Text style={styles.emptyTitle}>Henüz takip etmiyorsun</Text>
            <Text style={styles.emptyDesc}>Ana ekranda ★ butonuna basarak ödülleri takip listene ekle.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {tracked.map((award) => {
              const hoursLeft = getHoursLeft(award.deadlineDate);
              const daysLeft = getDaysLeft(award.deadlineDate);
              const isUrgent = hoursLeft <= 72;
              const displayValue = hoursLeft <= 24
                ? String(hoursLeft).padStart(2, '0')
                : String(daysLeft);
              const displayUnit = hoursLeft <= 24 ? 'SAAT' : 'GÜN';

              return (
                <TouchableOpacity
                  key={award.id}
                  onPress={() => router.push(`/award/${award.id}` as never)}
                  style={[styles.card, isUrgent && styles.cardUrgent]}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardRegion}>
                      {award.region === 'TR' ? '🇹🇷' : '🌍'} {award.country}
                    </Text>
                    <Text style={styles.cardName}>{award.name}</Text>
                    <View style={styles.cats}>
                      {award.categories.slice(0, 3).map((c) => (
                        <Text key={c} style={styles.cat}>{c}</Text>
                      ))}
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.days, isUrgent && styles.daysUrgent]}>{displayValue}</Text>
                    <Text style={styles.daysUnit}>{displayUnit}</Text>
                    <TouchableOpacity
                      onPress={() => toggleTracking(award.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.trackIcon, isUrgent && styles.trackIconUrgent]}>★</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  headerSub: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontFamily: Fonts.extraBold, fontSize: 24, color: Colors.white, letterSpacing: -0.5, marginBottom: 4 },
  headerAccent: { color: Colors.violet },
  headerCount: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  cardUrgent: { backgroundColor: 'rgba(255,80,80,0.04)', borderColor: 'rgba(255,80,80,0.2)' },
  cardLeft: { flex: 1 },
  cardRegion: { fontFamily: Fonts.regular, fontSize: 9, color: Colors.muted, marginBottom: 3 },
  cardName: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.white, marginBottom: 6 },
  cats: { flexDirection: 'row', gap: 5 },
  cat: { fontFamily: Fonts.regular, fontSize: 9, color: Colors.muted, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  cardRight: { alignItems: 'flex-end', gap: 3 },
  days: { fontFamily: MONO, fontSize: 36, fontWeight: '700', color: Colors.violet, lineHeight: 36 },
  daysUrgent: { color: Colors.red },
  daysUnit: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.muted, letterSpacing: 1.5 },
  trackIcon: { fontSize: 14, color: Colors.violet, marginTop: 4 },
  trackIconUrgent: { color: Colors.red },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, color: Colors.muted, marginBottom: 16 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.white, marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 20 },
});
