import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface NotifToggleProps {
  isTracking: boolean;
  onPress: () => void;
  size?: number;
}

export function NotifToggle({ isTracking, onPress, size = 22 }: NotifToggleProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.btn,
        { width: size, height: size },
        isTracking && styles.btnActive,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={[styles.icon, isTracking && styles.iconActive]}>
        {isTracking ? '★' : '☆'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: Colors.amberDim,
    borderColor: 'rgba(255,180,70,0.3)',
  },
  icon: {
    fontSize: 10,
    color: Colors.muted,
  },
  iconActive: {
    color: Colors.amber,
  },
});
