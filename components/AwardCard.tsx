// components/AwardCard.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Theme';
import { Award, getCountdownDisplay } from '@/types';
import { resolveAwardColor } from '@/constants/AwardColors';

const MONO = Platform.select({ ios: 'Courier', android: 'monospace' }) ?? 'Courier';

interface AwardCardProps {
  award: Award;
  isTracking: boolean;
  onTrackToggle: (id: string) => void;
  onPress: () => void;
}

function getRegionFlag(region: string, country: string): string {
  if (region === 'TR') return '🇹🇷';
  const flags: Record<string, string> = {
    'Fransa': '🇫🇷', 'İngiltere': '🇬🇧', 'ABD': '🇺🇸',
    'Almanya': '🇩🇪', 'Dubai': '🇦🇪', 'Avrupa': '🇪🇺',
  };
  return flags[country] ?? '🌍';
}

export default function AwardCard({ award, isTracking, onTrackToggle, onPress }: AwardCardProps) {
  const colorDef = resolveAwardColor(award.color);
  const countdown = getCountdownDisplay(award.deadlineDate);

  // Breathing glow: drives both border shadow and text glow
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.7, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const glowColor = glowAnim.interpolate({
    inputRange: [0.3, 0.7],
    outputRange: [`rgba(${colorDef.rgb}, 0.3)`, `rgba(${colorDef.rgb}, 0.7)`],
  });

  const shadowOpacityAnim = glowAnim.interpolate({
    inputRange: [0.3, 0.7],
    outputRange: [0.10, 0.36],
  });

  const shadowRadiusAnim = glowAnim.interpolate({
    inputRange: [0.3, 0.7],
    outputRange: [14, 30],
  });

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          shadowColor: colorDef.hex,
          shadowOpacity: shadowOpacityAnim,
          shadowRadius: shadowRadiusAnim,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        },
      ]}
    >
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          borderColor: `rgba(${colorDef.rgb}, 0.22)`,
          backgroundColor: `rgba(${colorDef.rgb}, 0.05)`,
        },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.left}>
          <Text style={styles.region}>
            {getRegionFlag(award.region, award.country)} {award.country.toUpperCase()}
          </Text>
          <Text style={styles.name}>{award.name}</Text>
        </View>
        <View style={styles.right}>
          <Animated.Text
            style={[
              styles.num,
              {
                color: colorDef.hex,
                textShadowColor: glowColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 12,
              },
            ]}
          >
            {countdown.value}
          </Animated.Text>
          <Text style={[styles.unit, { color: `rgba(${colorDef.rgb}, 0.5)` }]}>
            {countdown.unit.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          onPress={() => onTrackToggle(award.id)}
          style={[
            styles.trackBtn,
            isTracking && {
              backgroundColor: `rgba(${colorDef.rgb}, 0.15)`,
              borderColor: `rgba(${colorDef.rgb}, 0.35)`,
            },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.trackIcon, isTracking && { color: colorDef.hex }]}>
            {isTracking ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 18,
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  left: { flex: 1, paddingRight: 12 },
  region: {
    fontFamily: Fonts.semiBold,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.white,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  right: { alignItems: 'flex-end' },
  num: {
    fontFamily: MONO,
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 44,
    letterSpacing: -2,
  },
  unit: {
    fontFamily: Fonts.semiBold,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 2,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  trackBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackIcon: { fontSize: 12, color: Colors.muted },
});
