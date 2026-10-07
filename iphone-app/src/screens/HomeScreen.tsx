import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActionTile from '../components/ActionTile';
import ConnectionCard, { ConnState } from '../components/ConnectionCard';
import ConfirmSheet, { SheetConfig } from '../components/ConfirmSheet';
import Toast, { ToastData, ToastKind } from '../components/Toast';
import { LockIcon, MoonIcon, PlusIcon, PowerIcon, WakeIcon } from '../components/icons';
import { Action, ping, sendCommand } from '../lib/client';
import { isRTL, lang, t } from '../lib/i18n';
import { colors } from '../lib/theme';
import type { PC } from '../lib/storage';
import { canWake, wake } from '../lib/wol';

type Props = {
  pc: PC;
  multiplePCs: boolean;
  onManage: () => void;
  onAddPC: () => void;
};

const OS_LABEL: Record<string, string> = { windows: lang === 'ar' ? 'ويندوز' : 'Windows' };

export default function HomeScreen({ pc, multiplePCs, onManage, onAddPC }: Props) {
  const insets = useSafeAreaInsets();
  const [conn, setConn] = useState<ConnState>('checking');
  const [sheet, setSheet] = useState<SheetConfig | null>(null);
  const [toast, setToast] = useState<ToastData>(null);
  const pendingAction = useRef<Action | null>(null);
  const lastCmdAt = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((text: string, kind: ToastKind) => {
    setToast({ text, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const refresh = useCallback(async () => {
    const r = await ping(pc);
    const age = Date.now() - lastCmdAt.current;
    if (r.ok) {
      // Just after a command the PC is still up; keep showing "busy" briefly.
      setConn(age < 15000 && pendingAction.current ? 'busy' : 'online');
      if (age >= 15000) pendingAction.current = null;
    } else {
      setConn('offline');
    }
  }, [pc]);

  // Poll connectivity while the screen is focused and the app is foregrounded.
  useEffect(() => {
    setConn('checking');
    refresh();
    const start = () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      pollTimer.current = setInterval(refresh, 4000);
    };
    const stop = () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      pollTimer.current = null;
    };
    start();
    const sub = AppState.addEventListener('change', (s) => (s === 'active' ? (refresh(), start()) : stop()));
    return () => {
      stop();
      sub.remove();
    };
  }, [refresh]);

  const online = conn === 'online';

  const confirmFor = (action: Action): SheetConfig => {
    const map = {
      shutdown: {
        title: t('confirmShutdown'),
        body: t('confirmShutdownBody'),
        confirmLabel: t('yesShutdown'),
        gradient: [colors.red1, colors.red2] as [string, string],
        icon: <PowerIcon size={30} />,
      },
      sleep: {
        title: t('confirmSleep'),
        body: t('confirmSleepBody'),
        confirmLabel: t('yesSleep'),
        gradient: [colors.blue1, colors.blue2] as [string, string],
        icon: <MoonIcon size={30} />,
      },
      lock: {
        title: t('confirmLock'),
        body: t('confirmLockBody'),
        confirmLabel: t('yesLock'),
        gradient: [colors.teal1, colors.teal2] as [string, string],
        icon: <LockIcon size={28} />,
      },
    }[action];
    return { ...map, cancelLabel: t('cancel') };
  };

  const askConfirm = (action: Action) => {
    if (!online) {
      showToast(conn === 'checking' ? t('connecting') : t('notConnected'), conn === 'checking' ? 'info' : 'err');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pendingAction.current = action;
    setSheet(confirmFor(action));
  };

  const runConfirmed = async () => {
    const action = pendingAction.current;
    setSheet(null);
    if (!action) return;
    lastCmdAt.current = Date.now();
    setConn('busy');
    const res = await sendCommand(pc, action);
    if (res.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      lastCmdAt.current = Date.now();
      const sent = { shutdown: t('sentShutdown'), sleep: t('sentSleep'), lock: t('sentLock') }[action];
      showToast(sent, 'ok');
    } else {
      pendingAction.current = null;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(res.reason === 'server' ? t('failBusy') : t('failSend'), 'err');
      refresh();
    }
  };

  const doWake = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToast({ text: t('busyWake'), kind: 'info' });
    try {
      await wake(pc);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t('sentWake'), 'ok');
      setTimeout(refresh, 4000);
    } catch {
      showToast(t('failSend'), 'err');
    }
  };

  const busyLabel = pendingAction.current
    ? { shutdown: t('busyShutdown'), sleep: t('busySleep'), lock: t('busyLock') }[pendingAction.current]
    : t('connecting');

  const statusTitle =
    conn === 'online' ? t('connected') : conn === 'offline' ? t('offline') : conn === 'busy' ? busyLabel : t('connecting');
  const statusSub =
    conn === 'offline'
      ? t('offlineHint')
      : `${pc.name}${OS_LABEL.windows ? ' · ' + OS_LABEL.windows : ''}`;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.appName}>{multiplePCs ? pc.name : t('appName')}</Text>
          <Text style={styles.tagline}>{t('tagline')}</Text>
        </View>

        <View style={{ height: 18 }} />
        <ConnectionCard state={conn} title={statusTitle} subtitle={statusSub} onPress={onManage} />

        <View style={styles.grid}>
          <View style={styles.row}>
            <ActionTile
              label={t('shutdown')}
              sub={t('shutdownSub')}
              icon={<PowerIcon size={28} />}
              gradient={[colors.red1, colors.red2]}
              glow={colors.red1}
              disabled={!online}
              onPress={() => askConfirm('shutdown')}
            />
            <View style={{ width: 14 }} />
            <ActionTile
              label={t('sleep')}
              sub={t('sleepSub')}
              icon={<MoonIcon size={26} />}
              gradient={[colors.blue1, colors.blue2]}
              glow={colors.blue1}
              disabled={!online}
              onPress={() => askConfirm('sleep')}
            />
          </View>
          <View style={{ height: 14 }} />
          <View style={styles.row}>
            <ActionTile
              label={t('lock')}
              sub={t('lockSub')}
              icon={<LockIcon size={26} />}
              gradient={[colors.teal1, colors.teal2]}
              glow={colors.teal1}
              disabled={!online}
              onPress={() => askConfirm('lock')}
            />
            <View style={{ width: 14 }} />
            {canWake(pc) ? (
              <ActionTile
                label={t('wake')}
                sub={t('wakeSub')}
                icon={<WakeIcon size={26} />}
                gradient={[colors.amber1, colors.amber2]}
                glow={colors.amber1}
                disabled={online}
                onPress={doWake}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        </View>

        <Pressable onPress={onAddPC} style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.7 }]}>
          <PlusIcon size={18} color={colors.accent} />
          <Text style={styles.addText}>{t('addPC')}</Text>
        </Pressable>
      </ScrollView>

      <ConfirmSheet config={sheet} onConfirm={runConfirmed} onCancel={() => setSheet(null)} />
      <Toast data={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, flexGrow: 1 },
  header: { alignItems: isRTL ? 'flex-end' : 'flex-start' },
  appName: { color: colors.text, fontSize: 32, fontWeight: '800' },
  tagline: { color: colors.muted, fontSize: 15, marginTop: 2 },
  grid: { marginTop: 16 },
  row: { flexDirection: 'row' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    marginTop: 26,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
});
