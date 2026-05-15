import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface UrgentHeroProps {
  title?: string;
  daysLeft?: number;
}

export default function UrgentHero({ title, daysLeft }: UrgentHeroProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>ACIL</Text>
      <Text style={styles.title}>{title ?? 'Odul Adi'}</Text>
      <Text style={styles.days}>{daysLeft ?? 0} gun kaldi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.amberGlow,
    borderRadius: 20,
    padding: 24,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.amber,
  },
  label: { color: Colors.amber, fontFamily: 'Outfit_800ExtraBold', fontSize: 10, letterSpacing: 2 },
  title: { color: Colors.white, fontFamily: 'Outfit_800ExtraBold', fontSize: 28, marginTop: 8 },
  days: { color: Colors.amber, fontFamily: 'Outfit_600SemiBold', fontSize: 14, marginTop: 8 },
});
