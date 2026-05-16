import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

// 12 frames @ 4fps — pre-required so Metro bundles them
const FRAMES = [
  require('@/assets/splash/frames/frame-00.png'),
  require('@/assets/splash/frames/frame-01.png'),
  require('@/assets/splash/frames/frame-02.png'),
  require('@/assets/splash/frames/frame-03.png'),
  require('@/assets/splash/frames/frame-04.png'),
  require('@/assets/splash/frames/frame-05.png'),
  require('@/assets/splash/frames/frame-06.png'),
  require('@/assets/splash/frames/frame-07.png'),
  require('@/assets/splash/frames/frame-08.png'),
  require('@/assets/splash/frames/frame-09.png'),
  require('@/assets/splash/frames/frame-10.png'),
  require('@/assets/splash/frames/frame-11.png'),
];

const FRAME_MS = 1000 / 4; // 250ms per frame @ 4fps
const HOLD_MS  = 400;       // hold last frame before fade
const FADE_MS  = 300;       // fade-out duration

interface Props { onFinished: () => void; }

export default function SplashAnimation({ onFinished }: Props) {
  const [frameIndex, setFrameIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let current = 0;

    const interval = setInterval(() => {
      current += 1;
      if (current >= FRAMES.length) {
        clearInterval(interval);
        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: FADE_MS,
            useNativeDriver: true,
          }).start(() => onFinished());
        }, HOLD_MS);
        return;
      }
      setFrameIndex(current);
    }, FRAME_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity }]}>
      <Image
        source={FRAMES[frameIndex]}
        style={styles.frame}
        resizeMode="cover"
        fadeDuration={0}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: '#0A0203',
  },
  frame: { width: W, height: H },
});
