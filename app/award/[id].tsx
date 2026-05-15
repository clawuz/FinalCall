import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Calendar from 'expo-calendar';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing, Radius } from '@/constants/Theme';
import type { Region } from '@/types';

// Mock veri — Firestore bağlantısı sonra gelecek
const MOCK_AWARD_DETAIL = {
  id: '2',
  name: 'Cannes Lions',
  nameEn: 'Cannes Lions International Festival of Creativity',
  region: 'Global' as Region,
  country: 'Fransa',
  categories: ['Film', 'Print', 'Outdoor', 'Digital', 'PR', 'Innovation', 'Design', 'Craft'],
  applicationOpenDate: new Date(2025, 0, 20),
  deadlineDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  earlyBirdDate: new Date(2025, 2, 28),
  applicationUrl: 'https://www.canneslions.com/enter',
  website: 'https://www.canneslions.com',
  applicationRequirements: 'Başvurular İngilizce yapılmalıdır. Çalışmanın yayınlanmış olması zorunludur. Son 12 ay içinde yayınlanan çalışmalar kabul edilir.',
  fee: '€500 - €2.500 / kategori',
  description: 'Dünyanın en prestijli yaratıcı iletişim festivali. Her yıl Haziran ayında Cannes\'da düzenlenir.',
  pastWinners: 'Türkiye\'den geçmiş yıllarda Leo Burnett, TBWA\\Istanbul, Grey Istanbul, Havas Istanbul ödül kazanmıştır.',
};

// Yardımcı
function getCountdownDetail(deadline: Date): { value: string; unit: string; isUrgent: boolean; hoursLeft: number } {
  const ms = deadline.getTime() - Date.now();
  const hours = Math.max(0, Math.ceil(ms / (1000 * 60 * 60)));
  const days = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  const isUrgent = hours <= 24;
  return {
    value: isUrgent ? String(hours).padStart(2, '0') : String(days),
    unit: isUrgent ? 'saat' : 'gün',
    isUrgent,
    hoursLeft: hours,
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const MONO = Platform.select({ ios: 'Courier', android: 'monospace' }) ?? 'Courier';

export default function AwardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isTracking, setIsTracking] = useState(false);
  const award = MOCK_AWARD_DETAIL; // Sonradan store'dan gelecek

  const { value, unit, isUrgent } = getCountdownDetail(award.deadlineDate);
  const countColor = isUrgent ? Colors.red : Colors.amber;

  // Takvime ekle
  async function handleAddToCalendar() {
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

      const deadline = award.deadlineDate;
      const startDate = new Date(deadline);
      startDate.setHours(9, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(10, 0, 0, 0);

      await Calendar.createEventAsync(defaultCalendar.id, {
        title: `📅 Son Gün: ${award.name} Başvurusu`,
        startDate,
        endDate,
        notes: `${award.name} başvuru son tarihi.\n\nBaşvuru linki: ${award.applicationUrl}\nÜcret: ${award.fee ?? 'Belirtilmemiş'}`,
        alarms: [
          { relativeOffset: -1440 }, // 1 gün önce
          { relativeOffset: -60 },   // 1 saat önce
        ],
      });

      Alert.alert('✓ Takvime Eklendi', `${award.name} son başvuru tarihi takviminize eklendi.`);
    } catch (error) {
      Alert.alert('Hata', 'Takvime eklenirken bir sorun oluştu.');
    }
  }

  // Web sitesi aç
  async function handleOpenWebsite() {
    await WebBrowser.openBrowserAsync(award.website, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
    });
  }

  // Başvuru linki aç
  async function handleApply() {
    await WebBrowser.openBrowserAsync(award.applicationUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Aurora orbs */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.orb1} />
        <View style={styles.orb2} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Geri butonu */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsTracking((v) => !v)}
            style={[styles.trackBtn, isTracking && styles.trackBtnActive]}
          >
            <Text style={[styles.trackIcon, isTracking && styles.trackIconActive]}>
              {isTracking ? '★ Takipte' : '☆ Takip Et'}
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
              <Text style={[styles.countdownNum, { color: countColor, fontFamily: MONO }]}>{value}</Text>
              <Text style={[styles.countdownUnit, { color: countColor }]}>
                {unit}{'\n'}kaldı
              </Text>
            </View>
            <Text style={styles.countdownDate}>{formatDate(award.deadlineDate)}</Text>
          </View>

          {/* Aksiyon butonları */}
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

          {/* Tarihler */}
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

          {/* Ücret */}
          {award.fee && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BAŞVURU ÜCRETİ</Text>
              <View style={styles.infoCard}>
                <Text style={styles.feeText}>{award.fee}</Text>
              </View>
            </View>
          )}

          {/* Kategoriler */}
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

          {/* Başvuru şartları */}
          {award.applicationRequirements && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BAŞVURU ŞARTLARI</Text>
              <View style={styles.infoCard}>
                <Text style={styles.bodyText}>{award.applicationRequirements}</Text>
              </View>
            </View>
          )}

          {/* Açıklama */}
          {award.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HAKKINDA</Text>
              <View style={styles.infoCard}>
                <Text style={styles.bodyText}>{award.description}</Text>
              </View>
            </View>
          )}

          {/* Geçmiş kazananlar */}
          {award.pastWinners && (
            <View style={[styles.section, { marginBottom: 40 }]}>
              <Text style={styles.sectionTitle}>GEÇMIŞ KAZANANLAR</Text>
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
  orb1: {
    position: 'absolute', borderRadius: 9999,
    width: 300, height: 300, top: -80, right: -80,
    backgroundColor: 'rgba(180,122,255,0.08)',
  },
  orb2: {
    position: 'absolute', borderRadius: 9999,
    width: 200, height: 200, bottom: 100, left: -60,
    backgroundColor: 'rgba(255,140,60,0.06)',
  },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backIcon: { fontFamily: Fonts.regular, fontSize: 18, color: Colors.violet },
  backText: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.violet },
  trackBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  trackBtnActive: {
    backgroundColor: Colors.amberDim, borderColor: 'rgba(255,180,70,0.3)',
  },
  trackIcon: { fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.muted },
  trackIconActive: { color: Colors.amber },

  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },

  // Hero
  hero: { paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  heroRegion: {
    fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.muted,
    letterSpacing: 0.5, marginBottom: 8,
  },
  heroName: {
    fontFamily: Fonts.extraBold, fontSize: 32, color: Colors.white,
    letterSpacing: -1, lineHeight: 36, marginBottom: 4,
  },
  heroNameEn: {
    fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted, fontStyle: 'italic',
  },

  // Countdown
  countdownCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.md,
    alignItems: 'center',
  },
  countdownCardUrgent: {
    backgroundColor: 'rgba(255,80,80,0.08)', borderColor: 'rgba(255,80,80,0.2)',
  },
  countdownLabel: {
    fontFamily: Fonts.bold, fontSize: 10, color: Colors.muted,
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
  },
  countdownRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 10,
  },
  countdownNum: {
    fontSize: 72, fontWeight: '700',
    lineHeight: 72, letterSpacing: -3,
  },
  countdownUnit: {
    fontFamily: Fonts.bold, fontSize: 14, lineHeight: 20, letterSpacing: 1,
  },
  countdownDate: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted },

  // Actions
  actions: {
    flexDirection: 'row', gap: 8, marginBottom: Spacing.xl,
  },
  applyBtn: {
    flex: 1, backgroundColor: Colors.violet, borderRadius: Radius.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  applyBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
  calBtn: {
    flex: 1, backgroundColor: Colors.surface, borderWidth: 1,
    borderColor: Colors.border, borderRadius: Radius.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  calBtnText: { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.dim },
  webBtn: {
    width: 50, backgroundColor: Colors.surface, borderWidth: 1,
    borderColor: Colors.border, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  webBtnText: { fontSize: 18 },

  // Sections
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontFamily: Fonts.bold, fontSize: 9, color: Colors.muted,
    letterSpacing: 2, marginBottom: Spacing.sm,
  },
  infoCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted },
  infoValue: { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.white },
  infoValueAccent: { color: Colors.amber },
  feeText: {
    fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.white,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
  },
  bodyText: {
    fontFamily: Fonts.regular, fontSize: 13, color: Colors.dim,
    lineHeight: 20, padding: Spacing.lg,
  },

  // Categories
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  catChipText: { fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.dim },
});
