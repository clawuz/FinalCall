// components/AwardCard.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts, Spacing } from '@/constants/Theme';
import { Award, getCountdownDisplay } from '@/types';
import { resolveAwardColor } from '@/constants/AwardColors';

const MONO = Platform.select({ ios: 'Courier', android: 'monospace' }) ?? 'Courier';

interface AwardCardProps {
  award: Award;
  isTracking: boolean;
  onTrackToggle: (id: string) => void;
  onPress: () => void;
  showParticleBurst?: boolean;
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

  // Scan line animation
  const scanAnim = useRef(new Animated.Value(0)).current;
  // Glow pulse
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Scan line: loops from 0→1 over 4s
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: false,
      })
    ).start();

    // Glow pulse: 0.3→0.7→0.3 every 3s
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.7, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.3, 0.7],
    outputRange: [0.3, 0.7],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          borderColor: `rgba(${colorDef.rgb}, 0.2)`,
          backgroundColor: `rgba(${colorDef.rgb}, 0.05)`,
          shadowColor: colorDef.hex,
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        },
      ]}
    >
      {/* Scan line overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.scanLine,
          {
            opacity: scanAnim.interpolate({
              inputRange: [0, 0.4, 0.6, 1],
              outputRange: [0, 0.6, 0.6, 0],
            }),
            transform: [
              {
                translateX: scanAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-300, 300],
                }),
              },
            ],
          },
        ]}
      />

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
                textShadowColor: `rgba(${colorDef.rgb}, ${glowOpacity})`,
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
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  scanLine: {
    width: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
