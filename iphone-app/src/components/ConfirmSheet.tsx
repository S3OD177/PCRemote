import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '../lib/theme';

export type SheetConfig = {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  gradient: [string, string];
  icon: React.ReactNode;
};

type Props = {
  config: SheetConfig | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmSheet({ config, onConfirm, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const open = config !== null;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: open ? 1 : 0,
      duration: open ? 260 : 180,
      useNativeDriver: true,
    }).start();
  }, [open, slide]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 18 },
            {
              transform: [
                { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) },
              ],
            },
          ]}
        >
          {/* stop taps inside the sheet from closing it */}
          <Pressable>
            {config ? (
              <>
                <LinearGradient
                  colors={config.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.icon}
                >
                  {config.icon}
                </LinearGradient>
                <Text style={styles.title}>{config.title}</Text>
                <Text style={styles.body}>{config.body}</Text>
                <Pressable onPress={onConfirm} style={({ pressed }) => pressed && { opacity: 0.9 }}>
                  <LinearGradient
                    colors={config.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirm}
                  >
                    <Text style={styles.confirmText}>{config.confirmLabel}</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  onPress={onCancel}
                  style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.cancelText}>{config.cancelLabel}</Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2,4,12,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cardSolid,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 22,
    paddingTop: 26,
    alignItems: 'center',
  },
  icon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 24, marginTop: 6, marginBottom: 22, textAlign: 'center' },
  confirm: { borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancel: {
    marginTop: 10,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  cancelText: { color: colors.text, fontSize: 17, fontWeight: '600' },
});
