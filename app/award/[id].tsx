import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function AwardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Odul Detay</Text>
      <Text style={styles.id}>ID: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.white, fontFamily: 'Outfit_700Bold', fontSize: 24 },
  id: { color: Colors.dim, fontFamily: 'Outfit_400Regular', fontSize: 14, marginTop: 8 },
});
