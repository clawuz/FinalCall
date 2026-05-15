import { View, Text, Switch, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface NotifToggleProps {
  label?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
}

export default function NotifToggle({ label, value = false, onValueChange }: NotifToggleProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label ?? 'Bildirim'}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.surface2, true: Colors.violetGlow }}
        thumbColor={value ? Colors.violet : Colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  label: { color: Colors.white, fontFamily: 'Outfit_400Regular', fontSize: 15 },
});
