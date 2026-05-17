import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing, Radius } from '@/constants/Theme';
import { useAwardsStore } from '@/store/awardsStore';
import { getDaysLeft, getHoursLeft } from '@/types';
import { resolveAwardColor } from '@/constants/AwardColors';

type RegionFilter = 'all' | 'TR' | 'Global';

const MONO = Platform.select({ ios: 'Courier', android: 'monospace' }) ?? 'Courier';

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<RegionFilter>('all');
  const awards = useAwardsStore((s) => s.awards);
  const loading = useAwardsStore((s) => s.loading);

  const results = awards.filter((a) => {
    if (!a.isActive) return false;
    if (a.deadlineDate.toMillis() <= Date.now()) return false;
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.categories.some((c) => c.toLowerCase().includes(search.toLowerCase()));
    const matchRegion = region === 'all' || a.region === region;
    return matchSearch && matchRegion;
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerSub}>arama</Text>
          <Text style={styles.headerTitle}>
            Keş<Text style={styles.headerAccent}>fet</Text>
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Ödül veya kategori ara..."
            placeholderTextColor={Colors.muted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {(['all', 'TR', 'Global'] as RegionFilter[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRegion(r)}
              style={[styles.fchip, region === r && styles.fchipActive]}
            >
              <Text style={[styles.fchipText, region === r && styles.fchipTextActive]}>
                {r === 'all' ? 'Tümü' : r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.teal} size="large" />
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>{results.length} ödül</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {results.map((award) => {
                const hoursLeft = getHoursLeft(award.deadlineDate);
                const daysLeft = getDaysLeft(award.deadlineDate);
                const isUrgent = hoursLeft <= 24;
                const displayValue = isUrgent ? String(hoursLeft).padStart(2, '0') : String(daysLeft);
                const displayUnit = isUrgent ? 'SAAT' : 'GÜN';
                const colorDef = resolveAwardColor(award.color);
                const numColor = isUrgent ? Colors.red : colorDef.hex;

                return (
                  <TouchableOpacity
                    key={award.id}
                    onPress={() => router.push(`/award/${award.id}` as never)}
                    style={styles.row}
                    activeOpacity={0.8}
                  >
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowRegion}>
                        {award.region === 'TR' ? '🇹🇷' : '🌍'} {award.country}
                      </Text>
                      <Text style={styles.rowName}>{award.name}</Text>
                      <View style={styles.rowCats}>
                        {award.categories.slice(0, 2).map((c) => (
                          <Text key={c} style={styles.rowCat}>{c}</Text>
                        ))}
                      </View>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={[styles.rowNum, { color: numColor }]}>{displayValue}</Text>
                      <Text style={styles.rowUnit}>{displayUnit}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {results.length === 0 && (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    {awards.length === 0 ? 'Henüz ödül eklenmemiş' : 'Sonuç bulunamadı'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerSub: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontFamily: Fonts.extraBold, fontSize: 24, color: Colors.white, letterSpacing: -0.5 },
  headerAccent: { color: Colors.teal },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, height: 44,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.white },
  clearBtn: { fontSize: 14, color: Colors.muted, padding: 4 },
  filterRow: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },
  fchip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  fchipActive: { backgroundColor: Colors.tealDim, borderColor: 'rgba(77,205,190,0.25)' },
  fchipText: { fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.muted },
  fchipTextActive: { color: Colors.teal },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resultCount: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.muted, paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  rowLeft: { flex: 1 },
  rowRegion: { fontFamily: Fonts.regular, fontSize: 9, color: Colors.muted, marginBottom: 3 },
  rowName: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white, marginBottom: 5 },
  rowCats: { flexDirection: 'row', gap: 4 },
  rowCat: { fontFamily: Fonts.regular, fontSize: 9, color: Colors.muted, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  rowRight: { alignItems: 'flex-end', minWidth: 50 },
  rowNum: { fontFamily: MONO, fontSize: 28, fontWeight: '700', lineHeight: 28 },
  rowUnit: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.muted, letterSpacing: 1.5, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.muted },
});
