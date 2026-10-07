import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, CloseIcon } from '../components/icons';
import { t } from '../lib/i18n';
import { parsePairing } from '../lib/pairing';
import type { PC } from '../lib/storage';
import { colors, radius } from '../lib/theme';

type Props = {
  canClose: boolean;
  onPaired: (pc: PC) => void;
  onClose: () => void;
};

export default function PairScreen({ canClose, onPaired, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<PC | null>(null);
  const handled = useRef(false);

  // Ask for the camera as soon as the screen opens, if we haven't yet.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const onScan = ({ data }: { data: string }) => {
    if (handled.current) return;
    const pc = parsePairing(data);
    if (!pc) {
      setError(t('pairBadQR'));
      return;
    }
    handled.current = true;
    setError('');
    setSuccess(pc);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => onPaired(pc), 1100);
  };

  return (
    <View style={styles.root}>
      {/* Camera (only when granted) */}
      {permission?.granted && !success ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScan}
        />
      ) : (
        <View style={StyleSheet.absoluteFill} />
      )}
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />

      {/* Close button */}
      {canClose && !success ? (
        <Pressable onPress={onClose} style={[styles.close, { top: insets.top + 10 }]} hitSlop={12}>
          <CloseIcon size={22} color="#fff" />
        </Pressable>
      ) : null}

      <View style={[styles.body, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 30 }]}>
        {success ? (
          <View style={styles.center}>
            <LinearGradient colors={[colors.ok, '#10b981']} style={styles.successIcon}>
              <CheckIcon size={44} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>{t('paired')}</Text>
            <Text style={styles.hint}>{t('pairedBody')}</Text>
          </View>
        ) : permission?.granted ? (
          <>
            <Text style={styles.title}>{t('pairTitle')}</Text>
            <View style={styles.frame}>
              <Corner pos="tl" />
              <Corner pos="tr" />
              <Corner pos="bl" />
              <Corner pos="br" />
            </View>
            <Text style={styles.hint}>{t('pairHint')}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        ) : (
          <View style={styles.center}>
            <Text style={styles.title}>{t('cameraNeeded')}</Text>
            <Text style={styles.hint}>{t('cameraNeededBody')}</Text>
            {permission && !permission.canAskAgain ? (
              <Pressable onPress={() => Linking.openSettings()} style={styles.cta}>
                <Text style={styles.ctaText}>{t('openSettings')}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={requestPermission} style={styles.cta}>
                <Text style={styles.ctaText}>{t('grantCamera')}</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base = {
    position: 'absolute' as const,
    width: 42,
    height: 42,
    borderColor: '#fff',
  };
  const map = {
    tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
    tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
    bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
    br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  };
  return <View style={[base, map[pos]]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05070e' },
  scrim: { backgroundColor: 'rgba(5,7,14,0.55)' },
  close: {
    position: 'absolute',
    right: 18,
    zIndex: 5,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  frame: { width: 250, height: 250, marginVertical: 20 },
  hint: { color: 'rgba(255,255,255,0.82)', fontSize: 15.5, lineHeight: 24, textAlign: 'center', maxWidth: 320 },
  error: { color: colors.bad, fontSize: 14.5, marginTop: 16, textAlign: 'center' },
  successIcon: { width: 92, height: 92, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  cta: {
    marginTop: 26,
    backgroundColor: colors.blue1,
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
