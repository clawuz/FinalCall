import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Timestamp } from 'firebase/firestore';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing, Radius } from '@/constants/Theme';
import { useArticlesStore } from '@/store/articlesStore';
import { Article } from '@/types';

type FilterType = 'all' | 'news' | 'tip';

// Shown when Firestore has no articles yet
const PLACEHOLDER_ARTICLES: Article[] = [
  {
    id: 'p1', type: 'tip',
    title: "Cannes Lions'a Nasıl Başvurulur?",
    summary: 'Kategori seçiminden case videoya kadar başvuru sürecinde dikkat edilmesi gereken 7 kritik nokta.',
    publishedAt: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    isActive: true,
  },
  {
    id: 'p2', type: 'tip',
    title: 'Jury Brief Nedir? Jüri Nasıl Düşünür?',
    summary: 'Ödül jürilerinin değerlendirme kriterlerini anlamak, kazanan brieflerin ortak özellikleri.',
    publishedAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    isActive: true,
  },
  {
    id: 'p3', type: 'tip',
    title: 'Kategori Seçimi: En Büyük Strateji',
    summary: "Doğru kategori seçimi, ödül almanın en kritik adımı. Niche kategoriler nasıl avantaj sağlar?",
    publishedAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
    isActive: true,
  },
];

function timeAgo(ts: Timestamp): string {
  if (!ts?.toMillis) return '';
  const hours = Math.floor((Date.now() - ts.toMillis()) / (1000 * 60 * 60));
  if (hours < 1) return 'Az önce';
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Dün' : `${days} gün önce`;
}

function ArticleCard({ article }: { article: Article }) {
  const isNews = article.type === 'news';
  const accentColor = isNews ? Colors.teal : Colors.violet;
  const accentDim = isNews ? Colors.tealDim : Colors.violetDim;
  const accentBorder = isNews ? 'rgba(60,200,180,0.2)' : 'rgba(180,122,255,0.2)';

  async function handlePress() {
    if (article.url) {
      await WebBrowser.openBrowserAsync(article.url);
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.articleCard}
      activeOpacity={article.url ? 0.75 : 1}
    >
      <View style={styles.articleTop}>
        <View style={[styles.typePill, { backgroundColor: accentDim, borderColor: accentBorder }]}>
          <Text style={[styles.typePillText, { color: accentColor }]}>
            {isNews ? '● HABER' : '◆ İPUCU'}
          </Text>
        </View>
        {article.relatedAwardId && (
          <Text style={styles.relatedAward}>{article.relatedAwardId}</Text>
        )}
      </View>

      <Text style={styles.articleTitle}>{article.title}</Text>
      <Text style={styles.articleSummary}>{article.summary}</Text>

      <View style={styles.articleMeta}>
        <Text style={styles.metaText}>{timeAgo(article.publishedAt)}</Text>
        {article.url && (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={[styles.metaText, { color: accentColor }]}>Oku →</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function NewsScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const articles = useArticlesStore((s) => s.articles);
  const loading = useArticlesStore((s) => s.loading);
  const startListening = useArticlesStore((s) => s.startListening);
  const stopListening = useArticlesStore((s) => s.stopListening);

  useEffect(() => {
    startListening();
    return () => stopListening();
  }, []);

  // Use real articles if available, placeholders if Firestore is empty
  const source = articles.length > 0 ? articles : (!loading ? PLACEHOLDER_ARTICLES : []);

  const filtered = source.filter((a) => filter === 'all' || a.type === filter);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.orb1} />
      </View>

      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerSub}>içerik</Text>
          <Text style={styles.headerTitle}>
            Haberler & <Text style={styles.headerAccent}>İpuçları</Text>
          </Text>
        </View>

        <View style={styles.filterRow}>
          {(['all', 'news', 'tip'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.fchip, filter === f && styles.fchipActive]}
            >
              <Text style={[styles.fchipText, filter === f && styles.fchipTextActive]}>
                {f === 'all' ? 'Tümü' : f === 'news' ? 'Haberler' : 'İpuçları'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.teal} size="large" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {filtered.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
            {filtered.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Bu kategoride içerik bulunamadı</Text>
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
  safe: { flex: 1 },
  orb1: { position: 'absolute', borderRadius: 9999, width: 250, height: 250, top: -60, right: -60, backgroundColor: 'rgba(60,200,180,0.08)' },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerSub: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontFamily: Fonts.extraBold, fontSize: 24, color: Colors.white, letterSpacing: -0.5 },
  headerAccent: { color: Colors.teal },
  filterRow: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  fchip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  fchipActive: { backgroundColor: Colors.tealDim, borderColor: 'rgba(60,200,180,0.25)' },
  fchipText: { fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.muted },
  fchipTextActive: { color: Colors.teal },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 20 },
  articleCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.sm },
  articleTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  typePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
  typePillText: { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 1 },
  relatedAward: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.muted },
  articleTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white, lineHeight: 22, letterSpacing: -0.2, marginBottom: 6 },
  articleSummary: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.dim, lineHeight: 19, marginBottom: Spacing.sm },
  articleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.muted },
  metaDot: { color: Colors.muted, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.muted },
});
