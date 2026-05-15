import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Kesfet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.white, fontFamily: 'Outfit_700Bold', fontSize: 24 },
});
