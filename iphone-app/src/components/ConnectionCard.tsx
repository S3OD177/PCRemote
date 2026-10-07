import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { MonitorIcon, ChevronIcon } from './icons';
import { colors, radius } from '../lib/theme';

export type ConnState = 'checking' | 'online' | 'offline' | 'busy';

type Props = {
  state: ConnState;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

const DOT: Record<ConnState, string> = {
  checking: colors.muted,
  online: colors.ok,
  offline: colors.bad,
  busy: colors.warn,
};

export default function ConnectionCard({ state, title, subtitle, onPress }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    if (state === 'online' || state === 'checking' || state === 'busy') {
      pulse.setValue(0);
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
        ]),
      );
      loop.start();
    }
    return () => loop?.stop();
  }, [state, pulse]);

  const dotOpacity = state === 'offline' ? 1 : pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && onPress && { opacity: 0.85 }]}>
      <Animated.View style={[styles.dot, { backgroundColor: DOT[state], opacity: dotOpacity }]} />
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <MonitorIcon size={26} color={colors.muted} />
      {onPress ? <ChevronIcon size={18} color={colors.faint} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  text: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 13.5, marginTop: 3 },
});
