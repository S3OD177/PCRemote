import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, CloseIcon, MonitorIcon, PlusIcon, TrashIcon } from '../components/icons';
import { t } from '../lib/i18n';
import type { PC } from '../lib/storage';
import { colors, radius } from '../lib/theme';

type Props = {
  pcs: PC[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (pc: PC) => void;
  onAdd: () => void;
  onClose: () => void;
};

export default function ManageScreen({ pcs, activeId, onSelect, onRemove, onAdd, onClose }: Props) {
  const insets = useSafeAreaInsets();

  const confirmRemove = (pc: PC) => {
    Alert.alert(t('removePC'), t('removePCBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('remove'), style: 'destructive', onPress: () => onRemove(pc) },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>{t('myPCs')}</Text>
        <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
          <CloseIcon size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}>
        {pcs.map((pc) => {
          const active = pc.id === activeId;
          return (
            <Pressable
              key={pc.id}
              onPress={() => onSelect(pc.id)}
              style={({ pressed }) => [styles.pcRow, active && styles.pcActive, pressed && { opacity: 0.85 }]}
            >
              <MonitorIcon size={26} color={active ? colors.accent : colors.muted} />
              <View style={styles.pcText}>
                <Text style={styles.pcName}>{pc.name}</Text>
                <Text style={styles.pcAddr}>{`${pc.ip}:${pc.port}`}</Text>
              </View>
              {active ? <CheckIcon size={22} color={colors.ok} /> : null}
              <Pressable onPress={() => confirmRemove(pc)} hitSlop={10} style={styles.trash}>
                <TrashIcon size={20} color={colors.faint} />
              </Pressable>
            </Pressable>
          );
        })}

        <Pressable onPress={onAdd} style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.8 }]}>
          <PlusIcon size={20} color={colors.accent} />
          <Text style={styles.addText}>{t('addPC')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    marginBottom: 12,
  },
  pcActive: { borderColor: 'rgba(129,140,248,0.6)' },
  pcText: { flex: 1, minWidth: 0 },
  pcName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  pcAddr: { color: colors.muted, fontSize: 13, marginTop: 2 },
  trash: { padding: 4 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  addText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
});
