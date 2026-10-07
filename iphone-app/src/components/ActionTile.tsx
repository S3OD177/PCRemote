import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../lib/theme';

type Props = {
  label: string;
  sub: string;
  icon: React.ReactNode;
  gradient: [string, string];
  glow: string;
  disabled?: boolean;
  onPress: () => void;
};

export default function ActionTile({ label, sub, icon, gradient, glow, disabled, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.tile,
        { shadowColor: glow },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.iconWrap, { shadowColor: gradient[0] }]}
      >
        {icon}
      </LinearGradient>
      <View style={styles.labels}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sub} numberOfLines={2}>
          {sub}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 190,
    padding: 18,
    borderRadius: radius.lg + 2,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    justifyContent: 'space-between',
    shadowOpacity: 0.0,
  },
  pressed: { transform: [{ scale: 0.96 }], opacity: 0.95 },
  disabled: { opacity: 0.4 },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  labels: { marginTop: 14 },
  label: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 13, marginTop: 3, lineHeight: 18 },
});
