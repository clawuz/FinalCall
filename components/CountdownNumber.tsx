import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface CountdownNumberProps {
  value: number | string;
  unit: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

const SIZE_MAP = {
  sm: { num: 20, unit: 8 },
  md: { num: 28, unit: 9 },
  lg: { num: 36, unit: 10 },
  xl: { num: 48, unit: 11 },
};

export function CountdownNumber({ value, unit, size = 'md', color = Colors.amber }: CountdownNumberProps) {
  const sizes = SIZE_MAP[size];
  return (
    <>
      <Text style={[styles.num, { fontSize: sizes.num, color }]}>{value}</Text>
      <Text style={[styles.unit, { fontSize: sizes.unit }]}>{unit.toUpperCase()}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  num: {
    fontFamily: 'Courier', // Mono
    fontWeight: '700',
    letterSpacing: -1,
  },
  unit: {
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dim,
    letterSpacing: 1.5,
    marginTop: 2,
  },
});
