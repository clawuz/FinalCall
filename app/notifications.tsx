import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing, Radius } from '@/constants/Theme';
import { useNotificationsStore, NotifItem } from '@/store/notificationsStore';

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Dün' : `${days} gün önce`;
}

function NotifCard({ item }: { item: NotifItem }) {
  function handlePress() {
    if (item.awardId) router.push(`/award/${item.awardId}` as never);
  }

  return (
    <TouchableOpacity
      onPress={item.awardId ? handlePress : undefined}
      activeOpacity={item.awardId ? 0.75 : 1}
      style={[styles.card, !item.read && styles.cardUnread]}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.dot, item.read && styles.dotRead]} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMessage}>{item.body}</Text>
        <Text style={styles.cardTime}>{timeAgo(item.receivedAt)}</Text>
      </View>
      {item.awardId && <Text style={styles.cardArrow}>›</Text>}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const items = useNotificationsStore((s) => s.items);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const clearAll = useNotificationsStore((s) => s.clearAll);

  useEffect(() => {
    markAllRead();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Bildirimler</Text>
          {items.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
              <Text style={styles.clearText}>Temizle</Text>
            </TouchableOpacity>
          )}
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>Henüz bildirim yok</Text>
            <Text style={styles.emptyDesc}>Ödül bildirimleri burada görünecek.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {items.map((item) => (
              <NotifCard key={item.id} item={item} />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 60 },
  backIcon: { fontFamily: Fonts.regular, fontSize: 18, color: Colors.violet },
  backText: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.violet },
  title: { fontFamily: Fonts.bold, fontSize: 17, color: Colors.white },
  clearBtn: { minWidth: 60, alignItems: 'flex-end' },
  clearText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  cardUnread: { borderColor: 'rgba(180,122,255,0.25)', backgroundColor: 'rgba(180,122,255,0.05)' },
  cardLeft: { paddingTop: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.violet },
  dotRead: { backgroundColor: Colors.border },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },
  cardMessage: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.dim, lineHeight: 18 },
  cardTime: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.muted, marginTop: 2 },
  cardArrow: { fontSize: 20, color: Colors.muted, alignSelf: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.white, marginBottom: 8 },
  emptyDesc: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted, textAlign: 'center' },
});
