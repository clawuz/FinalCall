// components/ParticleBurst.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ParticleProps {
  color: string;
  angle: number;
  anim: Animated.Value;
}

function Particle({ color, angle, anim }: ParticleProps) {
  const distance = 40 + Math.random() * 20;
  const size = 4 + Math.random() * 4;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
          transform: [
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.cos(angle) * distance],
              }),
            },
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.sin(angle) * distance],
              }),
            },
          ],
        },
      ]}
    />
  );
}

interface ParticleBurstProps {
  color: string;
  trigger: boolean;
}

export default function ParticleBurst({ color, trigger }: ParticleBurstProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true;
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        hasTriggered.current = false;
      });
    }
  }, [trigger]);

  const PARTICLE_COUNT = 8;
  const angles = Array.from({ length: PARTICLE_COUNT }, (_, i) => (i / PARTICLE_COUNT) * Math.PI * 2);

  return (
    <View style={styles.container} pointerEvents="none">
      {angles.map((angle, i) => (
        <Particle key={i} color={color} angle={angle} anim={anim} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 0,
    height: 0,
  },
  particle: {
    position: 'absolute',
  },
});
