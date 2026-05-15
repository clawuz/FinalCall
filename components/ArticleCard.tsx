import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';

interface ArticleCardProps {
  title?: string;
  summary?: string;
  readTime?: string;
  onPress?: () => void;
}

export default function ArticleCard({ title, summary, readTime, onPress }: ArticleCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.readTime}>{readTime ?? '3 dk okuma'}</Text>
      <Text style={styles.title}>{title ?? 'Makale Basligi'}</Text>
      <Text style={styles.summary} numberOfLines={2}>{summary ?? 'Makale ozeti burada gorunecek...'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  readTime: { color: Colors.teal, fontFamily: 'Outfit_600SemiBold', fontSize: 11, letterSpacing: 0.5 },
  title: { color: Colors.white, fontFamily: 'Outfit_700Bold', fontSize: 17, marginTop: 6 },
  summary: { color: Colors.dim, fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 6, lineHeight: 20 },
});
