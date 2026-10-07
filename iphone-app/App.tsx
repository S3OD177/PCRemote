import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import ManageScreen from './src/screens/ManageScreen';
import PairScreen from './src/screens/PairScreen';
import { loadPCs, removePC as removeFromStore, upsertPC, type PC } from './src/lib/storage';
import { colors } from './src/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Screen = 'home' | 'pair' | 'manage';

export default function App() {
  const [ready, setReady] = useState(false);
  const [pcs, setPCs] = useState<PC[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    (async () => {
      const list = await loadPCs();
      setPCs(list);
      setActiveId(list[0]?.id ?? '');
      setScreen(list.length ? 'home' : 'pair');
      setReady(true);
      await SplashScreen.hideAsync().catch(() => {});
    })();
  }, []);

  const active = pcs.find((p) => p.id === activeId) ?? pcs[0];

  const handlePaired = useCallback(async (pc: PC) => {
    const list = await upsertPC(pc);
    setPCs(list);
    setActiveId(pc.id);
    setScreen('home');
  }, []);

  const handleRemove = useCallback(
    async (pc: PC) => {
      const list = await removeFromStore(pc.id);
      setPCs(list);
      if (pc.id === activeId) setActiveId(list[0]?.id ?? '');
      if (list.length === 0) setScreen('pair');
    },
    [activeId],
  );

  if (!ready) {
    return <View style={styles.root} />;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        {screen === 'pair' ? (
          <PairScreen
            canClose={pcs.length > 0}
            onPaired={handlePaired}
            onClose={() => setScreen(pcs.length ? 'home' : 'pair')}
          />
        ) : screen === 'manage' ? (
          <ManageScreen
            pcs={pcs}
            activeId={activeId}
            onSelect={(id) => {
              setActiveId(id);
              setScreen('home');
            }}
            onRemove={handleRemove}
            onAdd={() => setScreen('pair')}
            onClose={() => setScreen('home')}
          />
        ) : active ? (
          <HomeScreen
            key={active.id}
            pc={active}
            multiplePCs={pcs.length > 1}
            onManage={() => setScreen('manage')}
            onAddPC={() => setScreen('pair')}
          />
        ) : (
          <PairScreen canClose={false} onPaired={handlePaired} onClose={() => {}} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
