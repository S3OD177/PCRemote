// Paired PCs live in the iOS keychain (via expo-secure-store), because each one
// holds a secret that signs commands. The whole small list is kept as one JSON
// value under a single key.
import * as SecureStore from 'expo-secure-store';

export type PC = {
  id: string; // stable id = ip:port when paired
  name: string;
  host: string;
  ip: string;
  port: number;
  secret: string;
  mac: string;
  addedAt: number;
};

const KEY = 'pcremote.devices.v1';

export async function loadPCs(): Promise<PC[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function savePCs(list: PC[]): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(list), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

// upsertPC adds a PC or updates the one with the same id (ip:port), keeping the
// newest connection details and secret.
export async function upsertPC(pc: PC): Promise<PC[]> {
  const list = await loadPCs();
  const i = list.findIndex((p) => p.id === pc.id);
  if (i >= 0) list[i] = { ...list[i], ...pc };
  else list.push(pc);
  await savePCs(list);
  return list;
}

export async function removePC(id: string): Promise<PC[]> {
  const list = (await loadPCs()).filter((p) => p.id !== id);
  await savePCs(list);
  return list;
}

export async function renamePC(id: string, name: string): Promise<PC[]> {
  const list = await loadPCs();
  const pc = list.find((p) => p.id === id);
  if (pc) pc.name = name;
  await savePCs(list);
  return list;
}
