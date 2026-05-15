import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface PillBadgeProps {
  label: string;
  variant?: 'default' | 'urgent' | 'region';
}

export function PillBadge({ label, variant = 'default' }: PillBadgeProps) {
  const color = variant === 'urgent' ? Colors.red : variant === 'region' ? Colors.violet : Colors.muted;
  const bg = variant === 'urgent' ? Colors.redDim : variant === 'region' ? Colors.violetDim : 'rgba(255,255,255,0.04)';
  const borderColor = variant === 'urgent' ? 'rgba(255,80,80,0.2)' : variant === 'region' ? 'rgba(180,122,255,0.2)' : Colors.border;

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    fontSize: 9,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 0.3,
  },
});
