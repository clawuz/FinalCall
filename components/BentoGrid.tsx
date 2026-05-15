import { View, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

interface BentoGridProps {
  children?: ReactNode;
}

export default function BentoGrid({ children }: BentoGridProps) {
  return (
    <View style={styles.grid}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
  },
});
