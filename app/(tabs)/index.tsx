import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing } from '@/constants/Theme';
import { useAwardsStore } from '@/store/awardsStore';
import { Award, getCountdownDisplay } from '@/types';

type FilterType = 'all' | 'TR' | 'Global' | 'tracking';

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'Tümü', value: 'all' },
  { label: 'Türkiye', value: 'TR' },
  { label: 'Global', value: 'Global' },
  { label: 'Takipte', value: 'tracking' },
];

const MONO_FONT = Platform.select({ ios: 'Courier', android: 'monospace' }) ?? 'Courier';

function getRegionFlag(region: string, country: string): string {
  if (region === 'TR') return '🇹🇷';
  const flags: Record<string, string> = {
    'Fransa': '🇫🇷', 'İngiltere': '🇬🇧', 'ABD': '🇺🇸',
    'Almanya': '🇩🇪', 'Dubai': '🇦🇪', 'Avrupa': '🇪🇺',
  };
  return flags[country] ?? '🌍';
}

function UrgentHeroBanner({ award }: { award: Award }) {
  const countdown = getCountdownDisplay(award.deadlineDate);
  const dateStr = award.deadlineDate.toDate().toLocaleDateString('tr-TR');

  return (
    <TouchableOpacity
      onPress={() => router.push(`/award/${award.id}` as never)}
      style={styles.urgentBanner}
      activeOpacity={0.85}
    >
      <View style={styles.urgentLeft}>
        <View style={styles.urgentPill}>
          <View style={styles.pulseDot} />
          <Text style={styles.urgentPillText}>SON SAATLER</Text>
        </View>
        <Text style={styles.urgentName}>{award.name}</Text>
        <Text style={styles.urgentSub}>Son başvuru · {dateStr}</Text>
      </View>
      <View style={styles.urgentRight}>
        <Text style={styles.urgentNum}>{countdown.value}</Text>
        <Text style={styles.urgentUnit}>{countdown.unit.toUpperCase()}{'\n'}KALDI</Text>
      </View>
    </TouchableOpacity>
  );
}

function AwardCard({
  award,
  isTracking,
  onTrackToggle,
}: {
  award: Award;
  isTracking: boolean;
  onTrackToggle: (id: string) => void;
}) {
  const countdown = getCountdownDisplay(award.deadlineDate);
  const isUrgent = countdown.urgency === 'critical';
  const numColor = isUrgent ? Colors.red : Colors.amber;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/award/${award.id}` as never)}
      style={[styles.card, isUrgent && styles.cardUrgent]}
      activeOpacity={0.8}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardRegion}>
            {getRegionFlag(award.region, award.country)} {award.country}
          </Text>
          <Text style={styles.cardName}>{award.name}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.cardNum, { color: numColor }]}>{countdown.value}</Text>
          <Text style={styles.cardUnit}>{countdown.unit.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cats}>
          {award.categories.map((cat) => (
            <View key={cat} style={styles.catTag}>
              <Text style={styles.catText}>{cat}</Text>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity
          onPress={() => onTrackToggle(award.id)}
          style={[styles.trackBtn, isTracking && styles.trackBtnActive]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.trackIcon, isTracking && styles.trackIconActive]}>
            {isTracking ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function AwardsScreen() {
  const awards = useAwardsStore((s) => s.awards);
  const loading = useAwardsStore((s) => s.loading);
  const filter = useAwardsStore((s) => s.filter);
  const setFilter = useAwardsStore((s) => s.setFilter);
  const toggleTracking = useAwardsStore((s) => s.toggleTracking);
  const isTracking = useAwardsStore((s) => s.isTracking);
  const getFilteredAwards = useAwardsStore((s) => s.getFilteredAwards);
  const getUrgentAwards = useAwardsStore((s) => s.getUrgentAwards);

  const urgentAwards = getUrgentAwards();
  const filteredAwards = getFilteredAwards();
  const nonUrgentAwards = filteredAwards.filter((a) => {
    const hoursLeft = (a.deadlineDate.toMillis() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft > 24;
  });

  const urgentCount = awards.filter((a) => {
    const hoursLeft = (a.deadlineDate.toMillis() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 72;
  }).length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Aurora orbs */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoSub}>marketing ödülleri</Text>
            <Text style={styles.logoMain}>
              Final<Text style={styles.logoAccent}> Call</Text>
            </Text>
          </View>
          <View style={styles.headerRight}>
            {urgentCount > 0 && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>{urgentCount}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.bellBtn}>
              <Text style={styles.bellIcon}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            <Text style={styles.greetingAccent}>{filteredAwards.length} ödül</Text>
            {' '}yaklaşıyor
          </Text>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setFilter(opt.value)}
              style={[styles.filterChip, filter === opt.value && styles.filterChipActive]}
            >
              <Text style={[styles.filterLabel, filter === opt.value && styles.filterLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.violet} size="large" />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {urgentAwards.length > 0 && (
              <UrgentHeroBanner award={urgentAwards[0]} />
            )}

            {nonUrgentAwards.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>YAKLAŞAN TARİHLER</Text>
                  <Text style={styles.sectionCount}>{nonUrgentAwards.length} ödül</Text>
                </View>
                {nonUrgentAwards.map((award) => (
                  <AwardCard
                    key={award.id}
                    award={award}
                    isTracking={isTracking(award.id)}
                    onTrackToggle={toggleTracking}
                  />
                ))}
              </>
            )}

            {filteredAwards.length === 0 && !loading && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>◈</Text>
                <Text style={styles.emptyText}>
                  {awards.length === 0
                    ? 'Henüz ödül eklenmemiş'
                    : 'Bu filtrede ödül bulunamadı'}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safeArea: { flex: 1 },

  orb1: {
    position: 'absolute', borderRadius: 9999,
    width: 300, height: 300, top: -120, left: -80,
    backgroundColor: 'rgba(180,122,255,0.10)',
  },
  orb2: {
    position: 'absolute', borderRadius: 9999,
    width: 250, height: 250, top: 60, right: -100,
    backgroundColor: 'rgba(255,140,60,0.07)',
  },
  orb3: {
    position: 'absolute', borderRadius: 9999,
    width: 200, height: 200, bottom: 200, left: 20,
    backgroundColor: 'rgba(60,200,180,0.06)',
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  logoSub: {
    fontFamily: Fonts.regular, fontSize: 10, color: Colors.muted,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2,
  },
  logoMain: {
    fontFamily: Fonts.extraBold, fontSize: 24, color: Colors.white, letterSpacing: -0.5,
  },
  logoAccent: { color: Colors.violet },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  urgentBadge: {
    backgroundColor: Colors.red, borderRadius: 9999,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  urgentBadgeText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.white },
  bellBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  bellIcon: { fontSize: 14 },

  greeting: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  greetingText: { fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.dim },
  greetingAccent: { color: Colors.violet, fontFamily: Fonts.bold },

  filterScroll: { flexGrow: 0 },
  filterRow: { paddingHorizontal: Spacing.xl, gap: 6, paddingBottom: Spacing.md },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.violetDim, borderColor: 'rgba(180,122,255,0.25)',
  },
  filterLabel: {
    fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.muted, letterSpacing: 0.3,
  },
  filterLabelActive: { color: Colors.violet },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl - 4, paddingBottom: 20 },

  urgentBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,80,80,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,80,80,0.22)',
    borderRadius: 18, padding: Spacing.xl - 4, marginBottom: Spacing.md,
  },
  urgentLeft: { flex: 1 },
  urgentPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,80,80,0.15)', borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.25)', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 7,
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.red },
  urgentPillText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.red, letterSpacing: 1 },
  urgentName: {
    fontFamily: Fonts.bold, fontSize: 18, color: Colors.white,
    lineHeight: 22, letterSpacing: -0.3, marginBottom: 4,
  },
  urgentSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.dim },
  urgentRight: { alignItems: 'flex-end' },
  urgentNum: {
    fontFamily: MONO_FONT, fontSize: 52, fontWeight: '700',
    color: Colors.red, lineHeight: 52, letterSpacing: -2,
  },
  urgentUnit: {
    fontFamily: Fonts.semiBold, fontSize: 9, color: Colors.dim,
    letterSpacing: 1, textAlign: 'right', marginTop: 3,
  },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.muted, letterSpacing: 2 },
  sectionCount: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.faint },

  card: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 18, padding: Spacing.xl - 4, marginBottom: Spacing.sm,
  },
  cardUrgent: {
    backgroundColor: 'rgba(255,80,80,0.04)',
    borderColor: 'rgba(255,80,80,0.2)',
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.sm,
  },
  cardLeft: { flex: 1, paddingRight: 12 },
  cardRegion: {
    fontFamily: Fonts.semiBold, fontSize: 9, color: Colors.muted,
    letterSpacing: 0.5, marginBottom: 4,
  },
  cardName: {
    fontFamily: Fonts.bold, fontSize: 18, color: Colors.white,
    lineHeight: 22, letterSpacing: -0.3,
  },
  cardRight: { alignItems: 'flex-end' },
  cardNum: {
    fontFamily: MONO_FONT, fontSize: 34, fontWeight: '700',
    lineHeight: 34, letterSpacing: -1,
  },
  cardUnit: {
    fontFamily: Fonts.semiBold, fontSize: 8, color: Colors.muted,
    letterSpacing: 1.5, marginTop: 2,
  },

  cardBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cats: { flexGrow: 0 },
  catTag: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1,
    borderColor: Colors.border, borderRadius: 4, paddingHorizontal: 6,
    paddingVertical: 2, marginRight: 5,
  },
  catText: { fontFamily: Fonts.regular, fontSize: 9, color: Colors.muted, letterSpacing: 0.3 },
  trackBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  trackBtnActive: { backgroundColor: Colors.amberDim, borderColor: 'rgba(255,180,70,0.3)' },
  trackIcon: { fontSize: 11, color: Colors.muted },
  trackIconActive: { color: Colors.amber },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 32, marginBottom: 12, color: Colors.muted },
  emptyText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.muted },
});
