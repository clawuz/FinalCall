import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Calendar from 'expo-calendar';
import * as WebBrowser from 'expo-web-browser';
import { Timestamp } from 'firebase/firestore';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing, Radius } from '@/constants/Theme';
import { useAwardsStore } from '@/store/awardsStore';
import { getCountdownDisplay } from '@/types';

function formatDate(ts: Timestamp): string {
  return ts.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const MONO = Platform.select({ ios: 'Courier', android: 'monospace' }) ?? 'Courier';

export default function AwardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const awards = useAwardsStore((s) => s.awards);
  const loading = useAwardsStore((s) => s.loading);
  const isTracking = useAwardsStore((s) => s.isTracking);
  const toggleTracking = useAwardsStore((s) => s.toggleTracking);

  const award = awards.find((a) => a.id === id);
  const tracking = award ? isTracking(award.id) : false;

  async function handleAddToCalendar() {
    if (!award) return;
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Takvime eklemek için takvim izni gerekiyor.');
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find((c) => c.allowsModifications) ?? calendars[0];
      if (!defaultCalendar) {
        Alert.alert('Hata', 'Kullanılabilir takvim bulunamadı.');
        return;
      }
      const deadline = award.deadlineDate.toDate();
      const startDate = new Date(deadline);
      startDate.setHours(9, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(10, 0, 0, 0);
      await Calendar.createEventAsync(defaultCalendar.id, {
        title: `📅 Son Gün: ${award.name} Başvurusu`,
        startDate,
        endDate,
        notes: `${award.name} başvuru son tarihi.\n\nBaşvuru: ${award.applicationUrl}${award.fee ? `\nÜcret: ${award.fee}` : ''}`,
        alarms: [{ relativeOffset: -1440 }, { relativeOffset: -60 }],
      });
      Alert.alert('✓ Takvime Eklendi', `${award.name} son başvuru tarihi takviminize eklendi.`);
    } catch {
      Alert.alert('Hata', 'Takvime eklenirken bir sorun oluştu.');
    }
  }

  async function handleOpenWebsite() {
    if (!award) return;
    await WebBrowser.openBrowserAsync(award.website, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
    });
  }

  async function handleApply() {
    if (!award) return;
    await WebBrowser.openBrowserAsync(award.applicationUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
  }

  // Loading
  if (loading && !award) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={Colors.violet} size="large" />
      </View>
    );
  }

  // Not found
  if (!award) {
    return (
      <View style={[styles.root, styles.center]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.notFoundText}>Ödül bulunamadı</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCenter}>
          <Text style={styles.backBtnCenterText}>← Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const countdown = getCountdownDisplay(award.deadlineDate);
  const isUrgent = countdown.urgency === 'critical';
  const countColor = isUrgent ? Colors.red : Colors.amber;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.orb1} />
        <View style={styles.orb2} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleTracking(award.id)}
            style={[styles.trackBtn, tracking && styles.trackBtnActive]}
          >
            <Text style={[styles.trackIcon, tracking && styles.trackIconActive]}>
              {tracking ? '★ Takipte' : '☆ Takip Et'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroRegion}>
              {award.region === 'TR' ? '🇹🇷' : '🌍'} {award.country}
            </Text>
            <Text style={styles.heroName}>{award.name}</Text>
            {award.nameEn && <Text style={styles.heroNameEn}>{award.nameEn}</Text>}
          </View>

          {/* Countdown */}
          <View style={[styles.countdownCard, isUrgent && styles.countdownCardUrgent]}>
            <Text style={styles.countdownLabel}>
              {isUrgent ? '⚠ Son Saatler' : 'Son Başvuruya'}
            </Text>
            <View style={styles.countdownRow}>
              <Text style={[styles.countdownNum, { color: countColor, fontFamily: MONO }]}>
                {countdown.value}
              </Text>
              <Text style={[styles.countdownUnit, { color: countColor }]}>
                {countdown.unit}{'\n'}kaldı
              </Text>
            </View>
            <Text style={styles.countdownDate}>{formatDate(award.deadlineDate)}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleApply} style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Başvur →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddToCalendar} style={styles.calBtn}>
              <Text style={styles.calBtnText}>📅 Takvime Ekle</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenWebsite} style={styles.webBtn}>
              <Text style={styles.webBtnText}>🌐</Text>
            </TouchableOpacity>
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TARİHLER</Text>
            <View style={styles.infoCard}>
              <InfoRow label="Başvuru Açılışı" value={formatDate(award.applicationOpenDate)} />
              {award.earlyBirdDate && (
                <InfoRow label="Erken Kayıt" value={formatDate(award.earlyBirdDate)} accent />
              )}
              <InfoRow label="Son Başvuru" value={formatDate(award.deadlineDate)} isLast />
            </View>
          </View>

          {/* Fee */}
          {award.fee && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BAŞVURU ÜCRETİ</Text>
              <View style={styles.infoCard}>
                <Text style={styles.feeText}>{award.fee}</Text>
              </View>
            </View>
          )}

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>KATEGORİLER</Text>
            <View style={styles.catGrid}>
              {award.categories.map((cat) => (
                <View key={cat} style={styles.catChip}>
                  <Text style={styles.catChipText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Requirements */}
          {award.applicationRequirements && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BAŞVURU ŞARTLARI</Text>
              <View style={styles.infoCard}>
                <Text style={styles.bodyText}>{award.applicationRequirements}</Text>
              </View>
            </View>
          )}

          {/* Description */}
          {award.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HAKKINDA</Text>
              <View style={styles.infoCard}>
                <Text style={styles.bodyText}>{award.description}</Text>
              </View>
            </View>
          )}

          {/* Past winners */}
          {award.pastWinners && (
            <View style={[styles.section, { marginBottom: 40 }]}>
              <Text style={styles.sectionTitle}>GEÇMİŞ KAZANANLAR</Text>
              <View style={styles.infoCard}>
                <Text style={styles.bodyText}>{award.pastWinners}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function InfoRow({ label, value, accent, isLast }: {
  label: string; value: string; accent?: boolean; isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, accent && styles.infoValueAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safeArea: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.muted, marginBottom: 16 },
  backBtnCenter: { paddingHorizontal: 20, paddingVertical: 10 },
  backBtnCenterText: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.violet },

  orb1: { position: 'absolute', borderRadius: 9999, width: 300, height: 300, top: -80, right: -80, backgroundColor: 'rgba(180,122,255,0.08)' },
  orb2: { position: 'absolute', borderRadius: 9999, width: 200, height: 200, bottom: 100, left: -60, backgroundColor: 'rgba(255,140,60,0.06)' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backIcon: { fontFamily: Fonts.regular, fontSize: 18, color: Colors.violet },
  backText: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.violet },
  trackBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  trackBtnActive: { backgroundColor: Colors.amberDim, borderColor: 'rgba(255,180,70,0.3)' },
  trackIcon: { fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.muted },
  trackIconActive: { color: Colors.amber },

  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },

  hero: { paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  heroRegion: { fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.muted, letterSpacing: 0.5, marginBottom: 8 },
  heroName: { fontFamily: Fonts.extraBold, fontSize: 32, color: Colors.white, letterSpacing: -1, lineHeight: 36, marginBottom: 4 },
  heroNameEn: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted, fontStyle: 'italic' },

  countdownCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.md, alignItems: 'center' },
  countdownCardUrgent: { backgroundColor: 'rgba(255,80,80,0.08)', borderColor: 'rgba(255,80,80,0.2)' },
  countdownLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  countdownRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 10 },
  countdownNum: { fontSize: 72, fontWeight: '700', lineHeight: 72, letterSpacing: -3 },
  countdownUnit: { fontFamily: Fonts.bold, fontSize: 14, lineHeight: 20, letterSpacing: 1 },
  countdownDate: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted },

  actions: { flexDirection: 'row', gap: 8, marginBottom: Spacing.xl },
  applyBtn: { flex: 1, backgroundColor: Colors.violet, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  applyBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
  calBtn: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  calBtnText: { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.dim },
  webBtn: { width: 50, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  webBtnText: { fontSize: 18 },

  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.muted, letterSpacing: 2, marginBottom: Spacing.sm },
  infoCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted },
  infoValue: { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.white },
  infoValueAccent: { color: Colors.amber },
  feeText: { fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.white, paddingHorizontal: Spacing.lg, paddingVertical: 14 },
  bodyText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.dim, lineHeight: 20, padding: Spacing.lg },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  catChipText: { fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.dim },
});
