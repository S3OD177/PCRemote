import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '../lib/theme';

export type ToastKind = 'ok' | 'err' | 'info';
export type ToastData = { text: string; kind: ToastKind } | null;

const BORDER: Record<ToastKind, string> = {
  ok: 'rgba(52,211,153,0.5)',
  err: 'rgba(251,113,133,0.55)',
  info: colors.line,
};

export default function Toast({ data }: { data: ToastData }) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (data) {
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 70 }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [data, anim]);

  if (!data) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { top: insets.top + 10, borderColor: BORDER[data.kind] },
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
        },
      ]}
    >
      <Text style={styles.text}>{data.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '92%',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: '#18223a',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  text: { color: colors.text, fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
