import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface AwardCardProps {
  title?: string;
  deadline?: string;
  category?: string;
}

export default function AwardCard({ title, deadline, category }: AwardCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.category}>{category ?? 'Kategori'}</Text>
      <Text style={styles.title}>{title ?? 'Odul Adi'}</Text>
      <Text style={styles.deadline}>{deadline ?? 'Son Basvuru'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  category: { color: Colors.violet, fontFamily: 'Outfit_600SemiBold', fontSize: 11, letterSpacing: 1 },
  title: { color: Colors.white, fontFamily: 'Outfit_700Bold', fontSize: 18, marginTop: 4 },
  deadline: { color: Colors.dim, fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 6 },
});
