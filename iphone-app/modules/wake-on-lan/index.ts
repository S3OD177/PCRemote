import { requireNativeModule } from 'expo';

type WakeOnLanModule = {
  send(mac: string, broadcastIP?: string | null): Promise<boolean>;
};

// Resolves to the native WakeOnLanModule. Guarded so a JS-only environment
// (web, or Expo Go without the native module) doesn't crash on import.
let native: WakeOnLanModule | null = null;
try {
  native = requireNativeModule<WakeOnLanModule>('WakeOnLan');
} catch {
  native = null;
}

export function isAvailable(): boolean {
  return native !== null;
}

export async function send(mac: string, broadcastIP?: string | null): Promise<boolean> {
  if (!native) throw new Error('Wake-on-LAN is not available in this build.');
  return native.send(mac, broadcastIP ?? null);
}

export default { isAvailable, send };
