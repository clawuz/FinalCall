import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Radius } from '@/constants/Theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accentColor?: string;
  variant?: 'default' | 'urgent' | 'tracking';
}

export function GlassCard({ children, style, accentColor, variant = 'default' }: GlassCardProps) {
  const borderColor = variant === 'urgent'
    ? Colors.redGlow
    : variant === 'tracking'
    ? Colors.violetGlow
    : Colors.border;

  const bgColor = variant === 'urgent'
    ? Colors.redDim
    : variant === 'tracking'
    ? Colors.violetDim
    : Colors.surface;

  return (
    <View style={[styles.card, { backgroundColor: bgColor, borderColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
