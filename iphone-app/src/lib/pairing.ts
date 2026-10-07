// Parsing the pairing QR. The PC encodes a compact JSON object; here we validate
// it and turn it into a PC record we can store.
import type { PC } from './storage';

type RawPayload = {
  v?: number;
  app?: string;
  host?: string;
  ip?: string;
  port?: number;
  secret?: string;
  mac?: string;
};

export function parsePairing(text: string): PC | null {
  let raw: RawPayload;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (
    !raw ||
    raw.app !== 'pc-remote' ||
    typeof raw.ip !== 'string' ||
    typeof raw.port !== 'number' ||
    typeof raw.secret !== 'string' ||
    raw.secret.length < 32 ||
    !isIPv4(raw.ip) ||
    raw.port < 1 ||
    raw.port > 65535
  ) {
    return null;
  }
  const name = (raw.host || 'My PC').trim();
  return {
    id: `${raw.ip}:${raw.port}`,
    name,
    host: name,
    ip: raw.ip,
    port: raw.port,
    secret: raw.secret,
    mac: typeof raw.mac === 'string' ? raw.mac : '',
    addedAt: Date.now(),
  };
}

function isIPv4(s: string): boolean {
  const parts = s.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d{1,3}$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}
