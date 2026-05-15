import React from 'react';
import { View, StyleSheet } from 'react-native';

export function AuroraBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Violet orb — top left */}
      <View style={[styles.orb, styles.orb1]} />
      {/* Amber orb — top right */}
      <View style={[styles.orb, styles.orb2]} />
      {/* Teal orb — bottom center */}
      <View style={[styles.orb, styles.orb3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 280,
    height: 280,
    top: -100,
    left: -80,
    backgroundColor: 'rgba(180,122,255,0.12)',
    // React Native'de blur yok — opacity ile simüle
  },
  orb2: {
    width: 220,
    height: 220,
    top: 80,
    right: -80,
    backgroundColor: 'rgba(255,140,60,0.09)',
  },
  orb3: {
    width: 200,
    height: 200,
    bottom: 300,
    left: 20,
    backgroundColor: 'rgba(60,200,180,0.07)',
  },
});
