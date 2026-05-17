import { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const SPLASH = require('../assets/all/splash/splash-iphone-1290x2796.png');

const HOLD_MS = 2000;
const FADE_MS = 400;

interface Props { onFinished: () => void; }

export default function SplashAnimation({ onFinished }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => onFinished());
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity }]}>
      <Image source={SPLASH} style={styles.frame} resizeMode="cover" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: '#000000',
  },
  frame: { width: W, height: H },
});
