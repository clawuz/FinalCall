import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sayfa Bulunamadi</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Ana Sayfaya Don</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  title: { color: Colors.white, fontFamily: 'Outfit_700Bold', fontSize: 24, marginBottom: 16 },
  link: { marginTop: 8 },
  linkText: { color: Colors.violet, fontFamily: 'Outfit_600SemiBold', fontSize: 16 },
});
