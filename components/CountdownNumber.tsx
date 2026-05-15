import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface CountdownNumberProps {
  value: number;
  label: string;
}

export default function CountdownNumber({ value, label }: CountdownNumberProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.number}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginHorizontal: 8 },
  number: { color: Colors.white, fontFamily: 'Outfit_800ExtraBold', fontSize: 36 },
  label: { color: Colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 10, letterSpacing: 1, marginTop: 2 },
});
