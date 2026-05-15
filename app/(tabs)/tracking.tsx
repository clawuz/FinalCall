import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing, Radius } from '@/constants/Theme';

const TRACKED = [
  { id: '2', name: 'Cannes Lions', region: 'Global', country: 'Fransa', categories: ['Film', 'OOH'], deadlineDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  { id: '4', name: 'Kristal Elma', region: 'TR', country: 'Türkiye', categories: ['Reklam', 'PR'], deadlineDate: new Date(Date.now() + 47 * 24 * 60 * 60 * 1000) },
];

function getDaysLeft(d: Date) {
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function TrackingScreen() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerSub}>listem</Text>
          <Text style={styles.headerTitle}>
            Takip <Text style={styles.headerAccent}>Ediyor</Text>
          </Text>
          <Text style={styles.headerCount}>{TRACKED.length} ödül takipte</Text>
        </View>

        {TRACKED.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>☆</Text>
            <Text style={styles.emptyTitle}>Henüz takip etmiyorsun</Text>
            <Text style={styles.emptyDesc}>Ana ekranda ★ butonuna basarak ödülleri takip listene ekle.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {TRACKED.map((award) => {
              const days = getDaysLeft(award.deadlineDate);
              const isUrgent = days <= 3;
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
                      {award.categories.map((c) => (
                        <Text key={c} style={styles.cat}>{c}</Text>
                      ))}
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.days, isUrgent && styles.daysUrgent]}>{days}</Text>
                    <Text style={styles.daysUnit}>GÜN</Text>
                    <View style={[styles.trackDot, isUrgent && styles.trackDotUrgent]} />
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

const MONO = 'Courier';

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
  trackDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.violet, marginTop: 4 },
  trackDotUrgent: { backgroundColor: Colors.red },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, color: Colors.muted, marginBottom: 16 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.white, marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 20 },
});
