import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Switch, Alert,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing, Radius } from '@/constants/Theme';
import { usePrefsStore } from '@/store/prefsStore';
import { cancelAllNotifications } from '@/services/notifications';

export default function SettingsScreen() {
  const allNotifs = usePrefsStore((s) => s.allNotifs);
  const openNotif = usePrefsStore((s) => s.openNotif);
  const countdownNotif = usePrefsStore((s) => s.countdownNotif);
  const lastDayNotif = usePrefsStore((s) => s.lastDayNotif);
  const quietStart = usePrefsStore((s) => s.quietStart);
  const quietEnd = usePrefsStore((s) => s.quietEnd);
  const setAllNotifs = usePrefsStore((s) => s.setAllNotifs);
  const setOpenNotif = usePrefsStore((s) => s.setOpenNotif);
  const setCountdownNotif = usePrefsStore((s) => s.setCountdownNotif);
  const setLastDayNotif = usePrefsStore((s) => s.setLastDayNotif);

  function handleReset() {
    Alert.alert(
      'Bildirimleri Sıfırla',
      'Tüm planlanmış bildirimler iptal edilecek. Devam?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla', style: 'destructive', onPress: async () => {
            await cancelAllNotifications();
            Alert.alert('Tamam', 'Tüm bildirimler iptal edildi.');
          }
        },
      ]
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerSub}>tercihler</Text>
          <Text style={styles.headerTitle}>
            Ayar<Text style={styles.headerAccent}>lar</Text>
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          <Text style={styles.sectionTitle}>BİLDİRİMLER</Text>
          <View style={styles.group}>
            <SettingRow
              label="Tüm Bildirimler"
              desc="Ana bildirim kontrolü"
              value={allNotifs}
              onToggle={setAllNotifs}
            />
            <SettingRow
              label="Başvuru Açılışı"
              desc="Yeni ödül başvurusu başladığında"
              value={openNotif}
              onToggle={setOpenNotif}
              disabled={!allNotifs}
            />
            <SettingRow
              label="Geri Sayım"
              desc="30, 14, 7, 3, 1 gün kaldığında"
              value={countdownNotif}
              onToggle={setCountdownNotif}
              disabled={!allNotifs}
            />
            <SettingRow
              label="Son Gün Uyarıları"
              desc="4 saatlik periyotlarla son gün bildirimleri"
              value={lastDayNotif}
              onToggle={setLastDayNotif}
              isLast
              disabled={!allNotifs}
            />
          </View>

          <Text style={styles.sectionTitle}>SESSİZ SAATLER</Text>
          <View style={styles.group}>
            <View style={styles.quietRow}>
              <View>
                <Text style={styles.rowLabel}>Sessiz Başlangıç</Text>
                <Text style={styles.rowDesc}>Bildirim gönderilmez</Text>
              </View>
              <Text style={styles.quietTime}>{quietStart}:00</Text>
            </View>
            <View style={[styles.quietRow, styles.rowBorder]}>
              <View>
                <Text style={styles.rowLabel}>Sessiz Bitiş</Text>
                <Text style={styles.rowDesc}>Bildirimler başlar</Text>
              </View>
              <Text style={styles.quietTime}>{quietEnd}:00</Text>
            </View>
            <Text style={styles.quietNote}>
              Sessiz saat aralığında gönderilmesi gereken bildirimler sabah {quietEnd}:00'da iletilir.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>UYGULAMA</Text>
          <View style={styles.group}>
            <View style={styles.aboutRow}>
              <Text style={styles.rowLabel}>Final Call</Text>
              <Text style={styles.aboutVersion}>v1.0.0</Text>
            </View>
            <View style={[styles.aboutRow, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Marketing Ödülleri</Text>
              <Text style={styles.aboutSub}>Türkiye & Global</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Tüm Bildirimleri Sıfırla</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SettingRow({ label, desc, value, onToggle, isLast, disabled }: {
  label: string; desc: string; value: boolean;
  onToggle: (v: boolean) => void; isLast?: boolean; disabled?: boolean;
}) {
  return (
    <View style={[styles.settingRow, !isLast && styles.rowBorder]}>
      <View style={styles.settingLeft}>
        <Text style={[styles.rowLabel, disabled && styles.rowLabelDisabled]}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.violet }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  headerSub: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontFamily: Fonts.extraBold, fontSize: 24, color: Colors.white, letterSpacing: -0.5 },
  headerAccent: { color: Colors.violet },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  sectionTitle: {
    fontFamily: Fonts.bold, fontSize: 9, color: Colors.muted,
    letterSpacing: 2, marginBottom: Spacing.sm, marginTop: Spacing.lg, paddingHorizontal: 4,
  },
  group: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, overflow: 'hidden',
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
  },
  settingLeft: { flex: 1, paddingRight: 12 },
  rowLabel: { fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.white, marginBottom: 2 },
  rowLabelDisabled: { color: Colors.muted },
  rowDesc: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted },
  quietRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
  },
  quietTime: { fontFamily: 'Courier', fontSize: 20, fontWeight: '700', color: Colors.amber },
  quietNote: {
    fontFamily: Fonts.regular, fontSize: 11, color: Colors.muted,
    paddingHorizontal: Spacing.lg, paddingVertical: 10, lineHeight: 16,
  },
  aboutRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
  },
  aboutVersion: { fontFamily: 'Courier', fontSize: 13, color: Colors.muted },
  aboutSub: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted },
  resetBtn: {
    marginTop: Spacing.xl, padding: 16, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: 'rgba(255,80,80,0.2)', alignItems: 'center',
  },
  resetText: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.red },
});
